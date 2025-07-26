const db = require('../models/db');
// 📁 controllers/candidate.controller.js
exports.approveCandidate = (req, res) => {
    const candidateId = req.params.id;

    const sql = `UPDATE Candidates SET is_approved = 1, approved_at = NOW() WHERE candidate_id = ?`;
    db.query(sql, [candidateId], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: 'อนุมัติผู้สมัครเรียบร้อยแล้ว' });
    });
};
