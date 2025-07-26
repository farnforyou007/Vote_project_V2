import { useState } from "react";
import logo from "../assets/logo.jfif";

export default function Header({ studentName }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    
    const handleLogout = () => {
        // ลบข้อมูลทั้งหมด
        localStorage.clear();
        // หรือแค่ลบเฉพาะ key
        // localStorage.removeItem("studentName");
        // localStorage.removeItem("userRoles");

        // ไปหน้า Login
        window.location.href = "/";
    };


    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between bg-purple-300 p-3 relative">
                {/* ซ้าย */}
                <div className="flex items-center space-x-1">
                    <button
                        className="text-2xl focus:outline-none"
                        onClick={() => setMenuOpen(true)}
                    >
                        &#9776;
                    </button>
                    <img src={logo} alt="Logo" className="w-8 h-8" />
                </div>

                {/* กลาง */}
                <div className="flex-1 flex justify-center px-2">
                    <span className="font-semibold text-sm md:text-base text-center truncate max-w-[200px] md:max-w-none">
                        ระบบการเลือกตั้งออนไลน์ วิทยาลัยอาชีวศึกษายะลา
                    </span>
                </div>

                {/* ขวา */}
                <div className="flex items-center space-x-1">
                    <span className="text-sm md:text-base truncate max-w-[80px] md:max-w-none">
                        {studentName || "ผู้ใช้งาน"}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
            </header>

            {menuOpen && (
                <>
                    <aside
                        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300`}
                    >
                        <div className="p-4 flex justify-between items-center border-b">
                            <span className="font-semibold">เมนู</span>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        <ul className="p-4 space-y-2">
                            {/* เมนูที่ทุกคนเห็น */}
                            <li>
                                <a href="/elections" className="block text-blue-500 hover:underline">
                                    หน้าหลัก
                                </a>
                            </li>

                            <li>
                                <a href="/login" className="block text-blue-500 hover:underline">
                                    เข้าสู่ระบบ
                                </a>
                            </li>


                            {/* เมนูนักศึกษา */}
                            {roles.includes("นักศึกษา") && (
                                <>
                                    <li>
                                        <a href="/my-votes" className="block text-blue-500 hover:underline">
                                            การโหวตของฉัน
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/apply-candidate" className="block text-blue-500 hover:underline">
                                            สมัครเป็นผู้สมัคร
                                        </a>
                                    </li>
                                </>
                            )}

                            {/* เมนูกรรมการ */}
                            {roles.includes("กรรมการ") && (
                                <li>
                                    <a href="/review-applications" className="block text-blue-500 hover:underline">
                                        ตรวจสอบใบสมัคร
                                    </a>
                                </li>
                            )}

                            {/* เมนูผู้ดูแล */}
                            {roles.includes("ผู้ดูแล") && (
                                <>
                                    <li>
                                        <a href="/admin/manage-users" className="block text-blue-500 hover:underline">
                                            จัดการผู้ใช้
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/admin/elections" className="block text-blue-500 hover:underline">
                                            จัดการการเลือกตั้ง
                                        </a>
                                    </li>
                                </>
                            )}

                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-red-500 hover:underline"
                                >
                                    ออกจากระบบ
                                </button>
                            </li>
                        </ul>
                    </aside>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-40 z-40"
                        onClick={() => setMenuOpen(false)}
                    />
                </>
            )}
        </>
    );
}

