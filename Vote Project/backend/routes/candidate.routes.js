const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

const candidateController = require('../controllers/candidate.controller');
const requireRole = require('../middleware/role');

// router.get('/elections/:id/candidates',verifyToken, candidateController.getCandidatesByElection);
// router.get('/elections/:id/candidates', verifyToken, applicationController.getCandidatesByElection);
// router.get('/candidates/:id', verifyToken, candidateController.getCandidatesByElection);


// // งานแบ๋ม
// // ดึงรายชื่อผู้สมัคร
// router.get('/elections/:id/applications',verifyToken, candidateController.getApplicationsByElection);

// // รายละเอียดผู้สมัคร
// router.get('/applications/:id',verifyToken,  candidateController.getApplicationById);

// // รายชื่อแผนก
// router.get('/departments',verifyToken,  candidateController.getDepartments);

// // อนุมัติผู้สมัคร
// router.post('/applications/:id/approve',verifyToken,  candidateController.approveApplication);

// // ปฏิเสธผู้สมัคร
// router.post('/applications/:id/reject',verifyToken,  candidateController.rejectApplication);

// // อัปเดตข้อมูลผู้สมัคร (เช่น นโยบายใหม่)
// router.put('/applications/:id',verifyToken,  candidateController.updateApplication);

// // ลบ (ถ้าปฏิเสธครบ 2 ครั้ง)
// router.delete('/applications/:id',verifyToken,  candidateController.deleteApplication);

// // ✅ เส้นทางบันทึกผลตรวจสอบผู้สมัคร
// router.post('/committee/review', verifyToken, candidateController.recordCommitteeReview);

// version 2
// ลิสต์ใบสมัครของการเลือกตั้ง → Array
router.get('/elections/:id/applications', verifyToken,requireRole('กรรมการ') ,candidateController.getApplicationsByElection);

// รายละเอียดใบสมัคร → Object
router.get('/applications/:id', verifyToken,requireRole('กรรมการ') , candidateController.getApplicationById);

// lookups
router.get('/departments', verifyToken, candidateController.getDepartments);

// actions
router.post('/applications/:id/approve', verifyToken, requireRole('กรรมการ') ,candidateController.approveApplication);
router.post('/applications/:id/reject', verifyToken, requireRole('กรรมการ') ,candidateController.rejectApplication);
router.put('/applications/:id', verifyToken,requireRole('กรรมการ') , candidateController.updateApplication);
router.delete('/applications/:id', verifyToken,requireRole('กรรมการ') , candidateController.deleteApplication);

// บันทึกผลตรวจจากกรรมการ
router.post('/committee/review', verifyToken,requireRole('กรรมการ') , candidateController.recordCommitteeReview);



module.exports = router;
