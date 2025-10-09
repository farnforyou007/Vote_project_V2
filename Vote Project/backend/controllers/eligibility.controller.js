// // 📁 controllers/eligibility.controller.js
// const db = require('../models/db');
// const multer = require('multer');

// //ตรวจสอบว่า "ผู้ใช้คนนี้" มีสิทธิ์ลงคะแนนใน "การเลือกตั้งนั้น ๆ" หรือไม่

// exports.checkEligibility = (req, res) => {
//     const user_id = req.user.user_id;
//     const election_id = req.params.election_id;

//     const sql = `
//         SELECT * FROM election_eligibility
//         WHERE user_id = ? AND election_id = ?
//     `;

//     db.query(sql, [user_id, election_id], (err, results) => {
//         if (err) {
//             console.error("❌ SQL Error:", err);
//             return res.status(500).json({ success: false, message: "DB error" });
//         }

//         res.json({ success: true, eligible: results.length > 0, user_id });
//     });
// };

// exports.addEligibilityBulk = (req, res) => {
//     const election_id = req.params.id;
//     const { user_ids } = req.body;

//     if (!Array.isArray(user_ids) || user_ids.length === 0) {
//         return res.status(400).json({ success: false, message: "ไม่มีข้อมูล user_id" });
//     }

//     const sqlCheck = `
//     SELECT user_id FROM election_eligibility
//     WHERE election_id = ? AND user_id IN (?)
//     `;

//     db.query(sqlCheck, [election_id, user_ids], (err, existing) => {
//         if (err) {
//             console.error("❌ SQL เช็กซ้ำ:", err);
//             return res.status(500).json({ success: false });
//         }

//         const existingIds = existing.map(e => e.user_id);
//         const newIds = user_ids.filter(uid => !existingIds.includes(uid));

//         if (newIds.length === 0) {
//             return res.json({ success: false, alreadyExists: true, message: "นักศึกษาทั้งหมดมีสิทธิ์อยู่แล้ว" });
//         }

//         const values = newIds.map(uid => [election_id, uid, 1]);

//         const sqlInsert = `
//         INSERT INTO election_eligibility (election_id, user_id, can_vote)
//         VALUES ?
//     `;

//         db.query(sqlInsert, [values], (err2, result) => {
//             if (err2) {
//                 console.error("❌ SQL insert:", err2);
//                 return res.status(500).json({ success: false });
//             }

//             res.json({
//                 success: true,
//                 addedCount: result.affectedRows,
//                 skipped: existingIds,
//                 message: existingIds.length > 0
//                     ? `เพิ่มสิทธิ์แล้ว ${result.affectedRows} คน (บางคนมีสิทธิ์แล้ว)`
//                     : `เพิ่มสิทธิ์สำเร็จ ${result.affectedRows} คน`
//             });
//         });
//     });
// };

// exports.getEligibleUsers = (req, res) => {
//     const election_id = req.params.id;

//     const sql = `
//     SELECT u.*, y.level_id, y.year_name, d.department_name, ee.can_vote
//     FROM election_eligibility ee
//     JOIN users u ON ee.user_id = u.user_id
//     LEFT JOIN year_levels y ON u.year_id = y.year_id
//     LEFT JOIN department d ON u.department_id = d.department_id
//     WHERE ee.election_id = ?
//     ORDER BY u.user_id
//     `;

//     db.query(sql, [election_id], (err, results) => {
//         if (err) {
//             console.error("❌ SQL Error in getEligibleUsers:", err);
//             return res.status(500).json({ success: false, message: "DB Error" });
//         }
//         res.json({ success: true, users: results });
//         console.log("✅ ผู้มีสิทธิ์:", results.length, "คน");
//         console.log("✅ result", results);
//     });

// };

// exports.deleteEligibilityBulk = (req, res) => {
//     const election_id = req.params.id;
//     const { user_ids } = req.body;

//     if (!Array.isArray(user_ids) || user_ids.length === 0) {
//         return res.status(400).json({ success: false });
//     }

//     const sql = `
//     DELETE FROM election_eligibility
//     WHERE election_id = ? AND user_id IN (?)
//     `;

//     db.query(sql, [election_id, user_ids], (err, result) => {
//         if (err) {
//             console.error("❌ SQL ลบ bulk:", err);
//             return res.status(500).json({ success: false });
//         }
//         res.json({ success: true, affectedRows: result.affectedRows });
//     });

//     console.log("🧾 Election ID", election_id);
//     console.log("🧾 User IDs to delete", user_ids);
// };


// exports.deleteEligibilitySingle = (req, res) => {
//     const election_id = req.params.id;
//     const { user_id } = req.body;

//     if (!user_id) {
//         return res.status(400).json({ success: false, message: "ไม่พบ user_id" });
//     }

//     const sql = `
//     DELETE FROM election_eligibility
//     WHERE election_id = ? AND user_id = ?
//     `;

//     db.query(sql, [election_id, user_id], (err, result) => {
//         if (err) {
//             console.error("❌ SQL ลบรายคน:", err);
//             return res.status(500).json({ success: false });
//         }
//         res.json({ success: true, message: "ลบสิทธิ์เรียบร้อยแล้ว" });
//     });
// };

// exports.addAllEligibleUsers = (req, res) => {
//     const election_id = req.params.id;

//     const sql = `
//     INSERT INTO election_eligibility (election_id, user_id, can_vote)
//     SELECT ?, u.user_id, 1
//     FROM users u
//     JOIN user_roles ur ON u.user_id = ur.user_id
//     WHERE ur.role_id = 1
//     AND NOT EXISTS (
//         SELECT 1 FROM election_eligibility ee
//         WHERE ee.user_id = u.user_id AND ee.election_id = ?
//     )
//     `;

//     db.query(sql, [election_id, election_id], (err, result) => {
//         if (err) {
//             console.error("❌ SQL เพิ่มทั้งหมด:", err);
//             return res.status(500).json({ success: false, message: "SQL Error" });
//         }

//         res.json({ success: true, affectedRows: result.affectedRows });

//     });
// };

// exports.getMyEligibleElections = (req, res) => {
//     const user_id = req.user.user_id;
//     console.log("🧑‍💻 user_id =", user_id);
//     console.log("GET /list-my called")
//     const sql = `
//     SELECT 
//     e.election_id,
//     e.election_name,
//     e.start_date,
//     e.end_date,
//     COALESCE(ee.can_vote, 0) AS can_vote
//     FROM elections e
//     LEFT JOIN election_eligibility ee 
//     ON ee.election_id = e.election_id AND ee.user_id = ?
//     ORDER BY e.start_date DESC
//     `;

//     db.query(sql, [user_id], (err, results) => {
//         if (err) {
//             console.error("❌ ดึงสิทธิ์ล้มเหลว:", err);
//             return res.status(500).json({ success: false, message: "DB Error" });
//         }

//         res.json({ success: true, elections: results });
//     });
// };


const db = require('../models/db');

// ตรวจสิทธิ์ของ "ผู้ใช้" ต่อ "การเลือกตั้ง"
exports.checkEligibility = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const election_id = req.params.election_id;

        const rows = await db.query(
            `SELECT 1 FROM election_eligibility WHERE user_id = ? AND election_id = ?`,
            [user_id, election_id]
        );
        res.json({ success: true, eligible: rows.length > 0, user_id });
    } catch (err) {
        console.error('checkEligibility error:', err);
        res.status(500).json({ success: false, message: 'DB error' });
    }
};

// เพิ่มสิทธิ์แบบหลายคน (กันซ้ำก่อน)
exports.addEligibilityBulk = async (req, res) => {
    try {
        const election_id = req.params.id;
        const { user_ids } = req.body;
        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'ไม่มีข้อมูล user_id' });
        }

        // หา id ที่มีอยู่แล้ว
        const existing = await db.query(
            `SELECT user_id FROM election_eligibility WHERE election_id = ? AND user_id IN (?)`,
            [election_id, user_ids]
        );
        const existingIds = existing.map(e => e.user_id);
        const newIds = user_ids.filter(uid => !existingIds.includes(uid));

        if (newIds.length === 0) {
            return res.json({ success: false, alreadyExists: true, message: 'นักศึกษาทั้งหมดมีสิทธิ์อยู่แล้ว' });
        }

        // Bulk insert
        const values = newIds.map(uid => [election_id, uid, 1]);
        const result = await db.query(
            `INSERT INTO election_eligibility (election_id, user_id, can_vote) VALUES ?`,
            [values]
        );

        res.json({
            success: true,
            addedCount: result.affectedRows,
            skipped: existingIds,
            message: existingIds.length > 0
                ? `เพิ่มสิทธิ์แล้ว ${result.affectedRows} คน (บางคนมีสิทธิ์แล้ว)`
                : `เพิ่มสิทธิ์สำเร็จ ${result.affectedRows} คน`
        });
    } catch (err) {
        console.error('addEligibilityBulk error:', err);
        res.status(500).json({ success: false });
    }
};

// รายชื่อผู้มีสิทธิ์ของการเลือกตั้ง
exports.getEligibleUsers = async (req, res) => {
    try {
        const election_id = req.params.id;
        const rows = await db.query(
            `SELECT u.*, y.level_id, y.year_name, d.department_name, ee.can_vote
       FROM election_eligibility ee
       JOIN users u ON ee.user_id = u.user_id
       LEFT JOIN year_levels y ON u.year_id = y.year_id
       LEFT JOIN department d ON u.department_id = d.department_id
       WHERE ee.election_id = ?
       ORDER BY u.user_id`, [election_id]
        );
        res.json({ success: true, users: rows });
    } catch (err) {
        console.error('getEligibleUsers error:', err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
};

// ลบสิทธิ์แบบหลายคน
exports.deleteEligibilityBulk = async (req, res) => {
    try {
        const election_id = req.params.id;
        const { user_ids } = req.body;
        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ success: false });
        }
        const result = await db.query(
            `DELETE FROM election_eligibility WHERE election_id = ? AND user_id IN (?)`,
            [election_id, user_ids]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error('deleteEligibilityBulk error:', err);
        res.status(500).json({ success: false });
    }
};

// ลบสิทธิ์รายคน
exports.deleteEligibilitySingle = async (req, res) => {
    try {
        const election_id = req.params.id;
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'ไม่พบ user_id' });
        }
        await db.query(
            `DELETE FROM election_eligibility WHERE election_id = ? AND user_id = ?`,
            [election_id, user_id]
        );
        res.json({ success: true, message: 'ลบสิทธิ์เรียบร้อยแล้ว' });
    } catch (err) {
        console.error('deleteEligibilitySingle error:', err);
        res.status(500).json({ success: false });
    }
};

// เพิ่มสิทธิ์ให้ "นักศึกษาทั้งหมด" ที่ยังไม่มีสิทธิ์
exports.addAllEligibleUsers = async (req, res) => {
    try {
        const election_id = req.params.id;
        const result = await db.query(
            `INSERT INTO election_eligibility (election_id, user_id, can_vote)
       SELECT ?, u.user_id, 1
       FROM users u
       JOIN user_roles ur ON u.user_id = ur.user_id
       WHERE ur.role_id = 1
       AND NOT EXISTS (
         SELECT 1 FROM election_eligibility ee
         WHERE ee.user_id = u.user_id AND ee.election_id = ?
       )`,
            [election_id, election_id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error('addAllEligibleUsers error:', err);
        res.status(500).json({ success: false, message: 'SQL Error' });
    }
};

// รายการเลือกตั้งทั้งหมดของ "ฉัน" + flag can_vote
exports.getMyEligibleElections = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const rows = await db.query(
            `SELECT 
         e.election_id,
         e.election_name,
         e.start_date,
         e.end_date,
         COALESCE(ee.can_vote, 0) AS can_vote
       FROM elections e
       LEFT JOIN election_eligibility ee 
         ON ee.election_id = e.election_id AND ee.user_id = ?
       ORDER BY e.start_date DESC`,
            [user_id]
        );
        res.json({ success: true, elections: rows });
    } catch (err) {
        console.error('getMyEligibleElections error:', err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
};
