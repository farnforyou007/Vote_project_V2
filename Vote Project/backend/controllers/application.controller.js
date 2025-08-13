const db = require('../models/db');
const jwt = require('jsonwebtoken');



exports.applyCandidate = (req, res) => {
    const { user_id, election_id, policy } = req.body;
    const photoFile = req.file;

    if (!user_id || !election_id || !policy || !imageFile) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const checkEligibilitySQL = `
        SELECT * FROM election_eligibility 
        WHERE user_id = ? AND election_id = ?
    `;
    db.query(checkEligibilitySQL, [user_id, election_id], (err, results) => {
        if (err) {
            console.error("❌ ตรวจสอบสิทธิ์ผิดพลาด:", err);
            return res.status(500).json({ success: false });
        }

        if (results.length === 0) {
            return res.status(403).json({ success: false, message: "คุณไม่มีสิทธิ์สมัครในรายการนี้" });
        }

        const photoPath = `/uploads/candidates/${photoFile.filename}`;

        const checkDuplicateSQL = `
            SELECT * FROM applications WHERE user_id = ? AND election_id = ?
        `;
        db.query(checkDuplicateSQL, [user_id, election_id], (dupErr, dupResults) => {
            if (dupErr) return res.status(500).json({ success: false });

            if (dupResults.length > 0) {
                return res.status(409).json({ success: false, message: "คุณได้สมัครไปแล้วในรายการนี้" });
            }

            const insertSQL = `
                INSERT INTO applications 
                (user_id, election_id, campaign_slogan, photo, application_status, submitted_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())
            `;
            db.query(insertSQL, [user_id, election_id, policy, photoPath], (insertErr) => {
                if (insertErr) {
                    console.error("❌ บันทึกใบสมัครผิดพลาด:", insertErr);
                    return res.status(500).json({ success: false });
                }

                return res.json({ success: true, message: "สมัครเรียบร้อยแล้ว รอการอนุมัติจากกรรมการ" });
            });
        });
    });
};

exports.checkAlreadyApplied = (req, res) => {
    const user_id = req.user.user_id;
    const election_id = req.params.election_id;

    const sql = `
    SELECT * FROM applications
    WHERE user_id = ? AND election_id = ?
    `;
    db.query(sql, [user_id, election_id], (err, results) => {
        if (err) {
            console.error("❌ SQL error checkAlreadyApplied:", err);
            return res.status(500).json({ success: false });
        }

        const hasApplied = results.length > 0;
        res.json({ success: true, applied: hasApplied });
    });
};


// PUT /api/applications/:id/approve
exports.approveApplication = (req, res) => {
    const applicationId = req.params.id;
    const reviewerId = req.user.user_id;

    // 1. ดึง election_id ของ application นี้ก่อน
    const getElectionIdSQL = `
    SELECT election_id FROM applications WHERE application_id = ?
    `;

    db.query(getElectionIdSQL, [applicationId], (err, results) => {
        if (err || results.length === 0) {
            console.error("❌ ดึง election_id ล้มเหลว:", err);
            return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
        }

        const electionId = results[0].election_id;

        // 2. หาเลขเบอร์สูงสุดในรายการเลือกตั้งนี้
        const getMaxNumberSQL = `
        SELECT MAX(application_number) AS max_number
        FROM applications
        WHERE election_id = ? AND application_status = 'approved'
    `;

        db.query(getMaxNumberSQL, [electionId], (err2, results2) => {
            if (err2) {
                console.error("❌ หาหมายเลขผู้สมัครล้มเหลว:", err2);
                return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
            }

            const newNumber = (results2[0].max_number || 0) + 1;

            // 3. อัปเดตสถานะ + เบอร์ + ผู้อนุมัติ
            const updateSQL = `
        UPDATE applications
        SET application_status = 'approved',
            application_number = ?,
            reviewed_by = ?,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE application_id = ?
        `;

            db.query(updateSQL, [newNumber, reviewerId, applicationId], (err3, result3) => {
                if (err3) {
                    console.error("❌ อัปเดตใบสมัครล้มเหลว:", err3);
                    return res.status(500).json({ success: false });
                }

                if (result3.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: "ไม่พบใบสมัคร" });
                }

                return res.json({
                    success: true,
                    message: `อนุมัติใบสมัครแล้ว พร้อมกำหนดหมายเลขผู้สมัคร: ${newNumber}`,
                    application_number: newNumber
                });
            });
        });
    });
};


// PUT /api/applications/:id/reject
exports.rejectApplication = (req, res) => {
    const applicationId = req.params.id;
    const reviewerId = req.user.user_id; // ดึงจาก token
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
        return res.status(400).json({ success: false, message: "กรุณากรอกเหตุผลในการปฏิเสธ" });
    }

    const sql = `
    UPDATE applications
    SET application_status = 'rejected',
        rejection_reason = ?,
        reviewed_by = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE application_id = ?
  `;

    db.query(sql, [rejection_reason, reviewerId, applicationId], (err, result) => {
        if (err) {
            console.error("❌ ปฏิเสธใบสมัครผิดพลาด:", err);
            return res.status(500).json({ success: false });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบใบสมัคร" });
        }

        return res.json({ success: true, message: "ปฏิเสธใบสมัครเรียบร้อยแล้ว" });
    });
};

exports.approveCandidate = (req, res) => {
    const candidateId = req.params.id;

    const sql = `UPDATE Candidates SET is_approved = 1, approved_at = NOW() WHERE candidate_id = ?`;
    db.query(sql, [candidateId], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: 'อนุมัติผู้สมัครเรียบร้อยแล้ว' });
    });
};



// admin DELETE /api/candidates/:id
exports.deleteCandidate = (req, res) => {
    const candidateId = req.params.id;
    db.query("DELETE FROM candidates WHERE candidate_id = ?", [candidateId], (err, result) => {
        if (err) return res.status(500).json({ message: "Delete failed" });
        res.json({ success: true });
    });
};

exports.getCandidatesByElection = (req, res) => {
    const electionId = req.params.id;

    const sql = `
    SELECT
      a.application_id AS candidate_id,
      u.student_id,
      CONCAT(u.first_name, ' ', u.last_name) AS full_name,
      a.photo AS image_url,
      a.campaign_slogan AS policy,
      a.application_status AS status,
      a.application_number,
      a.reviewed_by,
      a.reviewed_at,
      a.submitted_at,
      a.rejection_reason,
      u.department_id,
      d.department_name,
      u.year_id,
      y.year_name,
      y.level_id,
      CONCAT(r.first_name, ' ', r.last_name) AS reviewer_name
    FROM applications a
    JOIN users u ON a.user_id = u.user_id
    LEFT JOIN users r ON a.reviewed_by = r.user_id
    LEFT JOIN department d ON u.department_id = d.department_id
    LEFT JOIN year_levels y ON u.year_id = y.year_id
    WHERE a.election_id = ?
    ORDER BY a.submitted_at DESC
    `;

    db.query(sql, [electionId], (err, results) => {
        if (err) {
            console.error("❌ ดึงรายชื่อผู้สมัครผิดพลาด:", err);
            return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่ server" });
        }

        const processed = results.map((r) => ({
            ...r,
            image_url: r.image_url || "",
            policy: r.policy || "-",
            reviewer_name: r.reviewer_name || "-",
            application_number: r.application_number || "-",
            department_name: r.department_name || "-",
            year_name: r.year_name || "-",
            reject_reason: r.rejection_reason || null,
            submitted_at: r.submitted_at || null,
            reviewed_at: r.reviewed_at || null,

            department_id: r.department_id || null,
            year_id: r.year_id || null,
            level_id: r.level_id || null,
        }));

        return res.json({ success: true, candidates: processed });
    });
};

// GET /api/applications/my
exports.getMyApplication = (req, res) => {
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

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("❌ ดึงใบสมัครล้มเหลว:", err);

            return res.status(500).json({ success: false });
        }

        return res.json({ success: true, applications: results });
    });
};

// `ตรวจสอบใบสมัครของ นศ
exports.checkApplicationStatus = (req, res) => {
    const user_id = req.user.user_id;

    const sql = `SELECT * FROM applications WHERE user_id = ?`;
    db.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        if (results.length > 0) {
            res.json({ hasApplied: true });
        } else {
            res.json({ hasApplied: false });
        }
    });
};

// ตัวอย่าง controller สำหรับกรรมการส่งกลับให้แก้ไข
// exports.requestRevision = (req, res) => {
//     const { application_id, reason } = req.body;

//     const sql = `
//         UPDATE applications
//         SET application_status = 'revision_requested',
//             rejection_reason = ?
//         WHERE application_id = ?
//     `;

//     db.query(sql, [reason, application_id], (err, result) => {
//         if (err) {
//             console.error("❌ SQL error:", err);
//             return res.status(500).json({ success: false });
//         }
//         res.json({ success: true });
//     });
// };

exports.updateMyApplication = (req, res) => {
    const user_id = req.user.user_id;
    const { application_id, policy } = req.body;
    const photoFile = req.file; // <- ตรงกับ upload.single("photo")

    if (!application_id || !policy) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const photoPath = photoFile ? `/uploads/candidates/${photoFile.filename}` : null;

    const sql = `
        UPDATE applications
        SET campaign_slogan = ?, 
            ${photoPath ? "photo = ?," : ""}
            application_status = 'pending',
            updated_at = NOW()
        WHERE application_id = ? AND user_id = ?
    `;

    const params = photoPath
        ? [policy, photoPath, application_id, user_id]
        : [policy, application_id, user_id];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("❌ Update Application Error:", err);
            return res.status(500).json({ success: false, message: "DB Error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        res.json({ success: true, message: "Application updated" });
    });
};

