// 📁 middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token:", token); // ✅ ตรวจสอบ token ที่ส่งมา

    if (!token) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};
