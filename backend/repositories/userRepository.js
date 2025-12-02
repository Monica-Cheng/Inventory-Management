const crypto = require('crypto');
const { query } = require('../db/connection');

function tableFor(role) {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'staff';
  throw new Error('Unknown role');
}

async function findByPhone(role, phoneNumber) {
  const table = tableFor(role);
  const rows = await query(
    `SELECT id, name AS user_name, phone_number, '${role}' AS role FROM ${table} WHERE phone_number = ? LIMIT 1`,
    [phoneNumber]
  );
  return rows[0];
}

async function findById(role, id) {
  const table = tableFor(role);
  const rows = await query(
    `SELECT id, name AS user_name, phone_number, '${role}' AS role FROM ${table} WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
}

async function findWithPasswordById(role, id) {
  const table = tableFor(role);
  const rows = await query(
    `SELECT id, name AS user_name, phone_number, password_hash, '${role}' AS role${
      role === 'staff' ? ', status' : ''
    } FROM ${table} WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
}

async function findWithPasswordByPhone(role, phoneNumber) {
  const table = tableFor(role);
  const rows = await query(
    `SELECT id, name AS user_name, phone_number, password_hash, '${role}' AS role${
      role === 'staff' ? ', status' : ''
    } FROM ${table} WHERE phone_number = ? LIMIT 1`,
    [phoneNumber]
  );
  return rows[0];
}

async function createUser({ role, id, name, phone_number, password_hash, admin_id }) {
  const table = tableFor(role);
  const finalId = id || crypto.randomBytes(16).toString('hex');

  if (role === 'admin') {
    await query(`INSERT INTO admin (id, name, phone_number, password_hash) VALUES (?, ?, ?, ?)`, [
      finalId,
      name,
      phone_number,
      password_hash,
    ]);
  } else {
    await query(
      `INSERT INTO staff (id, admin_id, name, phone_number, password_hash, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        finalId,
        admin_id,
        name,
        phone_number,
        password_hash,
      ]
    );
  }

  return finalId;
}

module.exports = {
  findByPhone,
  findById,
  findWithPasswordById,
  findWithPasswordByPhone,
  createUser,
};
