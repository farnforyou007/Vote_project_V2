const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

const candidateController = require('../controllers/candidate.controller');

// router.get('/elections/:id/candidates',verifyToken, candidateController.getCandidatesByElection);
// router.get('/elections/:id/candidates', verifyToken, applicationController.getCandidatesByElection);
router.get('/candidates/:id',verifyToken, candidateController.getCandidatesByElection);



module.exports = router;
