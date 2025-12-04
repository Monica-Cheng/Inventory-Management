const { getSession } = require('../auth/sessionStore');

function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  return raw.split(';').reduce((acc, pair) => {
    const [k, ...rest] = pair.trim().split('=');
    acc[k] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.admin_token;
  const session = getSession(token);
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.admin = session;
  return next();
}

module.exports = {
  requireAdmin,
};
