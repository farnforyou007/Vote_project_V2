const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { applyCandidate } = require('../controllers/application.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
// const { checkEligibility , checkAlreadyApplied} = require('../controllers/application.controller');
const applicationController = require('../controllers/application.controller');
const router = express.Router();

// const storage = multer.diskStorage({
//     destination: 'uploads/candidates/',
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname);
//         cb(null, 'candidate_' + Date.now() + ext);
//     },
// });
// const upload = multer({ storage });

/* ---------- 1) เตรียมโฟลเดอร์ปลายทาง (เผื่อยังไม่มี) ---------- */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'candidates');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- 2) ใช้ memoryStorage + filter ประเภทไฟล์ + จำกัดขนาด ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('รองรับเฉพาะไฟล์ JPG/PNG/WebP'));
    cb(null, true);
  },
});

/* ---------- 3) มิดเดิลแวร์ย่อ/ครอปรูปด้วย sharp ---------- */
async function resizeCandidatePhoto(req, res, next) {
  try {
    if (!req.file) return next();

    // ตั้งชื่อไฟล์ใหม่
    const fileName = `candidate_${Date.now()}.jpg`;
    const outPath = path.join(UPLOAD_DIR, fileName);

    // ปรับขนาดเป็นสี่เหลี่ยมจัตุรัส 600x600 / บีบคุณภาพ
    await sharp(req.file.buffer)
      .rotate()                                 // auto-rotate ตาม EXIF
      .resize(600, 600, { fit: 'cover' })       // ครอปกลางให้พอดีการ์ด
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outPath);

    // ใส่ข้อมูลกลับให้ controller ใช้เหมือน multer.diskStorage
    req.file.filename = fileName;
    req.file.path = `/uploads/candidates/${fileName}`; // สำคัญ: path ที่ frontend ใช้ render
    next();
  } catch (err) {
    next(err);
  }
}
// เช็คว่าสมัครไปแล้วยัง
router.get('/applications/check/:election_id', verifyToken, applicationController.checkAlreadyApplied);



// เช็คว่าผู้ใช้นั้นมีใบสมัครมั้ย
router.get('/applications/check', verifyToken, applicationController.checkApplicationStatus);

// ใบสมัครทั้งหมดของฉัน
router.get(
  "/applications/my-all", verifyToken, applicationController.getMyApplication);

// อัปเดตใบสมัครของฉัน (+อัปโหลดรูปใหม่)
// router.put('/applications/update-my', verifyToken, upload.single('photo'), applicationController.updateMyApplication);
// สมัครผู้สมัคร (+อัปโหลดรูป
router.post('/apply-candidate', verifyToken, upload.single('photo'), resizeCandidatePhoto, applyCandidate);
router.delete('/candidates/:id', verifyToken, applicationController.deleteCandidate);

// รายชื่อผู้สมัครของการเลือกตั้ง (ใช้กับดูผู้สมัครฝั่งแอดมิน)
router.get('/elections/:id/candidates', verifyToken, applicationController.getCandidatesByElection); // ดึงใบสมัครแต่ละรายการนั้น
router.put('/applications/:id/request-revision', verifyToken, /* requireRole('committee'), */ applicationController.requestRevision);
// เพิ่ม route นี้ (หรือแก้ของเดิมให้มี middleware อัปโหลดรูป)

// application.routes.js
router.put(
  '/applications/update-my',
  verifyToken,
  upload.single('photo'),   // รับไฟล์
  resizeCandidatePhoto,     // ★ สำคัญ: เซ็ต filename + path
  applicationController.updateMyApplication
);



module.exports = router;
