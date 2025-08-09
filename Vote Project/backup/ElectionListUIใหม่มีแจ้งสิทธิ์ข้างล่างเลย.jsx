import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import { formatDateTime, translateStatus } from "./utils/dateUtils";
import CandidateApplicationForm from "./components/Student/CandidateApplicationForm";
import Swal from "sweetalert2";

export default function ElectionList() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const isLoggedIn = !!studentName;
    const [applyingElectionId, setApplyingElectionId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { "Content-Type": "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch("http://localhost:5000/api/elections", { headers });
                const data = await res.json();
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

    const checkEligibility = async (electionId) => {
        const token = localStorage.getItem("token");

        const eligibilityRes = await fetch(`http://localhost:5000/api/eligibility/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const eligibilityData = await eligibilityRes.json();

        if (!eligibilityData.success || !eligibilityData.eligible) {
            Swal.fire({
                title: "คุณไม่มีสิทธิ์สมัครในรายการนี้",
                text: "คุณขาดคุณสมบัติในการลงสมัครจึงไม่สามารถลงสมัครได้\n โปรดติดต่อห้ององค์การ",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });
            return;
        }

        const checkRes = await fetch(`http://localhost:5000/api/applications/check/${electionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const checkData = await checkRes.json();

        if (checkData.applied) {
            Swal.fire({
                title: "คุณสมัครไปแล้ว",
                text: "ไม่สามารถสมัครซ้ำในรายการนี้ได้",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });
            return;
        }

        setApplyingElectionId(electionId);
        setShowForm(true);

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

    if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>;

    return (
        <>
            <Header studentName={studentName} />

            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {elections.map((election) => (
                        <div
                            key={election.election_id}
                            className="bg-white p-6 rounded shadow hover:shadow-md transition"
                        >
                            <img
                                src={`http://localhost:5000${election.image_path}`}
                                alt="election"
                                className="w-full h-48 object-cover rounded mb-4"
                            />

                            <h2 className="text-lg font-bold text-purple-800 mb-2">🗳️ {election.election_name}</h2>
                            <p className="text-sm text-gray-700 mb-4">{election.description}</p>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-purple-700 mb-2">🕒 กำหนดการเลือกตั้ง</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700">
                                    <div>
                                        <span className="font-semibold text-gray-600">📥 วันที่เปิดรับสมัคร:</span><br />
                                        <span className="text-gray-800">{formatDateTime(election.registration_start)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-600">📤 วันที่สิ้นสุดรับสมัคร:</span><br />
                                        <span className="text-gray-800">{formatDateTime(election.registration_end)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-600">🗳️ วันที่เริ่มลงคะแนน:</span><br />
                                        <span className="text-gray-800">{formatDateTime(election.start_date)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-600">🛑 วันที่สิ้นสุดการลงคะแนน:</span><br />
                                        <span className="text-gray-800">{formatDateTime(election.end_date)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right mt-4">
                                {election.can_vote === 1 ? (
                                    <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                                        ✅ คุณมีสิทธิ์ลงคะแนน
                                    </span>
                                ) : (
                                    <span className="inline-block bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">
                                        ❌ คุณไม่มีสิทธิ์ลงคะแนน
                                    </span>
                                )}
                            </div>

                            <p className="text-sm mt-4">
                                <span className="font-semibold">สถานะ:</span>{" "}
                                <span className={`px-2 py-1 rounded text-white text-xs ${election.computed_status === "registration"
                                        ? "bg-violet-500"
                                        : election.computed_status === "active"
                                            ? "bg-green-500"
                                            : election.computed_status === "closed"
                                                ? "bg-gray-500"
                                                : election.computed_status === "completed"
                                                    ? "bg-slate-500"
                                                    : "bg-purple-500"
                                    }`}>
                                    {translateStatus(election.computed_status)}
                                </span>
                            </p>

                            <div className="mt-4 flex flex-col space-y-2">
                                <Link
                                    to={`/election/${election.election_id}`}
                                    className="block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                                >
                                    ดูรายละเอียด
                                </Link>

                                {isLoggedIn && (
                                    <>
                                        {roles.includes("นักศึกษา") && election.computed_status === "registration" && (
                                            <button
                                                className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
                                                onClick={() => checkEligibility(election.election_id)}
                                            >
                                                สมัครเป็นผู้สมัคร
                                            </button>
                                        )}

                                        {roles.includes("นักศึกษา") && election.computed_status === "active" && (
                                            <button className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600">
                                                โหวต
                                            </button>
                                        )}

                                        {roles.includes("นักศึกษา") && election.computed_status === "closed" && (
                                            <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed">
                                                ปิดโหวตแล้ว
                                            </button>
                                        )}

                                        {roles.includes("นักศึกษา") && election.computed_status === "completed" && (
                                            <button className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600">
                                                ดูผลคะแนน
                                            </button>
                                        )}

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
