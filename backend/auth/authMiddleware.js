// backend/auth/authMiddleware.js
const { getSession } = require('./sessionStore');

function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  return raw.split(';').reduce((acc, pair) => {
    const [k, ...rest] = pair.trim().split('=');
    acc[k] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function getSessionFromCookie(req, cookieName, expectedRole) {
  const cookies = parseCookies(req);
  const token = cookies[cookieName];
  const session = getSession(token);
  if (!session || session.role !== expectedRole) return null;
  return session;
}

function requireAdmin(req, res, next) {
  const session = getSessionFromCookie(req, 'admin_token', 'admin');
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.admin = session; // existing routes already use req.admin
  next();
}

function requireAdminOrStaff(req, res, next) {
  const adminSession = getSessionFromCookie(req, 'admin_token', 'admin');
  const staffSession = getSessionFromCookie(req, 'staff_token', 'staff');

  if (!adminSession && !staffSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Attach whichever exists; keeps compatibility with existing handlers
  if (adminSession) req.admin = adminSession;
  if (staffSession) req.staff = staffSession;
  next();
}

// NEW: for staff POS / staff pages
function requireStaff(req, res, next) {
  const session = getSessionFromCookie(req, 'staff_token', 'staff');
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.staff = session;
  next();
}

module.exports = {
  requireAdmin,
  requireAdminOrStaff,
  requireStaff,
};
