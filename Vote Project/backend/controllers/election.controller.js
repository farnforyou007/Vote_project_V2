// // 📁 controllers/election.controller.js
// const db = require("../models/db");
// const multer = require("multer");
// const path = require("path");
// const { computeEffectiveStatus } = require('../utils/electionStatus');
// // แอดมินแก้ไขสถานะได้ 9/8/68

// exports.getElections = (req, res) => {
//     const sql = `
//     SELECT election_id, 
//         election_name, description,
//         registration_start, 
//         registration_end, 
//         start_date, 
//         end_date,
//         image_path  AS image_url, 
//         manual_override, 
//         status_note,
//         is_hidden
//     FROM elections
//     ORDER BY start_date DESC
//   `;
//   db.query(sql, [], (err, rows) => {
//     if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });

//     const result = rows.map(r => {
//       const merged = computeEffectiveStatus(r);
//       return { ...r, ...merged };
//     });
//     res.json({ success: true, data: result });
//   });
//   console.log(new Date().toString());
// };

// exports.getElectionById = (req, res) => {
//   // const { id } = req.params;
//   const electionId = req.params.id;
//   const sql = `
//     SELECT election_id, 
//         election_name, 
//         description,
//         registration_start, 
//         registration_end, 
//         start_date, 
//         end_date,
//         image_path  AS image_url, 
//         manual_override, 
//         status_note,
//         is_hidden
//     FROM elections
//     WHERE election_id = ?
//     LIMIT 1
//   `;
//   db.query(sql, [electionId], (err, rows) => {
//     if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

//     const r = rows[0];
//     const merged = computeEffectiveStatus(r);
//     res.json({ success: true, data: { ...r, ...merged } });
//   });
// };

// /**
//  * แอดมินเปลี่ยน manual_override + ใส่โน้ตได้
//  * body: { manual_override: 'AUTO'|'FORCE_OPEN'|'FORCE_CLOSED', status_note?: string }
//  */
// exports.patchElectionStatus = (req, res) => {
//   const { id } = req.params;
//   const { manual_override, status_note } = req.body || {};

//   const allow = ['AUTO', 'FORCE_OPEN', 'FORCE_CLOSED'];
//   if (!allow.includes(manual_override)) {
//     return res.status(400).json({ success: false, message: 'manual_override ไม่ถูกต้อง' });
//   }

//   const sql = `UPDATE elections SET manual_override = ?, status_note = ? WHERE election_id = ?`;
//   db.query(sql, [manual_override, status_note || null, id], (err) => {
//     if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });

//     // ดึงใหม่ส่งกลับทันที ให้ FE อัปเดต state โดยไม่ต้องรีเฟรช
//     const getOne = `
//       SELECT election_id, election_name, description,
//              registration_start, registration_end, start_date, end_date,
//              image_path  AS image_url, manual_override, status_note
//       FROM elections WHERE election_id = ? LIMIT 1
//     `;
//     db.query(getOne, [id], (e2, rows) => {
//       if (e2) return res.status(500).json({ success: false, message: 'SQL Error', error: e2 });
//       if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

//       const r = rows[0];
//       const merged = computeEffectiveStatus(r);
//       res.json({ success: true, data: { ...r, ...merged } });
//     });
//   });
// };




// // กำหนด path และชื่อไฟล์รูป
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/elections"),
//   filename: (req, file, cb) =>
//     cb(null, "election_" + Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // middleware รองรับ multipart
// exports.uploadElectionImage = upload.single("image");

// exports.deleteElection = (req, res) => {
//   const electionId = req.params.id;
//   const sql = "DELETE FROM Elections WHERE election_id = ?";

//   db.query(sql, [electionId], (err) => {
//     if (err) return res.status(500).json({ success: false, error: err });
//     res.json({ success: true, message: "Election deleted successfully" });
//   });
// };

// exports.createElection = (req, res) => {
//   const {
//     election_name,
//     description,
//     registration_start,
//     registration_end,
//     start_date,
//     end_date,
//   } = req.body;

//   const image_path = req.file
//     ? `/uploads/elections/${req.file.filename}`
//     : null;

//   const sql = `
//     INSERT INTO Elections (election_name, description, registration_start, registration_end, start_date, end_date, image_path)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//     `;

//   const params = [
//     election_name,
//     description,
//     registration_start,
//     registration_end,
//     start_date,
//     end_date,
//     image_path,
//   ];
//   console.log("📨 req.body:", req.body);
//   console.log("🖼️ req.file:", req.file);
//   console.log("🔗 image_path:", image_path);
//   db.query(sql, params, (err) => {
//     if (err) {
//       console.error("❌ SQL ERROR:", err);
//       return res
//         .status(500)
//         .json({ success: false, message: "SQL Error", error: err });
//     }

//     res.json({ success: true, message: "Election created successfully" });
//   });
// };

// exports.updateElectionWithImage = (req, res) => {
//   const electionId = req.params.id;
//   const {
//     election_name,
//     description,
//     registration_start,
//     registration_end,
//     start_date,
//     end_date,
//     status, // <<== รับค่ามาด้วย
//   } = req.body;

//   let sql = `
//     UPDATE Elections
//     SET election_name = ?, description = ?, registration_start = ?, registration_end = ?,
//         start_date = ?, end_date = ?, status = ?
//     `;
//   const params = [
//     election_name,
//     description,
//     registration_start,
//     registration_end,
//     start_date,
//     end_date,
//     status, // <<== ใส่ใน params
//   ];

//   if (req.file) {
//     const image_path = `/uploads/elections/${req.file.filename}`;
//     sql += `, image_path = ?`;
//     params.push(image_path);
//   }

//   sql += ` WHERE election_id = ?`;
//   params.push(electionId);

//   db.query(sql, params, (err) => {
//     if (err) {
//       console.error("❌ SQL ERROR:", err);
//       return res
//         .status(500)
//         .json({ success: false, message: "SQL Error", error: err });
//     }

//     res.json({ success: true, message: "Election updated" });
//   });
// };

// exports.updateVisibility = (req, res) => {
//   const { id } = req.params;
//   const { is_hidden } = req.body;

//   const sql = 'UPDATE elections SET is_hidden = ? WHERE election_id = ?';
//   db.query(sql, [is_hidden ? 1 : 0, id], (err, result) => {
//     if (err) {
//       return res.status(500).json({
//         success: false,
//         message: 'SQL Error',
//         error: err
//       });
//     }
//     return res.json({ success: true });
//   });
// };



/// version without getConnection for transaction support
// 📁 controllers/election.controller.js  (async/await + promise pool)
const db = require("../models/db");                 // db.query() => rows only (wrapper)
const multer = require("multer");
const path = require("path");
const { computeEffectiveStatus } = require('../utils/electionStatus');

// -----------------------------
// Multer: อัปโหลดรูปประกอบการเลือกตั้ง
// -----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/elections"),
  filename: (req, file, cb) =>
    cb(null, "election_" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
exports.uploadElectionImage = upload.single("image");

// -----------------------------
// GET /api/elections
// -----------------------------
exports.getElections = async (req, res) => {
  try {
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
             is_hidden,
             status,
             created_by
      FROM elections
      ORDER BY start_date DESC
    `;
    const rows = await db.query(sql, []);
    const result = rows.map(r => ({ ...r, ...computeEffectiveStatus(r) }));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getElections error:', err);
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// -----------------------------
// GET /api/elections/:id
// -----------------------------
exports.getElectionById = async (req, res) => {
  try {
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
             is_hidden,
             status,             
             created_by    
      FROM elections
      WHERE election_id = ?
      LIMIT 1
    `;
    const rows = await db.query(sql, [electionId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

    const r = rows[0];
    res.json({ success: true, data: { ...r, ...computeEffectiveStatus(r) } });
  } catch (err) {
    console.error('getElectionById error:', err);
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// -----------------------------
// PATCH /api/elections/:id/status
// body: { manual_override: 'AUTO'|'FORCE_OPEN'|'FORCE_CLOSED', status_note?: string }
// -----------------------------
exports.patchElectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { manual_override, status_note } = req.body || {};
    const allow = ['AUTO', 'FORCE_OPEN', 'FORCE_CLOSED'];
    if (!allow.includes(manual_override)) {
      return res.status(400).json({ success: false, message: 'manual_override ไม่ถูกต้อง' });
    }

    await db.query(
      `UPDATE elections SET manual_override = ?, status_note = ? WHERE election_id = ?`,
      [manual_override, status_note || null, id]
    );

    const rows = await db.query(
      `SELECT election_id, election_name, description,
              registration_start, registration_end, start_date, end_date,
              image_path AS image_url, manual_override, status_note, is_hidden
       FROM elections WHERE election_id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });

    const r = rows[0];
    res.json({ success: true, data: { ...r, ...computeEffectiveStatus(r) } });
  } catch (err) {
    console.error('patchElectionStatus error:', err);
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// -----------------------------
// DELETE /api/elections/:id
// -----------------------------
exports.deleteElection = async (req, res) => {
  try {
    const electionId = req.params.id;
    await db.query(`DELETE FROM elections WHERE election_id = ?`, [electionId]);
    res.json({ success: true, message: "Election deleted successfully" });
  } catch (err) {
    console.error('deleteElection error:', err);
    // รองรับ FK constraint
    if (err && (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2')) {
      return res.status(409).json({
        success: false,
        message: 'ลบไม่ได้ เนื่องจากมีข้อมูลที่เชื่อมโยงอยู่ (candidates/votes/eligibility)',
      });
    }
    res.status(500).json({ success: false, message: "SQL Error", error: err });
  }
};

// -----------------------------
// POST /api/elections  (multipart/form-data + image)
// -----------------------------
// POST /api/elections  (multipart/form-data + image)
exports.createElection = async (req, res) => {
  try {
    const {
      election_name,
      description,
      registration_start,
      registration_end,
      start_date,
      end_date,
      status,
    } = req.body;

    const image_path = req.file ? `/uploads/elections/${req.file.filename}` : null;

    // ✅ ผู้สร้างจาก token
    const created_by = req.user?.user_id || null;
    console.log("req.user =", req.user);

    // (ถ้าอยากบังคับค่าที่อนุญาต เปิดคอมเมนต์ 3 บรรทัดนี้ได้)
    // const allow = ['draft', 'open', 'closed', 'archived'];
    // if (status && !allow.includes(status)) return res.status(400).json({ success:false, message:'Invalid status' });

    const sql = `
      INSERT INTO elections
        (election_name, description, registration_start, registration_end, start_date, end_date, image_path,
         status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await db.query(sql, [
      election_name,
      description,
      registration_start,
      registration_end,
      start_date,
      end_date,
      image_path,
      status ?? 'draft',  // ✅ กำหนดค่าเริ่มต้นเป็น draft ถ้าไม่ส่งมา
      created_by,
    ]);

    res.json({ success: true, message: "Election created successfully" });
  } catch (err) {
    console.error('createElection error:', err);
    res.status(500).json({ success: false, message: "SQL Error", error: err });
  }
};


// -----------------------------
// PUT /api/elections/:id  (multipart/form-data + image)
// body อาจมี status มาด้วย ถ้ามีก็อัปเดตให้ ไม่มีก็ตัดทิ้ง
// -----------------------------
exports.updateElectionWithImage = async (req, res) => {
  try {
    const electionId = req.params.id;
    const {
      election_name,
      description,
      registration_start,
      registration_end,
      start_date,
      end_date,
      status,  
    } = req.body;

    const cols = [
      'election_name = ?',
      'description = ?',
      'registration_start = ?',
      'registration_end = ?',
      'start_date = ?',
      'end_date = ?'
    ];
    const params = [
      election_name,
      description,
      registration_start,
      registration_end,
      start_date,
      end_date
    ];

    if (status) {
      cols.push('status = ?');
      params.push(status);
    }

    if (req.file) {
      const image_path = `/uploads/elections/${req.file.filename}`;
      cols.push('image_path = ?');
      params.push(image_path);
    }

    // ✅ เก็บ updated_by ทุกครั้ง
    cols.push('updated_by = ?');
    params.push(req.user?.user_id || null);

    const sql = `
      UPDATE elections
      SET ${cols.join(', ')}, updated_at = NOW()
      WHERE election_id = ?
    `;
    params.push(electionId);

    await db.query(sql, params);
    res.json({ success: true, message: "Election updated" });
  } catch (err) {
    console.error('updateElectionWithImage error:', err);
    res.status(500).json({ success: false, message: "SQL Error", error: err });
  }
};

// -----------------------------
// PATCH /api/elections/:id/visibility
// -----------------------------
exports.updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_hidden } = req.body;
    await db.query(`UPDATE elections SET is_hidden = ? WHERE election_id = ?`, [is_hidden ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('updateVisibility error:', err);
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};
