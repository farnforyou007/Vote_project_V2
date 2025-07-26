const bcrypt = require('bcrypt');

(async () => {
    const password = '12345'; // รหัสที่คุณอยากให้ใช้
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash:', hash);
    
})();

