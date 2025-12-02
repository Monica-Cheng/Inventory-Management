const { query } = require('../db/connection');

async function listProducts(adminId) {
  const rows = await query(
    'SELECT id, name, description, quantity FROM product WHERE admin_id = ? ORDER BY id DESC',
    [adminId]
  );
  return rows;
}

async function createProduct(adminId, name, description, quantity) {
  await query(
    'INSERT INTO product (admin_id, name, description, quantity) VALUES (?, ?, ?, ?)',
    [adminId, name, description || null, quantity]
  );
}

async function updateQuantity(adminId, productId, quantity) {
  const result = await query(
    'UPDATE product SET quantity = ? WHERE id = ? AND admin_id = ?',
    [quantity, productId, adminId]
  );
  return result.affectedRows;
}

module.exports = {
  listProducts,
  createProduct,
  updateQuantity,
};
