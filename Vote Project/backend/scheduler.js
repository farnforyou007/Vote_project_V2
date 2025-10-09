// // // scheduler.js
// // const cron = require('node-cron');
// // const db = require('./models/db');
// // const { finalizeElectionById } = require('./controllers/electionResult.controller');

// // async function scanAndFinalize() {
// //     const conn = await db.getConnection();
// //     try {
// //         // หา election ที่หมดเวลาแล้วและยังไม่ถูกสรุป (กันการสรุปซ้ำด้วย NOT EXISTS)
// //         const [rows] = await conn.query(`
// //       SELECT e.election_id
// //       FROM elections e
// //       WHERE e.end_date <= NOW()
// //         AND NOT EXISTS (
// //           SELECT 1 FROM election_result er WHERE er.election_id = e.election_id
// //         )
// //     `);

// //         if (rows.length) {
// //             console.log(`[cron] Found ${rows.length} election(s) to finalize`);
// //         }

// //         for (const r of rows) {
// //             try {
// //                 const result = await finalizeElectionById(r.election_id);
// //                 console.log(`[cron] Finalized election ${r.election_id}`, result.summary);
// //             } catch (err) {
// //                 console.error(`[cron] Failed to finalize election ${r.election_id}`, err.message);
// //             }
// //         }
// //     } catch (err) {
// //         console.error('[cron] scanAndFinalize error:', err.message);
// //     } finally {
// //         conn.release();
// //     }
// // }

// // // รันทุก ๆ 1 นาที
// // cron.schedule('* * * * *', scanAndFinalize);

// // module.exports = { scanAndFinalize };


// // version 2.0
// // scheduler.js
// const cron = require('node-cron');
// const db = require('./models/db');
// const { finalizeElectionById } = require('./controllers/electionResult.controller');

// /**
//  * ป้องกัน cron ซ้อนกันข้ามโปรเซสด้วย MySQL GET_LOCK
//  * - ให้เวลารอ lock 3 วินาที (ปรับได้)
//  */
// async function acquireScanLock(conn) {
//     try {
//         const [rows] = await conn.query(`SELECT GET_LOCK('finalize_election_scan', 3) AS got;`);
//         return rows?.[0]?.got === 1;
//     } catch {
//         return false;
//     }
// }

// async function releaseScanLock(conn) {
//     try {
//         await conn.query(`DO RELEASE_LOCK('finalize_election_scan');`);
//     } catch { }
// }

// async function scanAndFinalize() {
//     const conn = await db.getConnection();
//     try {
//         // 1) กัน job ซ้อนกัน (ถ้าตัวเดิมยังทำงานอยู่ ให้ข้ามรอบนี้ไป)
//         const got = await acquireScanLock(conn);
//         if (!got) {
//             // มีอีกโปรเซสกำลังทำอยู่
//             return;
//         }

//         // 2) คัดเฉพาะการเลือกตั้งที่หมดเวลาแล้ว และ "ยังไม่สรุปผล"
//         //    เสริม NOT EXISTS เป็นกันพลาดอีกชั้น (เผื่อมีผลค้างอยู่)
//         const [rows] = await conn.query(`
//       SELECT e.election_id
//       FROM elections e
//       WHERE e.end_date <= NOW()
//         AND e.finalized_at IS NULL
//         AND NOT EXISTS (
//           SELECT 1 FROM election_result er WHERE er.election_id = e.election_id
//         )
//       ORDER BY e.end_date ASC
//       LIMIT 100
//     `);

//         if (rows.length > 0) {
//             console.log(`[cron] Found ${rows.length} election(s) to finalize`);
//         }

//         // 3) ทำทีละอันเพื่อความง่าย/ปลอดภัย (หากอยากเร็วค่อยทำ parallel ทีหลัง)
//         for (const r of rows) {
//             try {
//                 const result = await finalizeElectionById(r.election_id);
//                 console.log(`[cron] Finalized election ${r.election_id}`, result.summary);
//             } catch (err) {
//                 // ไม่ให้ล้มทั้งรอบ หากตัวใดตัวหนึ่งพัง
//                 console.error(
//                     `[cron] Failed to finalize election ${r.election_id} ->`,
//                     err?.message || err
//                 );
//             }
//         }
//     } catch (err) {
//         console.error('[cron] scanAndFinalize error:', err?.message || err);
//     } finally {
//         // ปล่อย lock + ปล่อยคอนเนกชัน
//         await releaseScanLock(conn);
//         conn.release();
//     }
// }

// // รันทุก ๆ 1 นาที
// cron.schedule('* * * * *', scanAndFinalize);

// module.exports = { scanAndFinalize };
