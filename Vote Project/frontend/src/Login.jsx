import { useState } from "react";

import { useNavigate } from "react-router-dom";
import Header from "./components/Header"; //


export default function Login() {
    // const [menuOpen, setMenuOpen] = useState(false);
    const [studentId, setStudentId] = useState(""); // เพิ่ม state สำหรับรหัสนักศึกษา
    const [password, setPassword] = useState("");   // เพิ่ม state สำหรับรหัสผ่าน
    const navigate = useNavigate();

    // ฟังก์ชันสำหรับล็อกอิน
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentId,
                    password: password,
                }),
            });
            const data = await res.json();
            if (data.success) {
                // ✅ เก็บชื่อที่ API ส่งมา
                localStorage.removeItem("token");
                localStorage.setItem("token", data.token);
                console.log("Token ที่เก็บหลัง login", localStorage.getItem("token"));
                localStorage.setItem("studentName", data.student_name);
                localStorage.setItem("userRoles", JSON.stringify(data.roles));
                localStorage.setItem("student_id", data.student_id);
                localStorage.setItem("first_name", data.first_name);
                localStorage.setItem("last_name", data.last_name);
                localStorage.setItem("email", data.email);
                localStorage.setItem("department", data.department); // จะเป็นชื่อ เช่น "เทคโนโลยีสารสนเทศ"
                localStorage.setItem("year_level", data.year_level);

                navigate("/elections");

            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดกับ server");
        }
    };


    return (
        <>
            {/* ✅ Header Component */}
            <Header studentName="ชื่อผู้ใช้งาน" />
            {/* Main Content */}
            <main className="min-h-screen flex items-center justify-center bg-purple-100">
                <div className="bg-white rounded shadow p-6 w-full max-w-sm">
                    <h2 className="text-center text-lg font-bold mb-4">เข้าสู่ระบบ</h2>
                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="flex items-center space-x-2">
                            <svg
                                className="w-6 h-6 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="รหัสนักศึกษา"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2v1h4v-1z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13h14v7H5z"
                                />
                            </svg>
                            <input
                                type="password"
                                placeholder="รหัสผ่าน"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500"
                        >
                            ล็อกอิน
                        </button>
                        <div className="text-right">
                            <a href="#" className="text-sm text-blue-500 hover:underline">
                                ลืมรหัสผ่าน
                            </a>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
