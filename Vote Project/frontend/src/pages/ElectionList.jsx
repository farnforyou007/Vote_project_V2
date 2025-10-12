// src/pages/ElectionList.jsx (reworked)
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "components";

import { formatDateTime } from "utils/dateUtils";
import { translateStatus } from "utils/electionStatus";
import { CandidateApplicationForm } from "components/Student";
import { EditElectionModal } from "components/AdminManageElections";
import Swal from "sweetalert2";
import { apiFetch } from "utils/apiFetch";
import { useNavigate } from "react-router-dom";

// ===== Helper: ปี (พ.ศ.) จากวันที่ =====
const getYearBE = (iso) => {
    if (!iso) return "ไม่ทราบปี";
    const y = new Date(iso).getFullYear();
    return y + 543; // ถ้าอยากใช้ ค.ศ. ให้ return y
};

// ===== Helper: map สถานะ -> คีย์เซคชัน =====
const sectionKey = (e) => {
    const s = e.effective_status || e.auto_status;
    if (s === "REGISTRATION_OPEN") return "REG";
    if (s === "VOTING_OPEN") return "VOTE";
    if (s === "WAITING_VOTE") return "WAIT";
    return "END"; // ENDED / CLOSED_BY_ADMIN / อื่น ๆ
};

// ===== Helper: ฐานสำหรับรูปภาพ/ไฟล์และ API (รองรับ CRA) =====
const API_BASE = process.env.REACT_APP_API_BASE || `${window.location.origin}`;
const FILE_BASE = process.env.REACT_APP_FILE_BASE || API_BASE.replace(/\/api\/?$/, "");

export default function ElectionList() {
    // ===== state หลัก =====
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);

    // โปรไฟล์ / สิทธิ์
    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const isLoggedIn = !!me;
    const studentName = me ? `${me.first_name} ${me.last_name}` : "";
    const isAdmin = roles.includes("ผู้ดูแล");

    // สมัคร/โหวต/แก้ไข
    const [applyingElectionId, setApplyingElectionId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [student, setStudent] = useState(null);
    const [votedElections, setVotedElections] = useState([]);
    const [editingElection, setEditingElection] = useState(null);

    const navigate = useNavigate();
    // ===== โหลดข้อมูล =====
    useEffect(() => {
        const fetchElections = async () => {
            try {
                const data = await apiFetch(`/api/elections`);
                if (data?.success) setElections(data.data || data.elections || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const fetchMe = async () => {
            try {
                const meRes = await apiFetch(`/api/users/me`);
                if (meRes?.success) {
                    setMe(meRes.user);
                    setRoles(meRes.user.roles || []);
                } else {
                    setMe(null);
                    setRoles([]);
                }
            } catch {
                // 401 / error -> ปล่อยผ่าน
                setMe(null);
                setRoles([]);
            }
        };

        fetchElections(); // โหลด public ก่อน
        fetchMe(); // โหลดโปรไฟล์แบบ non-blocking
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchVoted = async () => {
            const data = await apiFetch(`/api/votes/status`);
            if (data && data.success && data.voted_elections) {
                setVotedElections(data.voted_elections);
            }
        };
        fetchVoted();
    }, [isLoggedIn]);

    // ===== Action ปุ่มต่าง ๆ =====
    const checkEligibility = async (electionId) => {
        const eligibilityData = await apiFetch(`/api/eligibility/${electionId}`);
        if (!eligibilityData) return;

        if (!eligibilityData.success || !eligibilityData.eligible) {
            Swal.fire({
                title: "คุณไม่มีสิทธิ์สมัครในรายการนี้",
                text: "คุณขาดคุณสมบัติในการลงสมัครจึงไม่สามารถลงสมัครได้\nโปรดติดต่อห้ององค์การ",
                icon: "warning",
                confirmButtonText: "รับทราบ",
            });
            return;
        }

        // เช็คว่าสมัครไปแล้วหรือยัง
        const checkData = await apiFetch(`/api/applications/check/${electionId}`);
        if (!checkData) return;

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
        window.location.href = `/election/${electionId}/vote`;
    };

    const handleEdit = (election) => setEditingElection(election);

    const handleDelete = async (electionId) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: "คุณไม่สามารถกู้คืนได้หลังจากลบ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ใช่, ลบเลย!",
            cancelButtonText: "ยกเลิก",
        });
        if (!confirm.isConfirmed) return;

        try {
            await apiFetch(`/api/elections/${electionId}`, { method: "DELETE" });
            setElections((prev) => prev.filter((e) => e.election_id !== electionId));
            Swal.fire("ลบสำเร็จ!", "", "success");
        } catch (err) {
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบได้", "error");
        }
    };

    const toggleVisibility = async (election) => {
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
                body: JSON.stringify({ is_hidden: willHide }),
            });

            setElections((prev) =>
                prev.map((e) => (e.election_id === election.election_id ? { ...e, is_hidden: willHide } : e))
            );

            Swal.fire(willHide ? "ซ่อนแล้ว" : "ยกเลิกซ่อนแล้ว", "", "success");
        } catch {
            Swal.fire("เกิดข้อผิดพลาด", "อัปเดตการซ่อนไม่สำเร็จ", "error");
        }
    };

    // ===== มุมมอง: กรองปี + แบ่งเซคชัน =====
    const [yearFilter, setYearFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | REG | VOTE

    // ผู้ใช้ทั่วไปไม่เห็นที่ซ่อน
    const visibleElections = useMemo(
        () => (isAdmin ? elections || [] : (elections || []).filter((e) => !e.is_hidden)),
        [elections, isAdmin]
    );

    // รายชื่อปีทั้งหมดในข้อมูล (พ.ศ.) เรียงล่าสุดก่อน
    const allYears = useMemo(() => {
        const set = new Set(visibleElections.map((e) => getYearBE(e.start_date || e.registration_start)));
        return ["ALL", ...Array.from(set).sort((a, b) => b - a)];
    }, [visibleElections]);

    // ตามปีที่เลือก + เรียงวันที่ใหม่→เก่า
    const filteredByYear = useMemo(() => {
        const list =
            yearFilter === "ALL"
                ? visibleElections
                : visibleElections.filter((e) => getYearBE(e.start_date || e.registration_start) === yearFilter);

        return [...list].sort(
            (a, b) =>
                new Date(b.start_date || b.registration_start) - new Date(a.start_date || a.registration_start)
        );
    }, [visibleElections, yearFilter]);

    // ใช้ตัวกรองสถานะ (สำหรับหน้า "ทั้งหมด")
    const filteredByStatus = useMemo(() => {
        if (statusFilter === "ALL") return filteredByYear;
        if (statusFilter === "REG") return filteredByYear.filter((e) => sectionKey(e) === "REG");
        if (statusFilter === "VOTE") return filteredByYear.filter((e) => sectionKey(e) === "VOTE");
        return filteredByYear;
    }, [filteredByYear, statusFilter]);

    // แบ่ง 4 เซคชัน (ใช้ในกรณีเลือกปีเฉพาะ)
    const groupedBySection = useMemo(() => {
        const buckets = { REG: [], VOTE: [], WAIT: [], END: [] };
        filteredByYear.forEach((e) => buckets[sectionKey(e)].push(e));
        return buckets;
    }, [filteredByYear]);

    // เรนเดอร์การ์ด (ลดขนาดให้เล็กลงเล็กน้อย)
    const renderCard = (election) => (
        <div
            key={election.election_id}
            className="bg-white p-3 rounded-xl shadow-sm ring-1 ring-black/5 hover:shadow-md hover:-translate-y-0.5 transition"
        >
            {election.image_url && (
                <img
                    src={`${FILE_BASE}${election.image_url}`}
                    alt="election"
                    className="w-full h-36 object-cover rounded-lg mb-3"
                />
            )}

            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[15px] leading-snug line-clamp-2">{election.election_name}</p>
                {isAdmin && election.is_hidden && (
                    <span className="ml-2 inline-block text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 shrink-0">ซ่อนอยู่</span>
                )}
            </div>

            <p className="text-[13px] text-gray-700 whitespace-pre-wrap break-words line-clamp-3 min-h-[2.8rem]">
                {election.description}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-[12px] border-t pt-3">
                <div>
                    <span className="font-semibold text-gray-700">📥 เปิดรับสมัคร:</span>
                    <br />
                    <span className="text-gray-800">{formatDateTime(election.registration_start)}</span>
                </div>
                <div>
                    <span className="font-semibold text-gray-700">📤 สิ้นสุดสมัคร:</span>
                    <br />
                    <span className="text-gray-800">{formatDateTime(election.registration_end)}</span>
                </div>
                <div>
                    <span className="font-semibold text-gray-700">🗳️ เริ่มลงคะแนน:</span>
                    <br />
                    <span className="text-gray-800">{formatDateTime(election.start_date)}</span>
                </div>
                <div>
                    <span className="font-semibold text-gray-700">🛑 สิ้นสุดลงคะแนน:</span>
                    <br />
                    <span className="text-gray-800">{formatDateTime(election.end_date)}</span>
                </div>
            </div>

            <p className="text-[12px] mt-2">
                <span className="font-semibold">สถานะ:</span>{" "}
                <span
                    className={`px-2 py-0.5 rounded text-white text-[11px] ${election.effective_status === "REGISTRATION_OPEN"
                        ? "bg-violet-500"
                        : election.effective_status === "VOTING_OPEN"
                            ? "bg-green-500"
                            : election.effective_status === "CLOSED_BY_ADMIN"
                                ? "bg-gray-500"
                                : election.effective_status === "ENDED"
                                    ? "bg-slate-500"
                                    : election.effective_status === "WAITING_VOTE"
                                        ? "bg-amber-500"
                                        : "bg-purple-500"
                        }`}
                >
                    {translateStatus(election.effective_status || election.auto_status)}
                </span>
            </p>

            {election.manual_override !== "AUTO" && (
                <p className="text-[11px] mt-1 text-gray-600">
                    หมายเหตุผู้ดูแล:{" "}
                    {election.status_note ||
                        (election.manual_override === "FORCE_CLOSED"
                            ? "ปิดชั่วคราวโดยผู้ดูแล"
                            : "เปิดลงคะแนนแบบบังคับ")}
                </p>
            )}

            <div className="mt-3 flex flex-col space-y-2">
                <Link
                    to={`/election/${election.election_id}`}
                    className="block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700 text-[13px]"
                >
                    ดูรายละเอียด
                </Link>

                {isLoggedIn && (
                    <>
                        {roles.includes("นักศึกษา") && election.effective_status === "REGISTRATION_OPEN" && (
                            <button
                                className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600 text-[13px]"
                                onClick={() => checkEligibility(election.election_id)}
                            >
                                สมัครเป็นผู้สมัคร
                            </button>
                        )}

                        {roles.includes("นักศึกษา") &&
                            election.effective_status === "VOTING_OPEN" &&
                            (votedElections.includes(election.election_id) ? (
                                <button disabled className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed text-[13px]">
                                    ลงคะแนนแล้ว
                                </button>
                            ) : (
                                <button
                                    className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-center text-[13px]"
                                    onClick={() => handleVoteClick(election.election_id)}
                                >
                                    ลงคะแนน
                                </button>
                            ))}

                        {roles.includes("นักศึกษา") && election.effective_status === "CLOSED_BY_ADMIN" && (
                            <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed text-[13px]">ปิดโหวตแล้ว</button>
                        )}

                        {roles.includes("นักศึกษา") && election.effective_status === "ENDED" && (
                            // <button
                            //     onClick={() => navigate(`/results/${election.election_id}`)}   // ✅ ไปหน้าผลคะแนน
                            //     className="w-full bg-purple-500 text-white py-1 rounded hover:bg-purple-600 text-[13px]"
                            // >
                            //     ดูผลคะแนน
                            // </button>
                            <Link
                                to={`/results/${election.election_id}`}
                                className="block w-full text-center bg-purple-500 text-white py-1 rounded hover:bg-purple-600 text-[13px]"
                            >
                                ดูผลคะแนน
                            </Link>
                        )}

                        {isAdmin && (
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleEdit(election)} className="bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600 text-[13px]">
                                    แก้ไข
                                </button>
                                <button onClick={() => handleDelete(election.election_id)} className="bg-red-600 text-white py-1 rounded hover:bg-red-700 text-[13px]">
                                    ลบ
                                </button>
                                <button
                                    onClick={() => toggleVisibility(election)}
                                    className={`py-1 rounded text-white hover:opacity-90 text-[13px] ${election.is_hidden ? "bg-slate-600" : "bg-violet-600"}`}
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
    );

    // ===== Loading =====
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

    // ===== Views =====
    // ===== Views =====
    const YearGrid = ({ list }) => {
        // มีใบเดียว → จัดกลาง + กว้างเท่าหนึ่งคอลัมน์ของ layout 2 คอลัมน์
        // if (list.length === 1) {
        //     return (
        //         <div className="flex justify-center">
        //             <div className="w-full md:w-1/2 max-w-[720px]">
        //                 {renderCard(list[0])}
        //             </div>
        //         </div>
        //     );
        // }

        // ปกติ → 2 คอลัมน์บนจอ md ขึ้นไป, 1 คอลัมน์บนมือถือ
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {list.map(renderCard)}
            </div>
        );
    };


    // ปีทั้งหมด (เรียงใหม่→เก่า) ยกเว้น "ALL"
    // ปีทั้งหมด (เรียงใหม่→เก่า) ยกเว้น "ALL"
    const yearsDescending = allYears.filter((y) => y !== "ALL");

    // จัดลำดับสถานะ: REG → VOTE → WAIT → END
    const statusRank = (e) => {
        const k = sectionKey(e);
        return k === "REG" ? 0 : k === "VOTE" ? 1 : k === "WAIT" ? 2 : k === "END" ? 3 : 4;
    };


    return (
        <>
            <Header studentName={studentName} />

            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>

                {/* แถบกรองหลัก */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {/* ปี */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {allYears.map((y) => (
                            <button
                                key={y}
                                onClick={() => setYearFilter(y)}
                                className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${yearFilter === y
                                    ? "bg-violet-600 text-white border-violet-600"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {y === "ALL" ? "ทั้งหมด" : `ปี ${y}`}
                            </button>
                        ))}
                    </div>

                    {/* สถานะ (เฉพาะตอนดู "ทั้งหมด") */}
                    {yearFilter === "ALL" && (
                        // {/* ฟิลเตอร์สถานะ (ให้มีทั้งโหมดทั้งหมดและโหมดเลือกปี) */ }
                        <div className="flex gap-2 ml-auto">
                            {[
                                { k: "ALL", label: "ทุกสถานะ" },
                                { k: "REG", label: "เปิดรับสมัคร" },
                                { k: "VOTE", label: "เปิดลงคะแนน" },
                            ].map((it) => (
                                <button
                                    key={it.k}
                                    onClick={() => setStatusFilter(it.k)}
                                    className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${statusFilter === it.k
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {it.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Sticky Year Header เมื่อเลือกปีใดปีหนึ่ง */}
                {yearFilter !== "ALL" && (
                    <div className="sticky top-0 z-10 -mx-8 px-8 py-2 mb-4 backdrop-blur bg-white/70 border-b">
                        <h2 className="text-lg font-semibold">ปี {yearFilter}</h2>
                    </div>
                )}

                {/* โหมด: หน้ารวมทั้งหมด (แบ่งเซคชันเป็นปี ๆ) */}
                {yearFilter === "ALL" ? (
                    yearsDescending.length === 0 ? (
                        <p className="text-sm text-gray-600">ยังไม่มีรายการเลือกตั้ง</p>
                    ) : (
                        <div className="space-y-10">
                            {yearsDescending.map((yy) => {
                                // เอาข้อมูลเฉพาะปี yy จากชุดที่ถูกกรองสถานะแล้ว (filteredByStatus)
                                const listOfYear = filteredByStatus.filter(
                                    (e) => getYearBE(e.start_date || e.registration_start) === yy
                                );
                                if (listOfYear.length === 0) return null;

                                // เรียงสถานะ REG → VOTE → อื่น ๆ และในกลุ่มเดียวกันเรียงวันที่ใหม่→เก่า
                                const listSorted = [...listOfYear].sort((a, b) => {
                                    const r = statusRank(a) - statusRank(b);
                                    if (r !== 0) return r;
                                    return (
                                        new Date(b.start_date || b.registration_start) -
                                        new Date(a.start_date || a.registration_start)
                                    );
                                });

                                // หากเลือกเฉพาะสถานะ ให้แสดง grid เดียว
                                if (statusFilter === "REG" || statusFilter === "VOTE") {
                                    return (
                                        <section key={yy}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
                                                <h3 className="text-base font-semibold">ปี {yy}</h3>
                                            </div>
                                            <YearGrid list={listSorted} />
                                        </section>
                                    );
                                }

                                // ไม่ได้กรองสถานะ -> แบ่งย่อยตามสถานะภายในปี
                                const buckets = { REG: [], VOTE: [], WAIT: [], END: [] };
                                listOfYear.forEach((e) => buckets[sectionKey(e)].push(e));

                                return (
                                    <section key={yy}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
                                            <h3 className="text-base font-semibold">ปี {yy}</h3>
                                        </div>

                                        {buckets.REG.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
                                                    เปิดรับสมัคร
                                                </h4>
                                                <YearGrid list={buckets.REG} />
                                            </div>
                                        )}

                                        {buckets.VOTE.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                                                    กำลังลงคะแนน
                                                </h4>
                                                <YearGrid list={buckets.VOTE} />
                                            </div>
                                        )}

                                        {buckets.WAIT.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                                    รอโหวต
                                                </h4>
                                                <YearGrid list={buckets.WAIT} />
                                            </div>
                                        )}

                                        {buckets.END.length > 0 && (
                                            <div className="mb-2">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
                                                    สิ้นสุดแล้ว
                                                </h4>
                                                <YearGrid list={buckets.END} />
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )
                ) : (
                    // โหมด: เลือกปีเฉพาะ (คงโครงเดิม แบ่งตามสถานะ)
                    <>

                        {groupedBySection.REG.length > 0 && (
                            <section className="mb-8">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
                                    เปิดรับสมัคร
                                </h3>
                                <YearGrid list={groupedBySection.REG} />
                            </section>
                        )}

                        {groupedBySection.VOTE.length > 0 && (
                            <section className="mb-8">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                                    กำลังลงคะแนน
                                </h3>
                                <YearGrid list={groupedBySection.VOTE} />
                            </section>
                        )}

                        {groupedBySection.WAIT.length > 0 && (
                            <section className="mb-8">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                    รอโหวต
                                </h3>
                                <YearGrid list={groupedBySection.WAIT} />
                            </section>
                        )}

                        {groupedBySection.END.length > 0 && (
                            <section className="mb-2">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
                                    สิ้นสุดแล้ว
                                </h3>
                                <YearGrid list={groupedBySection.END} />
                            </section>
                        )}
                    </>
                )}
            </div >

            {showForm && student && (
                <CandidateApplicationForm
                    student={student}
                    electionId={applyingElectionId}
                    onClose={() => setShowForm(false)}
                />
            )
            }

            {
                editingElection && (
                    <EditElectionModal
                        election={editingElection}
                        onClose={() => setEditingElection(null)}
                        onSave={async () => {
                            const data = await apiFetch(`/api/elections`);
                            if (data && data.success) {
                                setElections(data.data || []);
                            }
                        }}
                    />
                )
            }
        </>
    );
}
