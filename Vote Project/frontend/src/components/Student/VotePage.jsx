// import { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import { apiFetch } from "../../utils/apiFetch";
// import { useParams } from "react-router-dom";
// import Header from "../Header";

// export default function VotePage() {
//     const [candidates, setCandidates] = useState([]);
//     const [selectedCandidateId, setSelectedCandidateId] = useState(null);
//     const [showDetail, setShowDetail] = useState(null);
//     // const studentName = localStorage.getItem("studentName") || "";
//     // const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
//     const [me, setMe] = useState(null);
//     const [roles, setRoles] = useState([]);
//     const { election_id } = useParams(); // รับ electionId จาก url
//     useEffect(() => {
//         (async () => {
//             const meRes = await apiFetch(`/api/users/me`)
//             if (meRes?.success) {
//                 setMe(meRes.user);
//                 setRoles(meRes.user.roles || []);
//             }
//         })();
//     }, []);

//     useEffect(() => {
//         const fetchCandidates = async () => {
//             const data = await apiFetch(`/api/candidates/${election_id}`);
//             if (data && data.success) {
//                 setCandidates(data.candidates);
//             }
//         };
//         fetchCandidates();
//     }, [election_id]);

//     const handleVote = async () => {
//         if (!selectedCandidateId) return;
//         const confirm = await Swal.fire({
//             title: "ยืนยันการโหวต",
//             text: "คุณแน่ใจหรือไม่ว่าต้องการโหวตให้ผู้สมัครคนนี้?",
//             icon: "question",
//             showCancelButton: true,
//             confirmButtonText: "ใช่, โหวตเลย!",
//             cancelButtonText: "ยกเลิก"
//         });
//         if (confirm.isConfirmed) {
//             const voteRes = await apiFetch(`/api/vote`, {
//                 method: "POST",
//                 body: JSON.stringify({ election_id, candidate_id: selectedCandidateId }),
//                 headers: {
//                     "Content-Type": "application/json"
//                 }
//             });
//             if (voteRes && voteRes.success) {
//                 await Swal.fire("โหวตสำเร็จ", "ขอบคุณที่ใช้สิทธิ์", "success");
//                 window.location.href = "/elections"; // หรือรีเฟรช/redirect
//             } else {
//                 Swal.fire("เกิดข้อผิดพลาด", voteRes?.message || "ไม่สามารถโหวตได้", "error");
//             }
//         }
//     };

//     const handleAbstain = async () => {
//         const confirm = await Swal.fire({
//             title: "ยืนยันการงดออกเสียง",
//             text: "คุณต้องการงดออกเสียงใช่หรือไม่?",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonText: "ใช่, งดออกเสียง",
//             cancelButtonText: "ยกเลิก"
//         });
//         if (confirm.isConfirmed) {
//             const voteRes = await apiFetch(`/api/vote`, {
//                 method: "POST",
//                 body: JSON.stringify({ election_id, candidate_id: null, abstain: true }),
//                 headers: {
//                     "Content-Type": "application/json"
//                 }
//             });
//             if (voteRes && voteRes.success) {
//                 await Swal.fire("บันทึกสำเร็จ", "คุณงดออกเสียงเรียบร้อย", "success");
//                 window.location.href = "/elections"; // หรือรีเฟรช/redirect

//             } else {
//                 Swal.fire("เกิดข้อผิดพลาด", voteRes?.message || "ไม่สามารถงดออกเสียงได้", "error");
//             }
//         }
//     };

//     return (
//         <>
//             {/* <Header studentName={studentName} /> */}
//             <Header />
//             <div className="min-h-screen bg-purple-100 py-8 px-4">
//                 <h1 className="text-3xl font-bold mb-6 text-gray-800">รายชื่อผู้สมัคร</h1>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                     {candidates.map((candidate) => (
//                         <div
//                             key={candidate.candidate_id}
//                             className={`bg-white rounded-xl shadow-lg flex items-center p-4 mb-4 hover:shadow-2xl transition group border-2 ${selectedCandidateId === candidate.candidate_id
//                                 ? "border-blue-500"
//                                 : "border-transparent"
//                                 }`}
//                         >
//                             <img
//                                 src={candidate.image_url || "/no-avatar.png"}
//                                 alt={candidate.full_name}
//                                 className="w-28 h-28 object-cover rounded-lg border"
//                             />
//                             <div className="flex-1 ml-5">
//                                 <div className="flex items-center justify-between">
//                                     <div>

//                                         <span className="block text-lg font-bold text-gray-800">
//                                             หมายเลข : {candidate.number}
//                                         </span>
//                                         <span className="block text-sm text-gray-500">
//                                             ชื่อผู้สมัคร : {candidate.full_name}
//                                         </span>
//                                         <span className="block text-sm text-gray-700 mt-2">
//                                             แผนก : {candidate.department}
//                                         </span>
//                                         <span className="block text-sm text-gray-700 mt-2">
//                                             ชั้นปี : {candidate.year}
//                                         </span>
//                                         <span className="block text-sm text-gray-700">
//                                             นโยบาย : {candidate.policy || "-"}
//                                         </span>
//                                     </div>
//                                     <button
//                                         className="ml-4 text-blue-500 underline text-sm hover:text-blue-700"
//                                         onClick={() => setShowDetail(candidate)}
//                                     >
//                                         ดูข้อมูลเพิ่มเติม
//                                     </button>
//                                 </div>
//                             </div>
//                             <input
//                                 type="checkbox"
//                                 name="selected"
//                                 className="w-7 h-7 ml-4 accent-blue-600 rounded-full" // ทำให้ดูเหมือน radio ด้วย Tailwind
//                                 checked={selectedCandidateId === candidate.candidate_id}
//                                 onChange={() => {
//                                     if (selectedCandidateId === candidate.candidate_id) {
//                                         setSelectedCandidateId(null); // กดซ้ำ = ยกเลิก
//                                     } else {
//                                         setSelectedCandidateId(candidate.candidate_id); // เลือกใหม่
//                                     }
//                                 }}
//                             />

//                         </div>
//                     ))}
//                 </div>
//                 <div className="flex justify-center mt-8 gap-4">
//                     <button
//                         className="px-6 py-2 rounded-lg bg-blue-500 text-white text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
//                         onClick={handleVote}
//                         disabled={!selectedCandidateId}
//                     >
//                         ลงคะแนนเสียง
//                     </button>
//                     <button
//                         className="px-6 py-2 rounded-lg bg-yellow-400 text-gray-900 text-lg font-semibold hover:bg-yellow-500 transition"
//                         onClick={handleAbstain}
//                     >
//                         งดออกเสียง
//                     </button>
//                 </div>

//                 {/* Modal ข้อมูลเพิ่มเติม */}
//                 {showDetail && (
//                     <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
//                         <div className="bg-white rounded-xl p-8 max-w-md shadow-2xl relative">
//                             <button
//                                 className="absolute top-2 right-3 text-gray-400 text-2xl"
//                                 onClick={() => setShowDetail(null)}
//                             >
//                                 ×
//                             </button>
//                             <img
//                                 src={showDetail.image_url || "/no-avatar.png"}
//                                 alt={showDetail.full_name}
//                                 className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
//                             />
//                             <div className="text-center">
//                                 <h2 className="text-xl font-bold text-gray-900">{showDetail.full_name}</h2>
//                                 <p className="text-gray-700 mb-2">แผนก : {showDetail.department}</p>
//                                 <p className="text-gray-700 mb-2">นโยบาย : {showDetail.policy || "-"}</p>
//                                 <p className="text-gray-600 mt-4">{showDetail.details || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../../utils/apiFetch";
import { useParams } from "react-router-dom";
import Header from "../Header";

export default function VotePage() {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [showDetail, setShowDetail] = useState(null);
    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const { election_id } = useParams();

    useEffect(() => {
        (async () => {
            const meRes = await apiFetch(`/api/users/me`);
            if (meRes?.success) {
                setMe(meRes.user);
                setRoles(meRes.user.roles || []);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const data = await apiFetch(`/api/candidates/${election_id}`);
            if (data?.success) setCandidates(data.candidates || []);
        })();
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
                headers: { "Content-Type": "application/json" }
            });
            if (voteRes?.success) {
                await Swal.fire("โหวตสำเร็จ", "ขอบคุณที่ใช้สิทธิ์", "success");
                window.location.href = "/elections";
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
                headers: { "Content-Type": "application/json" }
            });
            if (voteRes?.success) {
                await Swal.fire("บันทึกสำเร็จ", "คุณงดออกเสียงเรียบร้อย", "success");
                window.location.href = "/elections";
            } else {
                Swal.fire("เกิดข้อผิดพลาด", voteRes?.message || "ไม่สามารถงดออกเสียงได้", "error");
            }
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-purple-100 py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">
                        รายชื่อผู้สมัคร
                    </h1>

                    {/* Grid การ์ดผู้สมัคร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                        {candidates.map((c) => {
                            const dept = c.department_name || c.department || "-";
                            const year = c.year_level || c.year || "-";
                            return (
                                <label
                                    key={c.candidate_id}
                                    className={`group relative cursor-pointer rounded-2xl bg-white shadow-md ring-1 ring-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden w-full
                    ${selectedCandidateId === c.candidate_id ? "ring-2 ring-blue-500 shadow-xl" : ""}`}
                                >
                                    {/* หมายเลขเด่น */}
                                    <div className="absolute -left-3 -top-3">
                                        <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl grid place-items-center shadow-lg">
                                            <span className="text-2xl font-black leading-none">{c.number ?? "-"}</span>
                                        </div>
                                    </div>

                                    {/* รูป + เนื้อหา */}
                                    <div className="p-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={c.image_url || "/no-avatar.png"}
                                                alt={c.full_name}
                                                className="w-28 h-28 rounded-xl object-cover ring-1 ring-gray-200"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 truncate">
                                                    {c.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <span className="font-medium">แผนก:</span> {dept}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">ชั้นปี:</span> {year}
                                                </p>
                                                <p className="text-sm text-gray-700 mt-2 line-clamp-2 whitespace-pre-line">
                                                    <span className="font-medium">นโยบาย:</span>{" "}
                                                    {c.policy || "-"}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowDetail(c);
                                                    }}
                                                    className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    ดูข้อมูลเพิ่มเติม
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>

                                            {/* Radio เลือกผู้สมัคร */}
                                            <input
                                                type="checkbox"
                                                className="mt-2 shrink-0 w-6 h-6 accent-blue-600"
                                                checked={selectedCandidateId === c.candidate_id}
                                                onChange={() => {
                                                    setSelectedCandidateId(
                                                        selectedCandidateId === c.candidate_id ? null : c.candidate_id
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* ปุ่มกด */}
                    <div className="flex justify-center mt-10 gap-4">
                        <button
                            className="px-7 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 active:scale-[.98] transition disabled:opacity-50"
                            onClick={handleVote}
                            disabled={!selectedCandidateId}
                        >
                            ลงคะแนนเสียง
                        </button>
                        <button
                            className="px-7 py-3 rounded-xl bg-yellow-400 text-gray-900 text-lg font-semibold hover:bg-yellow-500 active:scale-[.98] transition"
                            onClick={handleAbstain}
                        >
                            งดออกเสียง
                        </button>
                    </div>
                </div>

                {/* Modal ข้อมูลเพิ่มเติม */}
                {showDetail && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                        onClick={() => setShowDetail(null)}
                    >
                        <div
                            className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* หัวโมดัล */}
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white w-12 h-12 rounded-xl grid place-items-center">
                                        <span className="text-xl font-black">{showDetail.number ?? "-"}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                                        {showDetail.full_name}
                                    </h2>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                    onClick={() => setShowDetail(null)}
                                    aria-label="ปิด"
                                >
                                    ×
                                </button>
                            </div>

                            {/* เนื้อหาโมดัล */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6">
                                <img
                                    src={showDetail.image_url || "/no-avatar.png"}
                                    alt={showDetail.full_name}
                                    className="w-full h-[260px] md:h-[300px] object-cover rounded-xl ring-1 ring-gray-200"
                                />
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="font-semibold text-gray-700">แผนก</div>
                                        <div className="text-gray-900">{showDetail.department_name || showDetail.department || "-"}</div>
                                        <div className="font-semibold text-gray-700">ชั้นปี</div>
                                        <div className="text-gray-900">{showDetail.year_level || showDetail.year || "-"}</div>
                                        <div className="font-semibold text-gray-700">หมายเลขผู้สมัคร</div>
                                        <div className="text-gray-900">{showDetail.number ?? "-"}</div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="font-semibold text-gray-700 mb-1">นโยบาย</div>
                                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                            {showDetail.policy || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ท้ายโมดัล */}
                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button
                                    className="px-5 py-2 rounded-lg bg-white ring-1 ring-gray-200 text-gray-700 hover:bg-gray-100"
                                    onClick={() => setShowDetail(null)}
                                >
                                    ปิด
                                </button>
                                <button
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={() => {
                                        setSelectedCandidateId(showDetail.candidate_id);
                                        setShowDetail(null);
                                    }}
                                >
                                    เลือกคนนี้
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
