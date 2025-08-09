import Swal from "sweetalert2";

let isAlertingSession = false;

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        ...options?.headers,
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        // ตรวจว่าตอนนี้อยู่หน้า login มั้ย
        if (!isAlertingSession && window.location.pathname !== "/login") {
            isAlertingSession = true;
            await Swal.fire({
                icon: "warning",
                title: "เซสชันหมดอายุ",
                text: "กรุณาเข้าสู่ระบบใหม่",
                confirmButtonText: "เข้าสู่ระบบ",
            });
            localStorage.removeItem("token");
            window.location.href = "/login";
            setTimeout(() => { isAlertingSession = false }, 2000);
        }
        return null;
    }
    return res.json();
}
    