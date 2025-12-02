const { query } = require('../db/connection');

async function createCategory(adminId, name, description) {
  await query(
    'INSERT INTO category (admin_id, name, description) VALUES (?, ?, ?)',
    [adminId, name, description || null]
  );
}

async function listCategories(adminId) {
  const rows = await query(
    'SELECT id, name, description FROM category WHERE admin_id = ? ORDER BY id DESC',
    [adminId]
  );
  return rows;
}

async function existsByName(adminId, name) {
  const rows = await query(
    'SELECT id FROM category WHERE admin_id = ? AND name = ? LIMIT 1',
    [adminId, name]
  );
  return Boolean(rows[0]);
}

async function categoryBelongsToAdmin(adminId, categoryId) {
  const rows = await query('SELECT id FROM category WHERE id = ? AND admin_id = ? LIMIT 1', [
    categoryId,
    adminId,
  ]);
  return Boolean(rows[0]);
}

module.exports = {
  createCategory,
  listCategories,
  existsByName,
  categoryBelongsToAdmin,
};
