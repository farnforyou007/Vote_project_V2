import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { formatDate, formatDateTime, formatTime } from "utils/dateUtils";

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

    const submittedAt = candidate.submitted_at;
    const reviewedAt = candidate.reviewed_at;

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
                                        {/* {submittedAt} */}
                                        {formatDateTime(submittedAt)}
                                    </div>
                                </div>
                            )}
                            {reviewedAt && (
                                <div>
                                    <div className="text-gray-600 text-xs mb-1">วันที่อนุมัติ</div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-2 rounded-md text-xs text-gray-700">
                                        {formatDateTime(reviewedAt)}
                                        {/* {reviewedAt} */}
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
