const db = require('../models/db');

// // ดึงผู้สมัครทั้งหมดของ election_id ที่กำหนด พร้อมแผนกและชั้นปี
// exports.getCandidatesByElection = (req, res) => {
//     const election_id = req.params.election_id;

//     const sql = `
//         SELECT
//             c.candidate_id,
//             c.candidate_number,
//             c.campaign_slogan,
//             c.status,
//             c.photo,
//             c.reviewed_by,
//             c.created_at,
//             u.first_name,
//             u.last_name,
//             u.department,
//             u.year_level
//         FROM Candidates c
//         JOIN Applications a ON c.application_id = a.application_id
//         JOIN Users u ON a.user_id = u.user_id
//         WHERE a.election_id = ?
//         AND c.status = 'approved'
//         ORDER BY c.candidate_number ASC
//     `;

//     db.query(sql, [election_id], (err, results) => {
//         if (err) return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลผู้สมัครได้" });
//         console.error(err);
//         res.json({ success: true, candidates: results });
//     });
// };

// exports.getCandidatesByElection = (req, res) => {
//     const election_id = req.params.election_id;

//     const sql = `
//         SELECT
//             c.candidate_id,
//             c.candidate_number,
//             c.campaign_slogan,
//             c.status,
//             c.photo,
//             u.first_name,
//             u.last_name,
//             d.department_name,
//             y.year_name
//         FROM candidates c
//         JOIN applications a ON c.application_id = a.application_id
//         JOIN users u ON a.user_id = u.user_id
//         LEFT JOIN department d ON u.department_id = d.department_id
//         LEFT JOIN year_levels y ON u.year_id = y.year_id
//         WHERE a.election_id = ?
//         AND c.status = 'approved'
//         ORDER BY c.candidate_number ASC
//     `;

//     db.query(sql, [election_id], (err, results) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลผู้สมัครได้" });
//         }
//         const mapped = results.map(row => ({
//             candidate_id: row.candidate_id,
//             number: row.candidate_number,
//             full_name: `${row.first_name} ${row.last_name}`,
//             image_url: row.photo,
//             department: row.department_name,
//             year_level: row.year_name,
//             policy: row.campaign_slogan,
//         }));
//         res.json({ success: true, candidates: mapped });
//     });
// };

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