// backend/admin/productRepository.js

const { query, getConnection } = require('../db/connection');

// Add product
async function addProduct({ adminId, categoryId, name, description, price, total_stock, is_unlimited }) {
  return await query(
    `
    INSERT INTO product (admin_id, category_id, name, description, price, total_stock, is_unlimited)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [adminId, categoryId || null, name, description, price, total_stock, is_unlimited]
  );
}

async function updateProduct(id, { categoryId, name, description, price, total_stock, is_unlimited }) {
  const result = await query(
    `
    UPDATE product
    SET category_id = ?, name = ?, description = ?, price = ?, total_stock = ?, is_unlimited = ?
    WHERE id = ?
    `,
    [categoryId || null, name, description, price, total_stock, is_unlimited, id]
  );
  return result.affectedRows;
}

async function deleteProduct(id) {
  const result = await query(
    `
    DELETE FROM product
    WHERE id = ?
    `,
    [id]
  );
  return result.affectedRows;
}

// Get all products for inventory page
async function listProducts() {
  return await query(
    `
    SELECT p.*, c.name AS category_name
    FROM product p
    LEFT JOIN category c ON c.id = p.category_id
    ORDER BY c.name, p.name
    `
  );
}

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  listProducts,
};
