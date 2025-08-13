// 📁 controllers/election.controller.js
const db = require("../models/db");
const multer = require("multer");
const path = require("path");
const { computeEffectiveStatus } = require('../utils/electionStatus');

// exports.getAllElections = (req, res) => {
//   const sql = `
//   SELECT *,
//     status AS original_status,
//     CASE
//     WHEN NOW() < registration_start THEN 'before_registration'
//     WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
//     WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
//     WHEN NOW() > end_date THEN 'completed'
//     ELSE 'unknown'
//     END AS computed_status
//     FROM Elections
// `;

//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ success: false });
//     res.json({ success: true, elections: results });
//   });
// };

// exports.getElectionById = (req, res) => {
//     const electionId = req.params.id;
//     const sql = `
//         SELECT
//             election_id, election_name, description,
//             registration_start, registration_end,
//             start_date, end_date,
//             image_path AS image_url, -- ✅ alias สำคัญ
//             status AS original_status,
//             CASE
//                 WHEN NOW() < registration_start THEN 'before_registration'
//                 WHEN NOW() BETWEEN registration_start AND registration_end THEN 'registration'
//                 WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
//                 WHEN NOW() > end_date THEN 'completed'
//                 ELSE 'unknown'
//             END AS computed_status
//         FROM Elections
//         WHERE election_id = ?
//     `;

//     db.query(sql, [electionId], (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         if (!results.length) return res.status(404).json({ success: false, message: 'Election not found' });

//         res.json({ success: true, election: results[0] });
//     });
// };

// แอดมินแก้ไขสถานะได้ 9/8/68

exports.getElections = (req, res) => {
    const sql = `
    SELECT election_id, 
        election_name, description,
        registration_start, 
        registration_end, 
        start_date, 
        end_date,
        image_path  AS image_url, 
        manual_override, 
        status_note,
        is_hidden
    FROM elections
    ORDER BY start_date DESC
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });

    const result = rows.map(r => {
      const merged = computeEffectiveStatus(r);
      return { ...r, ...merged };
    });
    res.json({ success: true, data: result });
  });
};

exports.getElectionById = (req, res) => {
  // const { id } = req.params;
  const electionId = req.params.id;
  const sql = `
    SELECT election_id, 
        election_name, 
        description,
        registration_start, 
        registration_end, 
        start_date, 
        end_date,
        image_path  AS image_url, 
        manual_override, 
        status_note,
        is_hidden
    FROM elections
    WHERE election_id = ?
    LIMIT 1
  `;
  db.query(sql, [electionId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

    const r = rows[0];
    const merged = computeEffectiveStatus(r);
    res.json({ success: true, data: { ...r, ...merged } });
  });
};

/**
 * แอดมินเปลี่ยน manual_override + ใส่โน้ตได้
 * body: { manual_override: 'AUTO'|'FORCE_OPEN'|'FORCE_CLOSED', status_note?: string }
 */
exports.patchElectionStatus = (req, res) => {
  const { id } = req.params;
  const { manual_override, status_note } = req.body || {};

  const allow = ['AUTO', 'FORCE_OPEN', 'FORCE_CLOSED'];
  if (!allow.includes(manual_override)) {
    return res.status(400).json({ success: false, message: 'manual_override ไม่ถูกต้อง' });
  }

  const sql = `UPDATE elections SET manual_override = ?, status_note = ? WHERE election_id = ?`;
  db.query(sql, [manual_override, status_note || null, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });

    // ดึงใหม่ส่งกลับทันที ให้ FE อัปเดต state โดยไม่ต้องรีเฟรช
    const getOne = `
      SELECT election_id, election_name, description,
             registration_start, registration_end, start_date, end_date,
             image_path  AS image_url, manual_override, status_note
      FROM elections WHERE election_id = ? LIMIT 1
    `;
    db.query(getOne, [id], (e2, rows) => {
      if (e2) return res.status(500).json({ success: false, message: 'SQL Error', error: e2 });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

      const r = rows[0];
      const merged = computeEffectiveStatus(r);
      res.json({ success: true, data: { ...r, ...merged } });
    });
  });
};




// กำหนด path และชื่อไฟล์รูป
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/elections"),
  filename: (req, file, cb) =>
    cb(null, "election_" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// middleware รองรับ multipart
exports.uploadElectionImage = upload.single("image");

exports.deleteElection = (req, res) => {
  const electionId = req.params.id;
  const sql = "DELETE FROM Elections WHERE election_id = ?";

  db.query(sql, [electionId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Election deleted successfully" });
  });
};

exports.createElection = (req, res) => {
  const {
    election_name,
    description,
    registration_start,
    registration_end,
    start_date,
    end_date,
  } = req.body;

  const image_path = req.file
    ? `/uploads/elections/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO Elections (election_name, description, registration_start, registration_end, start_date, end_date, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  const params = [
    election_name,
    description,
    registration_start,
    registration_end,
    start_date,
    end_date,
    image_path,
  ];
  console.log("📨 req.body:", req.body);
  console.log("🖼️ req.file:", req.file);
  console.log("🔗 image_path:", image_path);
  db.query(sql, params, (err) => {
    if (err) {
      console.error("❌ SQL ERROR:", err);
      return res
        .status(500)
        .json({ success: false, message: "SQL Error", error: err });
    }

    res.json({ success: true, message: "Election created successfully" });
  });
};

exports.updateElectionWithImage = (req, res) => {
  const electionId = req.params.id;
  const {
    election_name,
    description,
    registration_start,
    registration_end,
    start_date,
    end_date,
    status, // <<== รับค่ามาด้วย
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
    status, // <<== ใส่ใน params
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
      return res
        .status(500)
        .json({ success: false, message: "SQL Error", error: err });
    }

    res.json({ success: true, message: "Election updated" });
  });
};

exports.updateVisibility = (req, res) => {
  const { id } = req.params;
  const { is_hidden } = req.body;

  const sql = 'UPDATE elections SET is_hidden = ? WHERE election_id = ?';
  db.query(sql, [is_hidden ? 1 : 0, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'SQL Error',
        error: err
      });
    }
    return res.json({ success: true });
  });
};
