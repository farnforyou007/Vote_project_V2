// 📁 routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
// ให้ req.user พร้อมใช้งานเหมือน /api/users/me
const ctrl = require('../controllers/dashboard.controller');
const requireRole = require('../middleware/role');

router.get('/kpis', verifyToken,requireRole('ผู้ดูแล'), ctrl.getKpis);
// router.get('/turnout-history', verifyToken, ctrl.getTurnoutHistory);
router.get('/ballot-split/:electionId', verifyToken,requireRole('ผู้ดูแล'), ctrl.getBallotSplit);

router.get('/all-elections', verifyToken ,requireRole('ผู้ดูแล'), ctrl.getAllElections);
router.get('/department-distribution', verifyToken,requireRole('ผู้ดูแล'), ctrl.getDepartmentDistribution);
router.get('/year-distribution', verifyToken,requireRole('ผู้ดูแล'), ctrl.getYearDistribution);
router.get('/active-elections', verifyToken,requireRole('ผู้ดูแล'), ctrl.getActiveElections);
router.get('/election-summary', verifyToken,requireRole('ผู้ดูแล'), ctrl.getElectionSummary);

module.exports = router;
