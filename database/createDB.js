const mysql = require('mysql2/promise');
const { ROOT_CONFIG, DB_NAME } = require('./config');

async function main() {
  const root = await mysql.createConnection(ROOT_CONFIG);
  console.log('Connected to MySQL server');

  await root.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  console.log(`Database "${DB_NAME}" ready`);
  await root.end();

  const db = await mysql.createConnection({ ...ROOT_CONFIG, database: DB_NAME });
  console.log(`Connected to ${DB_NAME}`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`user\` (
      id VARCHAR(64) PRIMARY KEY,
      user_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(30) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      role ENUM('admin','staff') NOT NULL
    )
  `);
  console.log('Table "user" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS product (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      quantity INT DEFAULT 0,
      FOREIGN KEY (admin_id) REFERENCES \`user\`(id)
    )
  `);
  console.log('Table "product" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`order\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      operator_id VARCHAR(64) NOT NULL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending','completed','canceled') DEFAULT 'pending',
      FOREIGN KEY (admin_id) REFERENCES \`user\`(id),
      FOREIGN KEY (operator_id) REFERENCES \`user\`(id)
    )
  `);
  console.log('Table "order" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_item (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES \`order\`(id),
      FOREIGN KEY (product_id) REFERENCES product(id)
    )
  `);
  console.log('Table "order_item" ready');

  await db.end();
  console.log('Done');
}

main().catch((err) => {
  console.error('Setup failed:', err);
});
