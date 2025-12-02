const mysql = require('mysql2/promise');
const { ROOT_CONFIG, DB_NAME } = require('./config');

async function dropTables() {
  try {
    const db = await mysql.createConnection({ ...ROOT_CONFIG, database: DB_NAME });
    console.log(`Connected to ${DB_NAME} for table cleanup`);

    // Drop in dependency-safe order
    const tables = ['order_item', '`order`', 'product', '`user`'];
    for (const name of tables) {
      const displayName = name.replace(/`/g, '');
      await db.query(`DROP TABLE IF EXISTS ${name}`);
      console.log(`Table "${displayName}" dropped (if existed)`);
    }

    await db.end();
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log(`Database "${DB_NAME}" not found, skipping table drops`);
    } else {
      throw err;
    }
  }
}

async function dropDatabase() {
  const root = await mysql.createConnection(ROOT_CONFIG);
  console.log('Connected to MySQL server');
  await root.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  console.log(`Database "${DB_NAME}" dropped (if existed)`);
  await root.end();
}

async function main() {
  await dropTables();
  await dropDatabase();
  console.log('Cleanup complete');
}

main().catch((err) => {
  console.error('Teardown failed:', err);
});
