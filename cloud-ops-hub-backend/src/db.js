const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'viniZIKA3103',
  database: process.env.DB_NAME || 'cloudops_hub',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 5000
});

async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('[DB] Erro ao executar query:', err.message);
    throw err;
  }
}

async function getUserByEmail(email) {
  try {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[DB] Erro ao buscar usuário por email:', err.message);
    return null;
  }
}

module.exports = {
  pool,
  query,
  getUserByEmail
};
