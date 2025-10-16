// controllers/candidateController.js
const db = require('../models/db');

exports.getCandidatesByElection = async (req, res) => {
  try {
    const { election_id } = req.params;

    const sql = `
      SELECT
        c.candidate_id,
        c.candidate_number,
        COALESCE(c.campaign_slogan, a.campaign_slogan) AS campaign_slogan,
        c.status,
        COALESCE(c.photo, a.photo) AS photo,
        u.first_name,
        u.last_name,
        COALESCE(d.department_name, '') AS department_name,
        COALESCE(y.year_number, NULL) AS year_level
      FROM candidates c
      JOIN applications a   ON c.application_id = a.application_id
      JOIN users u          ON a.user_id = u.user_id
      LEFT JOIN department d   ON u.department_id = d.department_id
      LEFT JOIN year_levels y  ON u.year_id = y.year_id
      WHERE a.election_id = ?
      ORDER BY c.candidate_number ASC
    `;

    const rows = pickRows(await db.query(sql, [election_id])) || [];
    const mapped = rows.map(r => ({
      candidate_id: r.candidate_id,
      number: r.candidate_number,
      full_name: `${r.first_name} ${r.last_name}`,
      image_url: r.photo,
      department: r.department_name,
      year_level: r.year_level,
      policy: r.campaign_slogan,
    }));

    return res.json({ success: true, candidates: mapped });
  } catch (err) {
    console.error('[getCandidatesByElection]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลผู้สมัครได้' });
  }
};

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
    COALESCE(y.year_name, NULL)    AS year_name,
    COALESCE(l.level_name, '')       AS level_name,
    a.campaign_slogan,
    a.photo,
    a.application_status,
    a.rejection_reason,
    a.rejection_count,
    c.candidate_number AS number,
    COALESCE(CONCAT(r.first_name, ' ', r.last_name), '') AS reviewer_name

  FROM applications a
  JOIN users u             ON a.user_id = u.user_id
  LEFT JOIN department d   ON u.department_id = d.department_id
  LEFT JOIN year_levels y  ON u.year_id = y.year_id
  LEFT JOIN education_levels l ON y.level_id = l.level_id
  LEFT JOIN candidates c   ON c.application_id = a.application_id
  LEFT JOIN users r ON a.reviewed_by = r.user_id

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
//     const committeeId = req.user?.user_id ?? 0; // ผู้ตรวจ/อนุมัติ

//     // 1) เอา election_id + ข้อมูลที่ต้อง sync ไปเก็บใน candidates
//     const appRow = pickRows(
//       await conn.query(
//         `SELECT election_id, campaign_slogan, photo 
//            FROM applications 
//           WHERE application_id = ? 
//           LIMIT 1`,
//         [appId]
//       )
//     )[0];
//     if (!appRow) return res.status(404).json({ message: "Application not found" });

//     if (conn.beginTransaction) await conn.beginTransaction();

//     // 2) หาเบอร์ผู้สมัครล่าสุดในเลือกตั้งนี้
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

//     // 3) upsert ผู้สมัคร (ให้ DB ใส่ created_at/updated_at เอง)
//     const exist = pickRows(
//       await conn.query(
//         `SELECT candidate_id FROM candidates WHERE application_id = ? LIMIT 1`,
//         [appId]
//       )
//     )[0];

//     if (exist) {
//       await conn.query(
//         `UPDATE candidates 
//             SET candidate_number = ?, 
//                 status = 'approved',
//                 campaign_slogan = ?, 
//                 photo = ?, 
//                 reviewed_by = ?
//           WHERE candidate_id = ?`,
//         [nextNumber, appRow.campaign_slogan ?? null, appRow.photo ?? null, committeeId, exist.candidate_id]
//       );
//       // หมายเหตุ: ถ้ามีคอลัมน์ updated_at TIMESTAMP ... ON UPDATE CURRENT_TIMESTAMP
//       // DB จะอัปเดตเวลาให้เอง ไม่ต้องเซ็ตด้วยมือ
//     } else {
//       await conn.query(
//         `INSERT INTO candidates 
//             (application_id, candidate_number, status, campaign_slogan, photo, reviewed_by)
//          VALUES (?, ?, 'approved', ?, ?, ?)`,
//         [appId, nextNumber, appRow.campaign_slogan ?? null, appRow.photo ?? null, committeeId]
//       );
//       // หมายเหตุ: created_at จะถูกเซ็ตอัตโนมัติจาก DEFAULT CURRENT_TIMESTAMP
//     }

//     // 4) sync สถานะ + reviewer ใน applications (reviewed_at ใช้ CURRENT_TIMESTAMP)
//     await conn.query(
//       `UPDATE applications 
//           SET application_status = 'approved',
//               reviewed_by = ?,
//               reviewed_at = CURRENT_TIMESTAMP
//         WHERE application_id = ?`,
//       [committeeId, appId]
//     );

//     // 5) ✅ เพิ่ม record ในตาราง committee_reviews
//     await conn.query(
//       `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reviewed_at)
//    VALUES (
//      (SELECT candidate_id FROM candidates WHERE application_id = ?),
//      ?,
//      'approve',
//      CURRENT_TIMESTAMP
//    )`,
//       [appId, committeeId]
//     );

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

//ver2
// controllers/candidate.controller.js (หรือไฟล์ที่คุณวางฟังก์ชันนี้อยู่)
exports.approveApplication = async (req, res) => {
  const conn = db.getConnection ? await db.getConnection() : db;
  const pickRows = (result) =>
    Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

  try {
    const { id: appId } = req.params;
    const committeeId = req.user?.user_id ?? 0;

    if (conn.beginTransaction) await conn.beginTransaction();

    // ✅ ดึง user_id มาด้วย
    const appRow = pickRows(
      await conn.query(
        `SELECT election_id, user_id, campaign_slogan, photo
           FROM applications
          WHERE application_id = ?
          LIMIT 1`,
        [appId]
      )
    )[0];
    if (!appRow) {
      if (conn.rollback) await conn.rollback();
      return res.status(404).json({ message: "Application not found" });
    }

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
    } else {
      await conn.query(
        `INSERT INTO candidates
            (application_id, candidate_number, status, campaign_slogan, photo, reviewed_by)
         VALUES (?, ?, 'approved', ?, ?, ?)`,
        [appId, nextNumber, appRow.campaign_slogan ?? null, appRow.photo ?? null, committeeId]
      );
    }

    await conn.query(
      `UPDATE applications
          SET application_status = 'approved',
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP
        WHERE application_id = ?`,
      [committeeId, appId]
    );

    const roleRow = pickRows(
      await conn.query(`SELECT role_id FROM role WHERE role_name = 'ผู้สมัคร' LIMIT 1`)
    )[0];
    const candidateRoleId = roleRow?.role_id ?? 2;

    await conn.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at)
       SELECT ?, ?, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?
        )`,
      [appRow.user_id, candidateRoleId, appRow.user_id, candidateRoleId]
    );

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
    return res.status(500).json({ message: "อนุมัติไม่สำเร็จ", error: err.message });
  } finally {
    if (conn.release) conn.release();
  }
};



/* ------------------------------------------------------------------ */
/* POST /api/applications/:id/reject   body: { reason }
/* ------------------------------------------------------------------ */
// exports.rejectApplication = async (req, res) => {
//   try {
//     const { id: appId } = req.params;
//     const { reason } = req.body || {};
//     if (!reason || !String(reason).trim()) {
//       return res.status(400).json({ message: "กรุณาระบุเหตุผล" });
//     }
//     await db.query(
//       `UPDATE applications
//           SET application_status = 'rejected',
//               rejection_reason   = ?,
//               rejection_count    = COALESCE(rejection_count, 0) + 1
//         WHERE application_id = ?`,
//       [reason, appId]
//     );
//     return res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("[rejectApplication]", err);
//     return res.status(500).json({ message: "ปฏิเสธไม่สำเร็จ" });
//   }
// };

/* POST /api/applications/:id/reject   body: { reason } */
exports.rejectApplication = async (req, res) => {
  const conn = db.getConnection ? await db.getConnection() : db;
  try {
    const { id: appId } = req.params;
    const { reason } = req.body || {};
    const committeeId = req.user?.user_id ?? 0; // ← คนที่ปฏิเสธ

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "กรุณาระบุเหตุผล" });
    }

    if (conn.beginTransaction) await conn.beginTransaction();

    // 1) อัปเดตสถานะ + ผู้รีวิว + เวลา
    await conn.query(
      `UPDATE applications
          SET application_status = 'rejected',
              rejection_reason   = ?,
              rejection_count    = COALESCE(rejection_count, 0) + 1,
              reviewed_by        = ?,
              reviewed_at        = CURRENT_TIMESTAMP
        WHERE application_id = ?`,
      [reason, committeeId, appId]
    );

    // 2) บันทึกลง committee_reviews (candidate_id อาจยังไม่มี → NULL ได้)
    await conn.query(
      `INSERT INTO committee_reviews (candidate_id, committee_id, decision, reason, reviewed_at)
       VALUES (
         (SELECT candidate_id FROM candidates WHERE application_id = ? LIMIT 1),
         ?,
         'reject',
         ?,
         CURRENT_TIMESTAMP
       )`,
      [appId, committeeId, reason]
    );

    if (conn.commit) await conn.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (conn.rollback) try { await conn.rollback(); } catch { }
    console.error("[rejectApplication]", err);
    return res.status(500).json({ message: "ปฏิเสธไม่สำเร็จ" });
  } finally {
    if (conn.release) conn.release();
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
