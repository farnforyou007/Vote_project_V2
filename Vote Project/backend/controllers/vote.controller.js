// // 📁 controllers/vote.controller.js
// const db = require('../models/db');

// // ลงคะแนน (โหวตหรือ งดออกเสียง)
// exports.castVote = (req, res) => {
//     const { election_id, candidate_id, abstain } = req.body; // เพิ่ม abstain option
//     const user_id = req.user.user_id;

//     // 1. ป้องกันลงคะแนนซ้ำ
//     const checkSql = `SELECT * FROM Votes WHERE user_id = ? AND election_id = ?`;
//     db.query(checkSql, [user_id, election_id], (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         if (results.length > 0) {
//             return res.status(400).json({ success: false, message: 'คุณได้ลงคะแนนแล้ว' });
//         }

//         // 2. Insert vote (รองรับงดออกเสียง)
//         // ถ้างดออกเสียง candidate_id จะเป็น null, abstain = 1
//         const insertSql = `
//             INSERT INTO Votes (user_id, election_id, candidate_id, abstain, created_at)
//             VALUES (?, ?, ?, ?, NOW())
//         `;
//         db.query(insertSql, [
//             user_id,
//             election_id,
//             candidate_id || null, // จะได้ null ถ้างดออกเสียง
//             abstain ? 1 : 0
//         ], (err2) => {
//             if (err2) return res.status(500).json({ success: false });
//             res.json({ success: true, message: abstain ? "งดออกเสียงเรียบร้อย" : "ลงคะแนนเรียบร้อยแล้ว" });
//         });
//     });
// };

// // ประวัติการโหวต
// exports.getVoteHistory = (req, res) => {
//     const user_id = req.user.user_id;

//     const sql = `
//     SELECT v.*, e.title AS election_title, c.fullname AS candidate_name
//     FROM Votes v
//     JOIN Elections e ON v.election_id = e.election_id
//     LEFT JOIN Candidates c ON v.candidate_id = c.candidate_id
//     WHERE v.user_id = ?
//     ORDER BY v.created_at DESC
//     `;

//     db.query(sql, [user_id], (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         res.json({ success: true, history: results });
//     });
// };

// 📁 controllers/vote.controller.js
const db = require('../models/db');

// ลงคะแนน (โหวตหรือ งดออกเสียง)
// exports.castVote = (req, res) => {
//     const { election_id, candidate_id, abstain } = req.body;
//     const voter_id = req.user.user_id; // ใช้ user จาก JWT

//     // 1. ป้องกันลงคะแนนซ้ำ
//     const checkSql = `SELECT * FROM votes WHERE voter_id = ? AND election_id = ?`;
//     db.query(checkSql, [voter_id, election_id], (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         if (results.length > 0) {
//             return res.status(400).json({ success: false, message: 'คุณได้ลงคะแนนแล้ว' });
//         }

//         // 2. Insert vote (รองรับงดออกเสียง)
//         // ถ้างดออกเสียง candidate_id จะเป็น null, abstain = 1
//         const insertSql = `
//             INSERT INTO votes (election_id, voter_id, candidate_id, abstain)
//             VALUES (?, ?, ?, ?)
//         `;
//         db.query(insertSql, [
//             election_id,
//             voter_id,
//             abstain ? null : candidate_id, // null ถ้างดออกเสียง
//             abstain ? 1 : 0
//         ], (err2) => {
//             if (err2) return res.status(500).json({ success: false });

//             res.json({ 
//                 success: true,
//                 message: abstain ? "งดออกเสียงเรียบร้อย" : "ลงคะแนนเรียบร้อยแล้ว" 
//             });
//         });
//     });
// };

// ลงคะแนนและบันทึกประวัติ

exports.castVote = (req, res) => {
    const { election_id, candidate_id, abstain } = req.body;
    const voter_id = req.user.user_id;

    // 1. ป้องกันลงคะแนนซ้ำ
    const checkSql = `SELECT * FROM votes WHERE voter_id = ? AND election_id = ?`;
    db.query(checkSql, [voter_id, election_id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณได้ลงคะแนนแล้ว' });
        }

        // 2. Insert vote (รองรับงดออกเสียง)
        const insertSql = `
            INSERT INTO votes (election_id, voter_id, candidate_id, abstain)
            VALUES (?, ?, ?, ?)
        `;
        db.query(insertSql, [
            election_id,
            voter_id,
            abstain ? null : candidate_id,
            abstain ? 1 : 0
        ], (err2, voteResult) => {
            if (err2) return res.status(500).json({ success: false });

            // ⭐ เพิ่ม log ลง vote_history ทุกครั้งที่มีการโหวต
            const historySql = `
                INSERT INTO vote_history (user_id, election_id, participated, created_at)
                VALUES (?, ?, 1, NOW())
            `;
            db.query(historySql, [
                voter_id,
                election_id,
                abstain ? null : candidate_id,
                abstain ? 1 : 0,
                abstain ? 'abstain' : 'vote'
            ], (err3) => {
                // ไม่ต้อง return error ถ้า log history fail (optional)
                // จบด้วย return ปกติ
                res.json({
                    success: true,
                    message: abstain ? "งดออกเสียงเรียบร้อย" : "ลงคะแนนเรียบร้อยแล้ว"
                });
            });
        });
    });
};


// ประวัติการโหวต
exports.getVoteHistory = (req, res) => {
    const voter_id = req.user.user_id;

    const sql = `
        SELECT v.*,
            e.title AS election_title, 
            c.candidate_number,
            c.campaign_slogan,
            c.photo,
            c.candidate_id,
            CONCAT(u.first_name, ' ', u.last_name) AS candidate_name
        FROM votes v
        JOIN elections e ON v.election_id = e.election_id
        LEFT JOIN candidates c ON v.candidate_id = c.candidate_id
        LEFT JOIN applications a ON c.application_id = a.application_id
        LEFT JOIN users u ON a.user_id = u.user_id
        WHERE v.voter_id = ?
        ORDER BY v.voted_at DESC
    `;

    db.query(sql, [voter_id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        // ส่ง abstain ออกไปด้วย (จะได้รู้ว่าแต่ละรายการโหวตหรือ งดออกเสียง)
        res.json({ success: true, history: results });
    });
};

// GET /api/votes/status
exports.getVoteStatus = (req, res) => {
    const user_id = req.user.user_id;
    const sql = 'SELECT election_id FROM votes WHERE voter_id = ?';
    db.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "DB error" });
        const voted_elections = results.map(row => row.election_id);
        res.json({ success: true, voted_elections });
    });
};

// controllers/vote.controller.js
exports.getMyVoteHistory = (req, res) => {
    const userId = req.user.user_id;

    const sql = `
    SELECT
      e.election_id,
      e.election_name,
      e.start_date,
      e.end_date,
      YEAR(e.start_date) AS year_gregorian,

      v.vote_id,
      v.candidate_id,
      v.abstain,
      v.created_at AS voted_at,

      CASE
        WHEN v.vote_id IS NOT NULL AND v.abstain = 1 THEN 'ABSTAIN'
        WHEN v.vote_id IS NOT NULL AND v.abstain = 0 THEN 'VOTED'
        WHEN v.vote_id IS NULL AND NOW() > e.end_date THEN 'MISSED'
        ELSE 'PENDING'
      END AS my_status
    FROM elections e
    JOIN election_eligibility ee
      ON ee.election_id = e.election_id AND ee.user_id = ?
    LEFT JOIN votes v
      ON v.election_id = e.election_id AND v.user_id = ee.user_id
    ORDER BY e.start_date DESC;
  `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("❌ getMyVoteHistory:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        // แปลงค่าให้อ่านง่าย + เพิ่มปี พ.ศ.
        const data = rows.map(r => {
            const started = r.start_date ? new Date(r.start_date) : null;
            const yearBE = started ? started.getFullYear() + 543 : null;

            return {
                election_id: r.election_id,
                election_name: r.election_name,
                start_date: r.start_date,
                end_date: r.end_date,
                year_be: yearBE,                 // ปี พ.ศ.
                voted_at: r.voted_at,
                status: r.my_status,             // VOTED / ABSTAIN / MISSED / PENDING
                candidate_id: r.candidate_id,
                abstain: r.abstain === 1,
            };
        });

        res.json({ success: true, history: data });
    });
};
