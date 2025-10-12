
// งานแบ๋ม

// controllers/candidateController.js
const db = require('../models/db');


// /**
//  * ดึงผู้สมัครทั้งหมดตามการเลือกตั้ง (ยกเว้นพวกที่ถูก mark "ลบออกแล้ว")
//  */
// exports.getApplicationsByElection = async (req, res) => {
//   const { id } = req.params; // election_id
//   try {
//     const [rows] = await db.query(
//       `SELECT 
//           a.application_id,
//           u.student_id,
//           CONCAT(u.first_name, ' ', u.last_name) AS name,
//           d.department_name AS department,
//           y.year_number,
//           e.level_name,
//           a.campaign_slogan,
//           a.photo,
//           a.application_status,
//           a.rejection_reason,
//           a.rejection_count,
//           c.candidate_number
//        FROM applications a
//        JOIN users u ON a.user_id = u.user_id
//        JOIN department d ON u.department_id = d.department_id
//        JOIN year_levels y ON u.year_id = y.year_id
//        JOIN education_levels e ON y.level_id = e.level_id
//        LEFT JOIN candidates c ON a.application_id = c.application_id
//        WHERE a.election_id = ?
//          AND NOT (a.application_status = 'rejected' AND a.rejection_reason = 'ลบออกแล้ว')
//        ORDER BY a.application_id ASC`,
//       [id]
//     );
//     return res.status(200).json(rows);
//   } catch (err) {
//     console.error("Error getApplicationsByElection:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };



// /**
//  * ดึงรายละเอียดผู้สมัครรายคน
//  */
// exports.getApplicationById = async (req, res) => {
//   const { id } = req.params; // application_id
//   try {
//     const [rows] = await db.query(
//       `SELECT 
//           a.application_id,
//           u.student_id,
//           CONCAT(u.first_name, ' ', u.last_name) AS name,

//           u.email,
//           d.department_name AS department,
//           y.year_number,
//           e.level_name,
//           a.campaign_slogan,
//           a.photo,
//           a.application_status,
//           a.rejection_reason,
//           a.rejection_count,
//           c.candidate_number,
//           a.election_id
//        FROM applications a
//        JOIN users u ON a.user_id = u.user_id
//        JOIN department d ON u.department_id = d.department_id
//        JOIN year_levels y ON u.year_id = y.year_id
//        JOIN education_levels e ON y.level_id = e.level_id
//        LEFT JOIN candidates c ON a.application_id = c.application_id
//        WHERE a.application_id = ?`,
//       [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Application not found" });
//     }
//     res.json(rows[0]);
//   } catch (err) {
//     console.error("Error getApplicationById:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// /**
//  * ดึงรายชื่อแผนก
//  */
// exports.getDepartments = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT department_id, department_name FROM department"
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("Error getDepartments:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// // /**
// //  *อนุมัติผู้สมัคร
// //  */
// // exports.approveApplication = async (req, res) => {
// //   const { id } = req.params; // application_id
// //   try {
// //     // หา election_id + campaign_slogan จาก application
// //     const [rows] = await db.query(
// //       "SELECT election_id, campaign_slogan FROM applications WHERE application_id = ?",
// //       [id]
// //     );
// //     if (rows.length === 0) {
// //       return res.status(404).json({ error: "Application not found" });
// //     }
// //     const { election_id, campaign_slogan } = rows[0];

// //     // หาเบอร์ถัดไป
// //     const [maxRow] = await db.query(
// //       `SELECT MAX(number) AS maxNum
// //        FROM candidates c
// //        JOIN applications a ON c.application_id = a.application_id
// //        WHERE a.election_id = ?`,
// //       [election_id]
// //     );
// //     const nextNumber = (maxRow[0].maxNum || 0) + 1;

// //     // อัปเดต applications
// //     await db.query(
// //       `UPDATE applications
// //        SET application_status = 'approved',
// //            rejection_reason = NULL
// //        WHERE application_id = ?`,
// //       [id]
// //     );

// //     // เพิ่มเข้า candidates (ถ้ายังไม่มี) และเก็บ campaign_slogan ด้วย
// //     await db.query(
// //       `INSERT INTO candidates (application_id, number, status, campaign_slogan)
// //        VALUES (?, ?, 'approved', ?)
// //        ON DUPLICATE KEY UPDATE 
// //           number = VALUES(number), 
// //           status = 'approved',
// //           campaign_slogan = VALUES(campaign_slogan)`,
// //       [id, nextNumber, campaign_slogan]
// //     );

// //     res.json({ message: "อนุมัติผู้สมัครเรียบร้อยแล้ว", number: nextNumber });
// //   } catch (err) {
// //     console.error("Error approveApplication:", err);
// //     res.status(500).json({ error: "Database error" });
// //   }
// // };

// // /**
// //  * ปฏิเสธผู้สมัคร
// //  */
// // exports.rejectApplication = async (req, res) => {
// //   const { id } = req.params; // application_id
// //   const { reason } = req.body;

// //   try {
// //     await db.query(
// //       `UPDATE applications
// //        SET application_status = 'rejected',
// //            rejection_reason = ?,
// //            rejection_count = rejection_count + 1
// //        WHERE application_id = ?`,
// //       [reason || "ไม่ระบุ", id]
// //     );

// //     res.json({ message: "ปฏิเสธผู้สมัครเรียบร้อยแล้ว" });
// //   } catch (err) {
// //     console.error("Error rejectApplication:", err);
// //     res.status(500).json({ error: "Database error" });
// //   }
// // };

// /**
//  * อนุมัติผู้สมัคร
//  */
// exports.approveApplication = async (req, res) => {
//   const { id } = req.params; // application_id
//   const committeeId = req.user?.user_id || 46; // ใช้ mock id 1 ถ้ายังไม่มีระบบล็อกอิน

//   try {
//     // หา election_id + campaign_slogan จาก application
//     const [rows] = await db.query(
//       "SELECT election_id, campaign_slogan FROM applications WHERE application_id = ?",
//       [id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Application not found" });
//     }
//     const { election_id, campaign_slogan } = rows[0];

//     // หาเบอร์ถัดไป
//     const [maxRow] = await db.query(
//       `SELECT MAX(candidate_number) AS maxNum
//        FROM candidates c
//        JOIN applications a ON c.application_id = a.application_id
//        WHERE a.election_id = ?`,
//       [election_id]
//     );
//     const nextNumber = (maxRow[0].maxNum || 0) + 1;

//     // อัปเดต applications
//     await db.query(
//       `UPDATE applications
//        SET application_status = 'approved',
//            rejection_reason = NULL,
//            reviewed_by = ?,        -- 🟩 เพิ่มตรงนี้
//            reviewed_at = NOW()     -- 🟩 เพิ่มตรงนี้
//        WHERE application_id = ?`,
//       [committeeId, id] // 🟩 เพิ่มค่า reviewed_by ใน parameter
//     );

//     // เพิ่มเข้า candidates (ถ้ายังไม่มี) และเก็บ campaign_slogan ด้วย
//     await db.query(
//       `INSERT INTO candidates (application_id, candidate_number, status, campaign_slogan, reviewed_by)  -- 🟩 เพิ่ม reviewed_by, created_at
//        VALUES (?, ?, 'approved', ?, ?)                                                             -- 🟩 เพิ่มค่า reviewed_by
//        ON DUPLICATE KEY UPDATE 
//           candidate_number = VALUES(candidate_number), 
//           status = 'approved',
//           campaign_slogan = VALUES(campaign_slogan),
//           reviewed_by = VALUES(reviewed_by)`
//       ,
//       [id, nextNumber, campaign_slogan, committeeId] // 🟩 เพิ่ม parameter
//     );

//     // ✅ เพิ่มบันทึกลง committee_reviews
//     await db.query(
//       `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reviewed_at)
//        VALUES (
//          (SELECT candidate_id FROM candidates WHERE application_id = ?),
//          ?,
//          'approve',
//          NOW()
//        )`,
//       [id, committeeId]
//     );

//     res.json({ message: "อนุมัติผู้สมัครเรียบร้อยแล้ว", number: nextNumber });
//   } catch (err) {
//     console.error("Error approveApplication:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// /**
//  * ปฏิเสธผู้สมัคร
//  */
// exports.rejectApplication = async (req, res) => {
//   const { id } = req.params; // application_id
//   const { reason } = req.body;
//   const committeeId = req.user?.user_id || 1; // mock id = 1 ถ้ายังไม่มีระบบล็อกอิน

//   try {
//     // อัปเดตสถานะใน applications
//     await db.query(
//       `UPDATE applications
//        SET application_status = 'rejected',
//            rejection_reason = ?,
//            rejection_count = rejection_count + 1,
//            reviewed_by = ?,         
//            reviewed_at = NOW()      
//        WHERE application_id = ?`,
//       [reason || "ไม่ระบุ", committeeId, id] // 🟩 เพิ่มค่า reviewed_by
//     );

//     // ✅ เพิ่มบันทึกลง committee_reviews
//     await db.query(
//       `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reviewed_at)
//        VALUES (
//          (SELECT candidate_id FROM candidates WHERE application_id = ?),
//          ?,
//          'reject',
//          NOW()
//        )`,
//       [id, committeeId]
//     );

//     // 🟩 เพิ่มส่วนอัปเดต candidates ถ้ามี record เดิมอยู่
//     await db.query(
//       `UPDATE candidates
//        SET status = 'rejected',
//            reviewed_by = ?, 
//        WHERE application_id = ?`,
//       [committeeId, id]
//     );

//     res.json({ message: "ปฏิเสธผู้สมัครเรียบร้อยแล้ว" });
//   } catch (err) {
//     console.error("Error rejectApplication:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// /**
//  *  อัปเดตผู้สมัคร (เช่น แก้นโยบาย) → กลับไป pending
//  */
// exports.updateApplication = async (req, res) => {
//   const { id } = req.params; // application_id
//   const { campaign_slogan } = req.body;

//   try {
//     await db.query(
//       `UPDATE applications
//        SET campaign_slogan = ?,
//            application_status = 'pending',
//            rejection_reason = NULL
//        WHERE application_id = ?`,
//       [campaign_slogan, id]
//     );

//     res.json({ message: "อัปเดตข้อมูลแล้ว และสถานะกลับเป็น pending" });
//   } catch (err) {
//     console.error("Error updateApplication:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// /**
//  * ลบผู้สมัคร (ถ้าโดน reject >= 2 ครั้ง) → เปลี่ยนเป็น rejected + mark "ลบออกแล้ว"
//  */
// exports.deleteApplication = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const [rows] = await db.query(
//       "SELECT rejection_count FROM applications WHERE application_id = ?",
//       [id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Application not found" });
//     }

//     if (rows[0].rejection_count < 2) {
//       return res
//         .status(400)
//         .json({ error: "ยังไม่สามารถลบได้ ต้องถูกปฏิเสธอย่างน้อย 2 ครั้ง" });
//     }

//     // แทนที่จะ DELETE → mark ว่า "ลบออกแล้ว"
//     await db.query(
//       `UPDATE applications
//        SET application_status = 'rejected',
//            rejection_reason = 'ลบออกแล้ว'
//        WHERE application_id = ?`,
//       [id]
//     );

//     res.json({ message: "ทำการลบผู้สมัครออกจากหน้าตรวจสอบแล้ว" });
//   } catch (err) {
//     console.error("Error deleteApplication:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// //บันทึกผลการตรวจสอบของกรรมการ
// exports.recordCommitteeReview = async (req, res) => {
//   const { candidate_id, decision } = req.body; // รับค่าจาก frontend
//   const committee_id = req.user?.user_id || 1; // ถ้ามีระบบล็อกอินจริง → ใช้ user_id จริง, ถ้ายังไม่มี → ใช้ mock id=1

//   // ตรวจสอบค่าเบื้องต้น
//   if (!candidate_id || !decision) {
//     return res.status(400).json({ message: "กรุณาระบุ candidate_id และ decision" });
//   }

//   try {
//     // 1️⃣ บันทึกประวัติการตรวจลงในตาราง committee_reviews
//     await db.query(
//       `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reviewed_at)
//        VALUES (?, ?, ?, NOW())`,
//       [candidate_id, committee_id, decision]
//     );

//     // 2️⃣ อัปเดตสถานะและ reviewer ในตาราง candidates
//     await db.query(
//       `UPDATE candidates 
//        SET status = ?, reviewed_by = ?, 
//            created_at = created_at, updated_at = NOW() 
//        WHERE candidate_id = ?`,
//       [
//         decision === "approve" ? "approved" : "rejected",
//         committee_id,
//         candidate_id,
//       ]
//     );

//     // 3️⃣ อัปเดตสถานะในตาราง applications
//     // (โดยดึง application_id จาก candidates)
//     await db.query(
//       `UPDATE applications 
//        SET application_status = ?, reviewed_by = ?, reviewed_at = NOW()
//        WHERE application_id = (
//          SELECT application_id FROM candidates WHERE candidate_id = ?
//        )`,
//       [
//         decision === "approve" ? "approved" : "rejected",
//         committee_id,
//         candidate_id,
//       ]
//     );

//     // ✅ ตอบกลับเมื่อบันทึกสำเร็จ
//     res.json({
//       message: "✅ บันทึกผลการตรวจสอบเรียบร้อย",
//       candidate_id,
//       decision,
//       reviewed_by: committee_id,
//     });
//   } catch (err) {
//     console.error("❌ Error recordCommitteeReview:", err);
//     res.status(500).json({
//       message: "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ",
//       error: err.message,
//     });
//   }
// };

// version แก้

// controllers/candidate.controller.js
// const db = require("../models/db");

// รองรับทั้ง mysql2/promise ([rows]) และไลบรารีที่คืน rows ตรง ๆ
const pickRows = (result) =>
  Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

/* ------------------------------------------------------------------ */
/* GET /api/elections/:id/applications
/* ลิสต์ใบสมัครของการเลือกตั้ง → คืนเป็น "Array" เสมอ
/* ------------------------------------------------------------------ */
exports.getApplicationsByElection = async (req, res) => {
  try {
    const { id: electionId } = req.params;

    const sql = `
  SELECT
    a.application_id,
    u.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS name,
    COALESCE(d.department_name, '') AS department,
    COALESCE(y.year_number, NULL)    AS year_number,
    COALESCE(l.level_name, '')       AS level_name,
    a.campaign_slogan,
    a.photo,
    a.application_status,
    a.rejection_reason,
    a.rejection_count,
    c.candidate_number AS number
  FROM applications a
  JOIN users u             ON a.user_id = u.user_id
  LEFT JOIN department d   ON u.department_id = d.department_id
  LEFT JOIN year_levels y  ON u.year_id = y.year_id
  LEFT JOIN education_levels l ON y.level_id = l.level_id
  LEFT JOIN candidates c   ON c.application_id = a.application_id
  WHERE a.election_id = ?
  ORDER BY
    CASE WHEN c.candidate_number IS NULL THEN 1 ELSE 0 END,
    c.candidate_number ASC,
    a.application_id ASC
`;

    const rows = pickRows(await db.query(sql, [electionId]));
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("[getApplicationsByElection]", err);
    return res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้สมัครได้" });
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/applications/:id
/* รายละเอียดใบสมัคร → คืนเป็น "Object" (404 ถ้าไม่พบ)
/* ------------------------------------------------------------------ */
exports.getApplicationById = async (req, res) => {
  try {
    const { id: appId } = req.params;
    const sql = `
  SELECT
    a.application_id,
    u.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS name,
    u.email,
    COALESCE(d.department_name, '') AS department,
    COALESCE(y.year_number, NULL)    AS year_number,
    COALESCE(l.level_name, '')       AS level_name,
    a.campaign_slogan,
    a.photo,
    a.application_status,
    a.rejection_reason,
    a.rejection_count,
    c.candidate_number AS number,
    a.election_id
  FROM applications a
  JOIN users u             ON a.user_id = u.user_id
  LEFT JOIN department d   ON u.department_id = d.department_id
  LEFT JOIN year_levels y  ON u.year_id = y.year_id
  LEFT JOIN education_levels l ON y.level_id = l.level_id
  LEFT JOIN candidates c   ON c.application_id = a.application_id
  WHERE a.application_id = ?
  LIMIT 1
`;

    const rows = pickRows(await db.query(sql, [appId]));
    if (!rows || rows.length === 0) return res.status(404).json({ message: "Application not found" });
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[getApplicationById]", err);
    return res.status(500).json({ message: "ไม่สามารถดึงรายละเอียดได้" });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/applications/:id/approve
/* อนุมัติใบสมัคร → สร้าง/อัปเดตหมายเลขผู้สมัครและคืน { number }
/* ------------------------------------------------------------------ */
// exports.approveApplication = async (req, res) => {
//   const conn = db.getConnection ? await db.getConnection() : db;
//   try {
//     const { id: appId } = req.params;

//     // หา election_id ของใบสมัคร
//     const appRow = pickRows(
//       await conn.query(
//         `SELECT election_id FROM applications WHERE application_id = ?  LIMIT 1`,
//         [appId]
//       )
//     )[0];
//     if (!appRow) return res.status(404).json({ message: "Application not found" });

//     if (conn.beginTransaction) await conn.beginTransaction();

//     // เลขล่าสุดในเลือกตั้งนี้
//     const maxRow = pickRows(
//       await conn.query(
//         `SELECT MAX(c.candidate_number) AS max_no
//            FROM candidates c
//            JOIN applications a ON a.application_id = c.application_id
//           WHERE a.election_id = ?`,
//         [appRow.election_id]
//       )
//     )[0];
//     const nextNumber = (maxRow?.max_no || 0) + 1;

//     // upsert ผู้สมัคร
//     const exist = pickRows(
//       await conn.query(`SELECT candidate_id FROM candidates WHERE application_id = ? LIMIT 1`, [appId])
//     )[0];

//     if (exist) {
//       await conn.query(
//         `UPDATE candidates SET candidate_number = ?, status = 'approved' WHERE candidate_id = ?`,
//         [nextNumber, exist.candidate_id]
//       );
//     } else {
//       await conn.query(
//         `INSERT INTO candidates (application_id, candidate_number, status) VALUES (?, ?, 'approved')`,
//         [appId, nextNumber]
//       );
//     }

//     // sync สถานะใน applications
//     await conn.query(`UPDATE applications SET application_status = 'approved' WHERE application_id = ?`, [appId]);

//     if (conn.commit) await conn.commit();
//     return res.status(200).json({ number: nextNumber });
//   } catch (err) {
//     if (conn.rollback) try { await conn.rollback(); } catch { }
//     console.error("[approveApplication]", err);
//     return res.status(500).json({ message: "อนุมัติไม่สำเร็จ" });
//   } finally {
//     if (conn.release) conn.release();
//   }
// };

exports.approveApplication = async (req, res) => {
  const conn = db.getConnection ? await db.getConnection() : db;
  try {
    const { id: appId } = req.params;
    const committeeId = req.user?.user_id ?? 0; // ผู้ตรวจ/อนุมัติ

    // 1) เอา election_id + ข้อมูลที่ต้อง sync ไปเก็บใน candidates
    const appRow = pickRows(
      await conn.query(
        `SELECT election_id, campaign_slogan, photo 
           FROM applications 
          WHERE application_id = ? 
          LIMIT 1`,
        [appId]
      )
    )[0];
    if (!appRow) return res.status(404).json({ message: "Application not found" });

    if (conn.beginTransaction) await conn.beginTransaction();

    // 2) หาเบอร์ผู้สมัครล่าสุดในเลือกตั้งนี้
    const maxRow = pickRows(
      await conn.query(
        `SELECT MAX(c.candidate_number) AS max_no
           FROM candidates c
           JOIN applications a ON a.application_id = c.application_id
          WHERE a.election_id = ?`,
        [appRow.election_id]
      )
    )[0];
    const nextNumber = (maxRow?.max_no || 0) + 1;

    // 3) upsert ผู้สมัคร (ให้ DB ใส่ created_at/updated_at เอง)
    const exist = pickRows(
      await conn.query(
        `SELECT candidate_id FROM candidates WHERE application_id = ? LIMIT 1`,
        [appId]
      )
    )[0];

    if (exist) {
      await conn.query(
        `UPDATE candidates 
            SET candidate_number = ?, 
                status = 'approved',
                campaign_slogan = ?, 
                photo = ?, 
                reviewed_by = ?
          WHERE candidate_id = ?`,
        [nextNumber, appRow.campaign_slogan ?? null, appRow.photo ?? null, committeeId, exist.candidate_id]
      );
      // หมายเหตุ: ถ้ามีคอลัมน์ updated_at TIMESTAMP ... ON UPDATE CURRENT_TIMESTAMP
      // DB จะอัปเดตเวลาให้เอง ไม่ต้องเซ็ตด้วยมือ
    } else {
      await conn.query(
        `INSERT INTO candidates 
            (application_id, candidate_number, status, campaign_slogan, photo, reviewed_by)
         VALUES (?, ?, 'approved', ?, ?, ?)`,
        [appId, nextNumber, appRow.campaign_slogan ?? null, appRow.photo ?? null, committeeId]
      );
      // หมายเหตุ: created_at จะถูกเซ็ตอัตโนมัติจาก DEFAULT CURRENT_TIMESTAMP
    }

    // 4) sync สถานะ + reviewer ใน applications (reviewed_at ใช้ CURRENT_TIMESTAMP)
    await conn.query(
      `UPDATE applications 
          SET application_status = 'approved',
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP
        WHERE application_id = ?`,
      [committeeId, appId]
    );

    // 5) ✅ เพิ่ม record ในตาราง committee_reviews
    await conn.query(
      `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reviewed_at)
   VALUES (
     (SELECT candidate_id FROM candidates WHERE application_id = ?),
     ?,
     'approve',
     CURRENT_TIMESTAMP
   )`,
      [appId, committeeId]
    );

    if (conn.commit) await conn.commit();
    return res.status(200).json({ number: nextNumber });
  } catch (err) {
    if (conn.rollback) try { await conn.rollback(); } catch { }
    console.error("[approveApplication]", err);
    return res.status(500).json({ message: "อนุมัติไม่สำเร็จ" });
  } finally {
    if (conn.release) conn.release();
  }
};


/* ------------------------------------------------------------------ */
/* POST /api/applications/:id/reject   body: { reason }
/* ------------------------------------------------------------------ */
exports.rejectApplication = async (req, res) => {
  try {
    const { id: appId } = req.params;
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "กรุณาระบุเหตุผล" });
    }
    await db.query(
      `UPDATE applications
          SET application_status = 'rejected',
              rejection_reason   = ?,
              rejection_count    = COALESCE(rejection_count, 0) + 1
        WHERE application_id = ?`,
      [reason, appId]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[rejectApplication]", err);
    return res.status(500).json({ message: "ปฏิเสธไม่สำเร็จ" });
  }
};

/* ------------------------------------------------------------------ */
/* PUT /api/applications/:id   (อัปเดตนโยบาย/ฟิลด์อื่น ๆ ที่อนุญาต)
/* ------------------------------------------------------------------ */
exports.updateApplication = async (req, res) => {
  try {
    const { id: appId } = req.params;
    const { campaign_slogan } = req.body || {};
    await db.query(`UPDATE applications SET campaign_slogan = ? WHERE application_id = ?`, [
      campaign_slogan || null,
      appId,
    ]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[updateApplication]", err);
    return res.status(500).json({ message: "อัปเดตไม่สำเร็จ" });
  }
};

/* ------------------------------------------------------------------ */
/* DELETE /api/applications/:id   (soft delete + ลบ candidates ที่เกี่ยวข้อง)
/* ------------------------------------------------------------------ */
exports.deleteApplication = async (req, res) => {
  const conn = db.getConnection ? await db.getConnection() : db;
  try {
    const { id: appId } = req.params;
    if (conn.beginTransaction) await conn.beginTransaction();

    await conn.query(`DELETE FROM candidates WHERE application_id = ?`, [appId]);
    await conn.query(`DELETE FROM applications WHERE application_id = ?`, [appId]);

    if (conn.commit) await conn.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (conn.rollback) try { await conn.rollback(); } catch { }
    console.error("[deleteApplication]", err);
    return res.status(500).json({ message: "ลบไม่สำเร็จ" });
  } finally {
    if (conn.release) conn.release();
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/departments  → คืน Array เสมอ
/* ------------------------------------------------------------------ */
exports.getDepartments = async (_req, res) => {
  try {
    const rows = pickRows(
      await db.query(`SELECT department_id, department_name FROM department ORDER BY department_name`)
    );
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("[getDepartments]", err);
    return res.status(500).json({ message: "ไม่สามารถดึงแผนกได้" });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/committee/review  (บันทึกผลตรวจใบสมัครของกรรมการ)
/* ------------------------------------------------------------------ */
exports.recordCommitteeReview = async (req, res) => {
  try {
    const { application_id, is_passed, comment } = req.body || {};
    if (!application_id) return res.status(400).json({ message: "application_id is required" });
    await db.query(
      `INSERT INTO application_reviews (application_id, is_passed, comment, reviewed_at)
       VALUES (?, ?, ?, NOW())`,
      [application_id, !!is_passed, comment || null]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[recordCommitteeReview]", err);
    return res.status(500).json({ message: "บันทึกผลตรวจไม่สำเร็จ" });
  }
};
