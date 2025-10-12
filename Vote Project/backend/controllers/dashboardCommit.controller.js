const db = require('../models/db');


// 1. ดึงปีทั้งหมดจาก elections
exports.getElectionYears = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT DISTINCT YEAR(registration_start) + 543 AS year_th
      FROM elections
      ORDER BY year_th DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error("Error getElectionYears:", err);
        res.status(500).json({ error: err.message });
    }
};

// 2. ดึงรายการเลือกตั้งตามปี
exports.getElectionsByYear = async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
      SELECT 
        election_id,
        election_name,
        YEAR(registration_start) + 543 AS year_th
      FROM elections
      WHERE 1=1
    `;
        const params = [];

        if (year) {
            query += " AND YEAR(registration_start) + 543 = ? ";
            params.push(year);
        }

        query += " ORDER BY registration_start DESC";

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error getElectionsByYear:", err);
        res.status(500).json({ error: err.message });
    }
};

// 3. ดึงสถิติจำนวนผู้สมัคร (ตามปีและการเลือกตั้ง)
exports.getStatsByElection = async (req, res) => {
    try {
        const { electionId, year } = req.query;

        let query = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN a.application_status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN a.application_status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
      FROM applications a
      LEFT JOIN elections e ON a.election_id = e.election_id
      WHERE 1=1
    `;
        const params = [];

        if (electionId) {
            query += " AND a.election_id = ? ";
            params.push(electionId);
        }

        if (year) {
            query += " AND YEAR(e.registration_start) + 543 = ? ";
            params.push(year);
        }

        const [rows] = await db.query(query, params);
        const result = rows[0] || { total: 0, approved: 0, pending: 0, rejected: 0 };

        res.json({
            total: Number(result.total) || 0,
            approved: Number(result.approved) || 0,
            pending: Number(result.pending) || 0,
            rejected: Number(result.rejected) || 0,
        });
    } catch (err) {
        console.error("Error getStatsByElection:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. กราฟแสดงจำนวนผู้สมัครและจำนวนเลือกตั้ง แยกตามปี
exports.getStatsByYear = async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
      SELECT 
        y.year_th,
        COUNT(DISTINCT e.election_id) AS election_count,
        COUNT(a.application_id) AS applicant_count
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
            query += " AND y.year_th = ? ";
            params.push(year);
        }

        query += `
      GROUP BY y.year_th
      ORDER BY y.year_th
    `;

        const [rows] = await db.query(query, params);

        const result = rows.map((r) => ({
            year: r.year_th,
            election_count: Number(r.election_count) || 0,
            applicant_count: Number(r.applicant_count) || 0,
        }));

        res.json(result);
    } catch (err) {
        console.error("Error getStatsByYear:", err);
        res.status(500).json({ error: err.message });
    }
};
