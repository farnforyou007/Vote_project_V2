// 📁 routes/vote.routes.js
const express = require('express');
const router = express.Router();
const voteController = require('../controllers/vote.controller');
const verifyToken = require('../middleware/auth');

router.post('/vote', verifyToken, voteController.castVote);
router.get('/history', verifyToken, voteController.getVoteHistory);
router.get('/votes/status', verifyToken, voteController.getVoteStatus);
router.get('/vote-history/my', verifyToken, voteController.getMyVoteHistory);

module.exports = router;