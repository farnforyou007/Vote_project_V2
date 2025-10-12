// src/components/CandidateDetailModal.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "utils/apiFetch";
import { fillApplicationForm } from "utils/fillApplicationForm";

export default function CandidateDetailModal({ applicationId, onClose, onChanged }) {
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadDetail = async () => {
        setLoading(true);
        const data = await apiFetch(`/api/applications/${applicationId}`);
        setCandidate(data || null);
        setLoading(false);
    };
    useEffect(() => { loadDetail(); /* eslint-disable-next-line */ }, [applicationId]);

    const approve = async () => {
        const ok = await Swal.fire({ title: "ยืนยันการอนุมัติ?", icon: "question", showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก" });
        if (!ok.isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}/approve`, { method: "POST" });
        if (res) {
            Swal.fire("สำเร็จ", "ผู้สมัครได้รับการอนุมัติแล้ว", "success");
            setCandidate((c) => ({ ...c, application_status: "approved", number: res.number }));
            onChanged?.({ application_id: applicationId, application_status: "approved", number: res.number });
        }
    };

    const reject = async () => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: "ปฏิเสธการอนุมัติ",
            input: "textarea",
            inputLabel: "ระบุเหตุผล",
            inputPlaceholder: "เช่น เอกสารไม่ครบถ้วน...",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            inputValidator: (v) => (!v?.trim() ? "กรุณาระบุเหตุผล" : undefined),
        });
        if (!isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
        });
        if (res) {
            Swal.fire("บันทึกแล้ว", "ผู้สมัครถูกปฏิเสธ", "success");
            setCandidate((c) => ({
                ...c,
                application_status: "rejected",
                rejection_reason: reason,
                rejection_count: (c?.rejection_count || 0) + 1,
            }));
            onChanged?.({ application_id: applicationId, application_status: "rejected", rejection_reason: reason });
        }
    };

    const remove = async () => {
        const ok = await Swal.fire({ title: "ลบผู้สมัครนี้?", text: "การลบไม่สามารถย้อนกลับได้", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก" });
        if (!ok.isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}`, { method: "DELETE" });
        if (res) {
            Swal.fire("ลบสำเร็จ", "ผู้สมัครถูกลบแล้ว", "success");
            onChanged?.({ application_id: applicationId, deleted: true });
            onClose();
        }
    };

    const downloadPDF = async () => {
        try {
            await fillApplicationForm(candidate);
        } catch {
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถดาวน์โหลดใบสมัครได้", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg relative">
                <button className="absolute right-3 top-3 text-slate-500 hover:text-red-500" onClick={onClose}>✕</button>

                {loading ? (
                    <div className="py-10 text-center text-slate-600">กำลังโหลด...</div>
                ) : !candidate ? (
                    <div className="py-10 text-center text-red-500">ไม่พบข้อมูล</div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">รายละเอียดผู้สมัคร</h3>

                        <div className="flex justify-center">
                            <img
                                src={candidate.photo ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}` : "https://via.placeholder.com/100"}
                                alt="avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-purple-400"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div><div className="text-slate-500">ชื่อ - สกุล</div><div className="bg-purple-50 p-2 rounded">{candidate.name || "-"}</div></div>
                            <div><div className="text-slate-500">รหัสนักศึกษา</div><div className="bg-purple-50 p-2 rounded">{candidate.student_id || "-"}</div></div>
                            <div><div className="text-slate-500">อีเมล</div><div className="bg-purple-50 p-2 rounded">{candidate.email || "-"}</div></div>
                            <div><div className="text-slate-500">ระดับ</div><div className="bg-purple-50 p-2 rounded">{candidate.level_name || "-"}</div></div>
                            <div><div className="text-slate-500">ปี</div><div className="bg-purple-50 p-2 rounded">{candidate.year_number || "-"}</div></div>
                            <div><div className="text-slate-500">แผนก</div><div className="bg-purple-50 p-2 rounded">{candidate.department || "-"}</div></div>
                            <div className="md:col-span-3"><div className="text-slate-500">นโยบาย</div><div className="bg-purple-50 p-2 rounded whitespace-pre-wrap">{candidate.campaign_slogan || "-"}</div></div>
                            <div className="md:col-span-3"><div className="text-slate-500">หมายเลขผู้สมัคร</div><div className="bg-purple-50 p-2 rounded">{candidate.number || "-"}</div></div>
                            <div className="md:col-span-3">
                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${candidate.application_status === "approved" ? "bg-green-100 text-green-700"
                                        : candidate.application_status === "rejected" ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}>
                                    สถานะ: {candidate.application_status === "approved" ? "อนุมัติแล้ว"
                                        : candidate.application_status === "rejected" ? "ไม่อนุมัติ"
                                            : "รอการอนุมัติ"}
                                </div>
                            </div>

                            {candidate.application_status === "rejected" && (
                                <div className="md:col-span-3 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                                    <div><b>เหตุผลที่ปฏิเสธ:</b> {candidate.rejection_reason || "ไม่ระบุ"}</div>
                                    <div className="text-xs text-red-500 mt-1">ถูกปฏิเสธแล้ว {candidate.rejection_count || 0} ครั้ง</div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                            {candidate.application_status === "approved" && (
                                <button onClick={downloadPDF} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600">
                                    ดาวน์โหลดใบสมัคร
                                </button>
                            )}
                            {candidate.application_status === "pending" && (
                                <>
                                    <button onClick={approve} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">อนุมัติ</button>
                                    <button onClick={reject} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">ไม่อนุมัติ</button>
                                </>
                            )}
                            {candidate.application_status === "rejected" && (candidate.rejection_count || 0) >= 2 && (
                                <button onClick={remove} className="rounded-lg bg-black px-4 py-2 text-white hover:bg-black/80">ลบผู้สมัคร</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
