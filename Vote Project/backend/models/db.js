// // 📁 models/db.js
// require('dotenv').config();
// const mysql = require('mysql2');
// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT || 3306
// });

// db.connect(err => {
//     if (err) {
//         console.error('MySQL connection error:', err);
//         process.exit(1);
//     } else {
//         console.log('Connected to MySQL');
//     }
// });

// module.exports = db;

// backend/models/db.js
// require('dotenv').config();
// const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT || 3306,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
// });

// // ✅ ทดสอบเชื่อมต่อทันทีตอน start
// (async () => {
//     try {
//         const conn = await db.getConnection();
//         console.log("✅ Connected to MySQL");
//         conn.release(); // ปล่อย connection กลับเข้า pool
//     } catch (err) {
//         console.error("❌ MySQL connection error:", err);
//         process.exit(1);
//     }
// })();

// module.exports = db;

// version with getConnection for transaction support
// 📁 models/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// ✅ ใช้ได้ทั้ง 2 แบบ
// - db.query(sql, params, callback) → callback style (ของเดิม)
// - await db.query(sql, params) → promise style (ของใหม่) คืน rows ตรงๆ
function query(sql, params, callback) {
    if (typeof callback === 'function') {
        pool.query(sql, params)
            .then(([rows]) => callback(null, rows))
            .catch(err => callback(err));
    } else {
        return pool.query(sql, params).then(([rows]) => rows);
    }
}

// ✅ ใช้สำหรับ transaction
async function getConnection() {
    return pool.getConnection();
}

module.exports = { query, getConnection, pool };

