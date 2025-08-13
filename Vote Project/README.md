# 🗳 Vote Project – Full Stack Setup Guide (TH)

ระบบโหวต/เลือกตั้งออนไลน์ แบ่งออกเป็น 2 ส่วน
- **Backend** – Node.js + Express + MySQL
- **Frontend** – React + Tailwind CSS

> แนะนำให้ใช้ **Node.js v18 ขึ้นไป** (Backend ใช้ Express v5 ซึ่งต้องการ Node 18+)

---

## 📂 โครงสร้างโปรเจกต์
```
Vote Project/
│── backend/            # เซิร์ฟเวอร์และ API
│── frontend/           # ส่วนติดต่อผู้ใช้
```

---

## 🔧 ติดตั้งโปรแกรมที่จำเป็น
- [Node.js (LTS)](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/)
- [Git](https://git-scm.com/)

---

## ⬇️ โคลนโปรเจกต์
```bash
git clone <repo-url>
cd "Vote Project"
```

---

## 🟦 ติดตั้ง & รัน Backend
ไปที่โฟลเดอร์ `backend` แล้วติดตั้งแพ็กเกจ
```bash
cd backend
npm install
```

### สร้างไฟล์ `.env`
สร้างไฟล์ `backend/.env` แล้วใส่ค่าตัวอย่างนี้ (เปลี่ยนตามเครื่องคุณ)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vote_db
JWT_SECRET=your_secret_key
```

### เตรียมฐานข้อมูล
1) เปิด MySQL แล้วสร้างฐานข้อมูลและตารางต่าง ๆ โดยนำเข้าไฟล์ `vote_db.sql`
```bash
# วิธีที่ 1: ผ่าน MySQL CLI
mysql -u root -p < vote_db.sql

# วิธีที่ 2: เข้า mysql ก่อน
mysql -u root -p
CREATE DATABASE IF NOT EXISTS vote_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vote_db;
SOURCE vote_db.sql;
```

> ถ้าคุณสร้าง DB เองแล้ว ให้ปรับชื่อ DB ให้ตรงกับ `DB_NAME` ใน `.env`

### รัน Backend
```bash
# โหมดพัฒนา (รีสตาร์ทอัตโนมัติ)
npm run dev

# โหมดปกติ
npm start
```
Backend จะรันที่ `http://localhost:5000`

---

## 🟩 ติดตั้ง & รัน Frontend
ไปที่โฟลเดอร์ `frontend` แล้วติดตั้งแพ็กเกจ
```bash
cd ../frontend
npm install
```

### รัน Frontend
```bash
npm start
```
- Frontend จะรันที่ `http://localhost:3000`
- มีการตั้งค่า proxy ไปที่ `http://localhost:5000` ไว้แล้ว (ดูใน `frontend/package.json`)

> คำสั่ง `npm start` ของ frontend จะรัน **Tailwind watcher** และ **React dev server** พร้อมกันด้วย `concurrently`

---

## 🧰 สคริปต์ที่ใช้บ่อย

### Backend
- `npm run dev` – รันด้วย nodemon (เหมาะสำหรับพัฒนา)
- `npm start` – รันปกติด้วย Node

### Frontend
- `npm start` – รันโหมดพัฒนา
- `npm run build` – สร้างไฟล์พร้อม deploy

---

## 🗄️ สคีมาฐานข้อมูล (สรุป)
มีตารางหลัก ๆ ดังนี้
- `users` – ผู้ใช้ระบบ (นักศึกษา/แอดมิน)
- `elections` – ข้อมูลการเลือกตั้ง
- `candidates` – ผู้สมัครในแต่ละการเลือกตั้ง
- `votes` – บันทึกการโหวต (1 คนโหวตได้ 1 ครั้งต่อการเลือกตั้ง)

> โครงสร้างเต็ม ๆ อยู่ในไฟล์ `schema.sql`

---

## 🔐 หมายเหตุเรื่องความปลอดภัย
- อย่า commit ไฟล์ `.env` ขึ้น Git
- ถ้าต้องสร้างผู้ใช้ admin เริ่มต้น ควร **แฮชรหัสผ่านด้วย bcrypt** ก่อนค่อย INSERT

---

## 🧪 ตัวอย่างเรียก API
ตัวอย่าง (ปรับ URL และ Token ตามจริง)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login   -H "Content-Type: application/json"   -d '{"studentId":"65000001","password":"your_password"}'

# เรียกดูรายการเลือกตั้ง (public)
curl http://localhost:5000/api/elections

# โหวต (ต้องมี Bearer Token หลังจาก login)
curl -X POST http://localhost:5000/api/votes   -H "Content-Type: application/json"   -H "Authorization: Bearer <YOUR_JWT_TOKEN>"   -d '{"election_id":1,"candidate_id":3}'
```

---

## ❓ Troubleshooting
- ถ้ารัน Backend แล้ว error เรื่องเวอร์ชัน Node ให้ใช้ Node **18+**
- เช็คพอร์ตที่ชนกัน (Frontend: 3000, Backend: 5000)
- ถ้าต่อ DB ไม่ได้ ให้ตรวจสอบ host/user/password/สิทธิ์ของ user ใน MySQL

---

## 📜 License
MIT
