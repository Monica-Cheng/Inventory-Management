const { query } = require('../db/connection');

async function createCategory(adminId, name, description) {
  await query('INSERT INTO category (admin_id, name, description) VALUES (?, ?, ?)', [
    adminId,
    name,
    description || null,
  ]);
}

async function listCategories() {
  const rows = await query('SELECT id, name, description FROM category ORDER BY name ASC');
  return rows;
}

async function existsByName(name) {
  const rows = await query('SELECT id FROM category WHERE name = ? LIMIT 1', [name]);
  return Boolean(rows[0]);
}

async function existsByNameForOther(name, excludeId) {
  const rows = await query('SELECT id FROM category WHERE name = ? AND id <> ? LIMIT 1', [
    name,
    excludeId,
  ]);
  return Boolean(rows[0]);
}

async function isCategoryUsed(categoryId) {
  const rows = await query('SELECT COUNT(*) AS cnt FROM product WHERE category_id = ?', [
    categoryId,
  ]);
  return Number(rows[0]?.cnt || 0) > 0;
}

async function updateCategory(categoryId, name, description) {
  const result = await query('UPDATE category SET name = ?, description = ? WHERE id = ?', [
    name,
    description || null,
    categoryId,
  ]);
  return result.affectedRows;
}

async function deleteCategory(categoryId) {
  const result = await query('DELETE FROM category WHERE id = ? LIMIT 1', [categoryId]);
  return result.affectedRows;
}

module.exports = {
  createCategory,
  listCategories,
  existsByName,
  existsByNameForOther,
  isCategoryUsed,
  updateCategory,
  deleteCategory,
};
