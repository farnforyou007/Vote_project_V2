// 📁 routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');


router.post('/refresh-token', userController.refreshToken);
router.post('/login', userController.login);
router.get('/departments', verifyToken, userController.getDepartments);
router.get('/years', verifyToken, userController.getYears);
router.get('/levels', verifyToken, userController.getLevels);
router.get('/filtered-users', verifyToken, userController.filteredUsers);
router.get("/me", verifyToken, userController.getProfile);

router.get('/', verifyToken,requireRole('ผู้ดูแล'),userController.getAllUsers);

router.post('/add', verifyToken,requireRole('ผู้ดูแล'), userController.addUser);
router.put('/update/:id', verifyToken, requireRole('ผู้ดูแล'), userController.updateUser);
router.delete('/delete/:id', verifyToken,requireRole('ผู้ดูแล'), userController.deleteUser);
router.put('/update-email-password', verifyToken, userController.updateEmailAndPassword);

// routes/userRoutes.js หรือ studentRoutes.js
router.get('/students', verifyToken, userController.getStudents);

// router.get('/', verifyToken, requireRole('ผู้ดูแล'), userController.getAllUsers); // ใช้ตรวจ role

// // เฉพาะผู้ดูแลเข้าถึงได้
// router.get('/', verifyToken, requireRole('ผู้ดูแล'), userController.getAllUsers);

// // เฉพาะกรรมการ
// router.post('/review', verifyToken, requireRole('กรรมการ'), userController.review);

// // เฉพาะนักศึกษา
// router.post('/vote', verifyToken, requireRole('นักศึกษา'), voteController.castVote);

// // เฉพาะผู้สมัคร
// router.get('/my-campaign', verifyToken, requireRole('ผู้สมัคร'), candidateController.myProfile);


module.exports = router;