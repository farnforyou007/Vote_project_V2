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

// // ✅ ใช้ได้ทั้ง 2 แบบ
// // - db.query(sql, params, callback) → callback style (ของเดิม)
// // - await db.query(sql, params) → promise style (ของใหม่) คืน rows ตรงๆ
// function query(sql, params, callback) {
//     if (typeof callback === 'function') {
//         pool.query(sql, params)
//             .then(([rows]) => callback(null, rows))
//             .catch(err => callback(err));
//     } else {
//         return pool.query(sql, params).then(([rows]) => rows);
//     }
// }

// // ✅ ใช้สำหรับ transaction
// async function getConnection() {
//     return pool.getConnection();
// }

// module.exports = { query, getConnection, pool};


// models/db.js  (HYBRID: รองรับทั้ง callback และ await)
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

// // ใช้ได้ 2 แบบ:
// // 1) db.query(sql, params, (err, rows)=>{})   ← โค้ดเดิม
// // 2) const rows = await db.query(sql, params) ← โค้ดใหม่
// function query(sql, params, callback) {
//     if (typeof callback === 'function') {
//         pool.query(sql, params)
//             .then(([rows]) => callback(null, rows))
//             .catch(err => callback(err));
//     } else {
//         return pool.query(sql, params).then(([rows]) => rows);
//     }
// }

// async function getConnection() {
//     const conn = await pool.getConnection();
//     // ให้ conn.query คืน rows ตรงๆ ด้วย (ช่วยเวลาทำ transaction)
//     const rawQuery = conn.query.bind(conn);
//     conn.query = async (sql, params) => {
//         const [rows] = await rawQuery(sql, params);
//         return rows;
//     };
//     return conn;
// }

// module.exports = { query, getConnection, pool };

// finally, ถ้าต้องการใช้แบบ promise ทั่วไป
// 📁 models/db.js
// require('dotenv').config();
// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host:     process.env.DB_HOST,
//   user:     process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port:     process.env.DB_PORT || 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// // ✅ คืน rows ตรง ๆ
// async function query(sql, params) {
//   const [rows] = await pool.query(sql, params);
//   return rows;
// }

// // ✅ ใช้สำหรับ Transaction
// async function getConnection() {
//   return pool.getConnection();
// }

// module.exports = { query, getConnection, pool };






//////// 

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// ✅ query() คืน rows อย่างเดียว
async function query(sql, params) {
    const [rows] = await pool.query(sql, params);
    return rows;
}

// ✅ getConnection() สำหรับ transaction
async function getConnection() {
    return pool.getConnection();
}

module.exports = {
    query,
    getConnection,
    pool, // export pool เผื่อกรณีต้องใช้ตรง ๆ
};
