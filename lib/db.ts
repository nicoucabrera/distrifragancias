import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export async function ensureWinnersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discounted_winners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      marca VARCHAR(255) NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      usdt VARCHAR(32) NOT NULL,
      pesos INT NOT NULL,
      discount_usdt INT NOT NULL,
      discount_pesos INT NOT NULL,
      final_usdt VARCHAR(32) NOT NULL,
      final_pesos INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export { pool };
