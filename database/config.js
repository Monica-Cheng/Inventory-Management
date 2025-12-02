const ROOT_CONFIG = { host: 'localhost', user: 'root', password: '' };
const DB_NAME = 'inventory_siao';
const DB_CONFIG = { ...ROOT_CONFIG, database: DB_NAME };

module.exports = {
  ROOT_CONFIG,
  DB_NAME,
  DB_CONFIG,
};
