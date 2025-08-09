import { FaTimesCircle, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

export default function CandidateModal({ candidate, onClose, onDelete }) {
    const handleDeleteConfirm = async () => {
        const result = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "ต้องการลบผู้สมัครคนนี้",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
        });

        if (result.isConfirmed) {
            onDelete(candidate.candidate_id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
                >
                    <FaTimesCircle size={22} />
                </button>

                <div className="flex flex-col items-center space-y-3">
                    {candidate.image_url && (
                        <img
                            src={candidate.image_url}
                            alt="รูปผู้สมัคร"
                            className="w-28 h-28 object-cover rounded-full border"
                        />
                    )}

                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-bold">{candidate.full_name}</h2>
                        <p className="text-gray-600 text-sm">รหัสนักศึกษา: {candidate.student_id}</p>
                        <p className="text-gray-600 text-sm">หมายเลขผู้สมัคร: {candidate.application_number || "-"}</p>
                        <p className="text-gray-600 text-sm">แผนก: {candidate.department_name || "-"}</p>
                        <p className="text-gray-600 text-sm">ชั้นปี: {candidate.year_name || "-"}</p>
                        <p className="text-gray-600 text-sm">สถานะ: {candidate.status}</p>
                        <p className="text-gray-600 text-sm">ผู้อนุมัติ: {candidate.reviewer_name || "-"}</p>
                        {candidate.submitted_at && (
                            <p className="text-gray-600 text-sm">
                                วันที่สมัคร: {new Date(candidate.submitted_at).toLocaleString()}
                            </p>
                        )}
                        {candidate.reviewed_at && (
                            <p className="text-gray-600 text-sm">
                                วันที่อนุมัติ: {new Date(candidate.reviewed_at).toLocaleString()}
                            </p>
                        )}
                        {candidate.reject_reason && (
                            <p className="text-red-500 text-sm">เหตุผลที่ปฏิเสธ: {candidate.reject_reason}</p>
                        )}
                    </div>

                    <div className="w-full mt-4">
                        <p className="text-sm font-semibold mb-1">นโยบาย:</p>
                        <div className="border p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                            {candidate.policy}
                        </div>
                    </div>

                    <button
                        onClick={handleDeleteConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm mt-4"
                    >
                        <FaTrash className="inline mr-2" /> ลบผู้สมัคร
                    </button>
                </div>
            </div>
        </div>
    );
}
