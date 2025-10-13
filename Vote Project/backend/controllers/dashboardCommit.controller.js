// const db = require('../models/db');


// // 1. ดึงปีทั้งหมดจาก elections
// exports.getElectionYears = async (req, res) => {
//     try {
//         const [rows] = await db.query(`
//       SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
//       FROM elections
//       ORDER BY year_th DESC
//     `);
//         res.json(rows);
//     } catch (err) {
//         console.error("Error getElectionYears:", err);
//         res.status(500).json({ error: err.message });
//     }
// };

// // 2. ดึงรายการเลือกตั้งตามปี
// exports.getElectionsByYear = async (req, res) => {
//     try {
//         const { year } = req.query;

//         let query = `
//       SELECT 
//         election_id,
//         election_name,
//         YEAR(registration_start) + 543 AS year_th
//       FROM elections
//       WHERE 1=1
//     `;
//         const params = [];

//         if (year) {
//             query += " AND YEAR(registration_start) + 543 = ? ";
//             params.push(year);
//         }

//         query += " ORDER BY registration_start DESC";

//         const [rows] = await db.query(query, params);
//         res.json(rows);
//     } catch (err) {
//         console.error("Error getElectionsByYear:", err);
//         res.status(500).json({ error: err.message });
//     }
// };

// // 3. ดึงสถิติจำนวนผู้สมัคร (ตามปีและการเลือกตั้ง)
// exports.getStatsByElection = async (req, res) => {
//     try {
//         const { electionId, year } = req.query;

//         let query = `
//       SELECT 
//         COUNT(*) AS total,
//         SUM(CASE WHEN a.application_status = 'approved' THEN 1 ELSE 0 END) AS approved,
//         SUM(CASE WHEN a.application_status = 'pending' THEN 1 ELSE 0 END) AS pending,
//         SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
//       FROM applications a
//       LEFT JOIN elections e ON a.election_id = e.election_id
//       WHERE 1=1
//     `;
//         const params = [];

//         if (electionId) {
//             query += " AND a.election_id = ? ";
//             params.push(electionId);
//         }

//         if (year) {
//             query += " AND YEAR(e.registration_start) + 543 = ? ";
//             params.push(year);
//         }

//         const [rows] = await db.query(query, params);
//         const result = rows[0] || { total: 0, approved: 0, pending: 0, rejected: 0 };

//         res.json({
//             total: Number(result.total) || 0,
//             approved: Number(result.approved) || 0,
//             pending: Number(result.pending) || 0,
//             rejected: Number(result.rejected) || 0,
//         });
//     } catch (err) {
//         console.error("Error getStatsByElection:", err);
//         res.status(500).json({ error: err.message });
//     }
// };

// // 4. กราฟแสดงจำนวนผู้สมัครและจำนวนเลือกตั้ง แยกตามปี
// exports.getStatsByYear = async (req, res) => {
//     try {
//         const { year } = req.query;

//         let query = `
//       SELECT 
//         y.year_th,
//         COUNT(DISTINCT e.election_id) AS election_count,
//         COUNT(a.application_id) AS applicant_count
//       FROM (
//         SELECT YEAR(registration_start) + 543 AS year_th, election_id, registration_start
//         FROM elections
//       ) AS e
//       LEFT JOIN applications a ON e.election_id = a.election_id
//       JOIN (
//         SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
//         FROM elections
//       ) AS y ON y.year_th = e.year_th
//       WHERE 1=1
//     `;

//         const params = [];

//         if (year) {
//             query += " AND y.year_th = ? ";
//             params.push(year);
//         }

//         query += `
//       GROUP BY y.year_th
//       ORDER BY y.year_th
//     `;

//         const [rows] = await db.query(query, params);

//         const result = rows.map((r) => ({
//             year: r.year_th,
//             election_count: Number(r.election_count) || 0,
//             applicant_count: Number(r.applicant_count) || 0,
//         }));

//         res.json(result);
//     } catch (err) {
//         console.error("Error getStatsByYear:", err);
//         res.status(500).json({ error: err.message });
//     }
// };


// const db = require('../models/db');

// /**
//  * DashboardCommit Controller (refactor)
//  * \- ให้โครงสร้าง response และแนว error-handling เหมือน dashboard.controller.js
//  * \- ส่ง { success: true, data: ... } เสมอ (และ message เมื่อ error)
//  * \- ชื่อพารามิเตอร์ยึดเดิม: year (พ.ศ.), electionId
//  * \- ปรับเส้นทางแนะนำ (ตัวอย่าง):
//  *   GET /api/dashboard/commit/years
//  *   GET /api/dashboard/commit/elections?year=2568
//  *   GET /api/dashboard/commit/stats-by-election?electionId=1&year=2568
//  *   GET /api/dashboard/commit/stats-by-year?year=2568
//  */

// // 1) ปีทั้งหมดของการสมัคร (พ.ศ.)
// exports.getElectionYears = async (req, res) => {
//     try {
//         const [rows] = await db.query(`
//       SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
//       FROM elections
//       ORDER BY year_th DESC
//     `);
//         return res.json({ success: true, data: rows });
//     } catch (err) {
//         console.error('[getElectionYears] SQL Error:', err?.sqlMessage || err?.message);
//         return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     }
// };

// // 2) รายการเลือกตั้งตามปี (ถ้าไม่ส่ง year = ทั้งหมด)
// exports.getElectionsByYear = async (req, res) => {
//     try {
//         const { year } = req.query; // พ.ศ.

//         let sql = `
//       SELECT 
//         election_id,
//         election_name,
//         YEAR(registration_start) + 543 AS year_th
//       FROM elections
//       WHERE 1=1
//     `;
//         const params = [];

//         if (year) {
//             sql += ' AND YEAR(registration_start) + 543 = ? ';
//             params.push(Number(year));
//         }

//         sql += ' ORDER BY registration_start DESC';

//         const [rows] = await db.query(sql, params);
//         return res.json({ success: true, data: rows });
//     } catch (err) {
//         console.error('[getElectionsByYear] SQL Error:', err?.sqlMessage || err?.message);
//         return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     }
// };

// // 3) สถิติผู้สมัคร (รวม/อนุมัติ/รอ/ไม่อนุมัติ) กรองตามปี/การเลือกตั้ง
// exports.getStatsByElection = async (req, res) => {
//     try {
//         const { electionId, year } = req.query; // พ.ศ.

//         let sql = `
//       SELECT 
//         COUNT(*) AS total,
//         SUM(CASE WHEN a.application_status = 'approved' THEN 1 ELSE 0 END) AS approved,
//         SUM(CASE WHEN a.application_status = 'pending'  THEN 1 ELSE 0 END) AS pending,
//         SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
//       FROM applications a
//       LEFT JOIN elections e ON a.election_id = e.election_id
//       WHERE 1=1
//     `;
//         const params = [];

//         if (electionId) {
//             sql += ' AND a.election_id = ? ';
//             params.push(Number(electionId));
//         }
//         if (year) {
//             sql += ' AND YEAR(e.registration_start) + 543 = ? ';
//             params.push(Number(year));
//         }

//         const [rows] = await db.query(sql, params);
//         const r = rows?.[0] || {};

//         return res.json({
//             success: true,
//             data: {
//                 total: Number(r.total || 0),
//                 approved: Number(r.approved || 0),
//                 pending: Number(r.pending || 0),
//                 rejected: Number(r.rejected || 0),
//             },
//         });
//     } catch (err) {
//         console.error('[getStatsByElection] SQL Error:', err?.sqlMessage || err?.message);
//         return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     }
// };

// // 4) กราฟสรุปตามปี: จำนวนผู้สมัคร & จำนวนการเลือกตั้ง (option: กรองปีเดียว)
// exports.getStatsByYear = async (req, res) => {
//     try {
//         const { year } = req.query; // พ.ศ.

//         let sql = `
//       SELECT 
//         y.year_th,
//         COUNT(DISTINCT e.election_id) AS election_count,
//         COUNT(a.application_id)       AS applicant_count
//       FROM (
//         SELECT YEAR(registration_start) + 543 AS year_th, election_id, registration_start
//         FROM elections
//       ) AS e
//       LEFT JOIN applications a ON e.election_id = a.election_id
//       JOIN (
//         SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
//         FROM elections
//       ) AS y ON y.year_th = e.year_th
//       WHERE 1=1
//     `;
//         const params = [];

//         if (year) {
//             sql += ' AND y.year_th = ? ';
//             params.push(Number(year));
//         }

//         sql += ' GROUP BY y.year_th ORDER BY y.year_th';

//         const [rows] = await db.query(sql, params);
//         const result = rows.map((r) => ({
//             year: Number(r.year_th),
//             election_count: Number(r.election_count || 0),
//             applicant_count: Number(r.applicant_count || 0),
//         }));

//         return res.json({ success: true, data: result });
//     } catch (err) {
//         console.error('[getStatsByYear] SQL Error:', err?.sqlMessage || err?.message);
//         return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     }
// };

// // (ตัวเลือก) helper route: จำนวนรายการเลือกตั้งของปีที่เลือก (นับจาก getStatsByYear)
// exports.getElectionCountThisYear = async (req, res) => {
//     try {
//         const { year } = req.query; // พ.ศ. (optional)

//         let sql = `
//       SELECT 
//         y.year_th,
//         COUNT(DISTINCT e.election_id) AS election_count
//       FROM (
//         SELECT YEAR(registration_start) + 543 AS year_th, election_id
//         FROM elections
//       ) AS e
//       JOIN (
//         SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
//         FROM elections
//       ) AS y ON y.year_th = e.year_th
//       WHERE 1=1
//     `;
//         const params = [];

//         if (year) {
//             sql += ' AND y.year_th = ? ';
//             params.push(Number(year));
//         }

//         sql += ' GROUP BY y.year_th ORDER BY y.year_th DESC';

//         const [rows] = await db.query(sql, params);

//         if (year) {
//             const found = rows.find((r) => Number(r.year_th) === Number(year));
//             return res.json({ success: true, data: { year: Number(year), election_count: Number(found?.election_count || 0) } });
//         }

//         const total = rows.reduce((sum, x) => sum + Number(x.election_count || 0), 0);
//         return res.json({ success: true, data: { total } });
//     } catch (err) {
//         console.error('[getElectionCountThisYear] SQL Error:', err?.sqlMessage || err?.message);
//         return res.status(500).json({ success: false, message: 'SQL Error', error: err });
//     }
// };


// ver2

'use strict';

const db = require('../models/db');

// Helper: normalize the return from db.query to a plain array of rows
function rowsArray(qres) {
    // mysql2/promise -> [rows, fields]
    if (Array.isArray(qres) && Array.isArray(qres[0])) return qres[0];
    // some wrappers return only rows
    if (Array.isArray(qres)) return qres;
    // knex/mysql wrappers may return { rows: [...] } or { data: [...] }
    if (qres && Array.isArray(qres.rows)) return qres.rows;
    if (qres && Array.isArray(qres.data)) return qres.data;
    return [];
}

/**
 * DashboardCommit Controller (refactor)
 * \- ให้โครงสร้าง response และแนว error-handling เหมือน dashboard.controller.js
 * \- ส่ง { success: true, data: ... } เสมอ (และ message เมื่อ error)
 * \- ชื่อพารามิเตอร์ยึดเดิม: year (พ.ศ.), electionId
 * \- เส้นทางแนะนำ (ตัวอย่าง):
 *   GET /api/dashboard/commit/years
 *   GET /api/dashboard/commit/elections?year=2568
 *   GET /api/dashboard/commit/stats-by-election?electionId=1&year=2568
 *   GET /api/dashboard/commit/stats-by-year?year=2568
 */

// 1) ปีทั้งหมดของการสมัคร (พ.ศ.)
exports.getElectionYears = async (req, res) => {
    try {
        const q = await db.query(`
      SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
      FROM elections
      ORDER BY year_th DESC
    `);
        const rows = rowsArray(q);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[getElectionYears] SQL Error:', err?.sqlMessage || err?.message);
        return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
};

// 2) รายการเลือกตั้งตามปี (ถ้าไม่ส่ง year = ทั้งหมด)
exports.getElectionsByYear = async (req, res) => {
    try {
        const { year } = req.query; // พ.ศ.

        let sql = `
      SELECT 
        election_id,
        election_name,
        YEAR(registration_start) + 543 AS year_th
      FROM elections
      WHERE 1=1
    `;
        const params = [];

        if (year) {
            sql += ' AND YEAR(registration_start) + 543 = ? ';
            params.push(Number(year));
        }

        sql += ' ORDER BY registration_start DESC';

        const q = await db.query(sql, params);
        const rows = rowsArray(q);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[getElectionsByYear] SQL Error:', err?.sqlMessage || err?.message);
        return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
};

// 3) สถิติผู้สมัคร (รวม/อนุมัติ/รอ/ไม่อนุมัติ) กรองตามปี/การเลือกตั้ง
exports.getStatsByElection = async (req, res) => {
    try {
        const { electionId, year } = req.query; // พ.ศ.

        let sql = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN a.application_status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN a.application_status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN a.application_status = 'revision_requested' THEN 1 ELSE 0 END) AS revision_requested
      FROM applications a
      LEFT JOIN elections e ON a.election_id = e.election_id
      WHERE 1=1
    `;
        const params = [];

        if (electionId) {
            sql += ' AND a.election_id = ? ';
            params.push(Number(electionId));
        }
        if (year) {
            sql += ' AND YEAR(e.registration_start) + 543 = ? ';
            params.push(Number(year));
        }

        const q = await db.query(sql, params);
        const rows = rowsArray(q);
        const r = rows?.[0] || {};

        return res.json({
            success: true,
            data: {
                total: Number(r.total || 0),
                approved: Number(r.approved || 0),
                pending: Number(r.pending || 0),
                rejected: Number(r.rejected || 0),
                revision_requested : Number(r.revision_requested || 0), 
            },
        });
    } catch (err) {
        console.error('[getStatsByElection] SQL Error:', err?.sqlMessage || err?.message);
        return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
};

// 4) กราฟสรุปตามปี: จำนวนผู้สมัคร & จำนวนการเลือกตั้ง (option: กรองปีเดียว)
exports.getStatsByYear = async (req, res) => {
    try {
        const { year } = req.query; // พ.ศ.

        let sql = `
      SELECT 
        y.year_th,
        COUNT(DISTINCT e.election_id) AS election_count,
        COUNT(a.application_id)       AS applicant_count
      FROM (
        SELECT YEAR(registration_start) + 543 AS year_th, election_id, registration_start
        FROM elections
      ) AS e
      LEFT JOIN applications a ON e.election_id = a.election_id
      JOIN (
        SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
        FROM elections
      ) AS y ON y.year_th = e.year_th
      WHERE 1=1
    `;
        const params = [];

        if (year) {
            sql += ' AND y.year_th = ? ';
            params.push(Number(year));
        }

        sql += ' GROUP BY y.year_th ORDER BY y.year_th';

        const q = await db.query(sql, params);
        const rows = rowsArray(q);

        const result = Array.isArray(rows)
            ? rows.map((r) => ({
                year: Number(r.year_th),
                election_count: Number(r.election_count || 0),
                applicant_count: Number(r.applicant_count || 0),
            }))
            : [];

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('[getStatsByYear] SQL Error:', err?.sqlMessage || err?.message);
        return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
};

// (ตัวเลือก) helper route: จำนวนรายการเลือกตั้งของปีที่เลือก (นับจาก getStatsByYear)
exports.getElectionCountThisYear = async (req, res) => {
    try {
        const { year } = req.query; // พ.ศ. (optional)

        let sql = `
      SELECT 
        y.year_th,
        COUNT(DISTINCT e.election_id) AS election_count
      FROM (
        SELECT YEAR(registration_start) + 543 AS year_th, election_id
        FROM elections
      ) AS e
      JOIN (
        SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
        FROM elections
      ) AS y ON y.year_th = e.year_th
      WHERE 1=1
    `;
        const params = [];

        if (year) {
            sql += ' AND y.year_th = ? ';
            params.push(Number(year));
        }

        sql += ' GROUP BY y.year_th ORDER BY y.year_th DESC';

        const q = await db.query(sql, params);
        const rows = rowsArray(q);

        if (year) {
            const found = Array.isArray(rows) ? rows.find((r) => Number(r.year_th) === Number(year)) : null;
            return res.json({ success: true, data: { year: Number(year), election_count: Number(found?.election_count || 0) } });
        }

        const total = Array.isArray(rows) ? rows.reduce((sum, x) => sum + Number(x.election_count || 0), 0) : 0;
        return res.json({ success: true, data: { total } });
    } catch (err) {
        console.error('[getElectionCountThisYear] SQL Error:', err?.sqlMessage || err?.message);
        return res.status(500).json({ success: false, message: 'SQL Error', error: err });
    }
};
