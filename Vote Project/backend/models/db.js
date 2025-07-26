// // 📁 models/db.js
require('dotenv').config();
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL');
    }
});

module.exports = db;

// backend/models/db.js
// require('dotenv').config();
// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
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
//         const conn = await pool.getConnection();
//         console.log("✅ Connected to MySQL");
//         conn.release(); // ปล่อย connection กลับเข้า pool
//     } catch (err) {
//         console.error("❌ MySQL connection error:", err);
//         process.exit(1);
//     }
// })();

// module.exports = pool;
