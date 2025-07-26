// 📁 middleware/role.js
// ตรวจว่า user มี role ที่กำหนด
module.exports = function requireRole(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !req.user.roles.some(role => allowedRoles.includes(role))) {
            return res.status(403).json({ success: false, message: 'Access denied: ไม่ใช่บทบาทที่ได้รับอนุญาต' });
        }
        next();
    };
};
