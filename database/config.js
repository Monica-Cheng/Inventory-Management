// database/config.js
// Central place for DB settings used by createDB.js and backend connections

const ROOT_CONFIG = {
  host: 'localhost',
  user: 'root',       // XAMPP default
  password: '',       // XAMPP default is empty; change if you set a password
  multipleStatements: true,
};

const DB_NAME = 'inventory_siao'; // you can rename if you want

module.exports = { ROOT_CONFIG, DB_NAME };