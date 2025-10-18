// 📁 controllers/user.controller.js
const db = require('../models/db'); // db.query() -> returns rows only
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/** ------------------------------------------------------------------ */
/** JWT: refresh token                                                  */
/** ------------------------------------------------------------------ */
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

/** ------------------------------------------------------------------ */
/** GET /api/users/me                                                   */
/** ------------------------------------------------------------------ */
exports.getProfile = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const sql = `
      SELECT 
        u.user_id,
        u.student_id, u.first_name, u.last_name, u.email,
        d.department_name AS department,
        y.year_name       AS year_level,
        GROUP_CONCAT(r.role_name) AS roles
      FROM users u
      LEFT JOIN department   d ON u.department_id = d.department_id
      LEFT JOIN year_levels  y ON u.year_id = y.year_id
      LEFT JOIN user_roles  ur ON u.user_id = ur.user_id
      LEFT JOIN role         r ON ur.role_id = r.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `;
        const rows = await db.query(sql, [user_id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

        const row = rows[0];
        return res.json({
            success: true,
            user: {
                user_id: row.user_id,
                student_id: row.student_id,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email,
                department: row.department,
                year_level: row.year_level,
                roles: (row.roles || '').split(',').filter(Boolean),
            },
        });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** POST /api/users/login                                               */
/** ------------------------------------------------------------------ */
exports.login = async (req, res) => {
    try {
        const { student_id, password } = req.body;

        const sql = `
      SELECT u.*, d.department_name, y.year_name,
             GROUP_CONCAT(r.role_name) AS roles
      FROM users u
      LEFT JOIN user_roles  ur ON u.user_id = ur.user_id
      LEFT JOIN role         r ON ur.role_id = r.role_id
      LEFT JOIN department   d ON u.department_id = d.department_id
      LEFT JOIN year_levels  y ON u.year_id = y.year_id
      WHERE u.student_id = ?
      GROUP BY u.user_id
    `;
        const rows = await db.query(sql, [student_id]);
        if (!rows.length) {
            return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password || '', user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const payload = {
            user_id: user.user_id,
            student_id: user.student_id,
            roles: (user.roles || 'นักศึกษา').split(','),
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        return res.json({
            success: true,
            token,
            student_name: `${user.first_name} ${user.last_name}`,
            student_id: user.student_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            department: user.department_name,
            year_level: user.year_name,
            roles: payload.roles,
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** PATCH /api/users/me (อัปเดตอีเมล / รหัสผ่าน)                       */
/** ------------------------------------------------------------------ */
exports.updateEmailAndPassword = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { email, current_password, new_password } = req.body;

        const rows = await db.query(`SELECT password_hash FROM users WHERE user_id = ?`, [user_id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

        const dup = await db.query(`SELECT user_id FROM users WHERE email = ? AND user_id <> ?`, [email, user_id]);
        if (dup.length) return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });

        const user = rows[0];
        if (new_password && new_password.length < 8) {
            return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
        }

        if (new_password) {
            const ok = await bcrypt.compare(current_password || '', user.password_hash);
            if (!ok) {
                return res.status(400).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
            }
        }


        const updates = ['email = ?'];
        const values = [email];

        if (new_password) {
            const newHash = await bcrypt.hash(new_password, 10);
            updates.push('password_hash = ?');
            values.push(newHash);
        }
        values.push(user_id);

        const updateSql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`;
        await db.query(updateSql, values);

        return res.json({ success: true });
    } catch (err) {
        console.error('updateEmailAndPassword error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/users/departments                                          */
/** ------------------------------------------------------------------ */
exports.getDepartments = async (req, res) => {
    try {
        const rows = await db.query(`SELECT department_id, department_name FROM department`);
        return res.json({ success: true, departments: rows });
    } catch (err) {
        console.error('getDepartments error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/users/years                                                */
/** ------------------------------------------------------------------ */
exports.getYears = async (req, res) => {
    try {
        const sql = `
      SELECT y.year_id, y.year_name, y.level_id, l.level_name, y.year_number
      FROM year_levels y
      JOIN education_levels l ON y.level_id = l.level_id
      ORDER BY l.level_id ASC, y.year_number ASC
    `;
        const rows = await db.query(sql);
        return res.json({ success: true, years: rows });
    } catch (err) {
        console.error('getYears error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/users/levels                                               */
/** ------------------------------------------------------------------ */
exports.getLevels = async (req, res) => {
    try {
        const rows = await db.query(`SELECT level_id, level_name FROM education_levels`);
        return res.json({ success: true, levels: rows });
    } catch (err) {
        console.error('getLevels error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/users/filtered-users   // pageination                                  */
/** ------------------------------------------------------------------ */
exports.filteredUsers = async (req, res) => {
    try {
        const { department_id,
            year_id,
            level_id
        } = req.query;
        const search = (req.query.search || '').trim().toLowerCase();

        const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const offset = (page - 1) * limit;

        let baseSql = `
      FROM users u
      LEFT JOIN department   d ON u.department_id = d.department_id
      LEFT JOIN year_levels  y ON u.year_id = y.year_id
      LEFT JOIN user_roles  ur ON u.user_id = ur.user_id
      LEFT JOIN role         r ON ur.role_id = r.role_id
    `;
        const where = [];
        const params = [];

        if (department_id) {
            where.push('u.department_id = ?');
            params.push(department_id);
        }
        if (year_id) {
            where.push('u.year_id = ?');
            params.push(year_id);
        }
        if (level_id) {
            where.push('y.level_id = ?');
            params.push(level_id);
        }

        if (search) {
            where.push(`(
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
        OR LOWER(u.student_id) LIKE ?
        OR LOWER(u.email)      LIKE ?
      )`);
            params.push(`%${search}%`,
                `%${search}%`,
                `%${search}%`);
        }
        if (where.length)
            baseSql += ' WHERE ' + where.join(' AND ');

        const countSql = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT u.user_id
        ${baseSql}
        GROUP BY u.user_id
      ) t
    `;
        const countRows = await db.query(countSql, params);
        const total = countRows[0]?.total || 0;
        const totalPages = Math.max(Math.ceil(total / limit), 1);

        const dataSql = `
      SELECT 
        u.user_id, u.student_id, u.first_name, u.last_name, u.email, u.is_active,
        d.department_name, y.year_number, y.year_name,
        u.department_id, u.year_id, y.level_id,
        GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name)               AS roles,
        COALESCE(GROUP_CONCAT(DISTINCT ur.role_id ORDER BY ur.role_id), '')   AS roles_array
      ${baseSql}
      GROUP BY u.user_id
      ORDER BY u.user_id ASC
      LIMIT ? OFFSET ?
    `;
        const rows = await db.query(dataSql, [...params, limit, offset]);
        // console.log(rows);
        // console.log(total, totalPages);
        return res.json({ success: true, users: rows, page, limit, total, totalPages });
    } catch (err) {
        console.error('filteredUsers error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** POST /api/users/add                                                 */
/** ------------------------------------------------------------------ */
// exports.addUser = async (req, res) => {
//     const { student_id,
//         first_name,
//         last_name,
//         email,
//         password,
//         department_id,
//         year_id, roles } = req.body;

//     if (!student_id || !password || !first_name || !last_name || !department_id || !year_id || !roles?.length) {
//         return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
//     }

//     // ✅ validate เพิ่มเติม
//     if (password.length < 8) {
//         return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
//     }
//     if (!/^[a-zA-Z0-9]+$/.test(String(student_id))) {
//         return res.status(400).json({ success: false, message: 'รหัสนักศึกษาต้องเป็นตัวอักษร/ตัวเลขเท่านั้น' });
//     }
//     // อนุญาตอักขระพิเศษและตัวเลขในอีเมล (regex ครอบคลุมกว่าเดิม)
//     if (email && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email)) {
//         return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
//     }
//     const conn = await db.getConnection();
//     try {
//         await conn.beginTransaction();

//         const password_hash = await bcrypt.hash(password, 10);
//         const insertUserSql = `
//       INSERT INTO users
//         (student_id, first_name, last_name, email, password_hash, department_id, year_id, is_active, created_at, updated_at)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
//     `;
//         const [result] = await conn.query(insertUserSql, [
//             student_id, first_name, last_name, email, password_hash, department_id, year_id,
//         ]);
//         const userId = result.insertId;
//         // console.log('New user ID:', userId);
//         // console.log('id', result.insertId);
//         // ใส่บทบาทหลายแถวครั้งเดียว (bulk insert)
//         const roleSql = `INSERT INTO user_roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
//         const roleValues = roles.flatMap((r) => [userId, r]);
//         console.log('roleValues', roleValues);
//         await conn.query(roleSql, roleValues);

//         await conn.commit();
//         return res.json({ success: true });
//     } catch (err) {
//         await conn.rollback();
//         console.error('addUser error:', err);
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     } finally {
//         conn.release();
//     }
// };

// controllers/users.controller.js
exports.addUser = async (req, res) => {
    const {
        student_id, first_name, last_name, email,
        password, department_id, year_id, roles
    } = req.body;

    if (!student_id || !password || !first_name || !last_name || !department_id || !year_id || !roles?.length) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    // ✅ validate เพิ่มเติม
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    if (!/^[a-zA-Z0-9]+$/.test(String(student_id))) {
        return res.status(400).json({ success: false, message: 'รหัสนักศึกษาต้องเป็นตัวอักษร/ตัวเลขเท่านั้น' });
    }
    // อนุญาตอักขระพิเศษและตัวเลขในอีเมล (regex ครอบคลุมกว่าเดิม)
    if (email && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }



    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // ก่อน INSERT
        // เช็ค student_id ซ้ำ
        const [dupSid] = await conn.query(`SELECT user_id FROM users WHERE student_id = ? LIMIT 1`, [student_id]);
        if (dupSid.length) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' });
        }

        // เช็ค email ซ้ำ (ถ้ามีอีเมล)
        if (email) {
            const [dupEmail] = await conn.query(`SELECT user_id FROM users WHERE email = ? LIMIT 1`, [email]);
            if (dupEmail.length) {
                await conn.rollback();
                return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);
        const insertUserSql = `
      INSERT INTO users
        (student_id, first_name, last_name, email, password_hash, department_id, year_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
        const [result] = await conn.query(insertUserSql, [
            student_id, first_name, last_name, email, password_hash, department_id, year_id,
        ]);
        const userId = result.insertId;

        const roleSql = `INSERT INTO user_roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
        const roleValues = roles.flatMap((r) => [userId, r]);
        await conn.query(roleSql, roleValues);

        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();

        // ✅ รองรับกรณีพึ่งพา UNIQUE INDEX ที่ DB อยู่แล้ว
        if (err?.code === 'ER_DUP_ENTRY') {
            // ถ้า unique index อยู่ที่คอลัมน์ email
            if (String(err.sqlMessage || '').includes('users.email')) {
                return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }
            if (String(err.sqlMessage || '').includes('users.student_id')) {
                return res.status(409).json({ success: false, message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' });
            }
        }

        console.error('addUser error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    } finally {
        conn.release();
    }
};


/** ------------------------------------------------------------------ */
/** PUT /api/users/update/:id                                           */
/** ------------------------------------------------------------------ */
// exports.updateUser = async (req, res) => {
//     const userId = req.params.id;
//     const { student_id,
//         first_name,
//         last_name,
//         email,
//         password,
//         department_id,
//         year_id,
//         roles = [] } = req.body;

//     const conn = await db.getConnection();
//     try {
//         await conn.beginTransaction();

//         const password_hash = password ? await bcrypt.hash(password, 10) : null;

//         const updateSql = `
//       UPDATE users
//       SET student_id = ?,
//             first_name = ?, 
//             last_name = ?, 
//             email = ?,
//             department_id = ?, 
//             year_id = ?, 
//             ${password_hash ? 'password_hash = ?,' : ''}
//             updated_at = NOW()
//       WHERE user_id = ?
//     `;
//         const params = [
//             student_id,
//             first_name,
//             last_name,
//             email,
//             department_id,
//             year_id,
//             ...(password_hash ? [password_hash] : []),
//             userId,
//         ];
//         await conn.query(updateSql, params);

//         await conn.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

//         if (roles.length) {
//             const roleSql = `INSERT INTO user_roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
//             const roleValues = roles.flatMap((r) => [userId, r]);
//             await conn.query(roleSql, roleValues);
//         }

//         await conn.commit();
//         return res.json({ success: true });
//     } catch (err) {
//         await conn.rollback();
//         console.error('updateUser error:', err);
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     } finally {
//         conn.release();
//     }
// };

exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    const {
        student_id,
        first_name,
        last_name,
        email,
        password,
        department_id,
        year_id,
        roles = [],
    } = req.body;

    // ✅ validate เบื้องต้น
    if (!student_id || !first_name || !last_name || !department_id || !year_id) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    if (password && password.length < 8) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    if (email && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // ✅ เช็กซ้ำ (ตัด user ปัจจุบันออก)
        const [dups] = await conn.query(
            `SELECT user_id, email, student_id
         FROM users
        WHERE (email = ? OR student_id = ?) AND user_id <> ?
        LIMIT 1`,
            [email, student_id, userId]
        );
        if (dups.length) {
            const isEmailDup = dups[0].email === email;
            const isSidDup = dups[0].student_id === student_id;
            return res.status(409).json({
                success: false,
                message: isEmailDup
                    ? 'อีเมลนี้ถูกใช้งานแล้ว'
                    : 'รหัสนักศึกษานี้ถูกใช้งานแล้ว',
            });
        }

        const password_hash = password ? await bcrypt.hash(password, 10) : null;

        // ✅ อัปเดตผู้ใช้
        const updateSql = `
      UPDATE users
         SET student_id = ?,
             first_name = ?,
             last_name  = ?,
             email      = ?,
             department_id = ?,
             year_id       = ?,
             ${password_hash ? 'password_hash = ?,' : ''}
             updated_at = NOW()
       WHERE user_id = ?
    `;
        const params = [
            student_id,
            first_name,
            last_name,
            email,
            department_id,
            year_id,
            ...(password_hash ? [password_hash] : []),
            userId,
        ];
        await conn.query(updateSql, params);

        // ✅ อัปเดตบทบาท
        await conn.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        if (roles.length) {
            const roleSql = `INSERT INTO user_roles (user_id, role_id) VALUES ${roles.map(() => '(?, ?)').join(',')}`;
            const roleValues = roles.flatMap((r) => [userId, r]);
            await conn.query(roleSql, roleValues);
        }

        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();

        // ✅ map duplicate จาก unique index ของ DB ให้เป็น 409
        if (err?.code === 'ER_DUP_ENTRY') {
            const msg = String(err.sqlMessage || '');
            if (msg.includes('users.email')) {
                return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }
            if (msg.includes('users.student_id')) {
                return res.status(409).json({ success: false, message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' });
            }
            return res.status(409).json({ success: false, message: 'ข้อมูลซ้ำกับผู้ใช้อื่น' });
        }

        console.error('updateUser error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    } finally {
        conn.release();
    }
};


/** ------------------------------------------------------------------ */
/** DELETE /api/users/delete/:id                                        */
/** ------------------------------------------------------------------ */
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
        return res.json({ success: true });
    } catch (err) {
        if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED')) {
            return res.status(409).json({
                success: false,
                message: 'ลบไม่ได้ เพราะมีข้อมูลที่เชื่อมโยงอยู่ (เช่น สิทธิเลือกตั้ง/ใบสมัคร/คะแนนโหวต)',
            });
        }
        console.error('deleteUser error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

// /** ------------------------------------------------------------------ */
// /** GET /api/users/students                                             */
// /** ------------------------------------------------------------------ */
exports.getStudents = async (req, res) => {
    try {
        const { level, year, department } = req.query;

        let sql = `
      SELECT u.*, y.level_id, y.year_name, d.department_name
      FROM users u
      JOIN user_roles   ur ON u.user_id = ur.user_id
      LEFT JOIN year_levels y ON u.year_id = y.year_id
      LEFT JOIN department  d ON u.department_id = d.department_id
      WHERE ur.role_id = 1
    `;
        const params = [];

        if (level) { sql += ' AND y.level_id = ?'; params.push(parseInt(level, 10)); }
        if (year) { sql += ' AND u.year_id = ?'; params.push(parseInt(year, 10)); }
        if (department) { sql += ' AND u.department_id = ?'; params.push(parseInt(department, 10)); }

        const rows = await db.query(sql, params);
        return res.json({ success: true, users: rows });
    } catch (err) {
        console.error('getStudents error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};


/** ------------------------------------------------------------------ */
/** GET /api/users/all                                                  */
/** ------------------------------------------------------------------ */
// exports.getAllUsers = async (req, res) => {
//     try {
//         const sql = `
//       SELECT 
//         u.user_id, u.student_id, u.first_name, u.last_name, u.email,
//         d.department_name, y.year_name,
//         GROUP_CONCAT(r.role_name)  AS roles,
//         GROUP_CONCAT(ur.role_id)   AS roles_array
//       FROM users u
//       LEFT JOIN department   d ON u.department_id = d.department_id
//       LEFT JOIN year_levels  y ON u.year_id = y.year_id
//       LEFT JOIN user_roles  ur ON u.user_id = ur.user_id
//       LEFT JOIN role         r ON ur.role_id = r.role_id
//       GROUP BY u.user_id
//     `;
//         const rows = await db.query(sql);
//         return res.json({ success: true, users: rows });
//     } catch (err) {
//         console.error('getAllUsers error:', err);
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// };

exports.existsField = async (req, res) => {
    try {
        const { email, student_id, exclude_id } = req.query;
        if (!email && !student_id) {
            return res.status(400).json({ success: false, message: 'ต้องระบุ email หรือ student_id อย่างใดอย่างหนึ่ง' });
        }

        let sql = '';
        let params = [];
        if (email) {
            sql = `SELECT 1 FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))`;
            params = [email];
        } else {
            sql = `SELECT 1 FROM users WHERE LOWER(TRIM(student_id)) = LOWER(TRIM(?))`;
            params = [student_id];
        }
        if (exclude_id) {
            sql += ` AND user_id <> ?`;
            params.push(Number(exclude_id));
        }
        sql += ` LIMIT 1`;

        const [rows] = await db.query(sql, params);
        return res.json({ success: true, exists: rows.length > 0 });
    } catch (e) {
        console.error('existsField error:', e);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};
