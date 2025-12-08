const express = require('express');
const { register } = require('../controllers/registerController');
const { login } = require('../controllers/loginController');
const { destroySession, getSession } = require('../auth/sessionStore');

const router = express.Router();

router.post('/api/register', register);
router.post('/api/login', login);

router.post('/api/logout', (req, res) => {
  const cookies = req.headers.cookie
    ? req.headers.cookie.split(';').reduce((acc, pair) => {
        const [k, ...rest] = pair.trim().split('=');
        acc[k] = decodeURIComponent(rest.join('='));
        return acc;
      }, {})
    : {};

  const adminToken = cookies.admin_token;
  const staffToken = cookies.staff_token;
  if (adminToken) destroySession(adminToken);
  if (staffToken) destroySession(staffToken);

  res.clearCookie('admin_token');
  res.clearCookie('staff_token');
  res.json({ success: true });
});

module.exports = router;
