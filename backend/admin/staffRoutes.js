const express = require('express');
const { requireAdmin } = require('./authMiddleware');
const { listStaffByStatus, updateStaffStatus } = require('./staffRepository');

const router = express.Router();

router.get('/api/admin/staff', requireAdmin, async (req, res) => {
  const status = req.query.status || 'pending';
  const allowed = ['pending', 'active', 'rejected', 'terminated', 'all'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status filter' });
  }
  try {
    const staff = await listStaffByStatus(req.admin.id, status);
    res.json({ items: staff });
  } catch (err) {
    console.error('List staff failed:', err);
    res.status(500).json({ error: 'Failed to load staff' });
  }
});

router.patch('/api/admin/staff/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await updateStaffStatus({
      adminId: req.admin.id,
      staffId: id,
      status: 'active',
      approvedBy: req.admin.id,
    });
    if (!affected) {
      return res.status(404).json({ error: 'Staff not found or already reviewed' });
    }
    res.json({ message: 'Staff approved' });
  } catch (err) {
    console.error('Approve staff failed:', err);
    res.status(500).json({ error: 'Failed to approve staff' });
  }
});

router.patch('/api/admin/staff/:id/reject', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await updateStaffStatus({
      adminId: req.admin.id,
      staffId: id,
      status: 'rejected',
      approvedBy: req.admin.id,
    });
    if (!affected) {
      return res.status(404).json({ error: 'Staff not found or already reviewed' });
    }
    res.json({ message: 'Staff rejected' });
  } catch (err) {
    console.error('Reject staff failed:', err);
    res.status(500).json({ error: 'Failed to reject staff' });
  }
});

router.patch('/api/admin/staff/:id/terminate', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await updateStaffStatus({
      adminId: req.admin.id,
      staffId: id,
      status: 'terminated',
      approvedBy: req.admin.id,
      allowedFromStatuses: ['active', 'pending'],
    });
    if (!affected) {
      return res.status(404).json({ error: 'Staff not found or cannot be terminated' });
    }
    res.json({ message: 'Staff terminated' });
  } catch (err) {
    console.error('Terminate staff failed:', err);
    res.status(500).json({ error: 'Failed to terminate staff' });
  }
});

module.exports = router;
