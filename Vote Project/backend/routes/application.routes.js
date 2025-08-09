const express = require('express');
const multer = require('multer');
const path = require('path');
const { applyCandidate } = require('../controllers/application.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
// const { checkEligibility , checkAlreadyApplied} = require('../controllers/application.controller');
const applicationController = require('../controllers/application.controller');
const router = express.Router();

const storage = multer.diskStorage({
    destination: 'uploads/candidates/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, 'candidate_' + Date.now() + ext);
    },
});
const upload = multer({ storage });

router.post('/apply-candidate', upload.single('photo'), applyCandidate);

// ✅ เส้นทางใหม่สำหรับกรรมการ
router.put('/applications/:id/approve', verifyToken, applicationController.approveApplication);
router.put('/applications/:id/reject', verifyToken, applicationController.rejectApplication);
router.get('/applications/check/:election_id', verifyToken, applicationController.checkAlreadyApplied);
router.get('/applications/check',verifyToken,applicationController.checkApplicationStatus)


router.post('/approve/:id', verifyToken, applicationController.approveCandidate);

router.delete('/candidates/:id', verifyToken, applicationController.deleteCandidate);
router.get('/elections/:id/candidates', verifyToken, applicationController.getCandidatesByElection);
router.get(
  "/applications/my-all",
  verifyToken,
  applicationController.getMyApplication
);

router.put('/applications/update-my', verifyToken, upload.single('photo'), applicationController.updateMyApplication);

module.exports = router;
