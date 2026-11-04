const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const filePath = 'tmp-old-perfumes-data-utf8.ts';
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}. Run this script from the repository root after recovering the old static data file.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const perfumes: Perfume\[\] = (\[.*\]);/s);
  if (!match) {
    console.error('Could not parse perfumes array from old data file.');
    process.exit(1);
  }

  const perfumes = JSON.parse(match[1]);
  const requiredEnv = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    throw new Error(`Faltan variables de entorno para la DB: ${missingEnv.join(', ')}`);
  }

  const pool = await mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: String(process.env.MYSQL_SSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PERFUMES (
        id INT PRIMARY KEY,
        marca VARCHAR(255) NOT NULL,
        nombre VARCHAR(1024) NOT NULL,
        usdt VARCHAR(32) NOT NULL,
        pesos INT NOT NULL,
        INDEX idx_nombre (nombre(255)),
        INDEX idx_marca (marca(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const rows = perfumes.map(p => [p.id, p.marca, p.nombre, p.usdt, p.pesos]);
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await pool.query(
        'INSERT INTO PERFUMES (id, marca, nombre, usdt, pesos) VALUES ? ON DUPLICATE KEY UPDATE marca = VALUES(marca), nombre = VALUES(nombre), usdt = VALUES(usdt), pesos = VALUES(pesos)',
        [batch]
      );
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(rows.length / batchSize)}`);
    }

    const [count] = await pool.query('SELECT COUNT(*) AS c FROM PERFUMES');
    console.log('Perfumes in DB:', count[0].c);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
