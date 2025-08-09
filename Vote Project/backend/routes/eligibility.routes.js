const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibility.controller');
const verifyToken = require('../middleware/auth');


router.post('/elections/:id/eligibility/bulk', verifyToken, eligibilityController.addEligibilityBulk);
router.get('/elections/:id/eligible-users', verifyToken, eligibilityController.getEligibleUsers);
router.delete('/elections/:id/eligibility/bulk-delete', verifyToken, eligibilityController.deleteEligibilityBulk);
router.delete('/elections/:id/eligibility-delete', verifyToken, eligibilityController.deleteEligibilitySingle);
router.post('/elections/:id/eligibility/add-all', verifyToken, eligibilityController.addAllEligibleUsers);
router.get('/eligibility/list-my', verifyToken, eligibilityController.getMyEligibleElections);
router.get('/eligibility/:election_id', verifyToken, eligibilityController.checkEligibility);


module.exports = router;
// 📁 routes/eligibility.routes.js