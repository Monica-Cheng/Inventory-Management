const { query } = require('../db/connection');

async function listProducts(adminId) {
  const rows = await query(
    `
    SELECT p.id, p.name, p.description, p.quantity, p.category_id, c.name AS category_name
    FROM product p
    LEFT JOIN category c ON c.id = p.category_id
    WHERE p.admin_id = ?
    ORDER BY p.id DESC
    `,
    [adminId]
  );
  return rows;
}

async function createProduct(adminId, categoryId, name, description, quantity) {
  await query(
    'INSERT INTO product (admin_id, category_id, name, description, quantity) VALUES (?, ?, ?, ?, ?)',
    [adminId, categoryId, name, description || null, quantity]
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
