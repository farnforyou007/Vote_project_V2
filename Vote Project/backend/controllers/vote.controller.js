const db = require('../models/db');

/** ---------------------------------------------------------------
 * POST /api/votes
 * ลงคะแนน (รองรับงดออกเสียง)
 * --------------------------------------------------------------- */
exports.castVote = async (req, res) => {
    try {
        const { election_id, candidate_id, abstain } = req.body;
        const voter_id = req.user.user_id;

        if (!election_id) {
            return res.status(400).json({ success: false, message: 'missing election_id' });
        }
        // ป้องกันโหวตซ้ำ
        const dup = await db.query(
            `SELECT 1 FROM votes WHERE voter_id = ? AND election_id = ?`,
            [voter_id, election_id]
        );
        if (dup.length) {
            return res.status(400).json({ success: false, message: 'คุณได้ลงคะแนนแล้ว' });
        }

        // ถ้าไม่งดออกเสียง ให้ตรวจว่าผู้สมัครอยู่ในการเลือกตั้งนี้จริง
        if (!abstain) {
            const rows = await db.query(
                `
        SELECT 1
        FROM candidates c
        JOIN applications a ON a.application_id = c.application_id
        WHERE c.candidate_id = ? AND a.election_id = ?
        `,
                [candidate_id, election_id]
            );
            if (!rows.length) {
                return res.status(400).json({ success: false, message: 'ผู้สมัครไม่อยู่ในการเลือกตั้งนี้' });
            }
        }

        // บันทึกคะแนน
        await db.query(
            `
            INSERT INTO votes (election_id, voter_id, candidate_id, abstain, voted_at)
            VALUES (?, ?, ?, ?, NOW())
            `,
            [election_id, voter_id, abstain ? null : candidate_id, abstain ? 1 : 0]
        );
        // log history (โครงคอลัมน์พื้นฐาน: user_id, election_id, participated)
        // ถ้าตารางคุณมีคอลัมน์อื่น ให้เพิ่มชื่อคอลัมน์ให้ตรงก่อนเสมอ
        try {
            await db.query(
            `
                INSERT INTO vote_history (user_id, election_id, participated, created_at)
                VALUES (?, ?, 1, NOW())
            `,
                [voter_id, election_id]
            );
        } catch (_) {
            // ไม่ให้ล้มกระบวนการโหวต หากตาราง history ไม่มี/ล้มเหลว
        }

        return res.json({
            success: true,
            message: abstain ? 'งดออกเสียงเรียบร้อย' : 'ลงคะแนนเรียบร้อยแล้ว',
        });
    } catch (err) {
        console.error('castVote error:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
    }
};

/** ---------------------------------------------------------------
 * GET /api/votes/history
 * ประวัติการโหวตของฉัน (รายการโหวตจริงเท่านั้น)
 * --------------------------------------------------------------- */
exports.getVoteHistory = async (req, res) => {
    try {
        const voter_id = req.user.user_id;
        const rows = await db.query(
            `
      SELECT 
        v.vote_id,
        v.election_id,
        v.candidate_id,
        v.abstain,
        v.voted_at AS voted_at,
        e.election_name AS election_title,
        a.application_number AS candidate_number,
        a.campaign_slogan,
        a.photo,
        CONCAT(u.first_name, ' ', u.last_name) AS candidate_name
      FROM votes v
      JOIN elections e ON v.election_id = e.election_id
      LEFT JOIN candidates   c ON v.candidate_id = c.candidate_id
      LEFT JOIN applications a ON c.application_id = a.application_id
      LEFT JOIN users        u ON a.user_id = u.user_id
      WHERE v.voter_id = ?
      ORDER BY v.voted_at DESC
      `,
            [voter_id]
        );
        return res.json({ success: true, history: rows });
    } catch (err) {
        console.error('getVoteHistory error:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
    }
};

/** ---------------------------------------------------------------
 * GET /api/votes/status
 * ได้โหวตในแต่ละการเลือกตั้งแล้วหรือยัง
 * --------------------------------------------------------------- */
exports.getVoteStatus = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const rows = await db.query(
            `SELECT election_id FROM votes WHERE voter_id = ?`,
            [user_id]
        );
        const voted_elections = rows.map((r) => r.election_id);
        return res.json({ success: true, voted_elections });
    } catch (err) {
        console.error('getVoteStatus error:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
    }
};

/** ---------------------------------------------------------------
 * GET /api/votes/my
 * ทุกการเลือกตั้งที่เรามีสิทธิ์ + สถานะของฉัน (VOTED/ABSTAIN/MISSED/PENDING)
 * --------------------------------------------------------------- */
exports.getMyVoteHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const rows = await db.query(
            `
      SELECT
        e.election_id,
        e.election_name,
        e.start_date,
        e.end_date,
        v.vote_id,
        v.candidate_id,
        v.abstain,
        v.voted_at AS voted_at,
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
        ON v.election_id = e.election_id AND v.voter_id = ee.user_id
      ORDER BY e.start_date DESC
      `,
            [userId]
        );

        const history = rows.map((r) => {
            const start = r.start_date ? new Date(r.start_date) : null;
            return {
                election_id: r.election_id,
                election_name: r.election_name,
                start_date: r.start_date,
                end_date: r.end_date,
                year_be: start ? start.getFullYear() + 543 : null, // ปี พ.ศ.
                voted_at: r.voted_at,
                status: r.my_status, // VOTED / ABSTAIN / MISSED / PENDING
                candidate_id: r.candidate_id,
                abstain: r.abstain === 1,
            };
        });

        return res.json({ success: true, history });
    } catch (err) {
        console.error('getMyVoteHistory error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
