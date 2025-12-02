const { query } = require('../db/connection');

async function listStaffByStatus(adminId, status = 'pending') {
  const rows = await query(
    `
    SELECT id, name, phone_number, status, approved_by, approved_at
    FROM staff
    WHERE admin_id = ?
      ${status === 'all' ? '' : 'AND status = ?'}
    ORDER BY name ASC
    `,
    status === 'all' ? [adminId] : [adminId, status]
  );
  return rows;
}

async function updateStaffStatus({ adminId, staffId, status, approvedBy }) {
  const result = await query(
    `
    UPDATE staff
    SET status = ?, approved_by = ?, approved_at = NOW()
    WHERE id = ? AND admin_id = ? AND status = 'pending'
    `,
    [status, approvedBy || null, staffId, adminId]
  );
  return result.affectedRows;
}

module.exports = {
  listStaffByStatus,
  updateStaffStatus,
};
