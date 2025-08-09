const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

const candidateController = require('../controllers/candidate.controller');

router.get('/candidates/:election_id',verifyToken, candidateController.getCandidatesByElection);

module.exports = router;
