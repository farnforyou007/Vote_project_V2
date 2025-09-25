// // version3
// import Swal from "sweetalert2";

// let isAlertingSession = false;

// export async function apiFetch(url, options = {}) {
//   const token = sessionStorage.getItem("token") || localStorage.getItem("token");
//   const isFormData = options?.body instanceof FormData;

//   const headers = {
//     ...(options.headers || {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...(!isFormData ? { "Content-Type": "application/json" } : {}), // ห้ามใส่ตอนเป็น FormData
//   };

//   const res = await fetch(url, { ...options, headers });

//   if (res.status === 401) {
//     if (!isAlertingSession && window.location.pathname !== "/login") {
//       isAlertingSession = true;
//       await Swal.fire({
//         icon: "warning",
//         title: "เซสชันหมดอายุ",
//         text: "กรุณาเข้าสู่ระบบใหม่",
//         confirmButtonText: "เข้าสู่ระบบ",
//       });
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//       setTimeout(() => { isAlertingSession = false; }, 1500);
//     }
//     return null;
//   }

//   if (res.status === 204) return {};
//   return res.json();
// }

// version 4
// import Swal from "sweetalert2";
// import { tokenService } from "./tokenService";

// let isAlertingSession = false;

// export async function apiFetch(url, options = {}) {
//   const token = tokenService.get();
//   const isFormData = options?.body instanceof FormData;

//   const headers = {
//     ...(options.headers || {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...(!isFormData ? { "Content-Type": "application/json" } : {}), // ห้ามใส่ตอนเป็น FormData
//   };

//   const res = await fetch(url, { ...options, headers });

//   if (res.status === 401) {
//     if (!isAlertingSession && window.location.pathname !== "/login") {
//       isAlertingSession = true;
//       await Swal.fire({
//         icon: "warning",
//         title: "เซสชันหมดอายุ",
//         text: "กรุณาเข้าสู่ระบบใหม่",
//         confirmButtonText: "เข้าสู่ระบบ",
//       });
//       tokenService.remove();
//       window.location.href = "/login";
//       setTimeout(() => { isAlertingSession = false; }, 1500);
//     }
//     return null;
//   }

//   if (res.status === 204) return {};
//   return res.json();
// }


// utils/apiFetch.js
import axios from "axios";
import Swal from "sweetalert2";
import { tokenService } from "./tokenService";

let isAlertingSession = false;

// ✅ กำหนด baseURL กลาง
// const api = axios.create({
//   baseURL: "http://localhost:5000/", // เปลี่ยนทีเดียว ใช้ทุกที่
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

const API_BASE =
  process.env.REACT_APP_API_BASE || `${window.location.origin}`;

const api = axios.create({
  baseURL: API_BASE,
  
});

api.interceptors.request.use((config) => {
  const token = tokenService.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ฟังก์ชัน wrapper
export async function apiFetch(endpoint, options = {}) {
  // try {
  //   const res = await api.request({
  //     url: endpoint,               // แค่ส่ง "/users/me" ก็พอ
  //     method: options.method || "GET",
  //     data: options.body,
  //     headers: options.headers,
  //   });
  try {
    const isFormData = options.body instanceof FormData;

    const res = await api.request({
      url: endpoint,
      method: options.method || "GET",
      data: options.body,
      headers: {
        ...(options.headers || {}),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
    });

    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      if (!isAlertingSession && window.location.pathname !== "/login") {
        isAlertingSession = true;
        await Swal.fire({
          icon: "warning",
          title: "เซสชันหมดอายุ",
          text: "กรุณาเข้าสู่ระบบใหม่",
          confirmButtonText: "เข้าสู่ระบบ",
        });
        tokenService.remove();
        window.location.href = "/login";
        setTimeout(() => { isAlertingSession = false; }, 1500);
      }
      return null;
    }
    throw err;
  }
}
