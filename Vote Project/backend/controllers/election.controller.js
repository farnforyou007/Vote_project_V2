// 📁 controllers/election.controller.js
const db = require('../models/db');
const multer = require('multer');
const path = require('path');

exports.getAllElections = (req, res) => {
    const sql = `
  SELECT *,
    status AS original_status,
    CASE
    WHEN NOW() < registration_start THEN 'before_registration'
    WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
    WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
    WHEN NOW() > end_date THEN 'completed'
    ELSE 'unknown'
    END AS computed_status
    FROM Elections
`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, elections: results });
    });
};
// SELECT * FROM elections WHERE election_id = ?

// SELECT *,
//     status AS original_status,
//     CASE
//     WHEN NOW() < registration_start THEN 'before_registration'
//     WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
//     WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
//     WHEN NOW() > end_date THEN 'completed'
//     ELSE 'unknown'
//     END AS computed_status
//     FROM Elections
//     WHERE election_id = ?

exports.getElectionById = (req, res) => {
    const electionId = req.params.id;
    const sql = `
        SELECT
            election_id, election_name, description,
            registration_start, registration_end,
            start_date, end_date,
            image_path AS image_url, -- ✅ alias สำคัญ
            status AS original_status,
            CASE
                WHEN NOW() < registration_start THEN 'before_registration'
                WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
                WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
                WHEN NOW() > end_date THEN 'completed'
                ELSE 'unknown'
            END AS computed_status
        FROM Elections
        WHERE election_id = ?
    `;

    db.query(sql, [electionId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (!results.length) return res.status(404).json({ success: false, message: 'Election not found' });

        res.json({ success: true, election: results[0] });
    });

    // db.query("SELECT * FROM Elections WHERE election_id = ?", [electionId], (err2, updated) => {
    //     if (err2) return res.status(500).json({ success: false, message: "Fetch updated failed" });
    //     res.json({ success: true, updatedElection: updated[0] });
    // });

};

// กำหนด path และชื่อไฟล์รูป
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/elections'),
    filename: (req, file, cb) => cb(null, 'election_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// middleware รองรับ multipart
exports.uploadElectionImage = upload.single('image');

// exports.updateElectionWithImage = (req, res) => {
//     const electionId = req.params.id;
//     const {
//         election_name,
//         description,
//         registration_start,
//         registration_end,
//         start_date,
//         end_date
//     } = req.body;

//     console.log("📥 PUT เรียกแล้ว");
//     console.log("🔸 req.body:", req.body);
//     console.log("🔹 req.file:", req.file);

//     let sql = `
//     UPDATE Elections
//     SET election_name = ?, description = ?, registration_start = ?, registration_end = ?,
//         start_date = ?, end_date = ?
//     `;
//     const params = [election_name, description, registration_start, registration_end, start_date, end_date];

//     if (req.file) {
//         const image_path = `/uploads/elections/${req.file.filename}`;
//         sql += `, image_path  = ?`;
//         params.push(image_path);
//     }

//     sql += ` WHERE election_id = ?`;
//     params.push(electionId);

//     db.query(sql, params, (err) => {
//         if (err) {
//             console.error("❌ SQL ERROR:", err);
//             return res.status(500).json({ success: false, message: "SQL Error", error: err });
//         }

//         res.json({ success: true, message: "Election updated" });
//     });
// };

exports.deleteElection = (req, res) => {
    const electionId = req.params.id;
    const sql = 'DELETE FROM Elections WHERE election_id = ?';

    db.query(sql, [electionId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "Election deleted successfully" });
    });
}

exports.createElection = (req, res) => {
    const {
        election_name,
        description,
        registration_start,
        registration_end,
        start_date,
        end_date
    } = req.body;

    const image_path = req.file ? `/uploads/elections/${req.file.filename}` : null;

    const sql = `
    INSERT INTO Elections (election_name, description, registration_start, registration_end, start_date, end_date, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [election_name, description, registration_start, registration_end, start_date, end_date, image_path];
    console.log("📨 req.body:", req.body);
    console.log("🖼️ req.file:", req.file);
    console.log("🔗 image_path:", image_path);
    db.query(sql, params, (err) => {
        if (err) {
            console.error("❌ SQL ERROR:", err);
            return res.status(500).json({ success: false, message: "SQL Error", error: err });
        }

        res.json({ success: true, message: "Election created successfully" });
    });
};

// // เพิ่มฟังก์ชันแก้ไขสถานะ
// exports.updateElectionStatus = (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body;
//     // อนุญาตแค่ค่าสถานะที่ถูกต้อง
//     const allowed = ['draft', 'registration', 'active', 'closed', 'completed'];
//     if (!allowed.includes(status)) {
//         return res.status(400).json({ success: false, message: "Invalid status" });
//     }
//     const sql = `UPDATE Elections SET status = ? WHERE election_id = ?`;
//     db.query(sql, [status, id], (err) => {
//         if (err) return res.status(500).json({ success: false, message: "DB error" });
//         res.json({ success: true, election_id: id, status });
//     });
// };

exports.updateElectionWithImage = (req, res) => {
    const electionId = req.params.id;
    const {
        election_name,
        description,
        registration_start,
        registration_end,
        start_date,
        end_date,
        status // <<== รับค่ามาด้วย
    } = req.body;

    let sql = `
    UPDATE Elections
    SET election_name = ?, description = ?, registration_start = ?, registration_end = ?,
        start_date = ?, end_date = ?, status = ?
    `;
    const params = [
        election_name,
        description,
        registration_start,
        registration_end,
        start_date,
        end_date,
        status // <<== ใส่ใน params
    ];

    if (req.file) {
        const image_path = `/uploads/elections/${req.file.filename}`;
        sql += `, image_path = ?`;
        params.push(image_path);
    }

    sql += ` WHERE election_id = ?`;
    params.push(electionId);

    db.query(sql, params, (err) => {
        if (err) {
            console.error("❌ SQL ERROR:", err);
            return res.status(500).json({ success: false, message: "SQL Error", error: err });
        }

        res.json({ success: true, message: "Election updated" });
    });
};
