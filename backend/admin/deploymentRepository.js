// backend/admin/deploymentRepository.js

const { query, getConnection } = require('../db/connection');

// Get deployment info for ALL products (shared across admins)
async function listDeployedProducts() {
  return await query(
    `
    SELECT 
      p.id AS product_id,
      p.id AS id,
      p.name AS name,
      p.price AS price,
      p.is_unlimited AS is_unlimited,
      p.total_stock AS total_stock,
      c.name AS category_name,
      d.deployed_qty,
      d.sold_qty,
      (d.deployed_qty - d.sold_qty) AS available
    FROM deployment d
    INNER JOIN product p ON d.product_id = p.id
    LEFT JOIN category c ON c.id = p.category_id
    ORDER BY c.name, p.name
    `
  );
}

// Deploy stock for a product (admin or staff)
async function setDeployment(productId, deployQty) {
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // Validate product exists and stock
    const [[product]] = await conn.query(
      `SELECT id, name, total_stock, is_unlimited FROM product WHERE id = ? LIMIT 1`,
      [productId]
    );
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    // does a deployment row already exist?
    const [rows] = await conn.query(
      `SELECT id, deployed_qty, sold_qty FROM deployment WHERE product_id = ?`,
      [productId]
    );

    const sold = rows[0]?.sold_qty || 0;
    const isUnlimited = !!product.is_unlimited;
    const maxStock = isUnlimited ? Number.POSITIVE_INFINITY : Number(product.total_stock || 0);

    // Normalize qty: for unlimited we treat blank as 0 and skip stock guard
    const normalizedQty = isUnlimited
      ? Number.isFinite(Number(deployQty)) ? Number(deployQty) : 0
      : Number(deployQty);

    if (!isUnlimited && normalizedQty > maxStock) {
      throw new Error('DEPLOY_GT_STOCK');
    }

    if (rows.length === 0) {
      // create a new row
      await conn.query(
        `
        INSERT INTO deployment (product_id, deployed_qty, sold_qty)
        VALUES (?, ?, 0)
        `,
        [productId, normalizedQty]
      );
    } else {
      // update the existing row
      await conn.query(
        `
        UPDATE deployment
        SET deployed_qty = ?, sold_qty = 0
        WHERE product_id = ?
        `,
        [normalizedQty, productId]
      );
    }

    await conn.commit();
    return { productId, deployed_qty: normalizedQty, product_name: product.name };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Remove deployment row entirely
async function removeDeployment(productId) {
  const result = await query(`DELETE FROM deployment WHERE product_id = ?`, [productId]);
  return result.affectedRows;
}

// When an order is created — reduce stock + update sold_qty
// Accept optional existing connection to avoid nested transactions
async function applySale(productId, quantity, existingConn) {
  const conn = existingConn || (await getConnection());
  const ownTx = !existingConn;

  try {
    if (ownTx) await conn.beginTransaction();

    // 1. update product total stock
    await conn.query(
      `
      UPDATE product
      SET total_stock = total_stock - ?
      WHERE id = ?
      `,
      [quantity, productId]
    );

    // 2. update sold_qty in deployment
    const [rows] = await conn.query(
      `SELECT id, deployed_qty, sold_qty FROM deployment WHERE product_id = ?`,
      [productId]
    );

    if (rows.length === 0) {
      // If somehow deployment doesn't exist — create it automatically
      await conn.query(
        `
        INSERT INTO deployment (product_id, deployed_qty, sold_qty)
        VALUES (?, ?, ?)
        `,
        [productId, quantity, quantity]
      );
    } else {
      await conn.query(
        `
        UPDATE deployment
        SET sold_qty = sold_qty + ?
        WHERE product_id = ?
        `,
        [quantity, productId]
      );
    }

    if (ownTx) await conn.commit();
  } catch (err) {
    if (ownTx) await conn.rollback();
    throw err;
  } finally {
    if (ownTx) conn.release();
  }
}

// Adjust sale by delta (can be negative to revert)
async function adjustSale(productId, delta, existingConn) {
  if (delta === 0) return;
  const conn = existingConn || (await getConnection());
  const ownTx = !existingConn;

  try {
    if (ownTx) await conn.beginTransaction();

    // lock rows
    const [[p]] = await conn.query(
      `SELECT id, total_stock FROM product WHERE id = ? FOR UPDATE`,
      [productId]
    );
    const [dRows] = await conn.query(
      `SELECT id, deployed_qty, sold_qty FROM deployment WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    const d = dRows && dRows[0];

    if (!p) throw new Error('PRODUCT_NOT_FOUND');
    const deployedQty = d ? Number(d.deployed_qty) : 0;
    const soldQty = d ? Number(d.sold_qty) : 0;
    const available = deployedQty - soldQty;

    if (delta > 0 && d && delta > available) {
      throw new Error('DEPLOY_GT_AVAILABLE');
    }
    if (delta > 0 && !d) {
      throw new Error('DEPLOY_NOT_FOUND');
    }

    // Update product stock (delta positive => reduce stock)
    await conn.query(
      `
      UPDATE product
      SET total_stock = total_stock - ?
      WHERE id = ?
      `,
      [delta, productId]
    );

    let newSold = soldQty + delta;
    if (newSold < 0) newSold = 0;

    if (d) {
      await conn.query(
        `
        UPDATE deployment
        SET sold_qty = ?
        WHERE product_id = ?
        `,
        [newSold, productId]
      );
    } else if (delta < 0) {
      // create a deployment row to hold returned stock in POS
      await conn.query(
        `
        INSERT INTO deployment (product_id, deployed_qty, sold_qty)
        VALUES (?, ?, 0)
        `,
        [productId, Math.abs(delta)]
      );
    }

    if (ownTx) await conn.commit();
  } catch (err) {
    if (ownTx) await conn.rollback();
    throw err;
  } finally {
    if (ownTx) conn.release();
  }
}

module.exports = {
  listDeployedProducts,
  setDeployment,
  removeDeployment,
  applySale,
  adjustSale,
};
