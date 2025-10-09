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
router.get('/filtered-users', verifyToken,requireRole('ผู้ดูแล'), userController.filteredUsers);

// router.get('/', verifyToken,requireRole('ผู้ดูแล'),userController.getAllUsers);

router.post('/add', verifyToken,requireRole('ผู้ดูแล'), userController.addUser);
router.put('/update/:id', verifyToken, requireRole('ผู้ดูแล'), userController.updateUser);
router.delete('/delete/:id', verifyToken,requireRole('ผู้ดูแล'), userController.deleteUser);


//เปลี่ยน email password หน้าโปรไฟล์ผู้ใช้
router.put('/update-email-password', verifyToken, userController.updateEmailAndPassword);
// ดึงข้อมูลโปรไฟล์ผู้ใช้
router.get("/me", verifyToken, userController.getProfile);
router.get("/students/", verifyToken, userController.getStudents);

router.get('/exists', userController.existsField);
module.exports = router;