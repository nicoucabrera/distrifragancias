const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({
    host:'sql10.freesqldatabase.com',
    user:'sql10822633',
    password:'fkSEFdX9Di',
    database:'sql10822633',
    waitForConnections:true,
    connectionLimit:2,
  });
  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    const [cols] = await pool.query("DESCRIBE PERFUMES");
    console.log('\nPERFUMES columns:');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    const [sample] = await pool.query("SELECT * FROM PERFUMES LIMIT 1");
    console.log('\nSample row:', sample);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
