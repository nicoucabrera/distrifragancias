const mysql = require('mysql2/promise');
(async () => {
  try {
    const pool = mysql.createPool({
      host:'sql10.freesqldatabase.com',
      user:'sql10822633',
      password:'fkSEFdX9Di',
      database:'sql10822633',
      waitForConnections:true,
      connectionLimit:2,
    });
    const [rows] = await pool.query('SELECT 1+1 AS result');
    console.log('connected', rows);
    await pool.query('CREATE TABLE IF NOT EXISTS discounted_winners_test (id INT AUTO_INCREMENT PRIMARY KEY)');
    console.log('table created');
    await pool.end();
  } catch (err) {
    console.error('db error', err);
    process.exit(1);
  }
})();
