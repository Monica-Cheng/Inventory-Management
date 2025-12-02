const { findWithPasswordByPhone, findWithPasswordById } = require('../repositories/userRepository');

async function login(req, res) {
  const { phone_number, password, user_id } = req.body;
  if (!password || (!phone_number && !user_id)) {
    return res.status(400).json({ error: 'Provide password plus either user_id or phone_number' });
  }

  try {
    const trimmedId = user_id ? String(user_id).trim() : '';
    const trimmedPhone = phone_number ? String(phone_number).trim() : '';

    let user;
    if (trimmedId) {
      user = await findWithPasswordById(trimmedId);
    } else if (trimmedPhone) {
      user = await findWithPasswordByPhone(trimmedPhone);
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    return res.status(200).json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
};
