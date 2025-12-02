const bcrypt = require('bcryptjs');
const { findWithPasswordByPhone, findWithPasswordById } = require('../repositories/userRepository');
const { createSession } = require('../auth/sessionStore');

async function login(req, res) {
  const { phone_number, password, user_id, role } = req.body;
  if (!password || (!phone_number && !user_id)) {
    return res.status(400).json({ error: 'Provide password plus either user_id or phone_number' });
  }
  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or staff' });
  }

  try {
    const trimmedId = user_id ? String(user_id).trim() : '';
    const trimmedPhone = phone_number ? String(phone_number).trim() : '';

    let user;
    if (trimmedId) {
      user = await findWithPasswordById(role, trimmedId);
    } else if (trimmedPhone) {
      user = await findWithPasswordByPhone(role, trimmedPhone);
    }

    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (role === 'staff' && user.status !== 'active') {
      return res.status(403).json({ error: 'Account pending approval or rejected' });
    }

    const { password_hash: _, ...safeUser } = user;

    // only admins get a session for dashboard access
    if (role === 'admin') {
      const token = createSession({ ...safeUser, role });
      res.cookie('admin_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
    }

    return res.status(200).json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
};
