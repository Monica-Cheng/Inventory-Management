const { pool, query } = require('../db/connection');

async function listStaff(adminId) {
  const rows = await query(
    'SELECT id, name, phone_number FROM staff WHERE admin_id = ? ORDER BY name ASC',
    [adminId]
  );
  return rows;
}

async function listProductsForAdmin(adminId) {
  const rows = await query(
    'SELECT id, name, quantity FROM product WHERE admin_id = ? ORDER BY name ASC',
    [adminId]
  );
  return rows;
}

async function listOrdersWithItems(adminId, limit = 20) {
  const orders = await query(
    `
    SELECT o.id, o.order_date, o.status, o.operator_id, s.name AS operator_name
    FROM \`order\` o
    LEFT JOIN staff s ON s.id = o.operator_id
    WHERE o.admin_id = ?
    ORDER BY o.id DESC
    LIMIT ?
    `,
    [adminId, limit]
  );

  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const items = await query(
    `
    SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.name AS product_name
    FROM order_item oi
    JOIN product p ON p.id = oi.product_id
    WHERE oi.order_id IN (${placeholders})
    `,
    orderIds
  );

  const grouped = new Map();
  for (const order of orders) {
    grouped.set(order.id, { ...order, items: [] });
  }
  for (const item of items) {
    const target = grouped.get(item.order_id);
    if (target) target.items.push(item);
  }

  return Array.from(grouped.values());
}

async function createOrderWithItems({ adminId, operatorId, orderDate, items }) {
  const operatorValue = operatorId || null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let orderId;
    if (orderDate) {
      const [res] = await conn.execute(
        'INSERT INTO `order` (admin_id, operator_id, order_date) VALUES (?, ?, ?)',
        [adminId, operatorValue, orderDate]
      );
      orderId = res.insertId;
    } else {
      const [res] = await conn.execute('INSERT INTO `order` (admin_id, operator_id) VALUES (?, ?)', [
        adminId,
        operatorValue,
      ]);
      orderId = res.insertId;
    }

    for (const item of items) {
      const productId = Number(item.product_id);
      const qty = Number(item.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(qty) || qty <= 0) {
        throw new Error('INVALID_ITEM');
      }

      const [products] = await conn.execute(
        'SELECT quantity FROM product WHERE id = ? AND admin_id = ? LIMIT 1',
        [productId, adminId]
      );
      if (!products.length) {
        const err = new Error('PRODUCT_NOT_FOUND');
        err.productId = productId;
        throw err;
      }
      const currentQty = Number(products[0].quantity);
      if (currentQty < qty) {
        const err = new Error('INSUFFICIENT_STOCK');
        err.productId = productId;
        err.available = currentQty;
        throw err;
      }

      // deduct stock
      await conn.execute('UPDATE product SET quantity = quantity - ? WHERE id = ? AND admin_id = ?', [
        qty,
        productId,
        adminId,
      ]);

      // store line item, unit_price default 0
      await conn.execute(
        'INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, qty, 0]
      );
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

module.exports = {
  listStaff,
  listProductsForAdmin,
  createOrderWithItems,
  listOrdersWithItems,
};
