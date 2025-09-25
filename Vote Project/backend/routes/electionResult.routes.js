const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

const electionResult = require('../controllers/electionResult.controller');

const requireRole = require('../middleware/role');

// เฉพาะ admin เท่านั้นที่สามารถสรุปผลการเลือกตั้งได้
router.post('/elections/:id/finalize', verifyToken, requireRole('ผู้ดูแล'), electionResult.finalizeElection);
router.get('/elections/:id/results',  verifyToken, electionResult.getElectionResults);


module.exports = router;
