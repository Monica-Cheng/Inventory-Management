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

  async function ensureColumn(table, definition) {
    try {
      await db.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
      console.log(`Added column to ${table}: ${definition}`);
    } catch (err) {
      // MySQL duplicate column error
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }

  // admin accounts
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(30) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL
    )
  `);
  await ensureColumn('admin', 'password_hash VARCHAR(255) NOT NULL');
  try {
    await db.query('UPDATE admin SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL');
  } catch (err) {
    if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
  }
  console.log('Table "admin" ready');

  // staff accounts, tied to an admin
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(64) PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(30) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('pending','active','rejected') NOT NULL DEFAULT 'pending',
      approved_by VARCHAR(64) NULL,
      approved_at DATETIME NULL,
      CONSTRAINT fk_staff_admin
        FOREIGN KEY (admin_id) REFERENCES admin(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);
  await ensureColumn('staff', 'password_hash VARCHAR(255) NOT NULL');
  try {
    await db.query('UPDATE staff SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL');
  } catch (err) {
    if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
  }
  await ensureColumn('staff', "status ENUM('pending','active','rejected') NOT NULL DEFAULT 'pending'");
  await ensureColumn('staff', 'approved_by VARCHAR(64) NULL');
  await ensureColumn('staff', 'approved_at DATETIME NULL');
  try {
    await db.query(`
      ALTER TABLE staff
      ADD CONSTRAINT fk_staff_approved_by
        FOREIGN KEY (approved_by) REFERENCES admin(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_CANT_CREATE_TABLE') throw err;
  }
  console.log('Table "staff" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      CONSTRAINT uq_category_admin UNIQUE (admin_id, name),
      FOREIGN KEY (admin_id) REFERENCES admin(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);
  console.log('Table "category" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS product (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      category_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      quantity INT DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES category(id),
      FOREIGN KEY (admin_id) REFERENCES admin(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);
  await ensureColumn('product', 'category_id INT NOT NULL');
  console.log('Table "product" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`order\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      operator_id VARCHAR(64) NULL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending','completed','canceled') DEFAULT 'pending',
      FOREIGN KEY (admin_id) REFERENCES admin(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES staff(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `);
  try {
    await db.query('ALTER TABLE `order` MODIFY operator_id VARCHAR(64) NULL');
  } catch (err) {
    if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
  }
  console.log('Table "order" ready');

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_item (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES \`order\`(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (product_id) REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `);
  console.log('Table "order_item" ready');

  await db.end();
  console.log('Done');
}

main().catch((err) => {
  console.error('Setup failed:', err);
});
