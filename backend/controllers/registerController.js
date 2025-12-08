const bcrypt = require('bcryptjs');
const { findByPhone, findById, findByEmail, createUser } = require('../repositories/userRepository');

const SALT_ROUNDS = 10;

function mapMysqlError(err) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    if (err.sqlMessage && err.sqlMessage.includes('phone_number')) return 'Phone number already registered';
    if (err.sqlMessage && err.sqlMessage.includes('PRIMARY')) return 'user_id already exists';
    return 'Duplicate entry';
  }
  return null;
}

function validatePayload(body) {
  const { user_name, email, phone_number, password, role, user_id, admin_id } = body;
  if (!user_name || !email || !phone_number || !password || !role) {
    return 'user_name, email, phone_number, password, and role are required';
  }
  if (!['admin', 'staff'].includes(role)) {
    return 'role must be either "admin" or "staff"';
  }
  if (String(password).length < 6) {
    return 'password must be at least 6 characters';
  }
  if (!String(email).includes('@')) {
    return 'email must be valid';
  }
  if (user_id !== undefined && user_id !== null && user_id !== '') {
    const trimmed = String(user_id).trim();
    if (!trimmed) {
      return 'user_id cannot be empty spaces';
    }
    if (trimmed.length > 64) {
      return 'user_id must be 64 characters or fewer';
    }
  }
  if (role === 'staff' && (!admin_id || !String(admin_id).trim())) {
    return 'admin_id is required for staff';
  }
  return null;
}

async function register(req, res) {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ error });

  const { user_name, email, phone_number, password, role, user_id, admin_id } = req.body;

  try {
    const existingPhone = await findByPhone(role, phone_number);
    if (existingPhone) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const existingEmail = await findByEmail(role, email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (user_id) {
      const existingId = await findById(role, String(user_id).trim());
      if (existingId) {
        return res.status(409).json({ error: 'user_id already exists' });
      }
    }

    if (role === 'staff') {
      const adminExists = await findById('admin', String(admin_id).trim());
      if (!adminExists) {
        return res.status(400).json({ error: 'admin_id not found' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await createUser({
      role,
      id: user_id ? String(user_id).trim() : undefined,
      name: user_name,
      email,
      phone_number,
      password_hash: hashedPassword,
      admin_id: role === 'staff' ? String(admin_id).trim() : undefined,
    });
    const message =
      role === 'staff'
        ? 'Registered successfully. Awaiting admin approval.'
        : 'Registered successfully';
    return res.status(201).json({ message, userId });
  } catch (err) {
    const known = mapMysqlError(err);
    if (known) {
      return res.status(409).json({ error: known });
    }
    console.error('Register failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
};
