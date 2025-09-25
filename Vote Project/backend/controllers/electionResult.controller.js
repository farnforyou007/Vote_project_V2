const { getConnection } = require('../models/db');
const db = require('../models/db');
exports.finalizeElection = async (req, res) => {
  const electionId = Number(req.params.id);
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // (ทางเลือก) ตรวจว่าปิดโหวตจริงหรือยัง
    const [[e]] = await conn.query(
      `SELECT end_date FROM elections WHERE election_id=?`, [electionId]
    );
    if (!e) throw new Error('Election not found');
    if (new Date(e.end_date) > new Date()) throw new Error('Election not ended yet');

    // ลบผลเก่า
    await conn.query(`DELETE FROM election_result WHERE election_id=?`, [electionId]);

    // เติมคะแนนใหม่
    await conn.query(`
      INSERT INTO election_result (election_id, candidate_id, vote_count, is_winner, ranking)
      SELECT 
        a.election_id,
        c.candidate_id,
        COALESCE(SUM(CASE WHEN v.abstain=0 THEN 1 ELSE 0 END),0) AS vote_count,
        0, NULL
      FROM candidates c
      JOIN applications a ON a.application_id = c.application_id
      LEFT JOIN votes v 
        ON v.election_id = a.election_id 
       AND v.candidate_id = c.candidate_id
      WHERE a.election_id = ?
      GROUP BY a.election_id, c.candidate_id
    `, [electionId]);

    // 3) จัดอันดับ & ผู้ชนะ (ตามคะแนนมาก→น้อย)
    await conn.query(`SET @r := 0`);
    await conn.query(`
      UPDATE election_result er
      JOIN (
        SELECT election_id, candidate_id, vote_count,
               (@r := @r + 1) AS rn
        FROM election_result
        WHERE election_id = ?
        ORDER BY vote_count DESC, candidate_id ASC
      ) x
      ON x.election_id = er.election_id AND x.candidate_id = er.candidate_id
      SET er.ranking = x.rn,
          er.is_winner = (x.rn = 1)
    `, [electionId]);

    // 4) คำนวณสรุป
    const [[sum]] = await conn.query(`
      SELECT
        (SELECT COUNT(DISTINCT ee.user_id)
           FROM election_eligibility ee
          WHERE ee.election_id = ?) AS eligible_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS voted_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstain_count
    `, [electionId, electionId, electionId]);

    const eligible = Number(sum?.eligible_count || 0);
    const voted = Number(sum?.voted_count || 0);
    const abstain = Number(sum?.abstain_count || 0);
    const notVote = Math.max(eligible - voted, 0);

    // 5) เติมคนไม่มาใช้สิทธิ์ลง absentee_records (กันซ้ำด้วย UNIQUE)
    await conn.query(`
      INSERT IGNORE INTO absentee_records (election_id, user_id, created_at)
      SELECT ee.election_id, ee.user_id, NOW()
      FROM election_eligibility ee
      LEFT JOIN votes v
        ON v.election_id = ee.election_id AND v.voter_id = ee.user_id
      WHERE ee.election_id = ? AND v.vote_id IS NULL
    `, [electionId]);

    await conn.commit();

    res.json({
      success: true,
      message: 'Finalized',
      election_id: electionId,
      summary: {
        eligible_count: eligible,
        voted_count: voted,
        abstain_count: abstain,
        not_vote_count: notVote,
        turnout_percent: eligible ? +(voted / eligible * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('[finalizeElection]', err);
    res.status(500).json({ success: false, message: err.message || 'Finalize failed' });
  } finally {
    conn.release();
  }
};

exports.getElectionResults = async (req, res) => {
  const electionId = Number(req.params.id);
  try {
    const candidates = await db.query(`
      SELECT 
        er.candidate_id,
        u.first_name,
        u.last_name,
        er.vote_count,
        er.ranking,
        er.is_winner
      FROM election_result er
      JOIN candidates c ON c.candidate_id = er.candidate_id
      JOIN applications a ON a.application_id = c.application_id
      JOIN users u ON u.user_id = a.user_id   -- ✅ ดึงชื่อจาก applications → users
      WHERE a.election_id = ?
      ORDER BY er.ranking ASC, er.vote_count DESC
    `, [electionId]);

    const summary = await db.query(`
      SELECT
        (SELECT COUNT(DISTINCT ee.user_id) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS voted_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstain_count
    `, [electionId, electionId, electionId]);

    const eligible = Number(summary[0]?.eligible_count || 0);
    const voted    = Number(summary[0]?.voted_count || 0);
    const abstain  = Number(summary[0]?.abstain_count || 0);
    const notVote  = Math.max(eligible - voted, 0);

    res.json({
      success: true,
      data: {
        results: candidates.map(c => ({
          candidate_id: c.candidate_id,
          name: `${c.first_name} ${c.last_name}`,
          vote_count: c.vote_count,
          ranking: c.ranking,
          is_winner: c.is_winner
        })),
        summary: {
          eligible_count: eligible,
          voted_count: voted,
          abstain_count: abstain,
          not_vote_count: notVote,
          turnout_percent: eligible ? +(voted / eligible * 100).toFixed(1) : 0
        }
      }
    });
  } catch (err) {
    console.error('[getElectionResults]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
