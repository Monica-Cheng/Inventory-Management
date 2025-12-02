const { randomBytes } = require('crypto');

const sessions = new Map();

function createSession(user) {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { ...user, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  return token ? sessions.get(token) : undefined;
}

function destroySession(token) {
  if (token) sessions.delete(token);
}

module.exports = {
  createSession,
  getSession,
  destroySession,
};
