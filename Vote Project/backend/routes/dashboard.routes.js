// 📁 routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
// ให้ req.user พร้อมใช้งานเหมือน /api/users/me
const ctrl = require('../controllers/dashboard.controller');

router.get('/kpis', verifyToken, ctrl.getKpis);
// router.get('/turnout-history', verifyToken, ctrl.getTurnoutHistory);
router.get('/ballot-split/:electionId', verifyToken, ctrl.getBallotSplit);

router.get('/all-elections', verifyToken , ctrl.getAllElections);
router.get('/department-distribution', verifyToken, ctrl.getDepartmentDistribution);
router.get('/year-distribution', verifyToken, ctrl.getYearDistribution);
router.get('/active-elections', verifyToken, ctrl.getActiveElections);
router.get('/election-summary', verifyToken, ctrl.getElectionSummary);

module.exports = router;
