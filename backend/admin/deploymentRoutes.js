// backend/admin/deploymentRoutes.js

const express = require('express');
const router = express.Router();

const { requireAdminOrStaff } = require('../auth/authMiddleware');
const { setDeployment, removeDeployment } = require('./deploymentRepository');

// BOTH ADMIN AND STAFF CAN DEPLOY
router.post('/', requireAdminOrStaff, async (req, res) => {
  try {
    const { product_id, deploy_qty } = req.body;

    if (!product_id || deploy_qty == null) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const qty = Number(deploy_qty);
    if (!Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({ error: 'deploy_qty must be a non-negative number' });
    }

    const result = await setDeployment(product_id, qty);
    return res.json({ success: true, deployment: result });
  } catch (err) {
    console.error('Deployment error:', err);
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (err.message === 'DEPLOY_GT_STOCK') {
      return res.status(400).json({ error: 'Cannot deploy more than total stock' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// Remove deployment entirely
router.delete('/:productId', requireAdminOrStaff, async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  try {
    const removed = await removeDeployment(productId);
    if (!removed) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    return res.json({ success: true, productId });
  } catch (err) {
    console.error('Delete deployment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
