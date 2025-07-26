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
exports.getElectionById = (req, res) => {
    const electionId = req.params.id;
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
    WHERE election_id = ?
    `;
    db.query(sql, [electionId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (!results.length) return res.status(404).json({ success: false, message: 'Election not found' });
        res.json({ success: true, election: results[0] });
    });

    const election = results[0];
    res.json({
        ...election,
        image_url: election.image_url // ✅ ต้องมี field นี้
    });
};

// กำหนด path และชื่อไฟล์รูป
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/elections'),
    filename: (req, file, cb) => cb(null, 'election_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// middleware รองรับ multipart
exports.uploadElectionImage = upload.single('image');

// อัปเดตข้อมูล
exports.updateElectionWithImage = (req, res) => {
    const electionId = req.params.id;
    const {
        election_name,
        description,
        registration_start,
        registration_end,
        start_date,
        end_date
    } = req.body;

    const image_url = req.file ? `/uploads/elections/${req.file.filename}` : null;

    const sql = `
    UPDATE Elections
    SET election_name = ?, description = ?, registration_start = ?, registration_end = ?,
        start_date = ?, end_date = ?
        ${image_url ? ', image_url = ?' : ''}
    WHERE election_id = ?
    `;

    const params = image_url
        ? [election_name, description, registration_start, registration_end, start_date, end_date, image_url, electionId]
        : [election_name, description, registration_start, registration_end, start_date, end_date, electionId];

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "Election updated successfully" });
    });
};

// exports.updateElectionWithImage = async (req, res) => {
//     try {
//         console.log("📥 PUT /elections/:id ถูกเรียกแล้ว");
//         console.log("🔸 req.body:", req.body);
//         console.log("🔹 req.file:", req.file);

//         const election_id = req.params.id;
//         const {
//             election_name,
//             description,
//             registration_start,
//             registration_end,
//             start_date,
//             end_date,
//         } = req.body;

//         // ตรวจสอบค่า
//         if (!election_name || !description) {
//             return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ" });
//         }

//         // SQL อัปเดต
//         let image_url = null;
//         if (req.file) {
//             image_url = req.file.filename;
//         }

//         const sql = `
//         UPDATE elections SET
//         election_name = ?,
//         description = ?,
//         registration_start = ?,
//         registration_end = ?,
//         start_date = ?,
//         end_date = ?${image_url ? `, image_url = ?` : ""}
//         WHERE election_id = ?
//     `;

//         const params = [
//             election_name,
//             description,
//             registration_start,
//             registration_end,
//             start_date,
//             end_date,
//         ];

//         if (image_url) params.push(image_url);
//         params.push(election_id);

//         await db.query(sql, params);

//         res.json({ success: true, message: "อัปเดตสำเร็จ" });
//     } catch (error) {
//         console.error("❌ UPDATE ERROR:", error);
//         res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
//     }
// };


exports.deleteElection = (req, res) => {
    const electionId = req.params.id;
    const sql = 'DELETE FROM Elections WHERE election_id = ?';

    db.query(sql, [electionId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "Election deleted successfully" });
    });
}