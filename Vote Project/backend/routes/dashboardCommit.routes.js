// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// ปีการศึกษา
router.get("/years", dashboardController.getElectionYears);

// รายการเลือกตั้งตามปี
router.get("/elections", dashboardController.getElectionsByYear);

// การ์ดสรุป
router.get("/stats-by-election", dashboardController.getStatsByElection);

// กราฟจำนวนผู้สมัครและเลือกตั้งแยกตามปี
router.get("/stats-by-year", dashboardController.getStatsByYear);

module.exports = router;
