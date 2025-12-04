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

async function existsByNameForOther(adminId, name, excludeId) {
  const rows = await query(
    'SELECT id FROM category WHERE admin_id = ? AND name = ? AND id <> ? LIMIT 1',
    [adminId, name, excludeId]
  );
  return Boolean(rows[0]);
}

async function isCategoryUsed(adminId, categoryId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM product WHERE admin_id = ? AND category_id = ?',
    [adminId, categoryId]
  );
  return Number(rows[0]?.cnt || 0) > 0;
}

async function updateCategory(adminId, categoryId, name, description) {
  const result = await query(
    'UPDATE category SET name = ?, description = ? WHERE id = ? AND admin_id = ?',
    [name, description || null, categoryId, adminId]
  );
  return result.affectedRows;
}

async function deleteCategory(adminId, categoryId) {
  const result = await query('DELETE FROM category WHERE id = ? AND admin_id = ? LIMIT 1', [
    categoryId,
    adminId,
  ]);
  return result.affectedRows;
}

module.exports = {
  createCategory,
  listCategories,
  existsByName,
  categoryBelongsToAdmin,
  existsByNameForOther,
  isCategoryUsed,
  updateCategory,
  deleteCategory,
};
