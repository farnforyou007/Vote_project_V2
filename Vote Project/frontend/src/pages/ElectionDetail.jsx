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

    // const studentName = localStorage.getItem("studentName") || "";
    // const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    // const isLoggedIn = !!studentName;
    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const isLoggedIn = !!me;
    const studentName = me ? `${me.first_name} ${me.last_name}` : "";

    const [votedElections, setVotedElections] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                // const token = localStorage.getItem("token");
                // const data = await apiFetch(`http://localhost:5000/api/elections/${id}`, {
                //     headers: {
                //         "Content-Type": "application/json",
                //         Authorization: `Bearer ${token}`
                //     }
                // });
                const meRes = await apiFetch("http://localhost:5000/api/users/me");
                if (meRes?.success) {
                    setMe(meRes.user);
                    setRoles(meRes.user.roles || []);
                }
                const data = await apiFetch(`http://localhost:5000/api/elections/${id}`);
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
        // const token = localStorage.getItem('token');
        // // เช็คสิทธิ์โหวตก่อน
        // const eligibilityData = await apiFetch(`http://localhost:5000/api/eligibility/${electionId}`, {
        //     headers: { Authorization: `Bearer ${token}` },
        // });
        const eligibilityData = await apiFetch(`http://localhost:5000/api/eligibility/${electionId}`);
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
        // หรือถ้าใช้ react-router v6+
        // navigate(`/election/${electionId}/vote`);
    };

    const html = ((election && election.description) ? election.description : "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")   // **หนา**
        .replace(/_(.+?)_/g, "<em>$1</em>")                 // _เอียง_
        .replace(/^## (.+)$/gm, "<span class='font-semibold'>$1</span>")
        .replace(/^- (.+)$/gm, "• $1");

    if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>;
    if (!election) return <p className="p-8">ไม่พบข้อมูลการเลือกตั้ง</p>;

    return (
        <>
            <Header studentName={studentName} />
            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-4">
                    {election.election_name}
                </h1>
                <img
                    // src={`http://localhost:5000${election.image_path}`}
                    src={`http://localhost:5000${election.image_url}`}
                    alt="election"
                    className="w-full h-128 object-cover rounded mb-4"
                />
                {/* <div className="h-[4.5rem] overflow-hidden"> */}
                {/* <div> */}
                {/* <p className="text-sm text-gray-700 line-clamp-2 break-all">
                        {election.description}
                    </p> */}
                {/* <p className="whitespace-pre-line leading-relaxed">
                        {election.description}
                    </p> */}
                {/* <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {election.description}
                    </p>
                </div> */}

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
                    {/* <span className={`px-2 py-1 rounded text-white text-xs ${election.computed_status === "registration" ? "bg-violet-500" :
                        election.computed_status === "active" ? "bg-green-500" :
                            election.computed_status === "closed" ? "bg-gray-500" :
                                election.computed_status === "completed" ? "bg-slate-500" : "bg-purple-500"
                        }`}> */}
                    <span className={`px-2 py-1 rounded text-white text-xs 
                                ${election.effective_status === "REGISTRATION_OPEN" ? "bg-violet-500" :
                            election.effective_status === "VOTING_OPEN" ? "bg-green-500" :
                                election.effective_status === "CLOSED_BY_ADMIN" ? "bg-gray-500" :
                                    election.effective_status === "ENDED" ? "bg-slate-500" :
                                        election.effective_status === "WAITING_VOTE" ? "bg-amber-500" :
                                            "bg-purple-500"
                        }`
                    }>
                        {/* {translateStatus(election.computed_status)} */}
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
                    {/* <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                        ย้อนกลับ
                    </button> */}
                    {isLoggedIn && roles.includes("นักศึกษา") && election.effective_status === "VOTING_OPEN" && (
                        // <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                        //     ลงคะแนน
                        // </button>
                        votedElections.includes(election.election_id) ? (
                            <button
                                disabled
                                className="w-full bg-gray-400 text-white py- rounded cursor-not-allowed"
                            >
                                ลงคะแนนแล้ว
                            </button>
                        ) : (
                            <button
                                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"

                                onClick={() => handleVoteClick(election.election_id)}
                            >
                                ลงคะแนน
                            </button>
                        )
                    )}
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
