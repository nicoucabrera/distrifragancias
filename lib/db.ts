import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'sql10.freesqldatabase.com',
  user: process.env.MYSQL_USER || 'sql10822633',
  password: process.env.MYSQL_PASSWORD || 'fkSEFdX9Di',
  database: process.env.MYSQL_DATABASE || 'sql10822633',
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 30000,
  connectTimeout: 20000,
});

// The free MySQL host aggressively closes idle connections, which surfaces as
// PROTOCOL_CONNECTION_LOST / ECONNRESET errors. Retry those transient failures.
const RETRYABLE_CODES = new Set(['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE']);

export async function queryWithRetry<T = any>(
  sql: string,
  params: Array<string | number> = [],
  retries = 2,
): Promise<[T, any]> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return (await pool.query(sql, params)) as unknown as [T, any];
    } catch (error: any) {
      lastError = error;
      if (!RETRYABLE_CODES.has(error?.code)) throw error;
      // brief backoff before retrying a dropped connection
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

const ensuredTables = new Set<string>();

export async function ensurePerfumesTable() {
  if (ensuredTables.has('PERFUMES')) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS PERFUMES (
      marca VARCHAR(255) NOT NULL,
      nombre VARCHAR(1024) NOT NULL,
      usdt VARCHAR(32) NOT NULL,
      pesos INT NOT NULL,
      INDEX idx_nombre (nombre(255)),
      INDEX idx_marca (marca(255))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  ensuredTables.add('PERFUMES');
}

export async function ensureWinnersTable() {
  if (ensuredTables.has('discounted_winners')) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discounted_winners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      marca VARCHAR(255) NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      usdt VARCHAR(32) NOT NULL,
      pesos INT NOT NULL,
      discount_usdt INT NOT NULL,
      discount_pesos INT NOT NULL,
      final_usdt VARCHAR(32) NOT NULL,
      final_pesos INT NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [quantityColumns] = await pool.query("SHOW COLUMNS FROM discounted_winners LIKE 'quantity'");
  if (!Array.isArray(quantityColumns) || quantityColumns.length === 0) {
    await pool.query('ALTER TABLE discounted_winners ADD COLUMN quantity INT NOT NULL DEFAULT 0');
  }

  const [productIdColumns] = await pool.query("SHOW COLUMNS FROM discounted_winners LIKE 'product_id'");
  if (Array.isArray(productIdColumns) && productIdColumns.length > 0) {
    const columnType = (productIdColumns[0] as any).Type?.toString?.().toLowerCase?.();
    if (columnType?.startsWith('int')) {
      await pool.query('ALTER TABLE discounted_winners MODIFY COLUMN product_id VARCHAR(255) NOT NULL');
    }
  }

  const [manualColumns] = await pool.query("SHOW COLUMNS FROM discounted_winners LIKE 'is_manual'");
  if (!Array.isArray(manualColumns) || manualColumns.length === 0) {
    await pool.query('ALTER TABLE discounted_winners ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT FALSE');
  }
  ensuredTables.add('discounted_winners');
}

export async function ensureSavedQuotesTable() {
  if (ensuredTables.has('saved_quotes')) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_quotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      items TEXT NOT NULL,
      client_tel VARCHAR(64) DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client_name (client_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  ensuredTables.add('saved_quotes');
}

export { pool };
