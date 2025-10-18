const db = require('../models/db');
const { computeEffectiveStatus } = require('../utils/electionStatus');

// 1) KPI รวม
exports.getKpis = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM election_eligibility) AS eligible,
        (SELECT COUNT(DISTINCT user_id) FROM election_eligibility) AS eligible_unique,
        (SELECT COUNT(*) FROM candidates WHERE status = 'approved') AS candidates,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role_id = 3) AS committee,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role_id = 4) AS admin
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 2) Turnout ย้อนหลัง
exports.getTurnoutHistory = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        DATE_FORMAT(e.start_date, '%b %y') AS label,
        ROUND(
          (
            SELECT COUNT(DISTINCT v.user_id) 
            FROM votes v 
            WHERE v.election_id = e.election_id
          ) / NULLIF((
            SELECT COUNT(*) 
            FROM election_eligibility ee 
            WHERE ee.election_id = e.election_id
          ),0) * 100, 0
        ) AS turnout
      FROM elections e
      ORDER BY e.start_date ASC
      LIMIT 12
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 3) สัดส่วนบัตรโหวต
exports.getBallotSplit = async (req, res) => {
  try {
    const { electionId } = req.params;
    const rows = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 0) AS voted,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstained,
        (SELECT COUNT(DISTINCT ee.user_id) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible
    `, [electionId, electionId, electionId]);

    const r = rows[0] || {};
    const voted = Number(r.voted || 0);
    const abstained = Number(r.abstained || 0);
    const eligible = Number(r.eligible || 0);
    const notVoted = Math.max(eligible - (voted + abstained), 0);
    const pct = (n) => eligible ? +((n / eligible) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      meta: { eligible, total_count: voted + abstained + notVoted },
      data: [
        { name: 'โหวต', value: voted, percent: pct(voted) },
        { name: 'งดออกเสียง', value: abstained, percent: pct(abstained) },
        { name: 'ไม่มาโหวต', value: notVoted, percent: pct(notVoted) },
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 4) แจกแจงตามแผนก
exports.getDepartmentDistribution = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT d.department_name AS name, COUNT(*) AS total
      FROM users u
      LEFT JOIN department d ON u.department_id = d.department_id
      GROUP BY d.department_id, d.department_name
      ORDER BY total DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 5) แจกแจงตามชั้นปี
exports.getYearDistribution = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT y.year_name AS name, COUNT(*) AS total
      FROM users u
      LEFT JOIN year_levels y ON u.year_id = y.year_id
      GROUP BY y.year_id, y.year_name
      ORDER BY y.year_id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 6) เลือกตั้งที่ยังไม่หมดช่วง
// exports.getActiveElections = async (req, res) => {
//   try {
//     const rows = await db.query(`
//       SELECT 
//         e.election_id AS id,
//         e.election_name AS name,
//         e.registration_start, e.registration_end,
//         e.start_date, e.end_date
//       FROM elections e
//       WHERE NOW() <= e.end_date
//       ORDER BY e.start_date DESC
//       LIMIT 8
//     `);
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'SQL Error', error: err });
//   }
// };
exports.getActiveElections = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        e.election_id           AS id,
        e.election_name         AS name,
        e.description,
        e.registration_start, 
        e.registration_end,
        e.start_date, 
        e.end_date,
        e.image_path            AS image_url,
        e.is_hidden,
        e.manual_override,
        e.status_note
      FROM elections e
      WHERE NOW() <= e.end_date           -- ยังไม่จบ
      -- AND e.is_hidden = 0              -- (ออปชัน) ซ่อนจากแดชบอร์ด
      ORDER BY e.start_date DESC
      LIMIT 8
    `);

    const result = rows.map(r => ({
      ...r,
      ...computeEffectiveStatus(r),  // ✅ เติม { auto_status, effective_status }
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getActiveElections error:', err);
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};


// 7) สรุปจำนวนการเลือกตั้ง
exports.getElectionSummary = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE 
              WHEN registration_start IS NOT NULL AND registration_end IS NOT NULL 
                   AND NOW() BETWEEN registration_start AND registration_end 
              THEN 1 ELSE 0 END) AS registering,
        SUM(CASE 
              WHEN start_date IS NOT NULL AND end_date IS NOT NULL 
                   AND NOW() BETWEEN start_date AND end_date 
              THEN 1 ELSE 0 END) AS voting,
        SUM(CASE 
              WHEN end_date IS NOT NULL AND NOW() > end_date 
              THEN 1 ELSE 0 END) AS finished
      FROM elections
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 8) ทุกรายการเลือกตั้ง + สถานะคำนวณ
exports.getAllElections = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT
        e.election_id AS id,
        e.election_name AS name,
        e.registration_start, e.registration_end,
        e.start_date, e.end_date,
        CASE 
          WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL 
               AND NOW() BETWEEN e.start_date AND e.end_date
            THEN 'VOTING'
          WHEN e.registration_start IS NOT NULL AND e.registration_end IS NOT NULL
               AND NOW() BETWEEN e.registration_start AND e.registration_end
            THEN 'REGISTERING'
          WHEN e.end_date IS NOT NULL AND NOW() > e.end_date
            THEN 'FINISHED'
          WHEN e.registration_start IS NOT NULL AND NOW() < e.registration_start
            THEN 'UPCOMING'
          ELSE 'DRAFT'
        END AS status
      FROM elections e
      ORDER BY COALESCE(e.start_date, e.registration_start, e.created_at) DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};

// 2.1) Turnout ต่อรายการ
// 2.1) Turnout ต่อรายการ (เวอร์ชัน safe: no JOIN, no GROUP BY)
exports.getTurnoutByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const rows = await db.query(
      `
      SELECT 
        e.election_name AS name,
        e.start_date,
        -- นับคนมาโหวต (ไม่ซ้ำ)
        (
          SELECT COUNT(DISTINCT v.voter_id)
          FROM votes v
          WHERE v.election_id = e.election_id
        ) AS voters,
        -- นับผู้มีสิทธิ์ (ไม่ซ้ำ)
        (
          SELECT COUNT(DISTINCT ee.user_id)
          FROM election_eligibility ee
          WHERE ee.election_id = e.election_id
        ) AS eligible,
        -- เปอร์เซ็นต์ turnout
        ROUND(
          (
            (SELECT COUNT(DISTINCT v2.voter_id) FROM votes v2 WHERE v2.election_id = e.election_id)
            /
            NULLIF((SELECT COUNT(DISTINCT ee2.user_id) FROM election_eligibility ee2 WHERE ee2.election_id = e.election_id), 0)
          ) * 100
        , 2) AS turnout_percent
      FROM elections e
      WHERE e.election_id = ?
      `,
      [electionId]
    );

    if (!rows.length) {
      return res.json({ success: false, message: "ไม่พบรายการเลือกตั้งนี้" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[getTurnoutByElection] SQL Error:", err?.sqlMessage || err?.message);
    res.status(500).json({ success: false, message: "SQL Error", error: err });
  }
};



// 2.2) Turnout Leaderboard (ข้ามรายการ)
exports.getTurnoutLeaderboard = async (req, res) => {
  try {
    const { status, from, to, limit = 10 } = req.query;

    // เงื่อนไขช่วงเวลาใช้ start_date เป็นหลัก (ปรับได้ตามจริง)
    const conds = [];
    const params = [];

    if (status === 'REGISTERING') {
      conds.push(`e.registration_start IS NOT NULL AND e.registration_end IS NOT NULL AND NOW() BETWEEN e.registration_start AND e.registration_end`);
    } else if (status === 'VOTING') {
      conds.push(`e.start_date IS NOT NULL AND e.end_date IS NOT NULL AND NOW() BETWEEN e.start_date AND e.end_date`);
    } else if (status === 'FINISHED') {
      conds.push(`e.end_date IS NOT NULL AND NOW() > e.end_date`);
    }
    if (from) { conds.push(`e.start_date >= ?`); params.push(from); }
    if (to) { conds.push(`e.start_date <= ?`); params.push(to); }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await db.query(`
      SELECT
        e.election_id AS id,
        e.election_name AS name,
        e.start_date,
        e.end_date,
        COUNT(DISTINCT ee.user_id) AS eligible,
        COUNT(DISTINCT v.voter_id)  AS voters,
        ROUND(COUNT(DISTINCT v.voter_id) / NULLIF(COUNT(DISTINCT ee.user_id),0) * 100, 2) AS turnout_percent
      FROM elections e
      LEFT JOIN election_eligibility ee ON ee.election_id = e.election_id
      LEFT JOIN votes v               ON v.election_id  = e.election_id
      ${whereSql}
      GROUP BY e.election_id, e.election_name, e.start_date, e.end_date
      HAVING eligible > 0
      ORDER BY turnout_percent DESC, voters DESC
      LIMIT ?
    `, [...params, Number(limit)]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL Error', error: err });
  }
};
