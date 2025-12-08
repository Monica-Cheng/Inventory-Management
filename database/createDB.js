// database/createDB.js
// Creates the inventory_siao database and all required tables

const mysql = require('mysql2/promise');
const { ROOT_CONFIG, DB_NAME } = require('./config');

async function main() {
  // 1. connect as root (no database yet)
  const root = await mysql.createConnection(ROOT_CONFIG);
  console.log('Connected to MySQL as root');

  // 2. create database if not exists
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
  console.log(`Database "${DB_NAME}" ensured`);
  await root.end();

  // 3. connect to the new database
  const db = await mysql.createConnection({
    ...ROOT_CONFIG,
    database: DB_NAME,
  });
  console.log(`Connected to database "${DB_NAME}"`);

  // 4. create tables

  // admins
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone_number VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // staff accounts (for POS operators)
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone_number VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('PENDING','ACTIVE','REJECTED','TERMINATED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_staff_admin FOREIGN KEY (admin_id)
        REFERENCES admin(id) ON DELETE CASCADE
    )
  `);

  // product categories (Drinks, Food, Dessert, etc.)
  await db.query(`
    CREATE TABLE IF NOT EXISTS category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255) NULL,
      CONSTRAINT fk_category_admin FOREIGN KEY (admin_id)
        REFERENCES admin(id) ON DELETE CASCADE
    )
  `);

  // products (total_stock = full inventory in storeroom)
  await db.query(`
    CREATE TABLE IF NOT EXISTS product (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      category_id INT NULL,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      total_stock INT NULL,
      is_unlimited TINYINT(1) NOT NULL DEFAULT 0,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_admin FOREIGN KEY (admin_id)
        REFERENCES admin(id) ON DELETE CASCADE,
      CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES category(id) ON DELETE SET NULL
    )
  `);

  // deployment: how many of each product are deployed for selling
  await db.query(`
    CREATE TABLE IF NOT EXISTS deployment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL UNIQUE,
      deployed_qty INT NOT NULL DEFAULT 0,
      sold_qty INT NOT NULL DEFAULT 0,
      CONSTRAINT fk_deployment_product FOREIGN KEY (product_id)
        REFERENCES product(id) ON DELETE CASCADE
    )
  `);

  // orders header
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`order\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      operator_id INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(50),
      status ENUM('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PAID',
      CONSTRAINT fk_order_admin FOREIGN KEY (admin_id)
        REFERENCES admin(id) ON DELETE CASCADE,
      CONSTRAINT fk_order_staff FOREIGN KEY (operator_id)
        REFERENCES staff(id) ON DELETE SET NULL
    )
  `);

  // order line items
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_item (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      CONSTRAINT fk_item_order FOREIGN KEY (order_id)
        REFERENCES \`order\`(id) ON DELETE CASCADE,
      CONSTRAINT fk_item_product FOREIGN KEY (product_id)
        REFERENCES product(id) ON DELETE CASCADE
    )
  `);

  console.log('All tables created / ensured successfully');
  await db.end();
}

main().catch((err) => {
  console.error('Error creating DB:', err);
  process.exit(1);
});
