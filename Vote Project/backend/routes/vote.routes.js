// 📁 routes/vote.routes.js
const express = require('express');
const router = express.Router();
const voteController = require('../controllers/vote.controller');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, voteController.castVote);
router.get('/history', verifyToken, voteController.getVoteHistory);

module.exports = router;