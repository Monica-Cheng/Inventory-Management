const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { listCategories } = require('./categoryRepository');
const { listProducts } = require('./productRepository');

const router = express.Router();

// simple placeholder summary; replace with real queries later
router.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  const categories = await listCategories(req.admin.id);
  const products = await listProducts(req.admin.id);
  res.json({
    message: 'Admin dashboard summary',
    admin: { id: req.admin.id, name: req.admin.user_name || req.admin.name },
    stats: {
      products: products.length,
      orders: 0,
      staff: 0,
      categories: categories.length,
    },
  });
});

module.exports = router;
