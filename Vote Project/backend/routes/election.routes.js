// 📁 routes/election.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const electionController = require("../controllers/election.controller");
const verifyToken = require("../middleware/auth");
const requireRole = require('../middleware/role');

// 📦 ตั้งค่าเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/elections"); // 📁 โฟลเดอร์
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // ✅ ชื่อไฟล์ไม่ซ้ำ
  },
});

const upload = multer({ storage });
// router.get("/", electionController.getAllElections);

router.use(verifyToken); // ทุก endpoint ด้านล่างต้อง login
router.get("/", electionController.getElections);
router.get("/:id", electionController.getElectionById);
router.put(
  "/:id",
  verifyToken,
  electionController.uploadElectionImage, // ✅ middleware ของ multer
  electionController.updateElectionWithImage
);
router.delete("/:id", verifyToken, electionController.deleteElection);
router.post("/", upload.single("image"),verifyToken, electionController.createElection);
// router.put('/:id/status', verifyToken, electionController.updateElectionStatus);

router.patch(
  "/:id/status",
  verifyToken,
  requireRole("ผู้ดูแล"), // เฉพาะ admin
  electionController.patchElectionStatus
);

router.patch(
  '/:id/visibility',
  verifyToken,
  requireRole('ผู้ดูแล'),
  electionController.updateVisibility
);

module.exports = router;
