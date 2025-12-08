// backend/admin/productRoutes.js

const express = require('express');
const router = express.Router();

const { requireAdmin, requireAdminOrStaff } = require('../auth/authMiddleware');
const { addProduct, updateProduct, deleteProduct, listProducts } = require('./productRepository');

// ADMIN — Create product
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { categoryId, name, description, price, total_stock, is_unlimited } = req.body;

    await addProduct({
      adminId: req.admin ? req.admin.id : null,
      categoryId,
      name,
      description,
      price,
      total_stock,
      is_unlimited: is_unlimited ? 1 : 0,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN — Update product
router.put('/:id', requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  const { categoryId, name, description, price, total_stock, is_unlimited } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (price == null || Number(price) < 0) {
    return res.status(400).json({ error: 'Price must be >= 0' });
  }
  if (!is_unlimited && total_stock != null && Number(total_stock) < 0) {
    return res.status(400).json({ error: 'Stock must be >= 0' });
  }

  try {
    const affected = await updateProduct(productId, {
      categoryId,
      name,
      description,
      price,
      total_stock,
      is_unlimited: is_unlimited ? 1 : 0,
    });
    if (!affected) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN — Delete product
router.delete('/:id', requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const affected = await deleteProduct(productId);
    if (!affected) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN — List products
// Admin or staff can view product catalog
router.get('/', requireAdminOrStaff, async (_req, res) => {
  try {
    const rows = await listProducts();
    res.json(rows);
  } catch (err) {
    console.error('List product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
