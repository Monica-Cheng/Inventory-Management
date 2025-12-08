// backend/admin/orderRoutes.js

const express = require('express');
const router = express.Router();

const { requireAdminOrStaff, requireAdmin } = require('../auth/authMiddleware');
const { createOrder, listOrders, getOrderWithItems, updateOrderStatus, updateOrder } = require('./orderRepository');

// STAFF + ADMIN can create orders
router.post('/', requireAdminOrStaff, async (req, res) => {
  try {
    const adminId = req.staff ? req.staff.admin_id : req.admin.id;
    const operatorId = req.staff ? req.staff.id : null;

    const { items, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    const orderId = await createOrder({
      adminId,
      operatorId,
      items,
      paymentMethod: payment_method,
    });

    return res.json({ success: true, order_id: orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List orders (admin or staff)
router.get('/', requireAdminOrStaff, async (_req, res) => {
  try {
    const rows = await listOrders();
    res.json(rows);
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Order details
router.get('/:id', requireAdminOrStaff, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  try {
    const order = await getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  try {
    const affected = await updateOrderStatus(orderId, status);
    if (!affected) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update existing order (admin or staff)
router.put('/:id', requireAdminOrStaff, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  const { items, payment_method } = req.body;
  if (!items || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'No items' });
  }

  try {
    const adminId = req.staff ? req.staff.admin_id : req.admin.id;
    const operatorId = req.staff ? req.staff.id : null;
    await updateOrder({
      orderId,
      adminId,
      operatorId,
      items,
      paymentMethod: payment_method,
      actorName: req.staff?.user_name || req.admin?.user_name || null,
      actorRole: req.staff ? 'staff' : 'admin',
    });
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'DEPLOY_GT_AVAILABLE') {
      return res.status(400).json({ error: 'Not enough deployed stock for added items' });
    }
    if (err.message === 'DEPLOY_NOT_FOUND') {
      return res.status(400).json({ error: 'Item is not deployed to POS' });
    }
    if (err.message && err.message.startsWith('PRODUCT_NOT_FOUND')) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
