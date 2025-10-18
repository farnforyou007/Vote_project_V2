// routes/electionResult.routes.js
const router = require('express').Router();

// ปรับตามไฟล์จริงของโปรเจ็กต์คุณ
const verifyToken  = require('../middleware/auth');
// const { requireRole } = require('../middleware/roles');

const ctrl = require('../controllers/electionResult.controller');

// ทุกบทบาทที่ "ล็อกอินแล้ว" ดูผลได้
router.get('/elections/results', verifyToken, ctrl.listFinishedResults);
router.get('/elections/:id/results/full', verifyToken, ctrl.getElectionResultsFull);

// (ออปชัน) แอดมินสรุปผลล่วงหน้า
// router.post('/elections/:id/finalize', verifyToken, requireRole('ผู้ดูแล'), ctrl.finalizeElection);

module.exports = router;
