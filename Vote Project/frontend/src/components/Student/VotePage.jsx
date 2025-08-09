import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../../utils/apiFetch";
import { useParams } from "react-router-dom";
import Header from "../Header";

export default function VotePage() {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [showDetail, setShowDetail] = useState(null);
    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const { election_id } = useParams(); // รับ electionId จาก url
    useEffect(() => {
        const fetchCandidates = async () => {
            const data = await apiFetch(`/api/candidates/${election_id}`);
            if (data && data.success) {
                setCandidates(data.candidates);
            }
        };
        fetchCandidates();
    }, [election_id]);

    const handleVote = async () => {
        if (!selectedCandidateId) return;
        const confirm = await Swal.fire({
            title: "ยืนยันการโหวต",
            text: "คุณแน่ใจหรือไม่ว่าต้องการโหวตให้ผู้สมัครคนนี้?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ใช่, โหวตเลย!",
            cancelButtonText: "ยกเลิก"
        });
        if (confirm.isConfirmed) {
            const voteRes = await apiFetch(`/api/vote`, {
                method: "POST",
                body: JSON.stringify({ election_id, candidate_id: selectedCandidateId }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (voteRes && voteRes.success) {
                await Swal.fire("โหวตสำเร็จ", "ขอบคุณที่ใช้สิทธิ์", "success");
                window.location.href = "/elections"; // หรือรีเฟรช/redirect
            } else {
                Swal.fire("เกิดข้อผิดพลาด", voteRes?.message || "ไม่สามารถโหวตได้", "error");
            }
        }
    };

    const handleAbstain = async () => {
        const confirm = await Swal.fire({
            title: "ยืนยันการงดออกเสียง",
            text: "คุณต้องการงดออกเสียงใช่หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ใช่, งดออกเสียง",
            cancelButtonText: "ยกเลิก"
        });
        if (confirm.isConfirmed) {
            const voteRes = await apiFetch(`/api/vote`, {
                method: "POST",
                body: JSON.stringify({ election_id, candidate_id: null, abstain: true }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (voteRes && voteRes.success) {
                await Swal.fire("บันทึกสำเร็จ", "คุณงดออกเสียงเรียบร้อย", "success");
                window.location.href = "/elections"; // หรือรีเฟรช/redirect

            } else {
                Swal.fire("เกิดข้อผิดพลาด", voteRes?.message || "ไม่สามารถงดออกเสียงได้", "error");
            }
        }
    };

    return (
        <>
            <Header studentName={studentName} />
            <div className="min-h-screen bg-purple-100 py-8 px-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">รายชื่อผู้สมัคร</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {candidates.map((candidate) => (
                        <div
                            key={candidate.candidate_id}
                            className={`bg-white rounded-xl shadow-lg flex items-center p-4 mb-4 hover:shadow-2xl transition group border-2 ${selectedCandidateId === candidate.candidate_id
                                ? "border-blue-500"
                                : "border-transparent"
                                }`}
                        >
                            <img
                                src={candidate.image_url || "/no-avatar.png"}
                                alt={candidate.full_name}
                                className="w-28 h-28 object-cover rounded-lg border"
                            />
                            <div className="flex-1 ml-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block text-lg font-bold text-gray-800">
                                            {candidate.full_name}
                                        </span>
                                        <span className="block text-sm text-gray-500">
                                            หมายเลข {candidate.number}
                                        </span>
                                        <span className="block text-sm text-gray-700 mt-2">
                                            คณะ: {candidate.department}
                                        </span>
                                        <span className="block text-sm text-gray-700">
                                            นโยบาย: {candidate.policy || "-"}
                                        </span>
                                    </div>
                                    <button
                                        className="ml-4 text-blue-500 underline text-sm hover:text-blue-700"
                                        onClick={() => setShowDetail(candidate)}
                                    >
                                        ดูข้อมูลเพิ่มเติม
                                    </button>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                name="selected"
                                className="w-7 h-7 ml-4 accent-blue-600 rounded-full" // ทำให้ดูเหมือน radio ด้วย Tailwind
                                checked={selectedCandidateId === candidate.candidate_id}
                                onChange={() => {
                                    if (selectedCandidateId === candidate.candidate_id) {
                                        setSelectedCandidateId(null); // กดซ้ำ = ยกเลิก
                                    } else {
                                        setSelectedCandidateId(candidate.candidate_id); // เลือกใหม่
                                    }
                                }}
                            />

                        </div>
                    ))}
                </div>
                <div className="flex justify-center mt-8 gap-4">
                    <button
                        className="px-6 py-2 rounded-lg bg-blue-500 text-white text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        onClick={handleVote}
                        disabled={!selectedCandidateId}
                    >
                        ลงคะแนนเสียง
                    </button>
                    <button
                        className="px-6 py-2 rounded-lg bg-yellow-400 text-gray-900 text-lg font-semibold hover:bg-yellow-500 transition"
                        onClick={handleAbstain}
                    >
                        งดออกเสียง
                    </button>
                </div>

                {/* Modal ข้อมูลเพิ่มเติม */}
                {showDetail && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl p-8 max-w-md shadow-2xl relative">
                            <button
                                className="absolute top-2 right-3 text-gray-400 text-2xl"
                                onClick={() => setShowDetail(null)}
                            >
                                ×
                            </button>
                            <img
                                src={showDetail.image_url || "/no-avatar.png"}
                                alt={showDetail.full_name}
                                className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
                            />
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">{showDetail.full_name}</h2>
                                <p className="text-gray-700 mb-2">คณะ: {showDetail.department}</p>
                                <p className="text-gray-700 mb-2">นโยบาย: {showDetail.policy || "-"}</p>
                                <p className="text-gray-600 mt-4">{showDetail.details || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
