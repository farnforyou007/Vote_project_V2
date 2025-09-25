// 📁 controllers/dashboard.controller.js
const db = require('../models/db');

// 1) KPI รวมด้วย “ซับคิวรีเดียว” (ไม่ต้องเปิด multipleStatements)
exports.getKpis = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM election_eligibility) AS eligible,
      (SELECT COUNT(DISTINCT user_id) FROM election_eligibility) AS eligible_unique,
      (SELECT COUNT(*) FROM candidates WHERE status = 'approved') AS candidates,
      (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role_id = 3) AS committee  ,
      (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role_id = 4)  AS admin
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows[0] });
  });
};

// 2) Turnout ย้อนหลัง (ต่อ 1 แถว/การเลือกตั้ง)
exports.getTurnoutHistory = (req, res) => {
  const sql = `
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
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows });
  });
};

// 3) แยกสัดส่วนบัตรของเลือกตั้งหนึ่งรายการ
// exports.getBallotSplit = (req, res) => {
//   const { electionId } = req.params;
//   const sql = `
//     SELECT
//       (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 0) AS voted,
//       (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstained
//   `;
//   db.query(sql, [electionId, electionId, electionId, electionId], (err, rows) => {
//     if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     const r = rows[0] || {};
//     res.json({
//       success: true,
//       data: [
//         { name: 'โหวต', value: Number(r.voted || 0) },
//         { name: 'งดออกเสียง', value: Number(r.abstained || 0) },
//         // { name: 'ไม่มาโหวต', value: Number(r.not_voted || 0) },
//       ]
//     });
//   });
// };

// GET /api/dashboard/ballot-split/:electionId
exports.getBallotSplit = (req, res) => {
  const { electionId } = req.params;

  const sql = `
    SELECT
      /* โหวตจริง */
      (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 0) AS voted,
      /* งดออกเสียง */
      (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstained,
      /* ผู้มีสิทธิ์ทั้งหมดของรายการนี้ (ไม่ซ้ำ user) */
      (SELECT COUNT(DISTINCT ee.user_id) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible
  `;

  // ⬅️ มี ? ทั้งหมด 3 ตัว ก็ส่งพารามิเตอร์ 3 ค่าเท่านั้น
  db.query(sql, [electionId, electionId, electionId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
    const r = rows[0] || {};
    const voted = Number(r.voted || 0);
    const abstained = Number(r.abstained || 0);
    const eligible = Number(r.eligible || 0);

    // ไม่มาโหวต = ผู้มีสิทธิ์ - (โหวต + งดออกเสียง) (กันติดลบด้วย)
    const notVoted = Math.max(eligible - (voted + abstained), 0);

    // คิดเปอร์เซ็นต์ (กันหาร 0)
    const pct = (n) => eligible ? +((n / eligible) * 100).toFixed(2) : 0;

    return res.json({
      success: true,
      meta: { eligible, total_count: voted + abstained + notVoted },
      data: [
        { name: 'โหวต', value: voted, percent: pct(voted) },
        { name: 'งดออกเสียง', value: abstained, percent: pct(abstained) },
        { name: 'ไม่มาโหวต', value: notVoted, percent: pct(notVoted) },
      ]
    });
  });
};


// 4) จำนวนนักศึกษาตามแผนก
exports.getDepartmentDistribution = (req, res) => {
  const sql = `
    SELECT d.department_name AS name, COUNT(*) AS total
    FROM users u
    LEFT JOIN department d ON u.department_id = d.department_id
    GROUP BY d.department_id, d.department_name
    ORDER BY total DESC
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows });
  });
};

// 5) จำนวนนักศึกษาตามชั้นปี
exports.getYearDistribution = (req, res) => {
  const sql = `
    SELECT y.year_name AS name, COUNT(*) AS total
    FROM users u
    LEFT JOIN year_levels y ON u.year_id = y.year_id
    GROUP BY y.year_id, y.year_name
    ORDER BY y.year_id ASC
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows });
  });
};

// 6) ลิสต์เลือกตั้งที่ยังไม่หมดช่วง (ใช้สถานะคำนวณของคุณใน FE ได้)
exports.getActiveElections = (req, res) => {
  const sql = `
    SELECT 
      e.election_id AS id,
      e.election_name AS name,
      e.registration_start, e.registration_end,
      e.start_date, e.end_date
    FROM elections e
    WHERE NOW() <= e.end_date
    ORDER BY e.start_date DESC
    LIMIT 8
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows });
  });
};


// สรุปจำนวนการเลือกตั้ง: ทั้งหมด/เปิดรับสมัคร/เปิดลงคะแนน/เสร็จสิ้น
exports.getElectionSummary = (req, res) => {
  const sql = `
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
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    return res.json({ success: true, data: rows[0] });
  });
};


// ทุกรายการเลือกตั้ง + สถานะคำนวณ
exports.getAllElections = (req, res) => {
  const sql = `
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
  `;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    res.json({ success: true, data: rows });
  });
};
// หมายเหตุ: อาจเพิ่มจำนวนนักศึกษาที่มีสิทธิ์ลงคะแนนในแต่ละรายการได้ (JOIN กับ election_eligibility + COUNT DISTINCT)