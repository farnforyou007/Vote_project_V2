/// 📌 เรียก dotenv ก่อนทุกอย่าง
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = require('./models/db');

// ✅ DEBUG log ตรวจว่า server เริ่มแล้ว
console.log("✅ SERVER STARTED @", new Date().toLocaleString());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- CORS --------------------
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
    credentials: true
}));

// -------------------- Middleware --------------------
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// -------------------- Routes --------------------
const userRoutes = require('./routes/user.routes');
const electionRoutes = require('./routes/election.routes');
const eligibilityRoutes = require('./routes/eligibility.routes');
const applicationRoutes = require('./routes/application.routes');
const candidateRoutes = require('./routes/candidate.routes');
const voteRoutes = require('./routes/vote.routes');
const pingRoutes = require("./routes/ping.routes");
const dashboardRoutes = require('./routes/dashboard.routes');
const electionResult = require('./routes/electionResult.routes');

app.use('/api/dashboard', dashboardRoutes);
app.use('/api', electionResult);


app.use("/api", pingRoutes);

app.use('/api', candidateRoutes);
app.use('/api', voteRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/students ', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api', eligibilityRoutes);

app.use('/api', applicationRoutes);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
