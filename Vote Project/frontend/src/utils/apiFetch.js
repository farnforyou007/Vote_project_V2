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
import Swal from "sweetalert2";
import { tokenService } from "./tokenService";

let isAlertingSession = false;

export async function apiFetch(url, options = {}) {
  const token = tokenService.get();
  const isFormData = options?.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}), // ห้ามใส่ตอนเป็น FormData
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
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

  if (res.status === 204) return {};
  return res.json();
}
