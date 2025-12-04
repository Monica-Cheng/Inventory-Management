const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { listCategories } = require('./categoryRepository');
const { listProducts } = require('./productRepository');
const { query } = require('../db/connection');

const router = express.Router();

// simple placeholder summary; replace with real queries later
router.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [categories, products, staffCountRows, orderCountRows] = await Promise.all([
      listCategories(req.admin.id),
      listProducts(req.admin.id),
      query("SELECT COUNT(*) AS cnt FROM staff WHERE admin_id = ? AND status = 'active'", [req.admin.id]),
      query('SELECT COUNT(*) AS cnt FROM `order` WHERE admin_id = ?', [req.admin.id]),
    ]);

    res.json({
      message: 'Admin dashboard summary',
      admin: { id: req.admin.id, name: req.admin.user_name || req.admin.name },
      stats: {
        products: products.length,
        orders: Number(orderCountRows[0]?.cnt || 0),
        staff: Number(staffCountRows[0]?.cnt || 0),
        categories: categories.length,
      },
    });
  } catch (err) {
    console.error('Dashboard load failed:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;
