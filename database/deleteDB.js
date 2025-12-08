// database/deleteDB.js
// Drops the whole database (ONLY run when you are okay losing all data)

const mysql = require('mysql2/promise');
const { ROOT_CONFIG, DB_NAME } = require('./config');

async function main() {
  const root = await mysql.createConnection(ROOT_CONFIG);
  console.log('Connected to MySQL as root');

  await root.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  console.log(`Database "${DB_NAME}" dropped (if it existed)`);

  await root.end();
}

main().catch((err) => {
  console.error('Error dropping DB:', err);
  process.exit(1);
});