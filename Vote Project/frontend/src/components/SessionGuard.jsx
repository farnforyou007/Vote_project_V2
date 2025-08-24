// import { useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import { isTokenExpired } from "../utils/auth";
// import { apiFetch } from "../utils/apiFetch";

// export default function SessionGuard() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const checkingRef = useRef(false);

//     // ฟังก์ชันเช็กศูนย์กลาง (เรียกทั้งตอนเปลี่ยนหน้า และตอน interval)
//     const ensureSession = async () => {
//         if (checkingRef.current) return;
//         checkingRef.current = true;

//         try {
//             const token = localStorage.getItem("token");
//             if (!token) return; // ยังไม่ล็อกอินก็ปล่อย

//             // 1) เช็กเวลา exp ใน JWT ก่อน
//             if (isTokenExpired(token)) {
//                 await Swal.fire({
//                     icon: "warning",
//                     title: "เซสชันหมดอายุ",
//                     text: "กรุณาเข้าสู่ระบบใหม่",
//                     confirmButtonText: "เข้าสู่ระบบ",
//                 });
//                 localStorage.removeItem("token");
//                 navigate("/login");
//                 return;
//             }

//             // 2) ping server เบา ๆ (เช่น /api/ping หรือ /api/me) เพื่อให้ apiFetch จัดการ 401 ด้วย
//             const ok = await apiFetch("http://localhost:5000/api/ping"); // ทำ endpoint เบา ๆ ไว้ตอบ 200
//             if (ok === null) {
//                 // apiFetch จะเด้ง+redirect ให้แล้ว
//                 return;
//             }
//         } finally {
//             checkingRef.current = false;
//         }
//     };

//     // A) เช็กทุกครั้งที่ "เปลี่ยนหน้า"
//     useEffect(() => {
//         ensureSession();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [location.pathname]);

//     // B) เช็ก "อัตโนมัติเป็นระยะ ๆ" (เช่น ทุก 5 นาที)
//     useEffect(() => {
//         const id = setInterval(() => ensureSession(), 5 * 60 * 1000);
//         return () => clearInterval(id);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     return null; // ไม่ต้องแสดงอะไร แค่วิ่ง logic
// }

// ver2
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { isTokenExpired } from "../utils/auth";
import { apiFetch } from "../utils/apiFetch";
import { tokenService } from "../utils/tokenService";

export default function SessionGuard() {
    const location = useLocation();
    const navigate = useNavigate();
    const checkingRef = useRef(false);

    // เช็กเซสชันแบบศูนย์กลาง (เรียกเวลาย้ายหน้า + interval)
    const ensureSession = async () => {
        if (checkingRef.current) return;
        checkingRef.current = true;

        try {
            const token = tokenService.get();
            if (!token) return; // ยังไม่ล็อกอินก็ข้าม

            // 1) เช็ก exp ใน JWT ก่อน เพื่อลด 401
            if (isTokenExpired(token)) {
                await Swal.fire({
                    icon: "warning",
                    title: "เซสชันหมดอายุ",
                    text: "กรุณาเข้าสู่ระบบใหม่",
                    confirmButtonText: "เข้าสู่ระบบ",
                });
                tokenService.remove();           // ใช้ tokenService ไม่แตะ localStorage ตรงๆ
                navigate("/login");
                return;
            }

            // 2) ping เบาๆ ให้ apiFetch จัดการ 401 ถ้ามี
            const ok = await apiFetch("/api/users/me");
            if (ok === null) {
                // apiFetch จะขึ้นแจ้งเตือนและพาไป /login เองแล้ว
                return;
            }
        } finally {
            checkingRef.current = false;
        }
    };

    // A) เช็กทุกครั้งที่เปลี่ยนหน้า
    useEffect(() => {
        ensureSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // B) เช็กอัตโนมัติเป็นระยะ (ทุก 5 นาที)
    useEffect(() => {
        const id = setInterval(() => ensureSession(), 5 * 60 * 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null; // ไม่แสดงอะไร แค่วิ่งตรวจก็พอ
}
