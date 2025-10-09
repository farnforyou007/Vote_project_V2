import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { tokenService } from "../utils/tokenService";

export default function Login() {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ studentId: "", password: "" });
    const [general, setGeneral] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const base =
        "w-full block rounded-xl border px-4 py-3 bg-white/90 backdrop-blur focus:outline-none focus:ring-2";
    const idClass =
        base + (errors.studentId ? " border-red-400 focus:ring-red-300" : " border-purple-200 focus:ring-purple-300");
    const pwClass =
        base + (errors.password ? " border-red-400 focus:ring-red-300" : " border-purple-200 focus:ring-purple-300");

    const handleLogin = async (e) => {
        e.preventDefault();
        setGeneral("");
        setErrors({ studentId: "", password: "" });

        // validate เบื้องต้น
        const v = {};
        if (!studentId.trim()) v.studentId = "กรอกรหัสนักศึกษา";
        if (!password) v.password = "กรอกรหัสผ่าน";
        if (Object.keys(v).length) return setErrors(v);

        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: studentId.trim(), password }),
            });

            let data = {};
            try { data = await res.json(); } catch { }



            if (res.ok && data?.success) {
                tokenService.set(data.token);
                // const to = location.state?.redirect || "/elections";
                // navigate(to, { replace: true });
                const onLoginSuccess = () => {
                    const saved = sessionStorage.getItem("returnTo");
                    if (saved) {
                        sessionStorage.removeItem("returnTo");
                        navigate(saved, { replace: true });
                    } else {
                        // fallback มายัง state.from ถ้าใช้วิธี A ด้วย
                        const from = location.state?.from;
                        navigate(from || "/", { replace: true });
                    }
                };
                onLoginSuccess();
                return;
            }

            const msg = (data?.message || "").toLowerCase();
            if (res.status === 404 || msg.includes("ไม่พบ") || msg.includes("not found")) {
                setErrors((p) => ({ ...p, studentId: "ไม่พบรหัสนักศึกษานี้" }));
            } else if (res.status === 401 || msg.includes("password") || msg.includes("รหัสผ่าน")) {
                setErrors((p) => ({ ...p, password: "รหัสผ่านไม่ถูกต้อง" }));
            } else {
                setGeneral(data?.message || "เข้าสู่ระบบไม่สำเร็จ");
            }
        } catch {
            setGeneral("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            {/* พื้นหลังไล่เฉด + ลวดลายเบาๆ */}
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-t from-purple-300 via-white to-purple-200">
                <div className="w-full max-w-md">
                    {/* การ์ด */}
                    <div className="bg-white/95 shadow-xl rounded-2xl p-8 ring-1 ring-purple-100">
                        <h1 className="text-center text-2xl font-bold text-purple-700">เข้าสู่ระบบ</h1>
                        <p className="text-center text-sm text-gray-500 mt-1">ระบบการเลือกตั้งออนไลน์ วิทยาลัยอาชีวศึกษา</p>

                        {general && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                                {general}
                            </div>
                        )}

                        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                            {/* Student ID */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">รหัสนักศึกษา / ชื่อผู้ใช้</label>
                                <input
                                    type="text"
                                    placeholder="ชื่อผู้ใช้ / รหัสนักศึกษา"
                                    value={studentId}
                                    onChange={(e) => {
                                        setStudentId(e.target.value);
                                        if (errors.studentId) setErrors((p) => ({ ...p, studentId: "" }));
                                    }}
                                    className={idClass}
                                    aria-invalid={!!errors.studentId}
                                    aria-describedby="studentId-error"
                                />
                                {errors.studentId && (
                                    <p id="studentId-error" className="mt-1 text-xs text-red-600">
                                        {errors.studentId}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                                <input
                                    type="password"
                                    placeholder="กรอกรหัสผ่าน"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                                    }}
                                    className={pwClass}
                                    aria-invalid={!!errors.password}
                                    aria-describedby="password-error"
                                />
                                {errors.password && (
                                    <p id="password-error" className="mt-1 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full rounded-xl py-3 font-semibold text-white shadow-sm transition
                ${loading ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
                            >
                                {loading ? "กำลังเข้าสู่ระบบ..." : "ล็อกอิน"}
                            </button>

                            <div className="text-right">
                                <button type="button" className="text-sm text-purple-600 hover:underline">
                                    ลืมรหัสผ่าน
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ข้อความลิขสิทธิ์เล็กๆ */}
                    <p className="text-center text-xs text-gray-400 mt-4">© {new Date().getFullYear()} College Election System</p>
                </div>
            </main>
        </>
    );
}








// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import Header from "../components/Header";
// import { tokenService } from "../utils/tokenService";

// export default function Login() {
//     const [studentId, setStudentId] = useState("");
//     const [password, setPassword] = useState("");
//     const [errors, setErrors] = useState({ studentId: "", password: "" });
//     const [general, setGeneral] = useState("");
//     const [loading, setLoading] = useState(false);

//     const navigate = useNavigate();
//     const location = useLocation();

//     const baseInput =
//         " w-full flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 bg-white";
//     const idClass =
//         baseInput +
//         (errors.studentId ? "w-full  border-red-500 focus:ring-red-300" : " focus:ring-blue-500");
//     const pwClass =
//         baseInput +
//         (errors.password ? " w-full border-red-500 focus:ring-red-300" : " focus:ring-blue-500");

//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setGeneral("");
//         setErrors({ studentId: "", password: "" });

//         // validate ด่านหน้า
//         const v = {};
//         if (!studentId.trim()) v.studentId = "กรอกรหัสนักศึกษา";
//         if (!password) v.password = "กรอกรหัสผ่าน";
//         if (Object.keys(v).length) {
//             setErrors(v);
//             return;
//         }

//         try {
//             setLoading(true);
//             const res = await fetch("http://localhost:5000/api/users/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ student_id: studentId.trim(), password }),
//             });

//             // พยายามอ่าน body (บางกรณี backend อาจไม่ส่ง JSON ตอน error)
//             let data = null;
//             try { data = await res.json(); } catch { data = {}; }

//             if (res.ok && data?.success) {
//                 tokenService.set(data.token);
//                 const to = location.state?.redirect || "/elections";
//                 navigate(to, { replace: true });
//                 return;
//             }

//             // map error -> แสดงใต้ช่องที่เกี่ยวข้อง
//             const msg = (data?.message || "").toLowerCase();
//             if (res.status === 404 || msg.includes("ไม่พบ") || msg.includes("not found")) {
//                 setErrors((p) => ({ ...p, studentId: "ไม่พบรหัสนักศึกษานี้" }));
//             } else if (res.status === 401 || msg.includes("รหัสผ่าน") || msg.includes("password")) {
//                 setErrors((p) => ({ ...p, password: "รหัสผ่านไม่ถูกต้อง" }));
//             } else {
//                 setGeneral(data?.message || "เข้าสู่ระบบไม่สำเร็จ");
//             }
//         } catch (err) {
//             console.error(err);
//             setGeneral("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <>
//             <Header studentName="ชื่อผู้ใช้งาน" />

//             <main className="min-h-screen flex items-center justify-center bg-purple-100">
//                 <div className="bg-violet-200 rounded shadow p-6 w-full max-w-sm">
//                     <h2 className="text-center text-lg font-bold mb-4">เข้าสู่ระบบ</h2>

//                     {general && (
//                         <div className="mb-3 text-sm text-red-600">{general}</div>
//                     )}

//                     <form className="space-y-4" onSubmit={handleLogin}>
//                         {/* student_id */}
//                         <div className="flex items-start space-x-2">
//                             <svg className="w-6 h-6 text-black mt-2" fill="currentColor" viewBox="0 0 24 24">
//                                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
//                             </svg>
//                             <div className="flex-1">
//                                 <input
//                                     type="text"
//                                     placeholder="รหัสนักศึกษา"
//                                     value={studentId}
//                                     onChange={(e) => {
//                                         setStudentId(e.target.value);
//                                         if (errors.studentId) setErrors((p) => ({ ...p, studentId: "" }));
//                                     }}
//                                     className={idClass}
//                                     aria-invalid={!!errors.studentId}
//                                     aria-describedby="studentId-error"
//                                 />
//                                 {errors.studentId && (
//                                     <p id="studentId-error" className="mt-1 text-xs text-red-600">
//                                         {errors.studentId}
//                                     </p>
//                                 )}
//                             </div>
//                         </div>

//                         {/* password */}
//                         <div className="flex items-start space-x-2">
//                             <svg className="w-6 h-6 text-black mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2v1h4v-1z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13h14v7H5z" />
//                             </svg>
//                             <div className="flex-1">
//                                 <input
//                                     type="password"
//                                     placeholder="รหัสผ่าน"
//                                     value={password}
//                                     onChange={(e) => {
//                                         setPassword(e.target.value);
//                                         if (errors.password) setErrors((p) => ({ ...p, password: "" }));
//                                     }}
//                                     className={pwClass}
//                                     aria-invalid={!!errors.password}
//                                     aria-describedby="password-error"
//                                 />
//                                 {errors.password && (
//                                     <p id="password-error" className="mt-1 text-xs text-red-600">
//                                         {errors.password}
//                                     </p>
//                                 )}
//                             </div>
//                         </div>

//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className={`w-full text-white py-2 rounded ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}`}
//                         >
//                             {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
//                         </button>

//                         <div className="text-right">
//                             <a href="#" className="text-sm text-blue-500 hover:underline">
//                                 ลืมรหัสผ่าน
//                             </a>
//                         </div>
//                     </form>
//                 </div>
//             </main>
//         </>
//     );
// }





// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header"; //
// import { tokenService } from "../utils/tokenService";

// export default function Login() {
//     // const [menuOpen, setMenuOpen] = useState(false);
//     const [studentId, setStudentId] = useState(""); // เพิ่ม state สำหรับรหัสนักศึกษา
//     const [password, setPassword] = useState("");   // เพิ่ม state สำหรับรหัสผ่าน
//     const navigate = useNavigate();

//     // ฟังก์ชันสำหรับล็อกอิน
//     const handleLogin = async (e) => {
//         e.preventDefault();
//         try {
//             const res = await fetch("http://localhost:5000/api/users/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     student_id: studentId,
//                     password: password,
//                 }),
//             });
//             const data = await res.json();
//             if (data.success) {
//                 // ✅ เก็บชื่อที่ API ส่งมา
//                 // localStorage.removeItem("token");
//                 // localStorage.setItem("token", data.token);
//                 // console.log("Token ที่เก็บหลัง login", localStorage.getItem("token"));
//                 // localStorage.setItem("studentName", data.student_name);
//                 // localStorage.setItem("userRoles", JSON.stringify(data.roles));
//                 // localStorage.setItem("student_id", data.student_id);
//                 // localStorage.setItem("first_name", data.first_name);
//                 // localStorage.setItem("last_name", data.last_name);
//                 // localStorage.setItem("email", data.email);
//                 // localStorage.setItem("department", data.department); // จะเป็นชื่อ เช่น "เทคโนโลยีสารสนเทศ"
//                 // localStorage.setItem("year_level", data.year_level);
//                 // sessionStorage.setItem("token", data.token)
//                 tokenService.set(data.token);
//                 navigate("/elections");

//             } else {
//                 alert(data.message);
//             }
//         } catch (err) {
//             console.error(err);
//             alert("เกิดข้อผิดพลาดกับ server");
//         }
//     };


//     return (
//         <>
//             {/* ✅ Header Component */}
//             <Header studentName="ชื่อผู้ใช้งาน" />
//             {/* Main Content */}
//             <main className="min-h-screen flex items-center justify-center bg-purple-100">
//                 <div className="bg-white rounded shadow p-6 w-full max-w-sm">
//                     <h2 className="text-center text-lg font-bold mb-4">เข้าสู่ระบบ</h2>
//                     <form className="space-y-4" onSubmit={handleLogin}>
//                         <div className="flex items-center space-x-2">
//                             <svg
//                                 className="w-6 h-6 text-gray-400"
//                                 fill="currentColor"
//                                 viewBox="0 0 24 24"
//                             >
//                                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
//                             </svg>
//                             <input
//                                 type="text"
//                                 placeholder="รหัสนักศึกษา"
//                                 value={studentId}
//                                 onChange={(e) => setStudentId(e.target.value)}
//                                 className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             />
//                         </div>
//                         <div className="flex items-center space-x-2">
//                             <svg
//                                 className="w-6 h-6 text-gray-400"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                             >
//                                 <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth="2"
//                                     d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2v1h4v-1z"
//                                 />
//                                 <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth="2"
//                                     d="M5 13h14v7H5z"
//                                 />
//                             </svg>
//                             <input
//                                 type="password"
//                                 placeholder="รหัสผ่าน"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             />
//                         </div>
//                         <button
//                             type="submit"
//                             className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500"
//                         >
//                             ล็อกอิน
//                         </button>
//                         <div className="text-right">
//                             <a href="#" className="text-sm text-blue-500 hover:underline">
//                                 ลืมรหัสผ่าน
//                             </a>
//                         </div>
//                     </form>
//                 </div>
//             </main>
//         </>
//     );
// }
