const crypto = require('crypto');
const { query } = require('../db/connection');

async function findByPhone(phoneNumber) {
  const rows = await query('SELECT id, user_name, phone_number, role FROM `user` WHERE phone_number = ? LIMIT 1', [
    phoneNumber,
  ]);
  return rows[0];
}

async function findById(id) {
  const rows = await query('SELECT id, user_name, phone_number, role FROM `user` WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function findWithPasswordById(id) {
  const rows = await query('SELECT id, user_name, phone_number, password, role FROM `user` WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function findWithPasswordByPhone(phoneNumber) {
  const rows = await query(
    'SELECT id, user_name, phone_number, password, role FROM `user` WHERE phone_number = ? LIMIT 1',
    [phoneNumber]
  );
  return rows[0];
}

async function createUser({ id, user_name, phone_number, password, role }) {
  const finalId = id || crypto.randomBytes(16).toString('hex');
  await query('INSERT INTO `user` (id, user_name, phone_number, password, role) VALUES (?, ?, ?, ?, ?)', [
    finalId,
    user_name,
    phone_number,
    password,
    role,
  ]);
  return finalId;
}

module.exports = {
  findByPhone,
  findById,
  findWithPasswordById,
  findWithPasswordByPhone,
  createUser,
};
