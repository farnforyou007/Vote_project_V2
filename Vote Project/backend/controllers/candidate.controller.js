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

exports.getCandidatesByElection = (req, res) => {
    const election_id = req.params.election_id;

    const sql = `
        SELECT
            c.candidate_id,
            c.candidate_number,
            c.campaign_slogan,
            c.status,
            c.photo,
            u.first_name,
            u.last_name,
            d.department_name,
            y.year_name
        FROM candidates c
        JOIN applications a ON c.application_id = a.application_id
        JOIN users u ON a.user_id = u.user_id
        LEFT JOIN department d ON u.department_id = d.department_id
        LEFT JOIN year_levels y ON u.year_id = y.year_id
        WHERE a.election_id = ?
        AND c.status = 'approved'
        ORDER BY c.candidate_number ASC
    `;

    db.query(sql, [election_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลผู้สมัครได้" });
        }
        const mapped = results.map(row => ({
            candidate_id: row.candidate_id,
            number: row.candidate_number,
            full_name: `${row.first_name} ${row.last_name}`,
            image_url: row.photo,
            department: row.department_name,
            year_level: row.year_name,
            policy: row.campaign_slogan,
        }));
        res.json({ success: true, candidates: mapped });
    });
};
