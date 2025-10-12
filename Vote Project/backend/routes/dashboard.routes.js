// 📁 routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
// ให้ req.user พร้อมใช้งานเหมือน /api/users/me
const dashboardController = require('../controllers/dashboard.controller');
const requireRole = require('../middleware/role');

router.get('/kpis', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getKpis);
// router.get('/turnout-history', verifyToken, dashboardController.getTurnoutHistory);
router.get('/ballot-split/:electionId', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getBallotSplit);

router.get('/all-elections', verifyToken ,requireRole('ผู้ดูแล'), dashboardController.getAllElections);
router.get('/department-distribution', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getDepartmentDistribution);
router.get('/year-distribution', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getYearDistribution);
router.get('/active-elections', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getActiveElections);
router.get('/election-summary', verifyToken,requireRole('ผู้ดูแล'), dashboardController.getElectionSummary);
router.get("/turnout/:electionId", verifyToken,requireRole('ผู้ดูแล'),dashboardController.getTurnoutByElection);
router.get("/turnout-leaderboard", dashboardController.getTurnoutLeaderboard);

module.exports = router;
