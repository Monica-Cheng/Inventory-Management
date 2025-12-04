const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const {
  createCategory,
  listCategories,
  existsByName,
  categoryBelongsToAdmin,
  isCategoryUsed,
  existsByNameForOther,
  updateCategory,
  deleteCategory,
} = require('./categoryRepository');

const router = express.Router();

router.get('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const rows = await listCategories(req.admin.id);
    res.json({ items: rows });
  } catch (err) {
    console.error('List categories failed:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/api/admin/categories', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cleanName = String(name).trim();

  try {
    const exists = await existsByName(req.admin.id, cleanName);
    if (exists) {
      return res.status(409).json({ error: 'Category name already exists for this admin' });
    }

    await createCategory(req.admin.id, cleanName, description ? String(description).trim() : null);
    res.status(201).json({ message: 'Category created' });
  } catch (err) {
    console.error('Create category failed:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists for this admin' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  const { name, description } = req.body;
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' });
  }
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cleanName = String(name).trim();

  try {
    const belongs = await categoryBelongsToAdmin(req.admin.id, categoryId);
    if (!belongs) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const nameTaken = await existsByNameForOther(req.admin.id, cleanName, categoryId);
    if (nameTaken) {
      return res.status(409).json({ error: 'Category name already exists for this admin' });
    }

    const affected = await updateCategory(
      req.admin.id,
      categoryId,
      cleanName,
      description ? String(description).trim() : null
    );
    if (!affected) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error('Update category failed:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const belongs = await categoryBelongsToAdmin(req.admin.id, categoryId);
    if (!belongs) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const used = await isCategoryUsed(req.admin.id, categoryId);
    if (used) {
      return res.status(400).json({ error: 'Category is used by products and cannot be deleted' });
    }

    const affected = await deleteCategory(req.admin.id, categoryId);
    if (!affected) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category failed:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
