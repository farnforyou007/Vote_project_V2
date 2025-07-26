const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.post('/approve/:id', verifyToken, requireRole('กรรมการ'), candidateController.approveCandidate);
