const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { listProducts, createProduct, updateQuantity } = require('./productRepository');

const router = express.Router();

router.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const rows = await listProducts(req.admin.id);
    res.json({ items: rows });
  } catch (err) {
    console.error('List products failed:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/api/admin/products', requireAdmin, async (req, res) => {
  const { name, description, quantity } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  const qty = Number(quantity ?? 0);
  if (!Number.isFinite(qty) || qty < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  try {
    await createProduct(req.admin.id, String(name).trim(), description ? String(description).trim() : null, qty);
    res.status(201).json({ message: 'Product created' });
  } catch (err) {
    console.error('Create product failed:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.patch('/api/admin/products/:id/quantity', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const qty = Number(req.body.quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  try {
    const affected = await updateQuantity(req.admin.id, Number(id), qty);
    if (!affected) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Quantity updated' });
  } catch (err) {
    console.error('Update quantity failed:', err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

module.exports = router;
