// backend/admin/orderRepository.js

const { query, getConnection } = require('../db/connection');
const { applySale, adjustSale } = require('./deploymentRepository');

// Create order + apply stock/sale updates
async function createOrder({ adminId, operatorId, items, paymentMethod }) {
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // Create order header
    const [res] = await conn.query(
      `
      INSERT INTO \`order\` (admin_id, operator_id, payment_method)
      VALUES (?, ?, ?)
      `,
      [adminId, operatorId || null, paymentMethod || null]
    );

    const orderId = res.insertId;

    // Process each item
    for (const item of items) {
      const { product_id, quantity } = item;

      // Get product price + current stock
      const [[p]] = await conn.query(
        `
        SELECT id, price, total_stock
        FROM product
        WHERE id = ?
        FOR UPDATE
        `,
        [product_id]
      );

      if (!p) {
        throw new Error(`PRODUCT_NOT_FOUND_${product_id}`);
      }

      // Insert order item
      await conn.query(
        `
        INSERT INTO order_item (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
        `,
        [orderId, product_id, quantity, p.price]
      );

      // Apply stock + deployment updates using same transaction
      await applySale(product_id, quantity, conn);
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listOrders() {
  return query(
    `
    SELECT 
      o.id,
      o.admin_id,
      o.operator_id,
      o.created_at,
      o.payment_method,
      o.status,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total,
      COUNT(oi.id) AS item_count
    FROM \`order\` o
    LEFT JOIN order_item oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    `
  );
}

async function getOrderWithItems(orderId) {
  const orderRows = await query(
    `
    SELECT 
      o.id,
      o.admin_id,
      o.operator_id,
      o.created_at,
      o.payment_method,
      o.status,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
    FROM \`order\` o
    LEFT JOIN order_item oi ON oi.order_id = o.id
    WHERE o.id = ?
    GROUP BY o.id
    LIMIT 1
    `,
    [orderId]
  );
  const order = Array.isArray(orderRows) ? orderRows[0] : null;
  const items = await query(
    `
    SELECT 
      oi.id,
      oi.product_id,
      p.name AS product_name,
      oi.quantity,
      oi.unit_price
    FROM order_item oi
    LEFT JOIN product p ON p.id = oi.product_id
    WHERE oi.order_id = ?
    `,
    [orderId]
  );
  const logs = await query(
    `
    CREATE TABLE IF NOT EXISTS order_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      actor_role VARCHAR(20) NULL,
      actor_id INT NULL,
      action VARCHAR(50) NOT NULL,
      detail TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order (order_id)
    )
    `
  ).then(() =>
    query(
      `
      SELECT id, actor_role, actor_id, action, detail, created_at
      FROM order_log
      WHERE order_id = ?
      ORDER BY created_at DESC
      `,
      [orderId]
    )
  );
  return order
    ? { ...order, items: Array.isArray(items) ? items : [], logs: Array.isArray(logs) ? logs : [] }
    : null;
}

async function updateOrderStatus(orderId, status) {
  const allowed = ['PENDING', 'PAID', 'CANCELLED'];
  if (!allowed.includes(status)) throw new Error('INVALID_STATUS');
  const result = await query(
    `UPDATE \`order\` SET status = ? WHERE id = ?`,
    [status, orderId]
  );
  return result.affectedRows;
}

module.exports = {
  createOrder,
  listOrders,
  getOrderWithItems,
  updateOrderStatus,
  updateOrder,
};

// Update existing order: replace items, adjust stock by delta
async function updateOrder({ orderId, adminId, operatorId, items, paymentMethod, actorName, actorRole }) {
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // Load current items
    const [currentItems] = await conn.query(
      `SELECT product_id, quantity FROM order_item WHERE order_id = ?`,
      [orderId]
    );
    const currentMap = new Map();
    currentItems.forEach((it) => currentMap.set(it.product_id, Number(it.quantity)));

    const newMap = new Map();
    items.forEach((it) => newMap.set(it.product_id, Number(it.quantity)));
    const nameMap = new Map();

    // Calculate deltas
    const deltas = new Map();
    newMap.forEach((qty, pid) => {
      const oldQty = currentMap.get(pid) || 0;
      deltas.set(pid, qty - oldQty);
    });
    currentMap.forEach((oldQty, pid) => {
      if (!newMap.has(pid)) {
        deltas.set(pid, -oldQty);
      }
    });

    // Clear old items
    await conn.query(`DELETE FROM order_item WHERE order_id = ?`, [orderId]);

    // Insert new items and adjust stock by delta
    for (const item of items) {
      const { product_id, quantity } = item;
      const [[p]] = await conn.query(
        `
        SELECT id, price
        FROM product
        WHERE id = ?
        `,
        [product_id]
      );
      if (!p) throw new Error(`PRODUCT_NOT_FOUND_${product_id}`);
      nameMap.set(product_id, p.name);

      await conn.query(
        `
        INSERT INTO order_item (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
        `,
        [orderId, product_id, quantity, p.price]
      );
    }

    // Apply deltas to stock/deployment
    for (const [pid, delta] of deltas.entries()) {
      await adjustSale(pid, delta, conn);
      if (!nameMap.has(pid)) {
        const [[row]] = await conn.query(`SELECT name FROM product WHERE id = ?`, [pid]);
        if (row) nameMap.set(pid, row.name);
      }
    }

    // Update header
    await conn.query(
      `
      UPDATE \`order\`
      SET payment_method = ?, operator_id = ?
      WHERE id = ?
      `,
      [paymentMethod || null, operatorId || null, orderId]
    );

    // log change (human-friendly)
    const changes = Array.from(deltas.entries())
      .filter(([, delta]) => delta !== 0)
      .map(([pid, delta]) => {
        const oldQty = currentMap.get(pid) || 0;
        const newQty = newMap.get(pid) || 0;
        return {
          product_id: pid,
          product_name: nameMap.get(pid) || `#${pid}`,
          from: oldQty,
          to: newQty,
          delta,
        };
      });
    const detail = {
      changes,
      paymentMethod,
      actorName: actorName || null,
      actorRole: actorRole || null,
    };
    await conn.query(
      `
      CREATE TABLE IF NOT EXISTS order_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        actor_role VARCHAR(20) NULL,
        actor_id INT NULL,
        action VARCHAR(50) NOT NULL,
        detail TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_id)
      )
      `
    );
    await conn.query(
      `
      INSERT INTO order_log (order_id, actor_role, actor_id, action, detail)
      VALUES (?, ?, ?, 'UPDATE_ORDER', ?)
      `,
      [orderId, actorRole || (operatorId ? 'staff' : 'admin'), operatorId || adminId || null, JSON.stringify(detail)]
    );

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
