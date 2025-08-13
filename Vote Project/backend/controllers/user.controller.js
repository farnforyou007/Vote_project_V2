// 📁 controllers/user.controller.js
const db = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.refreshToken = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });

        const payload = { user_id: user.user_id, roles: user.roles };
        const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token: newToken });

    });

};


// exports.login = async (req, res) => {
//     const { student_id, password } = req.body;
//     if (!student_id || !password) {
//         return res.status(400).json({ success: false, message: 'รหัสนักศึกษาหรือรหัสผ่านว่าง' });
//     }
//     const sql = `
//     SELECT u.*, GROUP_CONCAT(r.role_name) AS roles
//     FROM Users u
//     LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
//     LEFT JOIN Role r ON ur.role_id = r.role_id
//     WHERE u.student_id = ? GROUP BY u.user_id
//     `;
//     db.query(sql, [student_id], async (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         if (!results.length) return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
//         const user = results[0];
//         const match = await bcrypt.compare(password, user.password_hash);
//         if (!match) return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });

//         const payload = {
//             user_id: user.user_id,
//             student_id: user.student_id,
//             roles: user.roles.split(',')
//         };

//         const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
//         console.log("Password Match?", match);

//         res.json({
//             success: true,
//             student_name: user.first_name + ' ' + user.last_name,
//             roles: payload.roles,
//             token
//         });
//     });
// };

exports.login = (req, res) => {
    const { student_id, password } = req.body;
    console.log("REQ LOGIN:", student_id, password); // ✅ ตรวจ input

    const sql = `
    SELECT u.*, d.department_name, y.year_name,
    GROUP_CONCAT(r.role_name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.role_id
    LEFT JOIN department d ON u.department_id = d.department_id
    LEFT JOIN year_levels y ON u.year_id = y.year_id
    WHERE u.student_id = ?
    GROUP BY u.user_id
    `;
    db.query(sql, [student_id], async (err, results) => {
        if (err) {
            console.error("DB ERROR:", err); // ✅ ตรวจ error DB
            return res.status(500).json({ success: false });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
        }

        const user = results[0];
        console.log("USER:", user); // ✅ ดูว่ามี field password_hash มั้ย

        const match = await bcrypt.compare(password, user.password_hash);
        console.log("PASSWORD MATCH?", match); // ✅ เทียบรหัสผ่าน

        if (!match) {
            return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const payload = {
            user_id: user.user_id,
            student_id: user.student_id,
            roles: (user.roles || 'นักศึกษา').split(',') // แยกเป็น array
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.json({
            success: true,
            token,
            student_name: user.first_name + ' ' + user.last_name,
            student_id: user.student_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            department: user.department_name, // ✅ ส่งชื่อแผนก
            year_level: user.year_name,       // ✅ ส่งชื่อชั้นปี
            roles: payload.roles,
        });

    });
};

exports.updateEmailAndPassword = async (req, res) => {
    const user_id = req.user.user_id;
    const { email, current_password, new_password } = req.body;

    // โหลดข้อมูลผู้ใช้ก่อน
    const sql = `SELECT password_hash FROM users WHERE user_id = ?`;
    db.query(sql, [user_id], async (err, results) => {
        if (err) return res.status(500).json({ success: false });

        const user = results[0];
        const match = await bcrypt.compare(current_password || '', user.password_hash);

        if (!match && new_password) {
            return res.status(401).json({
                success: false,
                message: 'รหัสผ่านเดิมไม่ถูกต้อง',
            });
        }

        const updates = ['email = ?'];
        const values = [email];

        if (new_password) {
            const newHash = await bcrypt.hash(new_password, 10);
            updates.push('password_hash = ?');
            values.push(newHash);
        }

        values.push(user_id);

        const updateSql = `
        UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?
    `;
        db.query(updateSql, values, (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
};
exports.getAllUsers = (req, res) => {
    const sql = `SELECT u.user_id, u.student_id, u.first_name, u.last_name,
    u.email, d.department_name, y.year_name, GROUP_CONCAT(r.role_name) AS roles,
    GROUP_CONCAT(ur.role_id) AS roles_array
    FROM Users u
    LEFT JOIN Department d ON u.department_id = d.department_id
    LEFT JOIN Year_levels y ON u.year_id = y.year_id
    LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
    LEFT JOIN Role r ON ur.role_id = r.role_id
    GROUP BY u.user_id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, users: results });
    });
};

exports.getDepartments = (req, res) => {
    db.query('SELECT department_id, department_name FROM Department', (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, departments: results });
    });
};

exports.getYears = (req, res) => {
    const sql = `
    SELECT y.year_id, y.year_name, y.level_id, l.level_name
    FROM Year_levels y
    JOIN Education_Levels l ON y.level_id = l.level_id
    ORDER BY l.level_id ASC, y.year_number ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, years: results });
    });
};

exports.getLevels = (req, res) => {
    db.query('SELECT * FROM Education_Levels', (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, levels: results });
    });
};

exports.filteredUsers = (req, res) => {
    const { department_id, year_id, level_id } = req.query;
    let sql = `
    SELECT u.user_id, u.student_id, u.first_name, u.last_name, u.email, u.is_active,
        d.department_name, y.year_number, y.year_name,
        u.department_id, u.year_id, y.level_id,
        GROUP_CONCAT(r.role_name) AS roles,
        COALESCE(GROUP_CONCAT(ur.role_id), '') AS roles_array
    FROM Users u
    LEFT JOIN Department d ON u.department_id = d.department_id
    LEFT JOIN Year_levels y ON u.year_id = y.year_id
    LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
    LEFT JOIN Role r ON ur.role_id = r.role_id
    `;
    const conditions = [];
    const values = [];
    if (department_id) { conditions.push('u.department_id = ?'); values.push(department_id); }
    if (year_id) { conditions.push('u.year_id = ?'); values.push(year_id); }
    if (level_id) { conditions.push('y.level_id = ?'); values.push(level_id); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' GROUP BY u.user_id';

    db.query(sql, values, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, users: results });
    });
};

exports.addUser = async (req, res) => {
    const { student_id, first_name, last_name, email, password, department_id, year_id, roles } = req.body;
    if (!student_id || !password || !first_name || !last_name || !department_id || !year_id || !roles?.length) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const insertUserSql = `
    INSERT INTO Users (student_id, first_name, last_name,
    email,password_hash, department_id, year_id, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    db.query(insertUserSql, [student_id, first_name, last_name, email, password_hash, department_id, year_id], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        const userId = result.insertId;
        const roleSql = `INSERT INTO User_Roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
        const roleValues = roles.flatMap(r => [userId, r]);
        db.query(roleSql, roleValues, (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
};

exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    const { student_id, first_name, last_name, email, password, department_id, year_id, roles } = req.body;
    const password_hash = password ? await bcrypt.hash(password, 10) : null;
    const updateSql = `
    UPDATE Users SET student_id = ?, first_name = ?, last_name = ?, email = ?,
    department_id = ?, year_id = ?, ${password_hash ? 'password_hash = ?,' : ''} updated_at = NOW()
    WHERE user_id = ?
    `;
    const params = [student_id, first_name, last_name, email, department_id, year_id, ...(password_hash ? [password_hash] : []), userId];
    db.query(updateSql, params, (err) => {
        if (err) return res.status(500).json({ success: false });
        db.query('DELETE FROM User_Roles WHERE user_id = ?', [userId], (err2) => {
            if (err2) return res.status(500).json({ success: false });
            const roleSql = `INSERT INTO User_Roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
            const roleValues = roles.flatMap(r => [userId, r]);
            db.query(roleSql, roleValues, (err3) => {
                if (err3) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        });
    });
};

exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    db.query('DELETE FROM User_Roles WHERE user_id = ?', [userId], (err) => {
        if (err) return res.status(500).json({ success: false });
        db.query('DELETE FROM Users WHERE user_id = ?', [userId], (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
};

exports.getStudents = (req, res) => {
    const { level, year, department } = req.query;

    let sql = `
    SELECT u.*, y.level_id, y.year_name, d.department_name
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN year_levels y ON u.year_id = y.year_id
    LEFT JOIN department d ON u.department_id = d.department_id
    WHERE ur.role_id = 1
    `;

    const params = [];

    if (level) {
        sql += ' AND y.level_id = ?';
        params.push(parseInt(level));
    }

    if (year) {
        sql += ' AND u.year_id = ?';
        params.push(parseInt(year));
    }

    if (department) {
        sql += ' AND u.department_id = ?';
        params.push(parseInt(department));
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("❌ SQL Error in getStudents:", err);
            return res.status(500).json({ success: false, message: "DB error" });
        }
        res.json({ success: true, users: results });
    });
};

