// src/pages/CommitteeElectionList.jsx
// UI และตารางอิงจากหน้า AdminElectionList แต่ปรับสิทธิ์เป็น "กรรมการ"
// เมนูจัดการเหลือเฉพาะปุ่ม "ตรวจใบสมัคร" ตามที่ต้องการ

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "components";
import { apiFetch } from "utils/apiFetch";
import { formatDate, formatTime } from "utils/dateUtils";
import { translateStatus } from "utils/electionStatus";

function ReviewApplicantsButton({ electionId }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(`/committee/election/${electionId}/applications`)}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 whitespace-nowrap"
        >
            ตรวจใบสมัคร
        </button>
    );
}

export default function CommitteeElectionList() {
    const [elections, setElections] = useState([]);
    const [search, setSearch] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    const loadMe = async () => {
        const meRes = await apiFetch(`/api/users/me`);
        if (meRes?.success) {
            setMe(meRes.user);
            setRoles(meRes.user.roles || []);
        }
        setLoadingMe(false);
    };

    const fetchElections = async () => {
        try {
            const data = await apiFetch("/api/elections");
            if (!data) return;
            if (data.success) {
                setElections(data.data || data.elections || []);
            } else {
                // fallback เงียบ ๆ เพื่อไม่ให้รบกวน UX ของคณะกรรมการ
                console.error("โหลดรายการเลือกตั้งไม่สำเร็จ");
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        (async () => {
            await Promise.all([loadMe(), fetchElections()]);
        })();
    }, []);

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

    if (!roles.includes("กรรมการ")) {
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
                    <p className="text-gray-500 text-sm">หน้านี้สำหรับบทบาท "กรรมการ" เท่านั้น</p>
                </div>
            </div>
        );
    }

    const filtered = (elections || []).filter((e) =>
        (e.election_name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Header />
            <div className="p-6 bg-purple-100 min-h-screen">
                <h1 className="text-xl font-bold mb-4">ตรวจใบสมัคร (กรรมการ)</h1>

                {/* Search full-width */}
                <div className="mb-4">
                    {/* old search removed (replaced by full-width search above) */}
                </div>

                {/* Tools (สไตล์เดียวกับแอดมิน แต่ตัดปุ่มเพิ่มออก) */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 ">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                        className="border p-2 rounded bg-gray-100 border-violet-300"
                    >
                        {[10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n} แถว
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหารายการเลือกตั้ง"
                        className="border p-2 rounded flex-1 bg-violet-50 border-violet-300"
                    />

                    {/* คง layout ช่องว่างตำแหน่งเดิม เพื่อบาลานซ์ UI */}
                    <div className="w-[1690]" />
                </div>

                {/* Table (ยกสไตล์จาก AdminElectionList) */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="p-2 text-center">ลำดับ</th>
                                <th className="p-2">รายการเลือกตั้ง</th>
                                <th className="p-2 text-center">วันที่ลงคะแนน</th>
                                <th className="p-2 text-center">เวลา</th>
                                <th className="p-2 text-center">สถานะ</th>
                                <th className="p-2 text-center">เมนู</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, rowsPerPage).map((e, index) => (
                                <tr
                                    key={e.election_id}
                                    className={`border-t hover:bg-zinc-200 ${index % 2 === 0 ? "bg-white " : "bg-slate-200"}`}
                                >
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2">{e.election_name}</td>
                                    <td className="p-2 text-center">
                                        {formatDate(e.start_date)} - {formatDate(e.end_date)}
                                    </td>
                                    <td className="p-2 text-center">
                                        {formatTime(e.start_date)} - {formatTime(e.end_date)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <span
                                            className={`px-2 py-1 rounded text-white text-xs 
                        ${e.effective_status === "REGISTRATION_OPEN"
                                                    ? "bg-violet-500"
                                                    : e.effective_status === "VOTING_OPEN"
                                                        ? "bg-green-500"
                                                        : e.effective_status === "CLOSED_BY_ADMIN"
                                                            ? "bg-gray-500"
                                                            : e.effective_status === "ENDED"
                                                                ? "bg-slate-500"
                                                                : e.effective_status === "WAITING_VOTE"
                                                                    ? "bg-amber-500"
                                                                    : "bg-purple-500"}
                      `}
                                        >
                                            {translateStatus(e.effective_status || e.auto_status)}
                                        </span>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto whitespace-nowrap justify-center">
                                            <ReviewApplicantsButton electionId={e.election_id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {elections.length === 0 && (
                    <p className="text-center text-gray-500 mt-6">ไม่มีรายการเลือกตั้ง</p>
                )}
            </div>
        </>
    );
}
