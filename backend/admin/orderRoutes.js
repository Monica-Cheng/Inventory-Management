const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { listStaff, listProductsForAdmin, createOrderWithItems, listOrdersWithItems } = require('./orderRepository');

const router = express.Router();

router.get('/api/admin/orders/meta', requireAdmin, async (req, res) => {
  try {
    const [staff, products] = await Promise.all([
      listStaff(req.admin.id),
      listProductsForAdmin(req.admin.id),
    ]);
    res.json({ staff, products });
  } catch (err) {
    console.error('Load orders meta failed:', err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

router.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await listOrdersWithItems(req.admin.id, 50);
    res.json({ items: orders });
  } catch (err) {
    console.error('List orders failed:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.post('/api/admin/orders', requireAdmin, async (req, res) => {
  const { operator_id, order_date, items } = req.body;

  const parsedItems = Array.isArray(items) ? items : [];
  if (!parsedItems.length) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  // normalize date; allow empty to default current timestamp
  const orderDate = order_date ? new Date(order_date) : null;
  if (orderDate && isNaN(orderDate.getTime())) {
    return res.status(400).json({ error: 'Invalid order_date' });
  }

  try {
    const operatorId = operator_id ? String(operator_id).trim() : null;
    if (operatorId) {
      const staff = await listStaff(req.admin.id);
      const operator = staff.find((s) => s.id === operatorId);
      if (!operator) {
        return res.status(404).json({ error: 'Operator not found for this admin' });
      }
    }

    const orderId = await createOrderWithItems({
      adminId: req.admin.id,
      operatorId,
      orderDate: orderDate ? orderDate : undefined,
      items: parsedItems,
    });

    res.status(201).json({ message: 'Order created', orderId });
  } catch (err) {
    console.error('Create order failed:', err);
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found for this admin' });
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Insufficient stock for one of the items' });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
