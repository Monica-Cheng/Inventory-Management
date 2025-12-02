require('dotenv').config();

const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

const ROOT_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(DB_PORT ? { port: DB_PORT } : {}),
};

const DB_NAME = process.env.DB_NAME || 'inventory_siao';
const DB_CONFIG = { ...ROOT_CONFIG, database: DB_NAME };

module.exports = {
  ROOT_CONFIG,
  DB_NAME,
  DB_CONFIG,
};
