// import { FaTimesCircle, FaTrash } from "react-icons/fa";
// import Swal from "sweetalert2";

// // map สถานะ → badge
// const mapStatus = (raw) => {
//     const st = String(raw || "").toLowerCase();
//     if (st.includes("approved") || st === "อนุมัติ")
//         return { text: "อนุมัติแล้ว", badge: "bg-green-100 text-green-700 ring-1 ring-green-200", dot: "bg-green-500" };
//     if (st.includes("rejected") || st === "ไม่อนุมัติ")
//         return { text: "ไม่อนุมัติ", badge: "bg-red-100 text-red-700 ring-1 ring-red-200", dot: "bg-red-500" };
//     if (st.includes("revision"))
//         return { text: "รอแก้ไข", badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-200", dot: "bg-amber-500" };
//     return { text: "รอการอนุมัติ", badge: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200", dot: "bg-yellow-500" };
// };

// export default function CandidateModal({ candidate, onClose, onDelete }) {
//     const handleDeleteConfirm = async () => {
//         const result = await Swal.fire({
//             title: "คุณแน่ใจหรือไม่?",
//             text: "ต้องการลบผู้สมัครคนนี้",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonText: "ลบ",
//             cancelButtonText: "ยกเลิก",
//         });
//         if (result.isConfirmed) {
//             onDelete(candidate.candidate_id ?? candidate.application_id);
//             onClose();
//         }
//     };

//     // fallback fields
//     const fullName = candidate.full_name || candidate.name || "-";
//     const dept = candidate.department || candidate.department_name || "-";
//     const yearText = candidate.year_name || (candidate.year_number ? `ปี ${candidate.year_number}` : "-");
//     const number = candidate.number ?? candidate.application_number ?? "-";
//     const statusRaw = candidate.application_status || candidate.status || "pending";
//     const st = mapStatus(statusRaw);
//     const photoUrl = candidate.photo
//         ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}`
//         : (candidate.image_url || "https://via.placeholder.com/120");
//     const policy = candidate.policy ?? candidate.campaign_slogan ?? "-";
//     const reviewer = candidate.reviewer_name || "-";
//     const submittedAt = candidate.submitted_at ? new Date(candidate.submitted_at).toLocaleString() : null;
//     const reviewedAt = candidate.reviewed_at ? new Date(candidate.reviewed_at).toLocaleString() : null;
//     return (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
//             <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
//                 {/* Header with gradient */}
//                 <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-28 relative">
//                     <button
//                         onClick={onClose}
//                         className="absolute top-4 right-4 text-white/80 hover:text-white hover:rotate-90 transition-all duration-300 bg-white/10 rounded-full p-2 backdrop-blur-sm"
//                     >
//                         <FaTimesCircle size={22} />
//                     </button>
//                 </div>

//                 <div className="px-6 pb-6 -mt-14">
//                     {/* Profile Image */}
//                     <div className="flex justify-center mb-4">
//                         <img
//                             src={photoUrl}
//                             alt="รูปผู้สมัคร"
//                             className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-xl ring-4 ring-purple-100"
//                         />
//                     </div>

//                     {/* Name and Status */}
//                     <div className="text-center space-y-3 mb-5">
//                         <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>

//                         <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${st.badge} shadow-sm`}>
//                             <span className={`inline-block h-2.5 w-2.5 rounded-full ${st.dot} animate-pulse`} />
//                             {st.text}
//                         </span>
//                     </div>

//                     {/* Info Badges */}
//                     <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
//                         <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200">
//                             <span className="text-slate-500">รหัส:</span> {candidate.student_id || "-"}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200">
//                             <span className="text-indigo-500">หมายเลข:</span> {number}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200">
//                             {dept}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border border-cyan-200">
//                             {yearText}
//                         </span>
//                     </div>

//                     {/* Details Section */}
//                     <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
//                         <div className="space-y-2 text-sm text-gray-700">
//                             <div className="flex items-center gap-2">
//                                 <span className="font-semibold text-gray-600 min-w-[100px]">ผู้อนุมัติ:</span>
//                                 <span className="text-gray-800">{reviewer}</span>
//                             </div>
//                             {submittedAt && (
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-semibold text-gray-600 min-w-[100px]">วันที่สมัคร:</span>
//                                     <span className="text-gray-800">{submittedAt}</span>
//                                 </div>
//                             )}
//                             {reviewedAt && (
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-semibold text-gray-600 min-w-[100px]">วันที่อนุมัติ:</span>
//                                     <span className="text-gray-800">{reviewedAt}</span>
//                                 </div>
//                             )}
//                             {candidate.reject_reason && (
//                                 <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
//                                     <span className="font-semibold text-red-700">เหตุผลที่ปฏิเสธ:</span>
//                                     <p className="text-red-600 mt-1">{candidate.reject_reason}</p>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     {/* Policy Section */}
//                     <div className="mb-5">
//                         <div className="flex items-center gap-2 mb-2">
//                             <div className="h-1 w-1 rounded-full bg-indigo-600"></div>
//                             <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">นโยบาย</p>
//                         </div>
//                         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
//                             {policy}
//                         </div>
//                     </div>

//                     {/* Delete Button */}
//                     <button
//                         onClick={handleDeleteConfirm}
//                         className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-6 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
//                     >
//                         <FaTrash className="group-hover:scale-110 transition-transform duration-300" />
//                         ลบผู้สมัคร
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }


//ver2

// import { FaTimesCircle, FaTrash } from "react-icons/fa";
// import Swal from "sweetalert2";

// const mapStatus = (raw) => {
//     const st = String(raw || "").toLowerCase();
//     if (st.includes("approved") || st === "อนุมัติ")
//         return { text: "อนุมัติแล้ว", badge: "bg-green-100 text-green-700 ring-1 ring-green-200", dot: "bg-green-500" };
//     if (st.includes("rejected") || st === "ไม่อนุมัติ")
//         return { text: "ไม่อนุมัติ", badge: "bg-red-100 text-red-700 ring-1 ring-red-200", dot: "bg-red-500" };
//     if (st.includes("revision"))
//         return { text: "รอแก้ไข", badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-200", dot: "bg-amber-500" };
//     return { text: "รอการอนุมัติ", badge: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200", dot: "bg-yellow-500" };
// };

// export default function CandidateModal({ candidate, onClose, onDelete }) {
//     const handleDeleteConfirm = async () => {
//         const result = await Swal.fire({
//             title: "คุณแน่ใจหรือไม่?",
//             text: "ต้องการลบผู้สมัครคนนี้",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonText: "ลบ",
//             cancelButtonText: "ยกเลิก",
//         });
//         if (result.isConfirmed) {
//             onDelete(candidate.candidate_id ?? candidate.application_id);
//             onClose();
//         }
//     };

//     const fullName = candidate.full_name || candidate.name || "-";
//     const dept = candidate.department || candidate.department_name || "-";
//     const yearText = candidate.year_name || (candidate.year_number ? `ปี ${candidate.year_number}` : "-");
//     const number = candidate.number ?? candidate.application_number ?? "-";
//     const statusRaw = candidate.application_status || candidate.status || "pending";
//     const st = mapStatus(statusRaw);
//     const photoUrl = candidate.photo
//         ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}`
//         : (candidate.image_url || "https://via.placeholder.com/120");
//     const policy = candidate.policy ?? candidate.campaign_slogan ?? "-";
//     const reviewer = candidate.reviewer_name || "-";
//     const submittedAt = candidate.submitted_at ? new Date(candidate.submitted_at).toLocaleString() : null;
//     const reviewedAt = candidate.committee_reviewed_at
//         ? new Date(candidate.committee_reviewed_at).toLocaleString()
//         : (candidate.reviewed_at ? new Date(candidate.reviewed_at).toLocaleString() : null);

//     return (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             {/* กล่องโมดอล: เล็กลง + สกอลได้ แต่ไม่มีหัวสีม่วงมาบังรูป */}
//             <div className="bg-white rounded-2xl w-full max-w-lg md:max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl relative">
//                 {/* ปุ่มปิด ลอยอยู่มุมขวาบน */}
//                 <button
//                     onClick={onClose}
//                     className="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition-colors"
//                     aria-label="close"
//                 >
//                     <FaTimesCircle size={20} />
//                 </button>

//                 {/* เนื้อหา */}
//                 <div className="px-6 py-6">
//                     {/* รูปอยู่บนสุด ไม่ถูกบัง */}
//                     <div className="flex justify-center mb-3">
//                         <img
//                             src={photoUrl}
//                             alt="รูปผู้สมัคร"
//                             loading="lazy"
//                             className="w-24 h-24 object-cover object-center rounded-full border-4 border-white shadow-xl ring-2 ring-purple-100"
//                         />
//                     </div>

//                     {/* ชื่อ + สถานะ */}
//                     <div className="text-center space-y-2 mb-4">
//                         <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
//                         <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${st.badge} shadow-sm`}>
//                             <span className={`inline-block h-2 w-2 rounded-full ${st.dot}`} />
//                             {st.text}
//                         </span>
//                     </div>

//                     {/* แท็กข้อมูล */}
//                     <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
//                         <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
//                             <span className="text-slate-500">รหัส:</span> {candidate.student_id || "-"}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
//                             <span className="text-indigo-500">หมายเลข:</span> {number}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
//                             {dept}
//                         </span>
//                         <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
//                             {yearText}
//                         </span>
//                     </div>

//                     {/* รายละเอียดย่อ */}
//                     <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
//                         <div className="space-y-1.5 text-sm text-gray-700">
//                             <div className="flex items-center gap-2">
//                                 <span className="font-semibold text-gray-600 min-w-[92px]">ผู้อนุมัติ:</span>
//                                 <span className="text-gray-800">{reviewer}</span>
//                             </div>
//                             {submittedAt && (
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-semibold text-gray-600 min-w-[92px]">วันที่สมัคร:</span>
//                                     <span className="text-gray-800">{submittedAt}</span>
//                                 </div>
//                             )}
//                             {reviewedAt && (
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-semibold text-gray-600 min-w-[92px]">วันที่อนุมัติ:</span>
//                                     <span className="text-gray-800">{reviewedAt}</span>
//                                 </div>
//                             )}
//                             {candidate.reject_reason && (
//                                 <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
//                                     <span className="font-semibold text-red-700">เหตุผลที่ปฏิเสธ:</span>
//                                     <p className="text-red-600 mt-1">{candidate.reject_reason}</p>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     {/* นโยบาย */}
//                     <div className="mb-4">
//                         <p className="text-sm font-semibold mb-1">นโยบาย:</p>
//                         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-3 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
//                             {policy}
//                         </div>
//                     </div>

//                     {/* ปุ่มลบ */}
//                     <button
//                         onClick={handleDeleteConfirm}
//                         className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
//                     >
//                         <FaTrash className="inline mr-2" />
//                         ลบผู้สมัคร
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );

// }


// ver3
// CandidateModal.jsx (เวอร์ชันแก้ไข)
// import { FaTrash } from "react-icons/fa";
// import Swal from "sweetalert2";

// const statusPill = (raw) => {
//     const st = String(raw || "").toLowerCase();
//     if (st.includes("approved") || st === "อนุมัติ") {
//         return { text: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" };
//     }
//     if (st.includes("rejected") || st === "ไม่อนุมัติ") {
//         return { text: "ไม่อนุมัติ", cls: "bg-red-100 text-red-700" };
//     }
//     if (st.includes("revision")) {
//         return { text: "รอแก้ไข", cls: "bg-amber-100 text-amber-700" };
//     }
//     return { text: "รอการอนุมัติ", cls: "bg-amber-100 text-amber-700" };
// };

// export default function CandidateModal({ candidate, onClose, onDelete }) {
//     if (!candidate) return null;

//     const fullName = candidate.full_name || candidate.name || "-";
//     const dept = candidate.department || candidate.department_name || "-";
//     const level = candidate.level_name || "-";
//     // ✅ เพิ่มเงื่อนไข fallback ให้ field year_number
//     const year = candidate.year_name || "-";
//     const studentId = candidate.student_id || "-";
//     // ✅ เพิ่ม fallback email_address
//     const email = candidate.email || candidate.email_address || "-";
//     const number = candidate.number ?? candidate.application_number ?? "-";
//     const policy = candidate.policy ?? candidate.campaign_slogan ?? "-";
//     const statusRaw = candidate.application_status || candidate.status || "pending";
//     const pill = statusPill(statusRaw);

//     const rejectionReason = candidate.rejection_reason || candidate.reject_reason || null;

//     const submittedAt = candidate.submitted_at
//         ? new Date(candidate.submitted_at).toLocaleString()
//         : null;
//     const reviewedAt = candidate.reviewed_at
//         ? new Date(candidate.reviewed_at).toLocaleString()
//         : null;

//     const photoUrl = candidate.photo
//         ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}`
//         : candidate.image_url || "https://via.placeholder.com/100";

//     const handleDeleteConfirm = async () => {
//         const ok = await Swal.fire({
//             title: "คุณแน่ใจหรือไม่?",
//             text: "ต้องการลบผู้สมัครคนนี้",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonText: "ลบ",
//             cancelButtonText: "ยกเลิก",
//             confirmButtonColor: "#d33",
//         });
//         if (ok.isConfirmed) {
//             onDelete?.(candidate.candidate_id ?? candidate.application_id);
//             onClose?.();
//         }
//     };

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//             <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg relative">
//                 <button
//                     className="absolute right-3 top-3 text-slate-500 hover:text-red-500"
//                     onClick={onClose}
//                     aria-label="close"
//                 >
//                     ✕
//                 </button>

//                 <div className="space-y-4">
//                     <h3 className="text-xl font-bold">รายละเอียดผู้สมัคร</h3>

//                     <div className="flex justify-center">
//                         <img
//                             src={photoUrl}
//                             alt="avatar"
//                             className="w-24 h-24 rounded-full object-cover border-4 border-purple-400"
//                         />
//                     </div>

//                     <div>
//                         <span
//                             className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pill.cls}`}
//                         >
//                             สถานะ: {pill.text}
//                         </span>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
//                         <div>
//                             <div className="text-slate-500">ชื่อ - สกุล</div>
//                             <div className="bg-purple-50 p-2 rounded">{fullName}</div>
//                         </div>
//                         <div>
//                             <div className="text-slate-500">รหัสนักศึกษา</div>
//                             <div className="bg-purple-50 p-2 rounded">{studentId}</div>
//                         </div>
//                         <div>
//                             <div className="text-slate-500">อีเมล</div>
//                             <div className="bg-purple-50 p-2 rounded">{email}</div>
//                         </div>

//                         <div>
//                             <div className="text-slate-500">ระดับ</div>
//                             <div className="bg-purple-50 p-2 rounded">{level}</div>
//                         </div>
//                         <div>
//                             <div className="text-slate-500">ปี</div>
//                             <div className="bg-purple-50 p-2 rounded">{year}</div>
//                         </div>
//                         <div>
//                             <div className="text-slate-500">แผนก</div>
//                             <div className="bg-purple-50 p-2 rounded">{dept}</div>
//                         </div>

//                         <div className="md:col-span-3">
//                             <div className="text-slate-500">หมายเลขผู้สมัคร</div>
//                             <div className="bg-purple-50 p-2 rounded">{number}</div>
//                         </div>

//                         <div className="md:col-span-3">
//                             <div className="text-slate-500">นโยบาย</div>
//                             <div className="bg-purple-50 p-2 rounded whitespace-pre-wrap">
//                                 {policy}
//                             </div>
//                         </div>

//                         {rejectionReason && (
//                             <div className="md:col-span-3 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
//                                 <strong>เหตุผลที่ไม่อนุมัติ:</strong> {rejectionReason}
//                             </div>
//                         )}


//                     </div>

//                     {(submittedAt || reviewedAt) && (
//                         <>
//                             {submittedAt && (
//                                 <div>
//                                     <div className="text-slate-500">วันที่สมัคร</div>
//                                     <div className="bg-purple-50 p-2 rounded">{submittedAt}</div>
//                                 </div>
//                             )}
//                             {reviewedAt && (
//                                 <div>
//                                     <div className="text-slate-500">วันที่อนุมัติ</div>
//                                     <div className="bg-purple-50 p-2 rounded">{reviewedAt}</div>
//                                 </div>
//                             )}
//                         </>
//                     )}


//                 <div className="flex justify-end">
//                     <button
//                         onClick={handleDeleteConfirm}
//                         className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                     >
//                         <FaTrash /> ลบผู้สมัคร
//                     </button>
//                 </div>
//             </div>
//         </div>
//         </div >
//     );
// }


// ver4
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

const statusPill = (raw) => {
    const st = String(raw || "").toLowerCase();
    if (st.includes("approved") || st === "อนุมัติ")
        return { text: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" };
    if (st.includes("rejected") || st === "ไม่อนุมัติ")
        return { text: "ไม่อนุมัติ", cls: "bg-red-100 text-red-700" };
    if (st.includes("revision"))
        return { text: "รอแก้ไข", cls: "bg-amber-100 text-amber-700" };
    return { text: "รอการอนุมัติ", cls: "bg-yellow-100 text-yellow-800" };
};

export default function CandidateModal({ candidate, onClose, onDelete }) {
    if (!candidate) return null;

    const fullName = candidate.full_name || candidate.name || "-";
    const dept = candidate.department || candidate.department_name || "-";
    const level = candidate.level_name || "-";
    const year = candidate.year_name || "-";
    const studentId = candidate.student_id || "-";
    const email = candidate.email || candidate.email_address || "-";
    const number = candidate.number ?? candidate.application_number ?? "-";
    const policy = candidate.policy ?? candidate.campaign_slogan ?? "-";
    const statusRaw = candidate.application_status || candidate.status || "pending";
    const pill = statusPill(statusRaw);

    const rejectionReason =
        candidate.rejection_reason || candidate.reject_reason || null;

    const submittedAt = candidate.submitted_at
        ? new Date(candidate.submitted_at).toLocaleString()
        : null;
    const reviewedAt = candidate.reviewed_at
        ? new Date(candidate.reviewed_at).toLocaleString()
        : null;

    const photoUrl = candidate.photo
        ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}`
        : candidate.image_url || "https://via.placeholder.com/100";

    const handleDeleteConfirm = async () => {
        const ok = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "ต้องการลบผู้สมัครคนนี้",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#d33",
        });
        if (ok.isConfirmed) {
            onDelete?.(candidate.candidate_id ?? candidate.application_id);
            onClose?.();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {/* <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative"> */}
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">

                {/* ปุ่มปิด */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-red-500"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    รายละเอียดผู้สมัคร
                </h3>

                {/* รูปภาพ */}
                <div className="flex justify-center mb-3">
                    <img
                        src={photoUrl}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-300 shadow-md"
                    />
                </div>

                {/* ป้ายสถานะ */}
                <div className="text-center mb-5">
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pill.cls}`}
                    >
                        สถานะ: {pill.text}
                    </span>
                </div>

                {/* เนื้อหาข้อมูลทั้งหมด */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {[
                        ["ชื่อ - สกุล", fullName],
                        ["รหัสนักศึกษา", studentId],
                        ["อีเมล", email],
                        ["ระดับ", level],
                        ["ปี", year],
                        ["แผนก", dept],
                        ["หมายเลขผู้สมัคร", number],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <div className="text-gray-600 text-xs mb-1">{label}</div>
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-2 rounded-md shadow-sm">
                                {value}
                            </div>
                        </div>
                    ))}

                    <div className="md:col-span-3">
                        <div className="text-gray-600 text-xs mb-1">นโยบาย</div>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-3 rounded-md shadow-sm whitespace-pre-wrap leading-relaxed">
                            {policy}
                        </div>
                    </div>

                    {rejectionReason && (
                        <div className="md:col-span-3 bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-700 shadow-sm">
                            <strong>เหตุผลที่ไม่อนุมัติ:</strong> {rejectionReason}
                        </div>
                    )}

                    {/* วันที่สมัคร / วันที่อนุมัติ */}
                    {(submittedAt || reviewedAt) && (
                        <>
                            {submittedAt && (
                                <div>
                                    <div className="text-gray-600 text-xs mb-1">วันที่สมัคร</div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-2 rounded-md text-xs text-gray-700">
                                        {submittedAt}
                                    </div>
                                </div>
                            )}
                            {reviewedAt && (
                                <div>
                                    <div className="text-gray-600 text-xs mb-1">วันที่อนุมัติ</div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-2 rounded-md text-xs text-gray-700">
                                        {reviewedAt}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ปุ่มลบ */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleDeleteConfirm}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 px-5 py-2.5 text-white text-sm font-semibold shadow-md transition-all"
                    >
                        <FaTrash className="text-white" /> ลบผู้สมัคร
                    </button>
                </div>
            </div>
        </div>
    );
}
