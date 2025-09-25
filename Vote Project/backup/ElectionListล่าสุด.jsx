import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { formatDateTime } from "../utils/dateUtils";
import { translateStatus } from "../utils/electionStatus"
import CandidateApplicationForm from "../components/Student/CandidateApplicationForm"
import EditElectionModal from "../components/AdminManageElections/EditElectionModal";
// import { tokenService } from "../utils/tokenService";

import Swal from "sweetalert2";
import { apiFetch } from "../utils/apiFetch";

export default function ElectionList() {

    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    // const studentName = localStorage.getItem("studentName") || "";
    // const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    // const isLoggedIn = !!studentName;
    const [me, setMe] = useState(null);           // เก็บข้อมูล user จาก /me
    const [roles, setRoles] = useState([]);
    const isLoggedIn = !!me;
    const studentName = me ? `${me.first_name} ${me.last_name}` : "";
    const isAdmin = roles.includes("ผู้ดูแล");
    const [applyingElectionId, setApplyingElectionId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [student, setStudent] = useState(null);
    const [votedElections, setVotedElections] = useState([]);
    const [editingElection, setEditingElection] = useState(null);



    // useEffect(() => {
    //     // const fetchData = async () => {
    //     const fetchData = async () => {
    //         // โหลดโปรไฟล์ก่อน
    //         const meRes = await apiFetch("http://localhost:5000/api/users/me");
    //         if (meRes?.success) {
    //             setMe(meRes.user);
    //             setRoles(meRes.user.roles || []);
    //         }
    //         try {
    //             // const token = localStorage.getItem("token");
    //             // const headers = {
    //             //     "Content-Type": "application/json",
    //             // };
    //             // if (token) {
    //             //     headers["Authorization"] = `Bearer ${token}`;
    //             // }
    //             // const data = await apiFetch("http://localhost:5000/api/elections", {
    //             //     headers,
    //             // });
    //             const data = await apiFetch("http://localhost:5000/api/elections");
    //             if (!data) return;

    //             // const data = await res.json();
    //             if (data.success) {
    //                 // setElections(data.data);
    //                 setElections(data.data || data.elections || []);
    //             } else {
    //                 alert("ไม่สามารถโหลดข้อมูลได้");
    //             }
    //         } catch (err) {
    //             console.error(err);
    //             alert("เกิดข้อผิดพลาดกับ server");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []);


    useEffect(() => {
        const fetchElections = async () => {
            try {
                // ✅ โหลดได้แม้ไม่มี token
                const data = await apiFetch("/api/elections");
                if (data?.success) setElections(data.data || data.elections || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false); // ให้หน้า list แสดงผลก่อน
            }
        };

        const fetchMe = async () => {
            try {
                const meRes = await apiFetch("/api/users/me");
                if (meRes?.success) {
                    setMe(meRes.user);
                    setRoles(meRes.user.roles || []);
                } else {
                    setMe(null); setRoles([]);
                }
            } catch (e) {
                // ถ้า 401 ก็ปล่อยผ่าน ไม่ต้อง alert
                setMe(null); setRoles([]);
            }
        };

        fetchElections(); // โหลด public ก่อน
        fetchMe();        // โหลดโปรไฟล์แบบ non-blocking
    }, []);
    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchVoted = async () => {
            // const token = localStorage.getItem("token");
            // const headers = { "Content-Type": "application/json" };
            // if (token) headers["Authorization"] = `Bearer ${token}`;
            // const data = await apiFetch("/api/votes/status", { headers });
            const data = await apiFetch("/api/votes/status");
            if (data && data.success && data.voted_elections) {
                setVotedElections(data.voted_elections);
            }
        };
        fetchVoted();
    }, [isLoggedIn]);

    const checkEligibility = async (electionId) => {

        const eligibilityData = await apiFetch(`/api/eligibility/${electionId}`);
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
        // const checkData = await apiFetch(`http://localhost:5000/api/applications/check/${electionId}`, {
        //     headers: { Authorization: `Bearer ${token}` },
        // });
        const checkData = await apiFetch(`/api/applications/check/${electionId}`);
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
        // setStudent({
        //     user_id: eligibilityData.user_id,
        //     first_name: localStorage.getItem("first_name"),
        //     last_name: localStorage.getItem("last_name"),
        //     student_id: localStorage.getItem("student_id"),
        //     email: localStorage.getItem("email"),
        //     department: localStorage.getItem("department"),
        //     year_level: localStorage.getItem("year_level"),
        // });
        // ใช้ข้อมูลจาก me ที่เราดึงไว้
        if (me) {
            setStudent({
                user_id: eligibilityData.user_id,
                first_name: me.first_name,
                last_name: me.last_name,
                student_id: me.student_id,
                email: me.email,
                department: me.department,
                year_level: me.year_level,
            });
        }
    };

    const handleVoteClick = async (electionId) => {
        // const token = localStorage.getItem('token');
        // // เช็คสิทธิ์โหวตก่อน
        // const eligibilityData = await apiFetch(`http://localhost:5000/api/eligibility/${electionId}`, {
        //     headers: { Authorization: `Bearer ${token}` },
        // });
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
        // หรือถ้าใช้ react-router v6+
        // navigate(`/election/${electionId}/vote`);
    };

    const handleEdit = (election) => {
        setEditingElection(election);
    };

    const handleDelete = async (electionId) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: "คุณไม่สามารถกู้คืนได้หลังจากลบ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ใช่, ลบเลย!",
            cancelButtonText: "ยกเลิก"
        });
        if (!confirm.isConfirmed) return;

        try {
            await apiFetch(`/api/elections/${electionId}`, { method: "DELETE" });
            setElections(prev => prev.filter(e => e.election_id !== electionId));
            Swal.fire("ลบสำเร็จ!", "", "success");
        } catch (err) {
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบได้", "error");
        }
    };

    const toggleVisibility = async (election) => {
        // const token = localStorage.getItem("token");
        const willHide = !election.is_hidden;

        const confirm = await Swal.fire({
            title: willHide ? "ซ่อนรายการนี้?" : "ยกเลิกซ่อนรายการนี้?",
            text: willHide ? "ผู้ใช้ทั่วไปจะไม่เห็นรายการนี้" : "ผู้ใช้ทั่วไปจะเห็นรายการนี้อีกครั้ง",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: willHide ? "ซ่อน" : "ยืนยัน",
            cancelButtonText: "ยกเลิก",
        });
        if (!confirm.isConfirmed) return;

        try {
            await apiFetch(`/api/elections/${election.election_id}/visibility`, {
                method: "PATCH",
                // headers: {
                //     "Content-Type": "application/json",
                //     Authorization: `Bearer ${token}`
                // },
                body: JSON.stringify({ is_hidden: willHide })
            });

            // อัปเดต state ให้ทันที
            setElections(prev =>
                prev.map(e => e.election_id === election.election_id ? { ...e, is_hidden: willHide } : e)
            );

            Swal.fire(willHide ? "ซ่อนแล้ว" : "ยกเลิกซ่อนแล้ว", "", "success");
        } catch (err) {
            Swal.fire("เกิดข้อผิดพลาด", "อัปเดตการซ่อนไม่สำเร็จ", "error");
        }
    };

    // ด้านบนไฟล์

    // …ในคอมโพเนนต์ ก่อน return
    const visibleElections = isAdmin
        ? (elections || [])
        : (elections || []).filter(e => !e.is_hidden); // ผู้ใช้ทั่วไปยังไม่เห็นที่ซ่อน



    // if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
                <div className="flex flex-col items-center bg-white shadow-lg rounded-2xl p-8 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                    <p className="text-gray-700 text-lg font-semibold">กำลังโหลดข้อมูล...</p>
                    <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
                </div>
            </div>
        );
    }


    return (
        <>
            <Header studentName={studentName} />

            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleElections.map((election) => (
                        <div
                            key={election.election_id}
                            className="bg-white p-4 rounded shadow"
                        >
                            <img
                                src={`http://localhost:5000${election.image_url}`}
                                alt="election"
                                className="w-full h-48 object-cover rounded mb-4"
                            />
                            {/* <p className="font-semibold mb-2">{election.election_name}</p> */}
                            <div className="flex items-center justify-between">
                                <p className="font-semibold mb-2">{election.election_name}</p>
                                {isAdmin && election.is_hidden && (
                                    <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                        ซ่อนอยู่
                                    </span>
                                )}
                            </div>
                            <div className="h-[4.5rem] overflow-hidden ">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words line-clamp-3">
                                    {election.description}
                                </p>
                            </div>

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
                                    {/* {translateStatus(election.computed_status)} */}
                                    {translateStatus(election.effective_status || election.auto_status)}
                                </span>
                            </p>

                            {election.manual_override !== "AUTO" && (
                                <p className="text-xs mt-1 text-gray-600">
                                    หมายเหตุผู้ดูแล: {election.status_note || (election.manual_override === "FORCE_CLOSED" ? "ปิดชั่วคราวโดยผู้ดูแล" : "เปิดลงคะแนนแบบบังคับ")}
                                </p>
                            )}


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
                                        {/* {roles.includes("นักศึกษา") && election.computed_status === "registration" && ( */}
                                        {roles.includes("นักศึกษา") && election.effective_status === "REGISTRATION_OPEN" && (

                                            <button
                                                className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
                                                onClick={() => checkEligibility(election.election_id)}
                                            >
                                                สมัครเป็นผู้สมัคร
                                            </button>
                                        )}

                                        {/* {roles.includes("นักศึกษา") && election.computed_status === "active" && ( */}
                                        {roles.includes("นักศึกษา") && election.effective_status === "VOTING_OPEN" && (

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
                                        {/* {roles.includes("นักศึกษา") && election.computed_status === "closed" && ( */}
                                        {roles.includes("นักศึกษา") && election.effective_status === "CLOSED_BY_ADMIN" && (

                                            <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed">
                                                ปิดโหวตแล้ว
                                            </button>
                                        )}

                                        {/* นักศึกษา: เสร็จสิ้น */}
                                        {/* {roles.includes("นักศึกษา") && election.computed_status === "completed" && ( */}
                                        {roles.includes("นักศึกษา") && election.effective_status === "ENDED" && (

                                            <button className="w-full bg-purple-500 text-white py-1 rounded hover:bg-purple-600">
                                                ดูผลคะแนน
                                            </button>
                                        )}

                                        {/* ผู้ดูแล: ปุ่มจัดการ */}
                                        {/* {roles.includes("ผู้ดูแล") && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(election)}
                                                    className="flex-1 bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(election.election_id)}
                                                    className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700"
                                                >
                                                    ลบ
                                                </button>
                                            </div>
                                        )} */}

                                        {isAdmin && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleEdit(election)}
                                                    className="bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
                                                >
                                                    แก้ไข
                                                </button>


                                                <button
                                                    onClick={() => handleDelete(election.election_id)}
                                                    className="bg-red-600 text-white py-1 rounded hover:bg-red-700"
                                                >
                                                    ลบ
                                                </button>

                                                <button
                                                    onClick={() => toggleVisibility(election)}
                                                    className={`py-1 rounded text-white hover:opacity-90
                                                    ${election.is_hidden ? "bg-slate-600" : "bg-violet-600"}`}
                                                    title={election.is_hidden ? "ยกเลิกซ่อน" : "ซ่อน"}
                                                >
                                                    {election.is_hidden ? "ยกเลิกซ่อน" : "ซ่อน"}
                                                </button>

                                            </div>
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

            {editingElection && (
                <EditElectionModal
                    election={editingElection}
                    onClose={() => setEditingElection(null)}
                    onSave={async () => {
                        // const token = localStorage.getItem("token");
                        // const data = await apiFetch("http://localhost:5000/api/elections", {
                        //     headers: { Authorization: `Bearer ${token}` }
                        // });
                        const data = await apiFetch("http://localhost:5000/api/elections");
                        if (data && data.success) {
                            setElections(data.data || []);
                        }
                    }}
                />
            )}


        </>
    );
}

// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import Header from "../components/Header";
// import { formatDateTime } from "../utils/dateUtils";
// import { translateStatus } from "../utils/electionStatus";
// import CandidateApplicationForm from "../components/Student/CandidateApplicationForm";
// import EditElectionModal from "../components/AdminManageElections/EditElectionModal";
// import Swal from "sweetalert2";
// import { apiFetch } from "../utils/apiFetch";

// export default function ElectionList() {
//     const [elections, setElections] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [me, setMe] = useState(null);
//     const [roles, setRoles] = useState([]);
//     const isLoggedIn = !!me;
//     const studentName = me ? `${me.first_name} ${me.last_name}` : "";
//     const isAdmin = roles.includes("ผู้ดูแล");
//     const [applyingElectionId, setApplyingElectionId] = useState(null);
//     const [showForm, setShowForm] = useState(false);
//     const [student, setStudent] = useState(null);
//     const [votedElections, setVotedElections] = useState([]);
//     const [editingElection, setEditingElection] = useState(null);

//     useEffect(() => {
//         const fetchElections = async () => {
//             try {
//                 const data = await apiFetch("http://localhost:5000/api/elections");
//                 if (data?.success) setElections(data.data || data.elections || []);
//             } catch (e) {
//                 console.error(e);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         const fetchMe = async () => {
//             try {
//                 const meRes = await apiFetch("http://localhost:5000/api/users/me");
//                 if (meRes?.success) {
//                     setMe(meRes.user);
//                     setRoles(meRes.user.roles || []);
//                 } else {
//                     setMe(null);
//                     setRoles([]);
//                 }
//             } catch {
//                 setMe(null);
//                 setRoles([]);
//             }
//         };

//         fetchElections();
//         fetchMe();
//     }, []);

//     useEffect(() => {
//         if (!isLoggedIn) return;
//         const fetchVoted = async () => {
//             const data = await apiFetch("http://localhost:5000/api/votes/status");
//             if (data && data.success && data.voted_elections) {
//                 setVotedElections(data.voted_elections);
//             }
//         };
//         fetchVoted();
//     }, [isLoggedIn]);

//     const checkEligibility = async (electionId) => {
//         const eligibilityData = await apiFetch(
//             `http://localhost:5000/api/eligibility/${electionId}`
//         );
//         if (!eligibilityData?.success || !eligibilityData.eligible) {
//             Swal.fire({
//                 title: "คุณไม่มีสิทธิ์สมัครในรายการนี้",
//                 text: "คุณขาดคุณสมบัติในการลงสมัคร โปรดติดต่อห้ององค์การ",
//                 icon: "warning",
//                 confirmButtonText: "รับทราบ",
//             });
//             return;
//         }

//         const checkData = await apiFetch(
//             `http://localhost:5000/api/applications/check/${electionId}`
//         );
//         if (checkData?.applied) {
//             Swal.fire({
//                 title: "คุณสมัครไปแล้ว",
//                 text: "ไม่สามารถสมัครซ้ำในรายการนี้ได้",
//                 icon: "warning",
//                 confirmButtonText: "รับทราบ",
//             });
//             return;
//         }

//         setApplyingElectionId(electionId);
//         setShowForm(true);

//         if (me) {
//             setStudent({
//                 user_id: eligibilityData.user_id,
//                 first_name: me.first_name,
//                 last_name: me.last_name,
//                 student_id: me.student_id,
//                 email: me.email,
//                 department: me.department,
//                 year_level: me.year_level,
//             });
//         }
//     };

//     const handleVoteClick = async (electionId) => {
//         const eligibilityData = await apiFetch(
//             `http://localhost:5000/api/eligibility/${electionId}`
//         );
//         if (!eligibilityData?.success || !eligibilityData.eligible) {
//             Swal.fire({
//                 title: "คุณไม่มีสิทธิ์ลงคะแนนรายการนี้",
//                 text: "คุณขาดคุณสมบัติในการลงคะแนน โปรดติดต่อเจ้าหน้าที่",
//                 icon: "warning",
//                 confirmButtonText: "รับทราบ",
//             });
//             return;
//         }
//         window.location.href = `/election/${electionId}/vote`;
//     };

//     const handleEdit = (election) => setEditingElection(election);

//     const handleDelete = async (electionId) => {
//         const confirm = await Swal.fire({
//             title: "ยืนยันการลบ?",
//             text: "คุณไม่สามารถกู้คืนได้หลังจากลบ",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#d33",
//             cancelButtonColor: "#3085d6",
//             confirmButtonText: "ใช่, ลบเลย!",
//             cancelButtonText: "ยกเลิก",
//         });
//         if (!confirm.isConfirmed) return;

//         try {
//             await apiFetch(`http://localhost:5000/api/elections/${electionId}`, {
//                 method: "DELETE",
//             });
//             setElections((prev) =>
//                 prev.filter((e) => e.election_id !== electionId)
//             );
//             Swal.fire("ลบสำเร็จ!", "", "success");
//         } catch {
//             Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบได้", "error");
//         }
//     };

//     const toggleVisibility = async (election) => {
//         const willHide = !election.is_hidden;
//         const confirm = await Swal.fire({
//             title: willHide ? "ซ่อนรายการนี้?" : "ยกเลิกซ่อนรายการนี้?",
//             text: willHide
//                 ? "ผู้ใช้ทั่วไปจะไม่เห็นรายการนี้"
//                 : "ผู้ใช้ทั่วไปจะเห็นรายการนี้อีกครั้ง",
//             icon: "question",
//             showCancelButton: true,
//             confirmButtonText: willHide ? "ซ่อน" : "ยืนยัน",
//             cancelButtonText: "ยกเลิก",
//         });
//         if (!confirm.isConfirmed) return;

//         try {
//             await apiFetch(
//                 `http://localhost:5000/api/elections/${election.election_id}/visibility`,
//                 {
//                     method: "PATCH",
//                     body: JSON.stringify({ is_hidden: willHide }),
//                 }
//             );
//             setElections((prev) =>
//                 prev.map((e) =>
//                     e.election_id === election.election_id
//                         ? { ...e, is_hidden: willHide }
//                         : e
//                 )
//             );
//             Swal.fire(willHide ? "ซ่อนแล้ว" : "ยกเลิกซ่อนแล้ว", "", "success");
//         } catch {
//             Swal.fire("เกิดข้อผิดพลาด", "อัปเดตการซ่อนไม่สำเร็จ", "error");
//         }
//     };

//     const visibleElections = isAdmin
//         ? elections
//         : (elections || []).filter((e) => !e.is_hidden);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
//                 <div className="flex flex-col items-center bg-white shadow-lg rounded-2xl p-8 space-y-4">
//                     <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
//                     <p className="text-gray-700 text-lg font-semibold">กำลังโหลดข้อมูล...</p>
//                     <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <>
//             <Header studentName={studentName} />

//             <div className="min-h-screen bg-purple-100 p-8">
//                 <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>

//                 {/* 📱 มือถือ = slide, 💻 จอใหญ่ = grid */}
//                 <div className="
//   flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-1
//   md:grid md:overflow-visible md:snap-none
//   md:grid-cols-2 md:gap-6
// ">
//                     {visibleElections.map((election) => (
//                         <div
//                             key={election.election_id}
//                             className="
//                 min-w-[85vw] snap-center
//                 md:min-w-0 md:snap-none
//                 bg-white p-4 rounded-2xl shadow-sm ring-1 ring-black/5
//                 hover:shadow-lg hover:-translate-y-0.5 transition backdrop-blur
//                 "
//                         >
//                             <img
//                                 src={`http://localhost:5000${election.image_url}`}
//                                 alt="election"
//                                 className="w-full h-48 object-cover rounded mb-4"
//                             />
//                             <div className="flex items-center justify-between">
//                                 <p className="font-semibold mb-2">{election.election_name}</p>
//                                 {isAdmin && election.is_hidden && (
//                                     <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
//                                         ซ่อนอยู่
//                                     </span>
//                                 )}
//                             </div>

//                             <div className="h-[4.5rem] overflow-hidden ">
//                                 <p className="text-sm text-gray-700 whitespace-pre-wrap break-words line-clamp-3">
//                                     {election.description}
//                                 </p>
//                             </div>

//                             <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm border-t pt-4">
//                                 <div>
//                                     <span className="font-semibold text-gray-700">📥 เปิดรับสมัคร:</span><br />
//                                     <span className="text-gray-800">{formatDateTime(election.registration_start)}</span>
//                                 </div>
//                                 <div>
//                                     <span className="font-semibold text-gray-700">📤 สิ้นสุดสมัคร:</span><br />
//                                     <span className="text-gray-800">{formatDateTime(election.registration_end)}</span>
//                                 </div>
//                                 <div>
//                                     <span className="font-semibold text-gray-700">🗳️ เริ่มลงคะแนน:</span><br />
//                                     <span className="text-gray-800">{formatDateTime(election.start_date)}</span>
//                                 </div>
//                                 <div>
//                                     <span className="font-semibold text-gray-700">🛑 สิ้นสุดลงคะแนน:</span><br />
//                                     <span className="text-gray-800">{formatDateTime(election.end_date)}</span>
//                                 </div>
//                             </div>

//                             <p className="text-sm mt-2">
//                                 <span className="font-semibold">สถานะ:</span>{" "}
//                                 <span
//                                     className={`px-2 py-1 rounded text-white text-xs 
//                     ${election.effective_status === "REGISTRATION_OPEN"
//                                             ? "bg-violet-500"
//                                             : election.effective_status === "VOTING_OPEN"
//                                                 ? "bg-green-500"
//                                                 : election.effective_status === "CLOSED_BY_ADMIN"
//                                                     ? "bg-gray-500"
//                                                     : election.effective_status === "ENDED"
//                                                         ? "bg-slate-500"
//                                                         : election.effective_status === "WAITING_VOTE"
//                                                             ? "bg-amber-500"
//                                                             : "bg-purple-500"
//                                         }`}
//                                 >
//                                     {translateStatus(election.effective_status || election.auto_status)}
//                                 </span>
//                             </p>

//                             {election.manual_override !== "AUTO" && (
//                                 <p className="text-xs mt-1 text-gray-600">
//                                     หมายเหตุผู้ดูแล:{" "}
//                                     {election.status_note ||
//                                         (election.manual_override === "FORCE_CLOSED"
//                                             ? "ปิดชั่วคราวโดยผู้ดูแล"
//                                             : "เปิดลงคะแนนแบบบังคับ")}
//                                 </p>
//                             )}

//                             <div className="mt-4 flex flex-col space-y-2">
//                                 <Link
//                                     to={`/election/${election.election_id}`}
//                                     className="block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
//                                 >
//                                     ดูรายละเอียด
//                                 </Link>

//                                 {isLoggedIn && (
//                                     <>
//                                         {roles.includes("นักศึกษา") &&
//                                             election.effective_status === "REGISTRATION_OPEN" && (
//                                                 <button
//                                                     className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
//                                                     onClick={() => checkEligibility(election.election_id)}
//                                                 >
//                                                     สมัครเป็นผู้สมัคร
//                                                 </button>
//                                             )}

//                                         {roles.includes("นักศึกษา") &&
//                                             election.effective_status === "VOTING_OPEN" &&
//                                             (votedElections.includes(election.election_id) ? (
//                                                 <button
//                                                     disabled
//                                                     className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed"
//                                                 >
//                                                     ลงคะแนนแล้ว
//                                                 </button>
//                                             ) : (
//                                                 <button
//                                                     className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600"
//                                                     onClick={() => handleVoteClick(election.election_id)}
//                                                 >
//                                                     ลงคะแนน
//                                                 </button>
//                                             ))}

//                                         {roles.includes("นักศึกษา") &&
//                                             election.effective_status === "CLOSED_BY_ADMIN" && (
//                                                 <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed">
//                                                     ปิดโหวตแล้ว
//                                                 </button>
//                                             )}

//                                         {roles.includes("นักศึกษา") &&
//                                             election.effective_status === "ENDED" && (
//                                                 <button className="w-full bg-purple-500 text-white py-1 rounded hover:bg-purple-600">
//                                                     ดูผลคะแนน
//                                                 </button>
//                                             )}

//                                         {isAdmin && (
//                                             <div className="grid grid-cols-3 gap-2">
//                                                 <button
//                                                     onClick={() => handleEdit(election)}
//                                                     className="bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600"
//                                                 >
//                                                     แก้ไข
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDelete(election.election_id)}
//                                                     className="bg-red-600 text-white py-1 rounded hover:bg-red-700"
//                                                 >
//                                                     ลบ
//                                                 </button>
//                                                 <button
//                                                     onClick={() => toggleVisibility(election)}
//                                                     className={`py-1 rounded text-white hover:opacity-90 ${election.is_hidden ? "bg-slate-600" : "bg-violet-600"
//                                                         }`}
//                                                 >
//                                                     {election.is_hidden ? "ยกเลิกซ่อน" : "ซ่อน"}
//                                                 </button>
//                                             </div>
//                                         )}
//                                     </>
//                                 )}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {showForm && student && (
//                 <CandidateApplicationForm
//                     student={student}
//                     electionId={applyingElectionId}
//                     onClose={() => setShowForm(false)}
//                 />
//             )}

//             {editingElection && (
//                 <EditElectionModal
//                     election={editingElection}
//                     onClose={() => setEditingElection(null)}
//                     onSave={async () => {
//                         const data = await apiFetch("http://localhost:5000/api/elections");
//                         if (data && data.success) {
//                             setElections(data.data || []);
//                         }
//                     }}
//                 />
//             )}
//         </>
//     );
// }

