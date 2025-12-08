const bcrypt = require('bcryptjs');
const { findWithPasswordByPhone, findWithPasswordById, findWithPasswordByEmail } = require('../repositories/userRepository');
const { createSession } = require('../auth/sessionStore');

async function login(req, res) {
  const { identifier, phone_number, user_id, email, password, role } = req.body;
  const loginId = identifier || user_id || phone_number || email;
  if (!password || !loginId) {
    return res.status(400).json({ error: 'Provide password plus email/phone/user_id' });
  }
  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or staff' });
  }

  try {
    const trimmedId = loginId ? String(loginId).trim() : '';

    let user;
    if (trimmedId.includes('@')) {
      user = await findWithPasswordByEmail(role, trimmedId);
    } else if (/^\d+$/.test(trimmedId)) {
      // treat numeric as phone first, then id fallback
      user = (await findWithPasswordByPhone(role, trimmedId)) || (await findWithPasswordById(role, trimmedId));
    } else {
      user = await findWithPasswordById(role, trimmedId);
    }

    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // staff must be active
    if (role === 'staff' && user.status !== 'active') {
      return res.status(403).json({ error: 'Account pending approval or rejected' });
    }

    // remove password_hash before sending to client / storing in session
    const { password_hash: _, ...safeUser } = user;

    // everyone gets a session; cookie name depends on role
    const token = createSession({ ...safeUser, role });
    const cookieName = role === 'admin' ? 'admin_token' : 'staff_token';

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return res.status(200).json({ message: 'Login successful', user: safeUser });

  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
};
