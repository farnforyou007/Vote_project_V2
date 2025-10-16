// version with getConnection for transaction support
// 📁 controllers/application.controller.js
const db = require('../models/db');
// const jwt = require('jsonwebtoken'); // ไม่ได้ใช้ในไฟล์นี้แล้ว

/** ------------------------------------------------------------------ */
/** POST /api/applications  (นักศึกษาสมัครเป็นผู้สมัคร)                */
/** ------------------------------------------------------------------ */
exports.applyCandidate = async (req, res) => {
    try {
        const user_id = req.user.user_id; // ✅ ใช้จาก token เพื่อกันสวมรอย
        const { election_id, policy } = req.body;
        const photoFile = req.file; // multer ใส่มาให้แล้ว

        if (!user_id || !election_id || !policy || !photoFile) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        // 1) ตรวจสิทธิ์
        const elig = await db.query(
            `SELECT 1 FROM election_eligibility WHERE user_id = ? AND election_id = ?`,
            [user_id, election_id]
        );
        if (elig.length === 0) {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์สมัครในรายการนี้' });
        }

        // 2) กันสมัครซ้ำ
        const dup = await db.query(
            `SELECT 1 FROM applications WHERE user_id = ? AND election_id = ?`,
            [user_id, election_id]
        );
        if (dup.length > 0) {
            return res.status(409).json({ success: false, message: 'คุณได้สมัครไปแล้วในรายการนี้' });
        }

        // 3) บันทึก
        const photoPath = req.file.path || `/uploads/candidates/${req.file.filename}`;
        await db.query(
            `INSERT INTO applications
        (user_id, election_id, campaign_slogan, photo, application_status, submitted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())`,
            [user_id, election_id, policy, photoPath]
        );

        return res.json({ success: true, message: 'สมัครเรียบร้อยแล้ว รอการอนุมัติจากกรรมการ' });
    } catch (err) {
        console.error('applyCandidate error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/applications/already/:election_id                          */
/** ------------------------------------------------------------------ */
exports.checkAlreadyApplied = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const election_id = req.params.election_id;

        const rows = await db.query(
            `SELECT 1 FROM applications WHERE user_id = ? AND election_id = ?`,
            [user_id, election_id]
        );
        return res.json({ success: true, applied: rows.length > 0 });
    } catch (err) {
        console.error('checkAlreadyApplied error:', err);
        return res.status(500).json({ success: false });
    }
};

/** ------------------------------------------------------------------ */
/** PUT /api/applications/:id/approve  (กรรมการอนุมัติ + แจกหมายเลข)     */
/** ------------------------------------------------------------------ */
exports.approveApplication = async (req, res) => {
    const applicationId = req.params.id;
    const reviewerId = req.user.user_id;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1) ล็อกแถวของใบสมัครนี้และดึง election_id มาก่อน
        const [apps] = await conn.query(
            `SELECT election_id FROM applications WHERE application_id = ? FOR UPDATE`,
            [applicationId]
        );
        if (!apps.length) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'ไม่พบใบสมัคร' });
        }
        const electionId = apps[0].election_id;

        // 2) ล็อกเบอร์เดิมทั้งหมดของรายการนี้ ป้องกันชน
        const [nums] = await conn.query(
            `SELECT application_number
         FROM applications
        WHERE election_id = ? AND application_status = 'approved'
        FOR UPDATE`,
            [electionId]
        );
        const maxNum = nums.reduce((m, r) => Math.max(m, Number(r.application_number || 0)), 0);
        const newNumber = maxNum + 1;

        // 3) อัปเดตสถานะ + เบอร์ + ผู้อนุมัติ
        const [upd] = await conn.query(
            `UPDATE applications
          SET application_status = 'approved',
              application_number = ?,
              reviewed_by = ?,
              reviewed_at = NOW(),
              updated_at = NOW()
        WHERE application_id = ?`,
            [newNumber, reviewerId, applicationId]
        );

        if (upd.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'ไม่พบใบสมัคร' });
        }

        await conn.commit();
        return res.json({
            success: true,
            message: `อนุมัติใบสมัครแล้ว พร้อมกำหนดหมายเลขผู้สมัคร: ${newNumber}`,
            application_number: newNumber,
        });
    } catch (err) {
        await conn.rollback();
        console.error('approveApplication error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    } finally {
        conn.release();
    }
};

/** ------------------------------------------------------------------ */
/** PUT /api/applications/:id/reject  (กรรมการปฏิเสธ)                    */
/** ------------------------------------------------------------------ */
exports.rejectApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const reviewerId = req.user.user_id;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกเหตุผลในการปฏิเสธ' });
        }

        const result = await db.query(
            `UPDATE applications
          SET application_status = 'rejected',
              rejection_reason = ?,
              reviewed_by = ?,
              reviewed_at = NOW(),
              updated_at = NOW()
        WHERE application_id = ?`,
            [rejection_reason, reviewerId, applicationId]
        );

        // หมายเหตุ: result เป็น rows จาก wrapper (ไม่ใช่ [result])
        // ถ้าต้องใช้ affectedRows จริง ๆ ควรใช้ conn.query ในทรานแซกชัน
        return res.json({ success: true, message: 'ปฏิเสธใบสมัครเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('rejectApplication error:', err);
        return res.status(500).json({ success: false });
    }
};

/** ------------------------------------------------------------------ */
/** PUT /api/candidates/:id/approve (legacy—อาจไม่ได้ใช้)                 */
/** ------------------------------------------------------------------ */
exports.approveCandidate = async (req, res) => {
    try {
        const candidateId = req.params.id;
        await db.query(
            `UPDATE candidates SET is_approved = 1, approved_at = NOW() WHERE candidate_id = ?`,
            [candidateId]
        );
        res.json({ success: true, message: 'อนุมัติผู้สมัครเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('approveCandidate error:', err);
        res.status(500).json({ success: false });
    }
};

/** ------------------------------------------------------------------ */
/** DELETE /api/candidates/:id (admin)                                   */
/** ------------------------------------------------------------------ */
// exports.deleteCandidate = async (req, res) => {
//     try {
//         const candidateId = req.params.id;
//         await db.query(`DELETE FROM candidates WHERE candidate_id = ?`, [candidateId]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error('deleteCandidate error:', err);
//         res.status(500).json({ message: 'Delete failed' });
//     }
// };
/** DELETE /api/candidates/:id  (admin only) */
// exports.deleteApplication = async (req, res) => {
//     const conn = db.getConnection ? await db.getConnection() : db;
//     try {
//         const candidateId = req.params.id;
//         if (conn.beginTransaction) await conn.beginTransaction();

//         await conn.query(`DELETE FROM candidates WHERE application_id = ?`, [candidateId]);
//         await conn.query(`DELETE FROM applications WHERE application_id = ?`, [candidateId]);


//         if (conn.commit) await conn.commit();
//         res.json({ success: true });
//     } catch (err) {
//         if (conn.rollback) try { await conn.rollback(); } catch { }
//         console.error('deleteCandidate error:', err);
//         res.status(500).json({ message: 'Delete failed' });
//     } finally {
//         if (conn.release) conn.release();
//     }
// };

// controllers/xxxx.controller.js
exports.deleteApplication = async (req, res) => {
    const conn = db.getConnection ? await db.getConnection() : db;
    const pickRows = (result) =>
        Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

    try {
        const applicationId = req.params.id; // ✅ ตั้งชื่อให้ตรงความจริง
        if (conn.beginTransaction) await conn.beginTransaction();

        // 1) หา user_id จากใบสมัครเพื่อตรวจ role ภายหลัง (ล็อกกันชน)
        const appRow = pickRows(
            await conn.query(
                `SELECT user_id FROM applications WHERE application_id = ? FOR UPDATE`,
                [applicationId]
            )
        )[0];
        if (!appRow) {
            if (conn.rollback) await conn.rollback();
            return res.status(404).json({ success: false, message: 'ไม่พบใบสมัคร' });
        }

        // 2) (ถ้าไม่มี FK CASCADE) ลบรีวิวที่ผูกกับ candidate ของใบสมัครนี้
        await conn.query(
            `DELETE FROM committee_reviews 
         WHERE candidate_id IN (
           SELECT c.candidate_id 
             FROM candidates c 
            WHERE c.application_id = ?
         )`,
            [applicationId]
        );

        // 3) ลบผู้สมัคร (ถ้ายังไม่อนุมัติจะไม่มีแถว → ลบ 0 แถวได้)
        await conn.query(`DELETE FROM candidates WHERE application_id = ?`, [applicationId]);

        // 4) ลบใบสมัคร
        await conn.query(`DELETE FROM applications WHERE application_id = ?`, [applicationId]);

        // 5) เงื่อนไขการถอด role “ผู้สมัคร”
        //    ถอดก็ต่อเมื่อ user นี้ "ไม่มีผู้สมัครในรายการอื่น" เหลืออยู่แล้ว
        const stillHasAnyCandidate = pickRows(
            await conn.query(
                `SELECT 1
           FROM candidates c
           JOIN applications a ON a.application_id = c.application_id
          WHERE a.user_id = ?
          LIMIT 1`,
                [appRow.user_id]
            )
        )[0];

        if (!stillHasAnyCandidate) {
            // หา role_id ของ "ผู้สมัคร"
            const roleRow = pickRows(
                await conn.query(
                    `SELECT role_id FROM role WHERE role_name = 'ผู้สมัคร' LIMIT 1`
                )
            )[0];
            const candidateRoleId = roleRow?.role_id ?? 2; // fallback ถ้า schema ใช้ 2

            await conn.query(
                `DELETE FROM user_roles 
          WHERE user_id = ? AND role_id = ?`,
                [appRow.user_id, candidateRoleId]
            );
        }

        if (conn.commit) await conn.commit();
        return res.status(200).json({ success: true });
    } catch (err) {
        if (conn.rollback) try { await conn.rollback(); } catch { }
        console.error('[deleteApplication]', err);
        return res.status(500).json({ message: 'Delete failed' });
    } finally {
        if (conn.release) conn.release();
    }
};



/** ------------------------------------------------------------------ */
/** GET /api/applications/by-election/:id                                */
/** ------------------------------------------------------------------ */
// exports.getCandidatesByElection = async (req, res) => {
//     try {
//         const electionId = req.params.id;

//         //     const sql = `
//         //   SELECT
//         //     a.application_id AS candidate_id,
//         //     u.student_id,
//         //     CONCAT(u.first_name, ' ', u.last_name) AS full_name,
//         //     a.photo AS image_url,
//         //     a.campaign_slogan AS policy,
//         //     a.application_status AS status,
//         //     a.application_number,
//         //     a.reviewed_by,
//         //     a.reviewed_at,
//         //     a.submitted_at,
//         //     a.rejection_reason,
//         //     u.department_id,
//         //     d.department_name,
//         //     u.year_id,
//         //     y.year_name,
//         //     y.level_id,
//         //     CONCAT(r.first_name, ' ', r.last_name) AS reviewer_name
//         //   FROM applications a
//         //   JOIN users u ON a.user_id = u.user_id
//         //   LEFT JOIN users r ON a.reviewed_by = r.user_id
//         //   LEFT JOIN department d ON u.department_id = d.department_id
//         //   LEFT JOIN year_levels y ON u.year_id = y.year_id
//         //   WHERE a.election_id = ?
//         //   ORDER BY a.submitted_at DESC
//         // `;

//         const sql = `
// SELECT
//   a.application_id AS candidate_id,
//   u.student_id,
//   CONCAT(u.first_name, ' ', u.last_name) AS name,
//   COALESCE(d.department_name, '') AS department,
//   COALESCE(y.year_name, '')        AS year_name,      -- ถ้าอยากเป็นเลขให้เปลี่ยนเป็น y.year_number
//   COALESCE(l.level_name, '')       AS level_name,
//   a.campaign_slogan,
//   a.photo,
//   a.application_status,
//   COALESCE(a.application_number, c.candidate_number) AS application_number,
//   a.rejection_reason,
//   a.rejection_count,
//   a.submitted_at,
//   a.reviewed_at,
//   COALESCE(CONCAT(r.first_name, ' ', r.last_name), '') AS reviewer_name,  -- << ชื่อผู้อนุมัติ
//   c.candidate_number AS number
// FROM applications a
// JOIN users u                 ON a.user_id = u.user_id
// LEFT JOIN users r            ON a.reviewed_by = r.user_id                 -- << join ผู้อนุมัติ
// LEFT JOIN department d       ON u.department_id = d.department_id
// LEFT JOIN year_levels y      ON u.year_id = y.year_id
// LEFT JOIN education_levels l ON y.level_id = l.level_id
// LEFT JOIN candidates c       ON c.application_id = a.application_id
// WHERE a.election_id = ?
// ORDER BY
//   CASE WHEN c.candidate_number IS NULL THEN 1 ELSE 0 END,
//   c.candidate_number ASC,
//   a.application_id ASC;


// `;

//         // const rows = await db.query(sql, [electionId]);
//         // const processed = rows.map((r) => ({
//         //     candidate_id: r.candidate_id,
//         //     student_id: r.student_id,
//         //     full_name: r.full_name,
//         //     image_url: r.image_url || '',
//         //     policy: r.policy || '-',
//         //     status: r.status,
//         //     application_number: r.application_number || '-',
//         //      : r.reviewer_name || '-',
//         //     department_id: r.department_id || null,
//         //     department_name: r.department_name || '-',
//         //     year_id: r.year_id || null,
//         //     year_name: r.year_name || '-',
//         //     level_id: r.level_id || null,
//         //     reject_reason: r.rejection_reason || null,
//         //     submitted_at: r.submitted_at || null,
//         //     reviewed_at: r.reviewed_at || null,
//         // }));

//         const rows = await db.query(sql, [electionId]);
//         const processed = rows.map((r) => ({
//             candidate_id: r.candidate_id,
//             student_id: r.student_id,
//             name: r.name,
//             photo: r.photo || '',
//             campaign_slogan: r.campaign_slogan || '-',
//             application_status: r.application_status,
//             application_number: r.application_number ?? '-',  // จะ fallback เป็น candidate_number ให้แล้ว
//             department: r.department || '-',
//             number: r.number ?? '-',
//             year_name: r.year_name || '-',                    // ถ้าใช้ year_number เปลี่ยน key ตามที่ส่ง
//             level_name: r.level_name || '-',
//             reviewer_name: r.reviewer_name || '-',            // << ตอนนี้จะมีค่า
//             reject_reason: r.rejection_reason || null,
//             submitted_at: r.submitted_at || null,
//             reviewed_at: r.reviewed_at || null,
//         }));

//         return res.json({ success: true, candidates: processed });
//     } catch (err) {
//         console.error('getCandidatesByElection error:', err);
//         return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่ server' });
//     }
// };

exports.getCandidatesByElection = async (req, res) => {
    try {
        const electionId = req.params.id;

        const sql = `
      SELECT
        a.application_id AS candidate_id,
        u.student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.email AS email,
        COALESCE(d.department_name, '') AS department,
        COALESCE(y.year_name, '')        AS year_name,
        COALESCE(l.level_name, '')       AS level_name,
        COALESCE(y.year_number, '')       AS year_number,
        a.campaign_slogan,
        a.photo,
        a.application_status,
        COALESCE(a.application_number, c.candidate_number) AS application_number,
        a.rejection_reason as rejection_reason,
        a.rejection_count,
        a.submitted_at,
        a.reviewed_at,

        -- ✅ ดึงชื่อกรรมการผู้อนุมัติจาก committee_reviews + users
        -- COALESCE(CONCAT(cm.first_name, ' ', cm.last_name), '') AS reviewer_name,
        COALESCE(CONCAT(r.first_name, ' ', r.last_name), '') AS reviewer_name,
        -- cr.reviewed_at AS committee_reviewed_at,
        -- cr.decision,

        c.candidate_number AS number

      FROM applications a
      JOIN users u                   ON a.user_id = u.user_id
      LEFT JOIN department d         ON u.department_id = d.department_id
      LEFT JOIN year_levels y        ON u.year_id = y.year_id
      LEFT JOIN education_levels l   ON y.level_id = l.level_id
      LEFT JOIN candidates c         ON c.application_id = a.application_id
      -- LEFT JOIN committee_reviews cr ON c.candidate_id = cr.candidate_id   -- 🔹 join ตาราง review
      -- LEFT JOIN users cm             ON cr.committee_id = cm.user_id       -- 🔹 join user ที่เป็นกรรมการ
      LEFT JOIN users r ON a.reviewed_by = r.user_id
      WHERE a.election_id = ?
      ORDER BY
        CASE WHEN c.candidate_number IS NULL THEN 1 ELSE 0 END,
        c.candidate_number ASC,
        a.application_id ASC;
    `;

        const rows = await db.query(sql, [electionId]);
        const processed = rows.map(r => ({
            candidate_id: r.candidate_id,
            student_id: r.student_id,
            name: r.name,
            email: r.email,
            photo: r.photo || '',
            campaign_slogan: r.campaign_slogan || '-',
            application_status: r.application_status,
            application_number: r.application_number ?? '-',
            department: r.department || '-',
            number: r.number ?? '-',
            year_name: r.year_name || '-',
            year_number: r.year_number || '-',
            level_name: r.level_name || '-',
            reviewer_name: r.reviewer_name || '-',     // ✅ ตอนนี้ได้จาก committee_reviews
            reviewed_at: r.committee_reviewed_at || r.reviewed_at || null,
            rejection_reason: r.rejection_reason || null,
            submitted_at: r.submitted_at || null,
        }));

        return res.json({ success: true, candidates: processed });
    } catch (err) {
        console.error('getCandidatesByElection error:', err);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่ server' });
    }
};


/** ------------------------------------------------------------------ */
/** GET /api/applications/my                                            */
/** ------------------------------------------------------------------ */
exports.getMyApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const sql = `
      SELECT  
        a.*,
        e.election_name,
        e.start_date,
        e.end_date,
        d.department_name,
        y.year_name,
        y.level_id,
        CONCAT(r.first_name, ' ', r.last_name) AS reviewer_name
      FROM applications a
      JOIN elections e ON a.election_id = e.election_id
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN users r ON a.reviewed_by = r.user_id
      LEFT JOIN department d ON u.department_id = d.department_id
      LEFT JOIN year_levels y ON u.year_id = y.year_id
      WHERE a.user_id = ?
      ORDER BY a.submitted_at DESC
    `;

        const rows = await db.query(sql, [userId]);
        return res.json({ success: true, applications: rows });
    } catch (err) {
        console.error('getMyApplication error:', err);
        return res.status(500).json({ success: false });
    }
};

/** ------------------------------------------------------------------ */
/** GET /api/applications/status  (นักศึกษาดูว่าเคยสมัครมั้ย)            */
/** ------------------------------------------------------------------ */
exports.checkApplicationStatus = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const rows = await db.query(`SELECT 1 FROM applications WHERE user_id = ?`, [user_id]);
        res.json({ hasApplied: rows.length > 0 });
    } catch (err) {
        console.error('checkApplicationStatus error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

/** ------------------------------------------------------------------ */
/** PUT /api/applications/my  (นักศึกษาปรับแก้ใบสมัครตัวเอง)             */
/** ------------------------------------------------------------------ */
exports.updateMyApplication = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { application_id, policy } = req.body;
        const photoFile = req.file;
        const photoPath = photoFile
            ? (req.file.path || `/uploads/candidates/${req.file.filename}`)
            : null;

        if (!application_id) {
            return res.status(400).json({ success: false, message: 'Missing application_id' });
        }
        if (!policy && !photoPath) {
            return res.status(400).json({ success: false, message: 'ต้องกรอกนโยบายหรือแนบรูปอย่างน้อยหนึ่งอย่าง' });
        }

        const sets = [];
        const params = [];

        if (policy) { sets.push('campaign_slogan = ?'); params.push(policy); }
        if (photoPath) { sets.push('photo = ?'); params.push(photoPath); }

        // ทุกครั้งที่นิสิตแก้ ให้กลับไปสถานะ pending เพื่อส่งตรวจใหม่
        sets.push(`application_status = 'pending'`,
            `rejection_reason = NULL`,
            `reviewed_by = NULL`,
            `reviewed_at = NULL`,
            `updated_at = NOW()`);

        const sql = `
      UPDATE applications
         SET ${sets.join(', ')}
       WHERE application_id = ? AND user_id = ?
    `;
        params.push(application_id, user_id);

        await db.query(sql, params);

        res.json({ success: true, message: 'Application updated' });
    } catch (err) {
        console.error('updateMyApplication error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};


// PUT /api/applications/:id/request-revision
exports.requestRevision = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const reviewerId = req.user.user_id;
        const { reason } = req.body; // เหตุผลที่ให้แก้ไข

        await db.query(
            `UPDATE applications
         SET application_status = 'revision_requested',
             rejection_reason = ?,
             reviewed_by = ?,
             reviewed_at = NOW(),
             updated_at = NOW()
       WHERE application_id = ?`,
            [reason || 'กรุณาแก้ไขข้อมูล', reviewerId, applicationId]
        );

        return res.json({ success: true, message: 'ส่งกลับให้แก้ไขแล้ว' });
    } catch (err) {
        console.error('requestRevision error:', err);
        return res.status(500).json({ success: false });
    }
};
