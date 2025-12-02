const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { createCategory, listCategories, existsByName } = require('./categoryRepository');

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

module.exports = router;
