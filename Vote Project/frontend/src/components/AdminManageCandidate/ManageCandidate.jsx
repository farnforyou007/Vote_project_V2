import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "components";

import { FaTrash, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";
import CandidateModal from "./CandidateModal";
import { apiFetch } from "utils/apiFetch";
import { formatDate, formatTime } from "utils/dateUtils";   

export default function AdminManageCandidates() {
    const { id } = useParams();

    // ข้อมูลหลัก
    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    const [electionInfo, setElectionInfo] = useState(null);
    const [candidates, setCandidates] = useState([]);

    // state สำหรับกรอง/ค้นหา/จำกัดแถว
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(20);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [levels, setLevels] = useState([]);
    const [filter, setFilter] = useState({ department: "", year: "", level: "" });

    // const [selectedDept, setSelectedDept] = useState('');
    // const [selectedYear, setSelectedYear] = useState('');
    // const [selectedLevel, setSelectedLevel] = useState('');
    // modal
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // ---------- loaders ----------
    const loadMe = async () => {
        const meRes = await apiFetch(`/api/users/me`);
        if (meRes?.success) {
            setMe(meRes.user);
            setRoles(meRes.user.roles || []);
        }
        setLoadingMe(false);
    };

    const loadElectionInfo = async () => {
        const data = await apiFetch(`/api/elections/${id}`);
        if (!data) return; // 401 -> apiFetch จัดการเองแล้ว
        // บาง backend ใช้ key ต่างกัน ลองรองรับทั้ง data.election และ data.data
        setElectionInfo(data.election || data.data || null);
    };

    const loadCandidates = async () => {
        const data = await apiFetch(`/api/elections/${id}/candidates`);
        if (!data) {
            setCandidates([]);
            return;
        }
        if (data.success && Array.isArray(data.candidates)) {
            setCandidates(data.candidates);
        } else {
            setCandidates([]);
        }
    };

    const loadLookups = async () => {
        const [d, y, l] = await Promise.all([
            apiFetch(`/api/users/departments`),
            apiFetch(`/api/users/years`),
            apiFetch(`/api/users/levels`),
        ]);
        setDepartments(d?.departments || []);
        setYears(y?.years || []);
        setLevels(l?.levels || []);
    };

    // โหลดทั้งหมดเมื่อ id เปลี่ยน/เข้าหน้านี้
    useEffect(() => {
        (async () => {
            await Promise.all([loadMe(), loadElectionInfo(), loadCandidates(), loadLookups()]);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ---------- actions ----------
    const handleDelete = async (candidateId) => {
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

        const data = await apiFetch(`/api/candidates/${candidateId}`,
            { method: "DELETE" });
        if (!data) return; // 401 → apiFetch พาไป login แล้ว

        if (data.success) {
            setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
            Swal.fire("ลบสำเร็จ!", "", "success");
        } else {
            Swal.fire("ลบไม่สำเร็จ", data.message || "กรุณาลองใหม่", "error");
        }
    };

    // ---------- filters / derived ----------
    const filteredYears = useMemo(
        () => (filter.level ? years.filter((y) => y.level_id === parseInt(filter.level)) : years),
        [years, filter.level]
    );

    // สร้างแผนที่ year_id -> level_id จากรายการปีที่มีอยู่
    const yearToLevel = useMemo(() => {
        const m = {};
        years.forEach(y => { m[String(y.year_id)] = String(y.level_id); });
        return m;
    }, [years]);

    // เมื่อเปลี่ยน 'ชั้นปี' ให้เซ็ต level ให้สอดคล้องอัตโนมัติ
    // handler สำหรับการเปลี่ยนแปลงชั้นปี
    const handleYearChange = (yearId) => {
        // หาระดับการศึกษาที่สัมพันธ์กับชั้นปีที่เลือก
        const nextLevel = yearToLevel[yearId] || '';

        // อัพเดท filter state ทั้งชั้นปีและระดับการศึกษา
        setFilter(prev => ({
            ...prev,
            year: yearId,
            level: nextLevel
        }));
    };

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return (candidates || []).filter((c) => {
            const matchKeyword =
                !keyword ||
                c.full_name?.toLowerCase().includes(keyword) ||
                c.student_id?.toLowerCase().includes(keyword) ||
                c.policy?.toLowerCase().includes(keyword);

            const matchDept = !filter.department || String(c.department_id) === filter.department;
            const matchYear = !filter.year || String(c.year_id) === filter.year;
            const matchLevel = !filter.level || String(c.level_id) === filter.level;

            return matchKeyword && matchDept && matchYear && matchLevel;
        });
    }, [candidates, search, filter]);

    // }

    if (loadingMe) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-700 text-lg font-medium">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        );
    }

    if (!roles.includes("ผู้ดูแล")) {
        return (
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
                    <p className="text-red-600 text-lg font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
                    <p className="text-gray-500 text-sm">โปรดติดต่อผู้ดูแลระบบ หากคิดว่านี่คือความผิดพลาด</p>
                </div>
            </div>
        );
    }


    return (
        <>
            {/* Header โหลดชื่อผู้ใช้เองแล้ว ไม่ต้องส่ง prop */}
            <Header />

            <div className="p-6 bg-purple-100 min-h-screen">
                <h1 className="text-2xl font-bold mb-2">จัดการผู้สมัครลงเลือกตั้ง</h1>

                {electionInfo && (
                    <div className="mb-6 px-4 py-3 bg-white rounded shadow text-sm text-gray-800 space-y-1">
                        <p>
                            <strong>📌 รายการ:</strong> {electionInfo.election_name}
                        </p>
                        <p>
                            <strong>🗓️ เปิดสมัคร :</strong>{" "}
                            {formatDate(electionInfo.registration_start?.slice(0, 10))} - {formatDate(electionInfo.registration_end?.slice(0, 10))}
                        </p>
                        <p>
                            <strong>🗳️ เปิดลงคะแนน :</strong>{" "}
                            {formatDate(electionInfo.start_date?.slice(0, 10))} - {formatDate(electionInfo.end_date?.slice(0, 10))}
                        </p>
                    </div>
                )}

                {/* แถบกรอง/ค้นหา */}
                <div className="flex flex-wrap gap-4 items-center mb-6">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        {[10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n} แถว
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ / รหัส / นโยบาย"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 rounded bg-white flex-1 border-violet-300"
                    />

                    <select
                        value={filter.level}
                        // onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value, year: "" }))}
                        onChange={(e) => setFilter(prev => ({
                            ...prev,
                            level: e.target.value,
                            year: "" // รีเซ็ตชั้นปีเมื่อเปลี่ยนระดับการศึกษา
                        }))}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกระดับการศึกษา</option>
                        {levels.map((l) => (
                            <option key={l.level_id} value={l.level_id}>
                                {l.level_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filter.year}
                        // onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกชั้นปี</option>
                        {filteredYears.map((y) => (
                            <option key={y.year_id} value={y.year_id}>
                                {y.year_name}

                            </option>
                        ))}
                    </select>

                    <select
                        value={filter.department}
                        onChange={(e) => setFilter((f) => ({ ...f, department: e.target.value }))}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกแผนก</option>
                        {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>
                                {d.department_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ตาราง (สไตล์เดียวกับ CandidatesList) */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 text-sm">
                        <thead className="bg-gray-200">
                            <tr className="text-center">
                                <th className="p-2">รหัสนักศึกษา</th>
                                <th className="p-2">รูป</th>
                                <th className="p-2">ชื่อ-สกุล</th>
                                <th className="p-2">หมายเลข</th>
                                <th className="p-2">แผนก</th>
                               
                                <th className="p-2">ชั้นปี</th>
                                <th className="p-2">นโยบาย</th>
                                <th className="p-2">สถานะ</th>
                                <th className="p-2">ผู้อนุมัติ</th>
                                <th className="p-2">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-6 text-center text-gray-500">ไม่พบข้อมูลผู้สมัครตามที่ค้นหา</td>
                                </tr>
                            ) : (
                                filtered.slice(0, limit).map((c) => {
                                    // ฟิลด์รูป: รองรับทั้ง image_url (ฝั่ง ManageCandidate เดิม) และ photo (แบบ CandidatesList)
                                    const photoUrl = c.photo
                                        ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${c.photo}`
                                        : (c.image_url || "https://via.placeholder.com/80");

                                    // ฟิลด์ชื่อ: รองรับทั้ง full_name และ name
                                    const fullName = c.full_name || c.name || "-";

                                    // ฟิลด์หมายเลข: รองรับทั้ง application_number และ number
                                    const number = c.number ?? "-";

                                    // ฟิลด์นโยบาย: รองรับทั้ง policy และ campaign_slogan
                                    const slogan = c.policy ?? c.campaign_slogan ?? "-";

                                    // แผนก/ระดับ/ปี (รองรับหลายแบบ)
                                    const dept = (c.department || "").replace?.("แผนกวิชา", "").trim() || (c.department || "-");
        
                                    const yearText = c.year_name || "-" ;

                                    const reviewer_name = c.reviewer_name || "-";   
                                    // map สถานะให้เป็น unified status
                                    const rawStatus = c.application_status || c.status || "pending";
                                    const st = String(rawStatus).toLowerCase();
                                    let badgeClass = "bg-yellow-100 text-yellow-700";
                                    let badgeText = "รอการอนุมัติ";
                                    if (st.includes("approved") || st === "อนุมัติ") {
                                        badgeClass = "bg-green-100 text-green-700";
                                        badgeText = "อนุมัติแล้ว";
                                    } else if (st.includes("rejected") || st === "ไม่อนุมัติ") {
                                        badgeClass = "bg-red-100 text-red-700";
                                        badgeText = "ไม่อนุมัติ";
                                    } else if (st.includes("revision")) {
                                        badgeClass = "bg-amber-100 text-amber-700";
                                        badgeText = "รอแก้ไข";
                                    }

                                    return (
                                        <tr key={c.candidate_id || c.application_id} className="border-t hover:bg-gray-50">
                                            <td className="p-2 text-center">{c.student_id}</td>
                                            <td className="p-2">
                                                <div className="flex items-center justify-center">
                                                    <img src={photoUrl} alt="ผู้สมัคร" className="w-10 h-10 object-cover rounded-md" />
                                                </div>
                                            </td>
                                            <td className="p-2">{fullName}</td>
                                            <td className="p-2 text-center">{number}</td>
                                            <td className="p-2 text-center">{dept}</td>
                                            
                                            <td className="p-2 text-center">{yearText}</td>

                                            <td className="p-2 max-w-sm"><div className="line-clamp-2">{slogan}</div></td>
                                            <td className="p-2 text-center">
                                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                                    {badgeText}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center" >{reviewer_name || "-"}</td>

                                            <td className="p-2 flex gap-2 justify-center">
                                                {/* คงปุ่มเดิมของ ManageCandidate */}
                                                <button
                                                    onClick={() => setSelectedCandidate(c)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                                >
                                                    <FaEye className="inline" size={14} /> ใบสมัคร
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.candidate_id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                                >
                                                    <FaTrash className="inline" size={14} /> ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>


                {selectedCandidate && (
                    <CandidateModal
                        candidate={selectedCandidate}
                        onClose={() => setSelectedCandidate(null)}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </>
    );
}
