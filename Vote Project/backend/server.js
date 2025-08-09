/// 📌 เรียก dotenv ก่อนทุกอย่าง
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = require('./models/db');

// ✅ DEBUG log ตรวจว่า server เริ่มแล้ว
console.log("✅ SERVER STARTED @", new Date().toLocaleString());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- CORS --------------------
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

// -------------------- Middleware --------------------
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// -------------------- Routes --------------------
const userRoutes = require('./routes/user.routes');
const electionRoutes = require('./routes/election.routes');
const eligibilityRoutes = require('./routes/eligibility.routes');
const applicationRoutes = require('./routes/application.routes');
const candidateRoutes = require('./routes/candidate.routes');
const voteRoutes = require('./routes/vote.routes');
app.use('/api', candidateRoutes);
app.use('/api', voteRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/students ', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api', eligibilityRoutes);

app.use('/api', applicationRoutes);

// app.use('/api',candidateRoutes);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});



// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const mysql = require('mysql2');
// const bcrypt = require('bcrypt');


// const app = express();
// app.use(cors());
// app.use(bodyParser.json());
// app.use('/uploads', express.static('uploads'));


// // ✅ เชื่อมต่อ MySQL
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'farn007',
//   port: 3306,
//   database: 'vote_db'
// });

// db.connect((err) => {
//   if (err) {
//     console.error('MySQL connection error:', err);
//     process.exit(1);
//   } else {
//     console.log('Connected to MySQL');
//   }
// });

// // ✅ API Login
// app.post('/api/login', (req, res) => {
//   const { student_id, password } = req.body;

//   if (!student_id || !password) {
//     return res.status(400).json({ success: false, message: 'รหัสนักศึกษาหรือรหัสผ่านว่าง' });
//   }

//   const sql = `
//     SELECT
//       u.*,
//       GROUP_CONCAT(r.role_name) AS roles
//     FROM Users u
//     LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
//     LEFT JOIN Role r ON ur.role_id = r.role_id
//     WHERE u.student_id = ?
//     GROUP BY u.user_id
//   `;

//   db.query(sql, [student_id], async (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//     if (results.length === 0) {
//       return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
//     }

//     const user = results[0];
//     const match = await bcrypt.compare(password, user.password_hash);

//     if (match) {
//       return res.json({
//         success: true,
//         message: 'ล็อกอินสำเร็จ',
//         user_id: user.user_id,
//         student_name: user.first_name + ' ' + user.last_name,
//         roles: user.roles ? user.roles.split(",") : []
//       });
//     } else {
//       return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
//     }
//   });
// });

// // // WHEN NOW() > end_date THEN 'closed' ให้แอดมินมาแก้สถานะว่าเสร็จสิ้นแล้ว ปุ่มดูผลถึงจะขึ้น
// // WHEN NOW() > end_date THEN 'completed' อันนี้อัตโนมัติเมื่อเวลาหมด
// app.get('/api/elections', (req, res) => {
//   const sql = `
//     SELECT *,
// CASE
//   WHEN status = 'closed' THEN 'closed'
//   WHEN status = 'completed' THEN 'completed'
//   WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
//   WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
//   WHEN NOW() > end_date THEN 'completed'
//   ELSE 'draft'
// END AS computed_status
// FROM Elections;

//   `;
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//     res.json({ success: true, elections: results });
//   });
// });


// app.get('/api/elections/:id', (req, res) => {
//   const electionId = req.params.id;
//   const sql = 'SELECT * FROM Elections WHERE election_id = ?';
//   db.query(sql, [electionId], (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//     if (results.length === 0) {
//       return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
//     }
//     res.json({ success: true, election: results[0] });
//   });
// });

// //  ✅ โหลดรายชื่อผู้ใช้งานแบบทั้งหมด(มีชื่อ แผนก ชั้นปี)
// app.get('/api/users', (req, res) => {
//   const sql = `
//   SELECT u.user_id, u.student_id, u.first_name, u.last_name, u.email,
// d.department_name, y.year_name,
// GROUP_CONCAT(r.role_name) AS roles,
// GROUP_CONCAT(ur.role_id) AS roles_array
// FROM Users u
// LEFT JOIN Department d ON u.department_id = d.department_id
// LEFT JOIN Year_levels y ON u.year_id = y.year_id
// LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
// LEFT JOIN Role r ON ur.role_id = r.role_id
// GROUP BY u.user_id
//   `;
//   // SELECT u.user_id, u.student_id, u.first_name, u.last_name, u.email,u.is_active, d.department_name, y.year_number, y.year_name,
//   //   GROUP_CONCAT(r.role_name) AS roles
//   //   FROM Users u
//   //   LEFT JOIN Department d ON u.department = d.department_id
//   //   LEFT JOIN Year_levels y ON u.year_id = y.year_id
//   //   LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
//   //   LEFT JOIN Role r ON ur.role_id = r.role_id
//   //   GROUP BY u.user_id
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//     res.json({ success: true, users: results });
//   });
// });

// // ✅ โหลดแผนก (dropdown กรอง)
// app.get('/api/users/departments', (req, res) => {
//   db.query('SELECT department_id, department_name FROM Department', (err, results) => {
//     if (err) return res.status(500).json({ success: false });
//     res.json({ success: true, departments: results });
//   });
// });

// // ✅ โหลดชั้นปี (dropdown กรอง)
// // app.get('/api/users/years', (req, res) => {
// //   db.query('SELECT year_id, year_number, year_name FROM Year_levels', (err, results) => {
// //     if (err) return res.status(500).json({ success: false });
// //     res.json({ success: true, years: results });
// //   });
// // });

// app.get('/api/users/years', (req, res) => {
//   const sql = `
//     SELECT y.year_id, y.year_name, y.level_id, l.level_name
//     FROM Year_levels y
//     JOIN Education_Levels l ON y.level_id = l.level_id
//     ORDER BY l.level_id ASC, y.year_number ASC
//   `;

//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ success: false, message: 'Database error' });
//     }
//     res.json({ success: true, years: results });
//   });
// });

// app.get('/api/users/filtered-users', (req, res) => {
//   const { department_id, year_id, level_id } = req.query;
//   let sql = `
//     SELECT u.user_id, u.student_id, u.first_name, u.last_name, u.email,
//     u.is_active, d.department_name, y.year_number, y.year_name,u.department_id, u.year_id,y.level_id,
//     GROUP_CONCAT(r.role_name) AS roles,
//     COALESCE(GROUP_CONCAT(ur.role_id), '') AS roles_array
//     FROM Users u
//     LEFT JOIN Department d ON u.department_id = d.department_id
//     LEFT JOIN Year_levels y ON u.year_id = y.year_id
//     LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
//     LEFT JOIN Role r ON ur.role_id = r.role_id
//   `;

//   const conditions = [];
//   const values = [];

//   if (department_id) {
//     conditions.push('u.department_id = ?');
//     values.push(department_id);
//   }
//   if (year_id) {
//     conditions.push('u.year_id = ?');
//     values.push(year_id);
//   }
//   if (level_id) {
//     conditions.push('y.level_id = ?');
//     values.push(level_id);
//   }

//   if (conditions.length > 0) {
//     sql += ' WHERE ' + conditions.join(' AND ');
//   }

//   sql += ' GROUP BY u.user_id';

//   db.query(sql, values, (err, results) => {
//     if (err) return res.status(500).json({ success: false, message: 'Query error' });
//     console.log("✅ results =>", results);
//     res.json({ success: true, users: results });
//   });
// });

// app.get('/api/users/levels', (req, res) => {
//   const sql = 'SELECT * FROM education_levels';
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error('Error fetching education levels:', err);
//       return res.status(500).json({ success: false, message: 'Server error' });
//     }
//     res.json({ success: true, levels: results });
//   });
// });

// //เพิ่มผู้ใช้งาน
// app.post('/api/users/add', async (req, res) => {
//   const {
//     first_name,
//     last_name,
//     student_id,
//     email,
//     password,
//     department_id,
//     year_id,
//     roles // array of role_id
//   } = req.body;

//   try {
//     // ตรวจสอบว่ามีข้อมูลจำเป็นครบไหม
//     console.log("BODY:", req.body);
//     if (!student_id || !password || !first_name || !last_name || !department_id || !year_id || !roles?.length) {
//       return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
//     }

//     // เข้ารหัสรหัสผ่าน
//     const password_hash = await bcrypt.hash(password, 10);

//     // 1. เพิ่มข้อมูลในตาราง Users
//     const insertUserSql = `
//       INSERT INTO Users (student_id, first_name, last_name, email, password_hash, department_id,year_id, is_active, created_at, updated_at)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
//     `;

//     db.query(insertUserSql, [student_id, first_name, last_name, email, password_hash, department_id,year_id], (err, result) => {
//       if (err) {
//         console.error('Insert user error:', err);
//         return res.status(500).json({ success: false, message: 'เพิ่มผู้ใช้ไม่สำเร็จ' });
//       }

//       const newUserId = result.insertId;

//       // 2. เพิ่มบทบาทใน User_Roles
//       const insertRolesSql = `
//         INSERT INTO User_Roles (user_id, role_id)
//         VALUES ${roles.map(() => '(?, ?)').join(',')}
//       `;
//       const roleValues = roles.flatMap((role_id) => [newUserId, role_id]);

//       db.query(insertRolesSql, roleValues, (err2) => {
//         if (err2) {
//           console.error('Insert roles error:', err2);
//           return res.status(500).json({ success: false, message: 'เพิ่มบทบาทผู้ใช้ไม่สำเร็จ' });
//         }

//         res.json({ success: true, message: 'เพิ่มผู้ใช้งานสำเร็จ' });
//       });
//     });
//   } catch (err) {
//     console.error('Unexpected error:', err);
//     res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
//   }
//   console.log("✅ Final Roles:", roles);  // ต้องเป็น [1, 2]

// });

// // ลบผู้ใช้งาน
// app.delete('/api/users/delete/:id', (req, res) => {
//   const userId = req.params.id;
//   db.query('DELETE FROM User_Roles WHERE user_id = ?', [userId], (err) => {
//     if (err) return res.status(500).json({ success: false, message: 'ลบไม่สำเร็จ (User_Roles)' });

//     db.query('DELETE FROM Users WHERE user_id = ?', [userId], (err2) => {
//       if (err2) return res.status(500).json({ success: false, message: 'ลบไม่สำเร็จ (Users)' });

//       res.json({ success: true });
//     });
//   });
// });

// // แก้ไขผู้ใช้งาน
// app.put('/api/users/update/:id', async (req, res) => {
//   const userId = req.params.id;
//   const {
//     student_id, first_name, last_name, email, password, department_id, year_id, roles
//   } = req.body;

//   try {
//     const password_hash = password ? await bcrypt.hash(password, 10) : null;

//     const updateSql = `
//       UPDATE Users SET
//         student_id = ?, first_name = ?, last_name = ?, email = ?, 
//         department_id = ?, year_id = ?, ${password_hash ? 'password_hash = ?,' : ''} updated_at = NOW()
//       WHERE user_id = ?
//     `;

//     const params = [
//       student_id, first_name, last_name, email, department_id, year_id,
//       ...(password_hash ? [password_hash] : []),
//       userId
//     ];

//     db.query(updateSql, params, (err) => {
//       if (err) return res.status(500).json({ success: false });

//       // ล้าง role เก่าก่อน
//       db.query('DELETE FROM User_Roles WHERE user_id = ?', [userId], (err2) => {
//         if (err2) return res.status(500).json({ success: false });

//         const roleInsert = `
//           INSERT INTO User_Roles (user_id, role_id)
//           VALUES ${roles.map(() => '(?, ?)').join(',')}
//         `;
//         const roleValues = roles.flatMap(r => [userId, r]);
//         db.query(roleInsert, roleValues, (err3) => {
//           if (err3) return res.status(500).json({ success: false });
//           res.json({ success: true });
//         });
//       });
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ success: false });
//   }
// });


// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
