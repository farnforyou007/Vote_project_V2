// 📁 routes/election.routes.js
const express = require('express');
const router = express.Router();
const electionController = require('../controllers/election.controller');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, electionController.getAllElections);
router.get('/:id', verifyToken, electionController.getElectionById);
router.put('/:id',
    verifyToken,
    electionController.uploadElectionImage, // ✅ middleware ของ multer
    electionController.updateElectionWithImage
);
router.delete('/:id', verifyToken, electionController.deleteElection);


module.exports = router;


