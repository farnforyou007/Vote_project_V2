import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import { formatDateTime, translateStatus } from "./utils/dateUtils";
import CandidateApplicationForm from "./components/Student/CandidateApplicationForm"
import Swal from "sweetalert2";
import { apiFetch } from "./utils/apiFetch";

export default function ElectionList() {

    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);

    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const isLoggedIn = !!studentName;
    const [applyingElectionId, setApplyingElectionId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [eligible, setEligible] = useState(false);
    const [student, setStudent] = useState(null);
    const [votedElections, setVotedElections] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");

                const headers = {
                    "Content-Type": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const data = await apiFetch("http://localhost:5000/api/elections", {
                    headers,
                });
                if (!data) return;

                // const data = await res.json();
                if (data.success) {
                    setElections(data.elections);
                } else {
                    alert("ไม่สามารถโหลดข้อมูลได้");
                }
            } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดกับ server");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchVoted = async () => {
            const token = localStorage.getItem("token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const data = await apiFetch("/api/votes/status", { headers });
            if (data && data.success && data.voted_elections) {
                setVotedElections(data.voted_elections);
            }
        };
        fetchVoted();
    }, [isLoggedIn]);

    const checkEligibility = async (electionId) => {
        const token = localStorage.getItem('token');

        // เช็คว่ามีสิทธิ์มั้ย
        const eligibilityData = await apiFetch(`http://localhost:5000/api/eligibility/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!eligibilityData) return;
        // const eligibilityData = await eligibilityRes.json();

        if (!eligibilityData.success || !eligibilityData.eligible) {
            Swal.fire({
                title: "คุณไม่มีสิทธิ์สมัครในรายการนี้",
                text: "คุณขาดคุณสมบัติในการลงสมัครจึงไม่สามารถลงสมัครได้\n โปรดติดต่อห้ององค์การ",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });

            return;
        }

        // เช็คว่าสมัครไปแล้วหรือยัง
        const checkData = await apiFetch(`http://localhost:5000/api/applications/check/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!checkData) return;

        // const checkData = await checkRes.json();

        if (checkData.applied) {
            Swal.fire({
                title: "คุณสมัครไปแล้ว",
                text: "ไม่สามารถสมัครซ้ำในรายการนี้ได้",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });
            return;
        }
        // ถ้าผ่านทั้งสองเงื่อนไข → แสดงฟอร์ม
        setApplyingElectionId(electionId);
        setShowForm(true);

        // จำลอง student object จาก localStorage หรือ state
        setStudent({
            user_id: eligibilityData.user_id,
            first_name: localStorage.getItem("first_name"),
            last_name: localStorage.getItem("last_name"),
            student_id: localStorage.getItem("student_id"),
            email: localStorage.getItem("email"),
            department: localStorage.getItem("department"),
            year_level: localStorage.getItem("year_level"),
        });
    };

    const handleVoteClick = async (electionId) => {
        const token = localStorage.getItem('token');
        // เช็คสิทธิ์โหวตก่อน
        const eligibilityData = await apiFetch(`http://localhost:5000/api/eligibility/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
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

    const visibleElections = elections.filter(e =>
        e.status !== "draft" // หรือจะ .computed_status !== "draft" ถ้าใช้ฟิลด์นี้
    );


    if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>
    return (
        <>
            <Header studentName={studentName} />

            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {elections.map((election) => (
                        <div
                            key={election.election_id}
                            className="bg-white p-4 rounded shadow"
                        >
                            <img
                                src={`http://localhost:5000${election.image_path}`}
                                alt="election"
                                className="w-full h-48 object-cover rounded mb-4"
                            />
                            <p className="font-semibold mb-2">{election.election_name}</p>
                            <div className="h-[4.5rem] overflow-hidden">
                                <p className="text-sm text-gray-700 line-clamp-2 break-all">
                                    {election.description}
                                </p>
                            </div>


                            {/* <p className="text-sm mt-2">
                                <span className="font-semibold">วันที่เปิดรับสมัคร:</span>{" "}
                                {formatDateTime(election.registration_start)}
                            </p>
                            <p className="text-sm">
                                <span className="font-semibold">วันที่สิ้นสุดรับสมัคร:</span>{" "}
                                {formatDateTime(election.registration_end)}
                            </p>
                            <p className="text-sm mt-2">
                                <span className="font-semibold">วันที่เริ่มลงคะแนน:</span>{" "}
                                {formatDateTime(election.start_date)}
                            </p>
                            <p className="text-sm">
                                <span className="font-semibold">วันที่สิ้นสุดการลงคะแนน:</span>{" "}
                                {formatDateTime(election.end_date)}
                            </p> */}

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
                                <span className={`px-2 py-1 rounded text-white text-xs ${election.computed_status === "registration" ? "bg-violet-500" :
                                    election.computed_status === "active" ? "bg-green-500" :
                                        election.computed_status === "closed" ? "bg-gray-500" :
                                            election.computed_status === "completed" ? "bg-slate-500" : "bg-purple-500"
                                    }`}>
                                    {translateStatus(election.computed_status)}
                                </span>
                            </p>

                            <div className="mt-4 flex flex-col space-y-2">
                                {/* ปุ่มดูรายละเอียด ทุกคนเห็น */}
                                <Link
                                    to={`/election/${election.election_id}`}
                                    className="block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                                >
                                    ดูรายละเอียด
                                </Link>

                                {/* ถ้า Login แล้ว */}
                                {isLoggedIn && (
                                    <>
                                        {/* นักศึกษา: เปิดรับสมัคร */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "registration" && (
                                            <button
                                                className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
                                                onClick={() => checkEligibility(election.election_id)}
                                            >
                                                สมัครเป็นผู้สมัคร
                                            </button>
                                        )}

                                        {/* นักศึกษา: เปิดโหวต */}
                                        {/* {roles.includes("นักศึกษา") && election.computed_status === "active" && (
                                            // <button className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600">
                                            //     โหวต
                                            // </button>
                                            // <Link
                                            //     to={`/election/${election.election_id}/vote`}
                                            //     className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-center"
                                            // >
                                            //     โหวต
                                            // </Link>
                                            

                                        )} */}

                                        {roles.includes("นักศึกษา") && election.computed_status === "active" && (
                                            votedElections.includes(election.election_id) ? (
                                                <button
                                                    disabled
                                                    className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed"
                                                >
                                                    ลงคะแนนแล้ว
                                                </button>
                                            ) : (
                                                <button
                                                    className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-center"
                                                    onClick={() => handleVoteClick(election.election_id)}
                                                >
                                                    ลงคะแนน
                                                </button>
                                            )
                                        )}


                                        {/* นักศึกษา: ปิดโหวต */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "closed" && (
                                            <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed">
                                                ปิดโหวตแล้ว
                                            </button>
                                        )}

                                        {/* นักศึกษา: เสร็จสิ้น */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "completed" && (
                                            <button className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600">
                                                ดูผลคะแนน
                                            </button>
                                        )}

                                        {/* ผู้ดูแล: ปุ่มจัดการ */}
                                        {roles.includes("ผู้ดูแล") && (
                                            <button className="w-full bg-purple-500 text-white py-1 rounded hover:bg-purple-600">
                                                จัดการการเลือกตั้ง
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>

            {showForm && student && (
                <CandidateApplicationForm
                    student={student}
                    electionId={applyingElectionId}
                    onClose={() => setShowForm(false)}
                />
            )}

        </>
    );
}
