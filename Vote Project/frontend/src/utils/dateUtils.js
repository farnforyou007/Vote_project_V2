// src/utils/dateUtils.js

// export const formatDate = (dateStr) => {
//     const d = new Date(dateStr);
//     return d.toLocaleDateString("th-TH", {
//         day: "2-digit",
//         month: "long",
//         year: "numeric"
//     });
// };

export const formatDate = (dateStr) => {
    if (!dateStr) return "ไม่ระบุ";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "ไม่ระบุ";

    const months = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;   // แปลงเป็น พ.ศ.
    const shortYear = year.toString().slice(-2); // เอา 2 หลักท้าย

    return `${day} ${month} ${shortYear}`;
};


export const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }) + " น.";
};

export const translateStatus = (status) => {
    switch (status) {
        case "registration": return "เปิดรับสมัคร";
        case "active": return "เปิดลงคะแนน";
        case "closed": return "ปิดลงคะแนน";
        case "completed": return "เสร็จสิ้น";
        default: return "ไม่ระบุ";
    }
};

export const formatDateTime = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

// export const formatDateTime = (dateString) => {
//     if (!dateString) return "ไม่ระบุ";

//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "ไม่ระบุ";

//     // ชื่อเดือนย่อภาษาไทย
//     const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", 
//                     "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

//     const day = date.getDate();
//     const month = months[date.getMonth()];
//     const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
//     const shortYear = year.toString().slice(-2); // ใช้เลข 2 หลัก

//     const hour = date.getHours().toString().padStart(2, "0");
//     const minute = date.getMinutes().toString().padStart(2, "0");

//     return `${day} ${month} ${shortYear} ${hour}:${minute}`;
// };

export const formatForInputDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatForBackend = (dateString) => {
    if (!dateString) return null;
    return dateString.replace("T", " ") + ":00"; // → "2025-08-17 20:30:00"
    //   const d = new Date(dateString);
    //   return d.toISOString().slice(0, 19).replace("T", " ");
};


