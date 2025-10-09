// const db = require('../models/db');

// // work
// exports.getCandidatesByElection = (req, res) => {
//     const election_id = req.params.id;

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

// controllers/candidate.controller.js
const db = require('../models/db');

/**
 * GET /api/candidates/election/:id
 * ดึงผู้สมัครที่ "อนุมัติแล้ว" ของการเลือกตั้งหนึ่ง ๆ
 */
exports.getCandidatesByElection = async (req, res) => {
    try {
        const election_id = req.params.id;

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
      JOIN users u        ON a.user_id = u.user_id
      LEFT JOIN department  d ON u.department_id = d.department_id
      LEFT JOIN year_levels y ON u.year_id = y.year_id
      WHERE a.election_id = ?
        AND c.status = 'approved'
      ORDER BY c.candidate_number ASC
    `;

        const rows = await db.query(sql, [election_id]);

        const candidates = rows.map(row => ({
            candidate_id: row.candidate_id,
            number: row.candidate_number,
            full_name: `${row.first_name} ${row.last_name}`,
            image_url: row.photo || '',
            department: row.department_name || '-',
            year_level: row.year_name || '-',
            policy: row.campaign_slogan || '-',
            status: row.status,
        }));

        return res.json({ success: true, candidates });
    } catch (err) {
        console.error('[getCandidatesByElection]', err);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลผู้สมัครได้' });
    }
};
