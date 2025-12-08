// backend/db/connection.js
// Connection pool and helpers for MySQL

const mysql = require('mysql2/promise');
const { ROOT_CONFIG, DB_NAME } = require('../../database/config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...ROOT_CONFIG,
      database: DB_NAME,
      connectionLimit: 10,
    });
  }
  return pool;
}

async function getConnection() {
  return getPool().getConnection();
}

async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

module.exports = { getConnection, query };