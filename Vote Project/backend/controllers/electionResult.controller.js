// // version 2
// // const db = require('../models/db');
// // /** ---------------------------------------------------------------
// //  * POST /api/election-results/:id/finalize
// //  * สรุปผลเลือกตั้ง: คำนวณคะแนน อันดับ ผู้ชนะ + บันทึกผู้ไม่มาใช้สิทธิ์
// //  * --------------------------------------------------------------- */
// // exports.finalizeElection = async (req, res) => {
// //     const electionId = Number(req.params.id);
// //     const conn = await db.getConnection();
// //     try {
// //         await conn.beginTransaction();

// //         // 1) ตรวจว่าหมดเวลาลงคะแนนจริงหรือยัง
// //         const [eRows] = await conn.query(
// //             `SELECT end_date FROM elections WHERE election_id = ?`,
// //             [electionId]
// //         );
// //         const e = eRows[0];
// //         if (!e) throw new Error('Election not found');
// //         if (new Date(e.end_date) > new Date()) throw new Error('Election not ended yet');

// //         // 2) ลบผลเก่า + เติมผลใหม่จากคะแนนจริง (งดออกเสียงไม่นับเป็นคะแนน)
// //         await conn.query(`DELETE FROM election_result WHERE election_id = ?`, [electionId]);
// //         await conn.query(
// //             `
// //       INSERT INTO election_result (election_id, candidate_id, vote_count, is_winner, ranking)
// //       SELECT 
// //         a.election_id,
// //         c.candidate_id,
// //         COALESCE(SUM(CASE WHEN v.abstain = 0 THEN 1 ELSE 0 END), 0) AS vote_count,
// //         0, NULL
// //       FROM candidates c
// //       JOIN applications a ON a.application_id = c.application_id
// //       LEFT JOIN votes v 
// //              ON v.election_id = a.election_id 
// //             AND v.candidate_id = c.candidate_id
// //       WHERE a.election_id = ?
// //       GROUP BY a.election_id, c.candidate_id
// //       `,
// //             [electionId]
// //         );

// //         // 3) จัดอันดับ & ผู้ชนะ (คะแนนมาก→น้อย)
// //         await conn.query(`SET @r := 0`);
// //         await conn.query(
// //             `
// //       UPDATE election_result er
// //       JOIN (
// //         SELECT election_id, candidate_id, vote_count,
// //                (@r := @r + 1) AS rn
// //         FROM election_result
// //         WHERE election_id = ?
// //         ORDER BY vote_count DESC, candidate_id ASC
// //       ) x
// //         ON x.election_id = er.election_id AND x.candidate_id = er.candidate_id
// //       SET er.ranking = x.rn,
// //           er.is_winner = (x.rn = 1)
// //       `,
// //             [electionId]
// //         );

// //         // 4) สรุปจำนวนผู้มีสิทธิ์/มาใช้สิทธิ์/งดออกเสียง
// //         const [sumRows] = await conn.query(
// //             `
// //       SELECT
// //         (SELECT COUNT(DISTINCT ee.user_id)
// //            FROM election_eligibility ee
// //           WHERE ee.election_id = ?) AS eligible_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS voted_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstain_count
// //       `,
// //             [electionId, electionId, electionId]
// //         );
// //         const sum = sumRows[0] || {};
// //         const eligible = Number(sum.eligible_count || 0);
// //         const voted = Number(sum.voted_count || 0);
// //         const abstain = Number(sum.abstain_count || 0);
// //         const notVote = Math.max(eligible - voted, 0);

// //         // 5) บันทึกผู้ไม่มาใช้สิทธิ์ (กันซ้ำด้วย INSERT IGNORE)
// //         await conn.query(
// //             `
// //       INSERT IGNORE INTO absentee_records (election_id, user_id, created_at)
// //       SELECT ee.election_id, ee.user_id, NOW()
// //       FROM election_eligibility ee
// //       LEFT JOIN votes v
// //         ON v.election_id = ee.election_id AND v.voter_id = ee.user_id
// //       WHERE ee.election_id = ? AND v.vote_id IS NULL
// //       `,
// //             [electionId]
// //         );

// //         await conn.commit();

// //         return res.json({
// //             success: true,
// //             message: 'Finalized',
// //             election_id: electionId,
// //             summary: {
// //                 eligible_count: eligible,
// //                 voted_count: voted,
// //                 abstain_count: abstain,
// //                 not_vote_count: notVote,
// //                 turnout_percent: eligible ? +(voted / eligible * 100).toFixed(1) : 0,
// //             },
// //         });
// //     } catch (err) {
// //         await conn.rollback();
// //         console.error('[finalizeElection]', err);
// //         return res
// //             .status(500)
// //             .json({ success: false, message: err.message || 'Finalize failed' });
// //     } finally {
// //         conn.release();
// //     }
// // };

// // // /** ---------------------------------------------------------------
// // //  * GET /api/election-results/:id
// // //  * รายงานผล + สรุปภาพรวม
// // //  * --------------------------------------------------------------- */
// // exports.getElectionResults = async (req, res) => {
// //     const electionId = Number(req.params.id);
// //     try {
// //         const candidates = await db.query(
// //             `
// //       SELECT 
// //         er.candidate_id,
// //         u.first_name,
// //         u.last_name,
// //         er.vote_count,
// //         er.ranking,
// //         er.is_winner
// //       FROM election_result er
// //       JOIN candidates   c ON c.candidate_id = er.candidate_id
// //       JOIN applications a ON a.application_id = c.application_id
// //       JOIN users        u ON u.user_id = a.user_id
// //       WHERE a.election_id = ?
// //       ORDER BY er.ranking ASC, er.vote_count DESC
// //       `,
// //             [electionId]
// //         );

// //         const summary = await db.query(
// //             `
// //       SELECT
// //         (SELECT COUNT(DISTINCT ee.user_id) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS voted_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstain_count
// //       `,
// //             [electionId, electionId, electionId]
// //         );

// //         const s = summary[0] || {};
// //         const eligible = Number(s.eligible_count || 0);
// //         const voted = Number(s.voted_count || 0);
// //         const abstain = Number(s.abstain_count || 0);
// //         const notVote = Math.max(eligible - voted, 0);

// //         return res.json({
// //             success: true,
// //             data: {
// //                 results: candidates.map((c) => ({
// //                     candidate_id: c.candidate_id,
// //                     name: `${c.first_name} ${c.last_name}`,
// //                     vote_count: c.vote_count,
// //                     ranking: c.ranking,
// //                     is_winner: c.is_winner,
// //                 })),
// //                 summary: {
// //                     eligible_count: eligible,
// //                     voted_count: voted,
// //                     abstain_count: abstain,
// //                     not_vote_count: notVote,
// //                     turnout_percent: eligible ? +(voted / eligible * 100).toFixed(1) : 0,
// //                 },
// //             },
// //         });
// //     } catch (err) {
// //         console.error('[getElectionResults]', err);
// //         return res.status(500).json({ success: false, message: err.message });
// //     }
// // };


// // // // --------------------------------------------------------------------------- 
// // // // electionResult.controller.js (ต่อท้ายไฟล์)
// // // const db = require('../models/db');
// // // // คำนวนและบันทึกผลเลือกตั้ง (transaction) ออโต้เมื่อเลือกตั้งจบ
// // // // เรียกใช้จาก cron/service ได้โดยตรง
// // exports.finalizeElectionById = async (electionId) => {
// //     const conn = await db.getConnection();
// //     try {
// //         await conn.beginTransaction();

// //         // ตรวจว่าหมดเวลาจริงหรือยัง
// //         const [eRows] = await conn.query(
// //             `SELECT end_date FROM elections WHERE election_id = ?`,
// //             [electionId]
// //         );
// //         const e = eRows[0];
// //         if (!e) throw new Error('Election not found');
// //         if (new Date(e.end_date) > new Date()) throw new Error('Election not ended yet');

// //         // ลบผลเก่า + เติมผลใหม่
// //         await conn.query(`DELETE FROM election_result WHERE election_id = ?`, [electionId]);
// //         await conn.query(
// //             `
// //       INSERT INTO election_result (election_id, candidate_id, vote_count, is_winner, ranking)
// //       SELECT 
// //         a.election_id,
// //         c.candidate_id,
// //         COALESCE(SUM(CASE WHEN v.abstain = 0 THEN 1 ELSE 0 END), 0) AS vote_count,
// //         0, NULL
// //       FROM candidates c
// //       JOIN applications a ON a.application_id = c.application_id
// //       LEFT JOIN votes v 
// //              ON v.election_id = a.election_id 
// //             AND v.candidate_id = c.candidate_id
// //       WHERE a.election_id = ?
// //       GROUP BY a.election_id, c.candidate_id
// //       `,
// //             [electionId]
// //         );

// //         // จัดอันดับ & ผู้ชนะ
// //         await conn.query(`SET @r := 0`);
// //         await conn.query(
// //             `
// //       UPDATE election_result er
// //       JOIN (
// //         SELECT election_id, candidate_id, vote_count,
// //                (@r := @r + 1) AS rn
// //         FROM election_result
// //         WHERE election_id = ?
// //         ORDER BY vote_count DESC, candidate_id ASC
// //       ) x
// //         ON x.election_id = er.election_id AND x.candidate_id = er.candidate_id
// //       SET er.ranking = x.rn,
// //           er.is_winner = (x.rn = 1)
// //       `,
// //             [electionId]
// //         );

// //         // สรุป (ถ้าต้องใช้ผลกลับไปทำอย่างอื่นในภายหลัง)
// //         const [sumRows] = await conn.query(
// //             `
// //       SELECT
// //         (SELECT COUNT(DISTINCT ee.user_id)
// //            FROM election_eligibility ee
// //           WHERE ee.election_id = ?) AS eligible_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS voted_count,
// //         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND v.abstain = 1) AS abstain_count
// //       `,
// //             [electionId, electionId, electionId]
// //         );
// //         const s = sumRows[0] || {};
// //         const eligible = Number(s.eligible_count || 0);
// //         const voted = Number(s.voted_count || 0);
// //         const abstain = Number(s.abstain_count || 0);
// //         const notVote = Math.max(eligible - voted, 0);

// //         // บันทึกคนไม่มาใช้สิทธิ์
// //         await conn.query(
// //             `
// //       INSERT IGNORE INTO absentee_records (election_id, user_id, created_at)
// //       SELECT ee.election_id, ee.user_id, NOW()
// //       FROM election_eligibility ee
// //       LEFT JOIN votes v
// //         ON v.election_id = ee.election_id AND v.voter_id = ee.user_id
// //       WHERE ee.election_id = ? AND v.vote_id IS NULL
// //       `,
// //             [electionId]
// //         );

// //         await conn.commit();

// //         return {
// //             success: true,
// //             election_id: electionId,
// //             summary: {
// //                 eligible_count: eligible,
// //                 voted_count: voted,
// //                 abstain_count: abstain,
// //                 not_vote_count: notVote,
// //                 turnout_percent: eligible ? +(voted / eligible * 100).toFixed(1) : 0,
// //             },
// //         };
// //     } catch (err) {
// //         await conn.rollback();
// //         throw err;
// //     } finally {
// //         conn.release();
// //     }
// // };


// // ===================================================================
// // controllers/electionResult.controller.js
// // controllers/electionResult.controller.js
// const db = require('../models/db');

// // ---------- ฟังก์ชันหลักสองตัวที่ route เรียก ----------
// async function getElectionResults(req, res) {
//     const electionId = Number(req.params.id);
//     if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

//     try {
//         const eRows = await db.query(
//             `SELECT election_id, election_name, start_date, end_date, status
//        FROM elections WHERE election_id = ?`,
//             [electionId]
//         );
//         if (!eRows.length) return res.status(404).json({ success: false, message: 'Election not found' });
//         const e = eRows[0];

//         // อ่านผลจากตารางสรุป ถ้ามี
//         const hasERows = await db.query(
//             `SELECT 1 FROM election_result WHERE election_id = ? LIMIT 1`,
//             [electionId]
//         );

//         let resultsRows;
//         if (hasERows.length) {
//             resultsRows = await db.query(
//                 `
//         SELECT er.candidate_id, er.vote_count, er.ranking, er.is_winner,
//                CONCAT(u.first_name,' ',u.last_name) AS candidate_name, u.student_id
//         FROM election_result er
//         JOIN candidates c   ON c.candidate_id = er.candidate_id
//         JOIN applications a ON a.application_id = c.application_id
//         JOIN users u        ON u.user_id = a.user_id
//         WHERE er.election_id = ?
//         ORDER BY er.ranking ASC, er.vote_count DESC
//         `,
//                 [electionId]
//             );
//         } else {
//             // SAFE MODE: คำนวณสดพื้นฐาน
//             resultsRows = await db.query(
//                 `
//         SELECT c.candidate_id,
//                CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
//                u.student_id,
//                COUNT(v.vote_id) AS vote_count
//         FROM candidates c
//         JOIN applications a ON a.application_id = c.application_id
//         JOIN users u        ON u.user_id = a.user_id
//         LEFT JOIN votes v   ON v.candidate_id = c.candidate_id AND v.election_id = a.election_id
//         WHERE a.election_id = ?
//         GROUP BY c.candidate_id, candidate_name, u.student_id
//         ORDER BY vote_count DESC, candidate_name ASC
//         `,
//                 [electionId]
//             );

//             // เติมอันดับฝั่งแอป
//             let last = null, rank = 0, place = 0;
//             resultsRows = resultsRows.map(r => {
//                 place += 1;
//                 if (r.vote_count !== last) { rank = place; last = r.vote_count; }
//                 return { ...r, ranking: rank, is_winner: rank === 1 };
//             });
//         }

//         // KPI แบบพื้นฐาน
//         const aggRows = await db.query(
//             `
//       SELECT
//         (SELECT COUNT(*) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_total,
//         (SELECT COUNT(DISTINCT v.voter_id) FROM votes v WHERE v.election_id = ?) AS voters_total,
//         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ?) AS ballots_total
//       `,
//             [electionId, electionId, electionId]
//         );
//         const agg = aggRows[0] || {};
//         const eligible = Number(agg.eligible_total || 0);
//         const voters = Number(agg.voters_total || 0);
//         const notVote = Math.max(eligible - voters, 0);
//         const turnout = eligible ? +((voters / eligible) * 100).toFixed(1) : 0;

//         // สถานะเพื่อแสดงผล
//         const ended =
//             new Date(e.end_date) <= new Date() ||
//             (e.status && ['finished', 'เสร็จสิ้น'].includes(String(e.status)));

//         return res.json({
//             success: true,
//             election: {
//                 election_id: e.election_id,
//                 election_name: e.election_name,
//                 start_date: e.start_date,
//                 end_date: e.end_date,
//                 status: ended ? 'finished' : (e.status || 'ongoing'),
//             },
//             summary: {
//                 eligible_count: eligible,
//                 voted_count: voters,
//                 not_vote_count: notVote,
//                 abstain_count: 0,
//                 turnout_percent: turnout,
//                 eligible_count: eligible,
//             },
//             results: resultsRows,
//         });
//     } catch (err) {
//         console.error('[getElectionResults] DB error:', {
//             code: err?.code, errno: err?.errno, sqlState: err?.sqlState,
//             sqlMessage: err?.sqlMessage, sql: err?.sql,
//         });
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// }

// async function listFinishedResults(req, res) {
//     try {
//         const items = await db.query(
//             `
//       SELECT election_id, election_name, end_date
//       FROM elections
//       WHERE NOW() > end_date OR status IN ('finished','เสร็จสิ้น')
//       ORDER BY end_date DESC
//       `
//         );
//         return res.json({ success: true, items });
//     } catch (err) {
//         console.error('[listFinishedResults] DB error:', err);
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// }

// // ---------- export แบบเดียว ให้แน่ใจว่าเป็น "ฟังก์ชัน" จริง ----------
// module.exports = {
//     getElectionResults,
//     listFinishedResults,
//     // finalizeElection: ... (ถ้าจะใช้)
// };


// version 3
// controllers/electionResult.controller.js
// ใช้ได้กับ db wrapper ของคุณ (db.query() คืน rows อย่างเดียว)
// const db = require('../models/db');

// /** คำนวณ + เขียนผลลง DB ภายในทรานแซกชัน */
// async function finalizeInTx(conn, electionId) {
//     // ลบของเก่า
//     await conn.query(`DELETE FROM election_result WHERE election_id = ?`, [electionId]);

//     // รวมคะแนน (นับเฉพาะบัตรโหวตปกติ: abstain=0)
//     await conn.query(
//         `
//     INSERT INTO election_result (election_id, candidate_id, vote_count, ranking, is_winner)
//     SELECT
//       a.election_id,
//       c.candidate_id,
//       COUNT(CASE WHEN COALESCE(v.abstain,0)=0 THEN v.vote_id END) AS vote_count,
//       NULL AS ranking,
//       0    AS is_winner
//     FROM candidates c
//     JOIN applications a ON a.application_id = c.application_id
//     LEFT JOIN votes v   ON v.candidate_id = c.candidate_id
//                        AND v.election_id  = a.election_id
//     WHERE a.election_id = ?
//     GROUP BY a.election_id, c.candidate_id
//     `,
//         [electionId]
//     );

//     // จัดอันดับ + ผู้ชนะ (รองรับคะแนนเสมอหลายคนด้วยการให้ ranking เดียวกันผ่านคิวรีลำดับ)
//     await conn.query(`SET @r := 0, @last := NULL, @place := 0`);
//     await conn.query(
//         `
//     UPDATE election_result er
//     JOIN (
//       SELECT er2.election_id,
//              er2.candidate_id,
//              er2.vote_count,
//              (@place := @place + 1)                                 AS place_calc,
//              (@r := IF(@last = er2.vote_count, @r, @place))          AS rank_calc,
//              (@last := er2.vote_count)                                AS _
//       FROM election_result er2
//       WHERE er2.election_id = ?
//       ORDER BY er2.vote_count DESC, er2.candidate_id ASC
//     ) t
//       ON t.election_id = er.election_id AND t.candidate_id = er.candidate_id
//     SET er.ranking   = t.rank_calc,
//         er.is_winner = (t.rank_calc = 1)
//     `,
//         [electionId]
//     );

//     // บันทึก "ขาดใช้สิทธิ์" = ผู้มีสิทธิ์ - ผู้ลงคะแนน (กันซ้ำด้วย INSERT IGNORE)
//     await conn.query(
//         `
//     INSERT IGNORE INTO absentee_records (election_id, user_id, created_at)
//     SELECT ee.election_id, ee.user_id, NOW()
//     FROM election_eligibility ee
//     LEFT JOIN votes v
//       ON v.election_id = ee.election_id
//      AND v.voter_id    = ee.user_id       -- ใช้ voter_id ตามสคีม่าคุณ
//     WHERE ee.election_id = ?
//       AND v.vote_id IS NULL
//     `,
//         [electionId]
//     );
// }

// /** GET /api/elections/:id/results/full
//  *  ส่งข้อมูลครบสำหรับทุกกราฟ: KPI/ผู้ชนะ/คะแนนผู้สมัคร/แยกชั้นปี/แยกแผนก
//  *  - ถ้าเลือกตั้งจบแล้วและยังไม่เคยสรุป → Lazy finalize (คำนวณ+เขียนลง DB ครั้งแรก)
//  */
// async function getElectionResultsFull(req, res) {
//     const electionId = Number(req.params.id);
//     if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

//     try {
//         // 1) ข้อมูลการเลือกตั้ง
//         const eRows = await db.query(
//             `SELECT election_id, election_name, start_date, end_date, status
//        FROM elections WHERE election_id = ?`,
//             [electionId]
//         );
//         if (!eRows.length) return res.status(404).json({ success: false, message: 'Election not found' });
//         const e = eRows[0];
//         const ended = new Date(e.end_date) <= new Date() ||
//             ['finished', 'เสร็จสิ้น'].includes(String(e.status || ''));

//         // 2) Lazy finalize เมื่อจบแล้วและยังไม่มีผลในตารางสรุป
//         if (ended) {
//             const chk = await db.query(
//                 `SELECT 1 FROM election_result WHERE election_id = ? LIMIT 1`,
//                 [electionId]
//             );
//             if (!chk.length) {
//                 const conn = await db.getConnection();
//                 try {
//                     await conn.beginTransaction();
//                     await finalizeInTx(conn, electionId);
//                     await conn.commit();
//                 } catch (err) {
//                     await conn.rollback();
//                     console.error('[lazy finalize error]', err);
//                     // ไม่ throw ต่อ ให้ไปดึงแบบสดเพื่อไม่ให้หน้า error
//                 } finally {
//                     conn.release();
//                 }
//             }
//         }

//         // 3) คะแนนผู้สมัคร (ถ้ามีในตารางสรุปแล้วจะเร็ว)
//         let results = await db.query(
//             `
//       SELECT er.candidate_id, er.vote_count, er.ranking, er.is_winner,
//              CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
//              u.student_id
//       FROM election_result er
//       JOIN candidates c   ON c.candidate_id = er.candidate_id
//       JOIN applications a ON a.application_id = c.application_id
//       JOIN users u        ON u.user_id = a.user_id
//       WHERE er.election_id = ?
//       ORDER BY er.ranking ASC, er.vote_count DESC
//       `,
//             [electionId]
//         );

//         if (!results.length) {
//             // คำนวณสด (กรณียังไม่จบหรือ finalize ล้มเหลว)
//             results = await db.query(
//                 `
//         SELECT c.candidate_id,
//                CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
//                u.student_id,
//                COUNT(CASE WHEN COALESCE(v.abstain,0)=0 THEN v.vote_id END) AS vote_count
//         FROM candidates c
//         JOIN applications a ON a.application_id = c.application_id
//         JOIN users u        ON u.user_id = a.user_id
//         LEFT JOIN votes v   ON v.candidate_id = c.candidate_id
//                            AND v.election_id  = a.election_id
//         WHERE a.election_id = ?
//         GROUP BY c.candidate_id, candidate_name, u.student_id
//         ORDER BY vote_count DESC, candidate_name ASC
//         `,
//                 [electionId]
//             );
//             // เติมอันดับ/ผู้ชนะฝั่งแอป
//             let last = null, rank = 0, place = 0, top = results[0]?.vote_count || 0;
//             results = results.map(r => {
//                 place += 1;
//                 if (r.vote_count !== last) { rank = place; last = r.vote_count; }
//                 return { ...r, ranking: rank, is_winner: r.vote_count === top };
//             });
//         }

//         // 4) KPI รวม
//         const kpiRows = await db.query(
//             `
//       SELECT
//         (SELECT COUNT(*) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_total,
//         (SELECT COUNT(DISTINCT v.voter_id) FROM votes v WHERE v.election_id = ?) AS voters_total,
//         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND COALESCE(v.abstain,0)=1) AS abstain_total
//       `,
//             [electionId, electionId, electionId]
//         );
//         const k = kpiRows[0] || {};
//         const eligible = +k.eligible_total || 0;
//         const voters = +k.voters_total || 0;
//         const abstain = +k.abstain_total || 0;
//         const turnout = eligible ? +((voters / eligible) * 100).toFixed(2) : 0;

//         // 5) แยกตามชั้นปี
//         const byYear = await db.query(
//             `
//       SELECT y.year_id, y.year_name AS name,
//              COUNT(*) AS eligible,
//              COUNT(DISTINCT v.voter_id) AS voted
//       FROM election_eligibility ee
//       JOIN users u  ON u.user_id = ee.user_id
//       LEFT JOIN year_levels y ON y.year_id = u.year_id
//       LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
//       WHERE ee.election_id = ?
//       GROUP BY y.year_id, name
//       ORDER BY y.year_id
//       `,
//             [electionId]
//         );
//         const breakdownByYear = byYear.map(r => ({
//             name: r.name || 'ไม่ระบุ',
//             voted: +r.voted || 0,
//             not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
//         }));

//         // 6) แยกตามแผนก
//         const byDept = await db.query(
//             `
//       SELECT d.department_id, d.department_name AS name,
//              COUNT(*) AS eligible,
//              COUNT(DISTINCT v.voter_id) AS voted
//       FROM election_eligibility ee
//       JOIN users u  ON u.user_id = ee.user_id
//       LEFT JOIN department d ON d.department_id = u.department_id
//       LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
//       WHERE ee.election_id = ?
//       GROUP BY d.department_id, name
//       ORDER BY name
//       `,
//             [electionId]
//         );
//         const breakdownByDepartment = byDept.map(r => ({
//             name: r.name || 'ไม่ระบุ',
//             voted: +r.voted || 0,
//             not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
//         }));

//         // 7) ผู้ชนะ (รองรับเสมอ)
//         const topVotes = results[0]?.vote_count || 0;
//         const winners = results.filter(r => r.vote_count === topVotes);

//         return res.json({
//             success: true,
//             election: {
//                 election_id: e.election_id,
//                 title: e.election_name,          // ใช้ชื่อคอลัมน์ election_name ตามสคีม่า
//                 start_date: e.start_date,
//                 end_date: e.end_date,
//                 status: ended ? 'finished' : (e.status || 'ongoing')
//             },
//             kpis: {
//                 eligible_total: eligible,
//                 voters_total: voters,
//                 abstain_total: abstain,
//                 turnout_percent: turnout
//             },
//             results,                 // คะแนนผู้สมัคร (มี vote_count, ranking, is_winner)
//             winners,                 // รายชื่อผู้ชนะ (อาจมีหลายคนถ้าเสมอ)
//             breakdownByYear,         // [{ name, voted, not_voted }]
//             breakdownByDepartment    // [{ name, voted, not_voted }]
//         });
//     } catch (err) {
//         console.error('[getElectionResultsFull] DB error:', {
//             code: err?.code, errno: err?.errno, sqlState: err?.sqlState,
//             sqlMessage: err?.sqlMessage, sql: err?.sql
//         });
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// }

// /** GET /api/elections/results — ลิสต์รายการที่จบแล้ว (ไว้ทำหน้า list) */
// async function listFinishedResults(req, res) {
//     try {
//         const items = await db.query(
//             `
//       SELECT election_id, election_name, end_date
//       FROM elections
//       WHERE NOW() > end_date OR status IN ('finished','เสร็จสิ้น')
//       ORDER BY end_date DESC
//       `
//         );
//         return res.json({ success: true, items });
//     } catch (err) {
//         console.error('[listFinishedResults] DB error:', err);
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// }

// /** POST /api/elections/:id/finalize — แอดมินสรุปผล/เขียนลง DB ได้ทุกเมื่อ */
// async function finalizeElection(req, res) {
//     const electionId = Number(req.params.id);
//     if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

//     const conn = await db.getConnection();
//     try {
//         await conn.beginTransaction();

//         // ตรวจว่าเลือกตั้งมีอยู่จริง และควรจะจบแล้ว
//         const eRows = await conn.query(
//             `SELECT end_date FROM elections WHERE election_id = ?`,
//             [electionId]
//         );
//         const e = eRows[0];
//         if (!e) throw new Error('Election not found');
//         if (new Date(e.end_date) > new Date()) throw new Error('Election not ended yet');

//         await finalizeInTx(conn, electionId);
//         await conn.commit();

//         return res.json({ success: true, message: 'Finalized', election_id: electionId });
//     } catch (err) {
//         await conn.rollback();
//         console.error('[finalizeElection] DB error:', err);
//         return res.status(500).json({ success: false, message: err?.message || 'DB Error' });
//     } finally {
//         conn.release();
//     }
// }

// module.exports = {
//     getElectionResultsFull,
//     listFinishedResults,
//     finalizeElection
// };


// ver4

const db = require('../models/db');

/** คำนวณ + เขียนผลลง DB ภายในทรานแซกชัน */
async function finalizeInTx(conn, electionId) {
    await conn.query(`DELETE FROM election_result WHERE election_id = ?`, [electionId]);

    await conn.query(
        `
    INSERT INTO election_result (election_id, candidate_id, vote_count, ranking, is_winner)
    SELECT
      a.election_id,
      c.candidate_id,
      COUNT(CASE WHEN COALESCE(v.abstain,0)=0 THEN v.vote_id END) AS vote_count,
      NULL AS ranking,
      0    AS is_winner
    FROM candidates c
    JOIN applications a ON a.application_id = c.application_id
    LEFT JOIN votes v   ON v.candidate_id = c.candidate_id
                       AND v.election_id  = a.election_id
    WHERE a.election_id = ?
    GROUP BY a.election_id, c.candidate_id
    `,
        [electionId]
    );

    await conn.query(`SET @r := 0, @last := NULL, @place := 0`);
    await conn.query(
        `
    UPDATE election_result er
    JOIN (
      SELECT er2.election_id,
             er2.candidate_id,
             er2.vote_count,
             (@place := @place + 1)                                 AS place_calc,
             (@r := IF(@last = er2.vote_count, @r, @place))          AS rank_calc,
             (@last := er2.vote_count)                                AS _
      FROM election_result er2
      WHERE er2.election_id = ?
      ORDER BY er2.vote_count DESC, er2.candidate_id ASC
    ) t
      ON t.election_id = er.election_id AND t.candidate_id = er.candidate_id
    SET er.ranking   = t.rank_calc,
        er.is_winner = (t.rank_calc = 1)
    `,
        [electionId]
    );

    await conn.query(
        `
    INSERT IGNORE INTO absentee_records (election_id, user_id, created_at)
    SELECT ee.election_id, ee.user_id, NOW()
    FROM election_eligibility ee
    LEFT JOIN votes v
      ON v.election_id = ee.election_id
     AND v.voter_id    = ee.user_id
    WHERE ee.election_id = ?
      AND v.vote_id IS NULL
    `,
        [electionId]
    );
}

/** GET /api/elections/:id/results/full */
// module.exports.getElectionResultsFull = async function (req, res) {
//     const electionId = Number(req.params.id);
//     if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

//     try {
//         const eRows = await db.query(
//             `SELECT election_id, election_name, start_date, end_date, status
//        FROM elections WHERE election_id = ?`,
//             [electionId]
//         );
//         if (!eRows.length) return res.status(404).json({ success: false, message: 'Election not found' });
//         const e = eRows[0];
//         const ended = new Date(e.end_date) <= new Date() ||
//             ['finished', 'เสร็จสิ้น'].includes(String(e.status || ''));

//         if (ended) {
//             const chk = await db.query(
//                 `SELECT 1 FROM election_result WHERE election_id = ? LIMIT 1`,
//                 [electionId]
//             );
//             if (!chk.length) {
//                 const conn = await db.getConnection();
//                 try {
//                     await conn.beginTransaction();
//                     await finalizeInTx(conn, electionId);
//                     await conn.commit();
//                 } catch (err) {
//                     await conn.rollback();
//                     console.error('[lazy finalize error]', err);
//                 } finally {
//                     conn.release();
//                 }
//             }
//         }

//         let results = await db.query(
//             `
//       SELECT er.candidate_id, er.vote_count, er.ranking, er.is_winner,
//              CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
//              u.student_id , c.photo AS photo_url , c.candidate_number AS candidate_number,
//              d.department_name AS department_name
//       FROM election_result er
//       JOIN candidates c   ON c.candidate_id = er.candidate_id
//       JOIN applications a ON a.application_id = c.application_id
//       JOIN users u        ON u.user_id = a.user_id
//       LEFT JOIN department d ON d.department_id = u.department_id
//       WHERE er.election_id = ?
//       ORDER BY er.ranking ASC, er.vote_count DESC
//       `,
//             [electionId]
//         );

//         if (!results.length) {
//             results = await db.query(
//                 `
//         SELECT c.candidate_id, c.photo
//                CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
//                u.student_id,
//                COUNT(CASE WHEN COALESCE(v.abstain,0)=0 THEN v.vote_id END) AS vote_count ,
//                c.photo AS photo_url , c.candidate_number AS candidate_number,
//                d.department_name AS department_name,
//         FROM candidates c
//         JOIN applications a ON a.application_id = c.application_id
//         JOIN users u        ON u.user_id = a.user_id
//         LEFT JOIN department d ON d.department_id = u.department_id
//         LEFT JOIN votes v   ON v.candidate_id = c.candidate_id
//                            AND v.election_id  = a.election_id
//         WHERE a.election_id = ?
//         GROUP BY c.candidate_id, candidate_name, u.student_id  , c.photo_url , c.candidate_number , department_name
//         ORDER BY vote_count DESC, candidate_name ASC
//         `,
//                 [electionId]
//             );
//             // กันกรณี "ไม่มีผู้สมัครเลย" ให้ไม่พัง
//             if (!results.length) {
//                 results = [];
//             } else {
//                 let last = null, rank = 0, place = 0, top = results[0]?.vote_count || 0;
//                 results = results.map(r => {
//                     place += 1;
//                     if (r.vote_count !== last) { rank = place; last = r.vote_count; }
//                     return { ...r, ranking: rank, is_winner: r.vote_count === top };
//                 });
//             }

//             // let last = null, rank = 0, place = 0, top = results[0]?.vote_count || 0;
//             // results = results.map(r => {
//             //     place += 1;
//             //     if (r.vote_count !== last) { rank = place; last = r.vote_count; }
//             //     return { ...r, ranking: rank, is_winner: r.vote_count === top };
//             // });
//         }

//         const kpiRows = await db.query(
//             `
//       SELECT
//         (SELECT COUNT(*) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_total,
//         (SELECT COUNT(DISTINCT v.voter_id) FROM votes v WHERE v.election_id = ?) AS voters_total,
//         (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND COALESCE(v.abstain,0)=1) AS abstain_total
//       `,
//             [electionId, electionId, electionId]
//         );
//         const k = kpiRows[0] || {};
//         const eligible = +k.eligible_total || 0;
//         const voters = +k.voters_total || 0;
//         const abstain = +k.abstain_total || 0;
//         const turnout = eligible ? +((voters / eligible) * 100).toFixed(2) : 0;

//         const byYear = await db.query(
//             `
//       SELECT y.year_id, y.year_name AS name,
//              COUNT(*) AS eligible,
//              COUNT(DISTINCT v.voter_id) AS voted
//       FROM election_eligibility ee
//       JOIN users u  ON u.user_id = ee.user_id
//       LEFT JOIN year_levels y ON y.year_id = u.year_id
//       LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
//       WHERE ee.election_id = ?
//       GROUP BY y.year_id, name
//       ORDER BY y.year_id
//       `,
//             [electionId]
//         );
//         const breakdownByYear = byYear.map(r => ({
//             name: r.name || 'ไม่ระบุ',
//             voted: +r.voted || 0,
//             not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
//         }));

//         const byDept = await db.query(
//             `
//       SELECT d.department_id, d.department_name AS name,
//              COUNT(*) AS eligible,
//              COUNT(DISTINCT v.voter_id) AS voted
//       FROM election_eligibility ee
//       JOIN users u  ON u.user_id = ee.user_id
//       LEFT JOIN department d ON d.department_id = u.department_id
//       LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
//       WHERE ee.election_id = ?
//       GROUP BY d.department_id, name
//       ORDER BY name
//       `,
//             [electionId]
//         );
//         const breakdownByDepartment = byDept.map(r => ({
//             name: r.name || 'ไม่ระบุ',
//             voted: +r.voted || 0,
//             not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
//         }));

//         const topVotes = results[0]?.vote_count || 0;
//         const winners = results.filter(r => r.vote_count === topVotes);

//         return res.json({
//             success: true,
//             election: {
//                 election_id: e.election_id,
//                 title: e.election_name,
//                 start_date: e.start_date,
//                 end_date: e.end_date,
//                 status: ended ? 'finished' : (e.status || 'ongoing')
//             },
//             kpis: {
//                 eligible_total: eligible,
//                 voters_total: voters,
//                 abstain_total: abstain,
//                 turnout_percent: turnout
//             },
//             results,
//             winners,
//             breakdownByYear,
//             breakdownByDepartment
//         });
//     } catch (err) {
//         console.error('[getElectionResultsFull] DB error:', {
//             code: err?.code, errno: err?.errno, sqlState: err?.sqlState,
//             sqlMessage: err?.sqlMessage, sql: err?.sql
//         });
//         return res.status(500).json({ success: false, message: 'DB Error' });
//     }
// };

// result ver2
module.exports.getElectionResultsFull = async function (req, res) {
    const electionId = Number(req.params.id);
    if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

    try {
        const eRows = await db.query(
            `SELECT election_id, election_name, start_date, end_date, status
       FROM elections WHERE election_id = ?`,
            [electionId]
        );
        if (!eRows.length) return res.status(404).json({ success: false, message: 'Election not found' });

        const e = eRows[0];
        const ended = new Date(e.end_date) <= new Date() ||
            ['finished', 'เสร็จสิ้น'].includes(String(e.status || ''));

        // lazy finalize ถ้ายังไม่มีผลในตาราง election_result แต่การเลือกตั้งจบแล้ว
        if (ended) {
            const chk = await db.query(
                `SELECT 1 FROM election_result WHERE election_id = ? LIMIT 1`,
                [electionId]
            );
            if (!chk.length) {
                const conn = await db.getConnection();
                try {
                    await conn.beginTransaction();
                    await finalizeInTx(conn, electionId);
                    await conn.commit();
                } catch (err) {
                    await conn.rollback();
                    console.error('[lazy finalize error]', err);
                } finally {
                    conn.release();
                }
            }
        }

        // 1) พยายามอ่านจาก election_result ก่อน
        let results = await db.query(
            `
      SELECT er.candidate_id, er.vote_count, er.ranking, er.is_winner,
             CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
             u.student_id, c.photo AS photo_url, c.candidate_number AS candidate_number,
             d.department_name AS department_name
      FROM election_result er
      JOIN candidates c   ON c.candidate_id = er.candidate_id
      JOIN applications a ON a.application_id = c.application_id
      JOIN users u        ON u.user_id = a.user_id
      LEFT JOIN department d ON d.department_id = u.department_id
      WHERE er.election_id = ?
      ORDER BY er.ranking ASC, er.vote_count DESC
      `,
            [electionId]
        );

        // 2) ถ้ายังไม่มีผลลัพธ์ (เช่น ยังไม่ finalize) ให้คำนวณสดจาก votes
        if (!results.length) {
            results = await db.query(
                `
        SELECT
          c.candidate_id,
          CONCAT(u.first_name,' ',u.last_name) AS candidate_name,
          u.student_id,
          COUNT(CASE WHEN COALESCE(v.abstain,0)=0 THEN v.vote_id END) AS vote_count,
          c.photo AS photo_url,
          c.candidate_number AS candidate_number,
          d.department_name AS department_name
        FROM candidates c
        JOIN applications a ON a.application_id = c.application_id
        JOIN users u        ON u.user_id = a.user_id
        LEFT JOIN department d ON d.department_id = u.department_id
        LEFT JOIN votes v   ON v.candidate_id = c.candidate_id
                           AND v.election_id  = a.election_id
        WHERE a.election_id = ?
        GROUP BY
          c.candidate_id, candidate_name, u.student_id, photo_url, c.candidate_number, d.department_name
        ORDER BY vote_count DESC, candidate_name ASC
        `,
                [electionId]
            );

            // ไม่มีผู้สมัครเลย → ให้เป็น [] เฉย ๆ
            if (!results.length) {
                results = [];
            } else {
                // ใส่อันดับ (competition ranking) และธงผู้ชนะ
                let last = null, rank = 0, place = 0, top = results[0]?.vote_count || 0;
                results = results.map(r => {
                    place += 1;
                    if (r.vote_count !== last) { rank = place; last = r.vote_count; }
                    return { ...r, ranking: rank, is_winner: r.vote_count === top };
                });
            }
        }

        // KPI / breakdowns
        const kpiRows = await db.query(
            `
      SELECT
        (SELECT COUNT(*) FROM election_eligibility ee WHERE ee.election_id = ?) AS eligible_total,
        (SELECT COUNT(DISTINCT v.voter_id) FROM votes v WHERE v.election_id = ?) AS voters_total,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = ? AND COALESCE(v.abstain,0)=1) AS abstain_total
      `,
            [electionId, electionId, electionId]
        );
        const k = kpiRows[0] || {};
        const eligible = +k.eligible_total || 0;
        const voters = +k.voters_total || 0;
        const abstain = +k.abstain_total || 0;
        const turnout = eligible ? +((voters / eligible) * 100).toFixed(2) : 0;

        const candidatesCount = results.length;
        const hasCandidates = candidatesCount > 0;
        const hasVotes = (k.voters_total ?? 0) > 0;
        // ถ้าไม่มีผู้สมัครเลย หรือ มีผู้สมัครแต่ไม่มีใครมาโหวตเลย (voters=0) → ให้ KPI เป็น 0 หมด
        const byYear = await db.query(
            `
      SELECT y.year_id, y.year_name AS name,
             COUNT(*) AS eligible,
             COUNT(DISTINCT v.voter_id) AS voted
      FROM election_eligibility ee
      JOIN users u  ON u.user_id = ee.user_id
      LEFT JOIN year_levels y ON y.year_id = u.year_id
      LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
      WHERE ee.election_id = ?
      GROUP BY y.year_id, name
      ORDER BY y.year_id
      `,
            [electionId]
        );
        const breakdownByYear = byYear.map(r => ({
            name: r.name || 'ไม่ระบุ',
            voted: +r.voted || 0,
            not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
        }));

        const byDept = await db.query(
            `
      SELECT d.department_id, d.department_name AS name,
             COUNT(*) AS eligible,
             COUNT(DISTINCT v.voter_id) AS voted
      FROM election_eligibility ee
      JOIN users u  ON u.user_id = ee.user_id
      LEFT JOIN department d ON d.department_id = u.department_id
      LEFT JOIN votes v ON v.election_id = ee.election_id AND v.voter_id = u.user_id
      WHERE ee.election_id = ?
      GROUP BY d.department_id, name
      ORDER BY name
      `,
            [electionId]
        );
        const breakdownByDepartment = byDept.map(r => ({
            name: r.name || 'ไม่ระบุ',
            voted: +r.voted || 0,
            not_voted: Math.max((+r.eligible || 0) - (+r.voted || 0), 0)
        }));

        const topVotes = results[0]?.vote_count || 0;
        const winners = results.filter(r => r.vote_count === topVotes);

        return res.json({
            success: true,
            election: {
                election_id: e.election_id,
                title: e.election_name,
                start_date: e.start_date,
                end_date: e.end_date,
                status: ended ? 'สิ้นสุดลงการคะแนน' : (e.status || 'ongoing')
            },
            kpis: {
                eligible_total: eligible,
                voters_total: voters,
                abstain_total: abstain,
                turnout_percent: turnout
            },
            results,
            winners,
            breakdownByYear,
            breakdownByDepartment,
            meta: {
                has_candidates: hasCandidates,
                candidates_count: candidatesCount,
                has_votes: hasVotes,
                empty_reason: hasCandidates ? null : 'no_candidates'
            }
        });
    } catch (err) {
        console.error('[getElectionResultsFull] DB error:', {
            code: err?.code, errno: err?.errno, sqlState: err?.sqlState,
            sqlMessage: err?.sqlMessage, sql: err?.sql
        });
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};


/** GET /api/elections/results */
module.exports.listFinishedResults = async function (req, res) {
    try {
        const items = await db.query(
            `
      SELECT election_id, election_name, end_date
      FROM elections
      WHERE NOW() > end_date OR status IN ('finished','เสร็จสิ้น')
      ORDER BY end_date DESC
      `
        );
        return res.json({ success: true, items });
    } catch (err) {
        console.error('[listFinishedResults] DB error:', err);
        return res.status(500).json({ success: false, message: 'DB Error' });
    }
};

/** POST /api/elections/:id/finalize */
module.exports.finalizeElection = async function (req, res) {
    const electionId = Number(req.params.id);
    if (!electionId) return res.status(400).json({ success: false, message: 'invalid election_id' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const eRows = await conn.query(
            `SELECT end_date FROM elections WHERE election_id = ?`,
            [electionId]
        );
        const e = eRows[0];
        if (!e) throw new Error('Election not found');
        if (new Date(e.end_date) > new Date()) throw new Error('Election not ended yet');

        await finalizeInTx(conn, electionId);
        await conn.commit();

        return res.json({ success: true, message: 'Finalized', election_id: electionId });
    } catch (err) {
        await conn.rollback();
        console.error('[finalizeElection] DB error:', err);
        return res.status(500).json({ success: false, message: err?.message || 'DB Error' });
    } finally {
        conn.release();
    }
};
