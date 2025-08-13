import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../Header";
import { FaTrash, FaEye } from "react-icons/fa";
import Swal from 'sweetalert2';

import CandidateModal from "./CandidateModal";

export default function AdminManageCandidates() {
    const { id } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(20);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [levels, setLevels] = useState([]);
    const [electionInfo, setElectionInfo] = useState(null);
    const [filter, setFilter] = useState({ department: "", year: "", level: "" });
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");

    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch(`http://localhost:5000/api/elections/${id}/candidates`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.candidates)) {
                    setCandidates(data.candidates);
                } else {
                    setCandidates([]);
                }
            })
            .catch((err) => {
                console.error("โหลด candidates ล้มเหลว:", err);
                setCandidates([]);
            });

        fetch(`http://localhost:5000/api/elections/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setElectionInfo(data.election);
            });

        Promise.all([
            fetch("http://localhost:5000/api/users/departments", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/users/years", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/users/levels", { headers: { Authorization: `Bearer ${token}` } }),
        ]).then(async ([d, y, l]) => {
            setDepartments((await d.json()).departments || []);
            setYears((await y.json()).years || []);
            setLevels((await l.json()).levels || []);
        });
    }, [id]);

    const handleDelete = async (candidateId) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้สมัครคนนี้?")) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/candidates/${candidateId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
        } else {
            alert("ลบไม่สำเร็จ");
        }
    };

    const filtered = candidates.filter((c) => {
        const keyword = search.toLowerCase();
        return (
            (!filter.department || String(c.department_id) === filter.department) &&
            (!filter.year || String(c.year_id) === filter.year) &&
            (!filter.level || String(c.level_id) === filter.level) &&
            (c.full_name.toLowerCase().includes(keyword) ||
                c.student_id.includes(keyword) ||
                c.policy.toLowerCase().includes(keyword))
        );
    });

    const filteredYears = filter.level
        ? years.filter((y) => y.level_id === parseInt(filter.level))
        : years;

    if (!roles.includes("ผู้ดูแล")) {
        return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
    }

    return (
        <>
            <Header studentName={studentName} />
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-2xl font-bold mb-2">จัดการผู้สมัครลงเลือกตั้ง</h1>

                {electionInfo && (
                    <div className="mb-6 px-4 py-3 bg-white rounded shadow text-sm text-gray-800 space-y-1">
                        <p><strong>📌 รายการ:</strong> {electionInfo.election_name}</p>
                        <p><strong>🗓️ ช่วงสมัคร:</strong> {electionInfo.registration_start?.slice(0, 10)} - {electionInfo.registration_end?.slice(0, 10)}</p>
                        <p><strong>🗳️ ช่วงลงคะแนน:</strong> {electionInfo.start_date?.slice(0, 10)} - {electionInfo.end_date?.slice(0, 10)}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-4 items-center mb-6">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="border p-2 rounded bg-white"
                    >
                        {[10, 20, 50].map((n) => (
                            <option key={n} value={n}>{n} แถว</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ / รหัส / นโยบาย"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 rounded bg-white flex-1"
                    />

                    <select
                        value={filter.level}
                        onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value, year: "" }))}
                        className="border p-2 rounded bg-white"
                    >
                        <option value="">เลือกระดับ</option>
                        {levels.map((l) => (
                            <option key={l.level_id} value={l.level_id}>{l.level_name}</option>
                        ))}
                    </select>

                    <select
                        value={filter.year}
                        onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
                        className="border p-2 rounded bg-white"

                    >
                        <option value="">เลือกชั้นปี</option>
                        {filteredYears.map((y) => (
                            <option key={y.year_id} value={y.year_id}>{y.year_name}</option>
                        ))}
                    </select>

                    <select
                        value={filter.department}
                        onChange={(e) => setFilter((f) => ({ ...f, department: e.target.value }))}
                        className="border p-2 rounded bg-white"
                    >
                        <option value="">เลือกแผนก</option>
                        {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                        ))}
                    </select>
                </div>

                <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">รหัสนักศึกษา</th>
                            <th className="p-2">ชื่อ-สกุล</th>
                            <th className="p-2">หมายเลข</th>
                            <th className="p-2">นโยบาย</th>
                            <th className="p-2 text-center">สถานะ</th>
                            <th className="p-2">ผู้อนุมัติ</th>
                            <th className="p-2 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center text-gray-500 py-4">
                                    ไม่พบข้อมูลผู้สมัครตามที่ค้นหา
                                </td>
                            </tr>
                        ) : (
                            filtered.slice(0, limit).map((c) => (
                                <tr key={c.candidate_id} className="border-t hover:bg-gray-50">
                                    <td className="p-2">{c.student_id}</td>
                                    <td className="p-2">{c.full_name}</td>
                                    <td className="p-2">{c.application_number || "-"}</td>
                                    <td className="p-2 max-w-sm line-clamp-2">{c.policy}</td>
                                    <td className="p-2 text-center">
                                        {c.status === "approved" ? (
                                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs">อนุมัติ</span>
                                        ) : c.status === "rejected" ? (
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs">ไม่อนุมัติ</span>
                                        ) : (
                                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">รอตรวจสอบ</span>
                                        )}
                                    </td>
                                    <td className="p-2">{c.reviewer_name || "-"}</td>
                                    <td className="p-2 flex gap-2 justify-center">  
                                        <button
                                            onClick={() => setSelectedCandidate(c)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                        >
                                            <FaEye className="inline" size={14} /> ใบสมัคร

                                        </button>
                                        <button
                                            onClick={() => {
                                                    handleDelete(c.candidate_id);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                        >
                                            <FaTrash  className="inline" size={14} /> ลบ
                                            
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {selectedCandidate && (
                    <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onDelete={handleDelete} />
                )}
            </div>
        </>
    );
}
