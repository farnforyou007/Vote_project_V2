// routes/ping.routes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth"); // ไฟล์ auth.js ของคุณ export เป็นฟังก์ชัน default

router.get("/ping", verifyToken, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
