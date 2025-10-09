const db = require('../models/db');

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
exports.getActiveElections = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        e.election_id AS id,
        e.election_name AS name,
        e.registration_start, e.registration_end,
        e.start_date, e.end_date
      FROM elections e
      WHERE NOW() <= e.end_date
      ORDER BY e.start_date DESC
      LIMIT 8
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
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
