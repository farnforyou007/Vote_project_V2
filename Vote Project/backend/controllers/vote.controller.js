// 📁 controllers/vote.controller.js
const db = require('../models/db');

exports.castVote = (req, res) => {
    const { election_id, candidate_id } = req.body;
    const user_id = req.user.user_id;

    const sql = `
    INSERT INTO Votes (user_id, election_id, candidate_id, created_at)
    VALUES (?, ?, ?, NOW())
    `;
    db.query(sql, [user_id, election_id, candidate_id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'ไม่สามารถลงคะแนนได้' });
        res.json({ success: true, message: 'ลงคะแนนเรียบร้อยแล้ว' });
    });
};

exports.getVoteHistory = (req, res) => {
    const user_id = req.user.user_id;

    const sql = `
    SELECT v.*, e.title AS election_title, c.fullname AS candidate_name
    FROM Votes v
    JOIN Elections e ON v.election_id = e.election_id
    JOIN Candidates c ON v.candidate_id = c.candidate_id
    WHERE v.user_id = ?
    ORDER BY v.created_at DESC
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, history: results });
    });
};

// ป้องกันการลงคะแนนซ้ำ
exports.castVote = (req, res) => {
    const { election_id, candidate_id } = req.body;
    const user_id = req.user.user_id;

    // 1. ตรวจว่าลงคะแนนซ้ำไหม
    const checkSql = `SELECT * FROM Votes WHERE user_id = ? AND election_id = ?`;
    db.query(checkSql, [user_id, election_id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณได้ลงคะแนนแล้ว' });
        }

        // 2. ลงคะแนนได้
        const insertSql = `INSERT INTO Votes (user_id, election_id, candidate_id, created_at) VALUES (?, ?, ?, NOW())`;
        db.query(insertSql, [user_id, election_id, candidate_id], (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true, message: 'ลงคะแนนเรียบร้อยแล้ว' });
        });
    });
};
