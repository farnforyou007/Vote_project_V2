// src/utils/dateUtils.js

export const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
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


