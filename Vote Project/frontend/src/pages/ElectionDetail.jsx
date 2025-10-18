import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "components";

import { useNavigate } from "react-router-dom";
// import { FaArrowLeft } from "react-icons/fa";
import { apiFetch } from "utils/apiFetch";
import { formatDateTime } from "utils/dateUtils";
import { translateStatus } from "utils/electionStatus"
import Swal from "sweetalert2";

export default function ElectionDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [election, setElection] = useState(null);
    const [loading, setLoading] = useState(true);

    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const isLoggedIn = !!me;
    const studentName = me ? `${me.first_name} ${me.last_name}` : "";

    // const [votedElections, setVotedElections] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const meRes = await apiFetch("/api/users/me");
                if (meRes?.success) {
                    setMe(meRes.user);
                    setRoles(meRes.user.roles || []);
                }
                const data = await apiFetch(`/api/elections/${id}`);
                // const data = await res.json();
                if (!data) return;

                if (data.success) {
                    setElection(data.data);
                } else {
                    alert("ไม่สามารถโหลดข้อมูลได้");
                    alert("กรุณาเข้าสู่ระบบใหม่");
                }
            } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดกับ server");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleVoteClick = async (electionId) => {

        const eligibilityData = await apiFetch(`/api/eligibility/${electionId}`);
        if (!eligibilityData) return;

        if (!eligibilityData.success || !eligibilityData.eligible) {
            Swal.fire({
                title: "คุณไม่มีสิทธิ์ลงคะแนนรายการนี้",
                text: "คุณขาดคุณสมบัติในการลงคะแนน โปรดติดต่อเจ้าหน้าที่",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });
            return;
        }
        // ถ้ามีสิทธิ์ → ไปหน้าลงคะแนน
        window.location.href = `/election/${electionId}/vote`;

    };

    const html = ((election && election.description) ? election.description : "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")   // **หนา**
        .replace(/_(.+?)_/g, "<em>$1</em>")                 // _เอียง_
        .replace(/^## (.+)$/gm, "<span class='font-semibold'>$1</span>")
        .replace(/^- (.+)$/gm, "• $1");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-700 text-lg font-medium">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }
    if (!election) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-3 border border-red-200">
                <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                <p className="text-red-600 text-lg font-semibold">ไม่พบรายการเลือกตั้ง</p>
                <p className="text-gray-500 text-sm">โปรดติดต่อผู้ดูแลระบบ</p>
            </div>
        </div>
    );

    return (
        <>
            <Header studentName={studentName} />
            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-4">
                    {election.election_name}
                </h1>
                <img

                    src={`http://localhost:5000${election.image_url}`}
                    alt="election"
                    className="w-full h-128 object-cover rounded mb-4"
                />


                <div
                    className="leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: html }}
                />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm border-t pt-4">
                    <div>
                        <span className="font-semibold text-gray-700">📥 วันที่เปิดรับสมัคร:</span><br />
                        <span className="text-gray-800">{formatDateTime(election.registration_start)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">📤 วันที่สิ้นสุดรับสมัคร:</span><br />
                        <span className="text-gray-800">{formatDateTime(election.registration_end)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">🗳️ วันที่เริ่มลงคะแนน:</span><br />
                        <span className="text-gray-800">{formatDateTime(election.start_date)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">🛑 วันที่สิ้นสุดการลงคะแนน:</span><br />
                        <span className="text-gray-800">{formatDateTime(election.end_date)}</span>
                    </div>
                </div>


                <p className="text-sm mt-2">
                    <span className="font-semibold">สถานะ:</span>{" "}
                    <span className={`px-2 py-1 rounded text-white text-xs 
                                ${election.effective_status === "REGISTRATION_OPEN" ? "bg-violet-500" :
                            election.effective_status === "VOTING_OPEN" ? "bg-green-500" :
                                election.effective_status === "CLOSED_BY_ADMIN" ? "bg-gray-500" :
                                    election.effective_status === "ENDED" ? "bg-slate-500" :
                                        election.effective_status === "WAITING_VOTE" ? "bg-amber-500" :
                                            "bg-purple-500"
                        }`
                    }>

                        {translateStatus(election.effective_status || election.auto_status)}
                    </span>
                </p>

                {/* ตัวอย่างปุ่มตามบทบาท */}
                <div className="mt-4 flex flex-col space-y-2">
                    <div className="mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                        >
                            ← ย้อนกลับ
                        </button>

                    </div>
                    {isLoggedIn && roles.includes("นักศึกษา") && election.effective_status === "VOTING_OPEN" && (

                            <button
                                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"

                                onClick={() => handleVoteClick(election.election_id)}
                            >
                                ลงคะแนน
                            </button>
                        )
                    }
                    {isLoggedIn && roles.includes("นักศึกษา") && election.effective_status === "REGISTRATION_OPEN" && (
                        <button className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
                            สมัครเป็นผู้สมัคร
                        </button>
                    )}
                    {isLoggedIn && roles.includes("ผู้ดูแล") && (
                        <button className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600">
                            จัดการการเลือกตั้ง
                        </button>

                    )}
                    {election.manual_override !== "AUTO" && (
                        <p className="text-xs mt-1 text-gray-600">
                            หมายเหตุผู้ดูแล: {election.status_note || (election.manual_override === "FORCE_CLOSED" ? "ปิดชั่วคราวโดยผู้ดูแล" : "เปิดลงคะแนนแบบบังคับ")}
                        </p>
                    )}


                </div>
            </div>
        </>
    );
}
