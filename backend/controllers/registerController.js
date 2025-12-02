const { findByPhone, findById, createUser } = require('../repositories/userRepository');

function validatePayload(body) {
  const { user_name, phone_number, password, role, user_id } = body;
  if (!user_name || !phone_number || !password || !role) {
    return 'user_name, phone_number, password, and role are required';
  }
  if (!['admin', 'staff'].includes(role)) {
    return 'role must be either "admin" or "staff"';
  }
  if (String(password).length < 6) {
    return 'password must be at least 6 characters';
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
  return null;
}

async function register(req, res) {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ error });

  const { user_name, phone_number, password, role, user_id } = req.body;

  try {
    const existing = await findByPhone(phone_number);
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    if (user_id) {
      const existingId = await findById(String(user_id).trim());
      if (existingId) {
        return res.status(409).json({ error: 'user_id already exists' });
      }
    }

    const userId = await createUser({
      id: user_id ? String(user_id).trim() : undefined,
      user_name,
      phone_number,
      password,
      role,
    });
    return res.status(201).json({ message: 'Registered successfully', userId });
  } catch (err) {
    console.error('Register failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
};
