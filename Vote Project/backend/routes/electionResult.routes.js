// const express = require('express');
// const router = express.Router();
// const verifyToken = require('../middleware/auth');

// const electionResult = require('../controllers/electionResult.controller');

// const requireRole = require('../middleware/role');

// // เฉพาะ admin เท่านั้นที่สามารถสรุปผลการเลือกตั้งได้
// router.post('/elections/:id/finalize', verifyToken, electionResult.finalizeElection);
// router.get('/elections/:id/results',  verifyToken, electionResult.getElectionResults);


// module.exports = router;

// routes/electionResult.routes.js
// const express = require('express');
// const router = express.Router();

// const verifyToken = require('../middleware/auth');  // ต้องมีของคุณอยู่แล้ว
// const ctrl = require('../controllers/electionResult.controller');

// // ✅ ทุกบทบาทที่ "ล็อกอินแล้ว" ดูได้ (ไม่ต้อง requireRole)
// router.get('/elections/results', verifyToken, ctrl.listFinishedResults);

// router.get('/elections/:id/results', verifyToken, ctrl.getElectionResults);

// module.exports = router;


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
