import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/apiFetch";
import Header from "../Header";

const beYear = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.getFullYear() + 543;
};

const fmtDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    // แสดงแบบ 14 ส.ค. 68 (ย่อไทย)
    const opts = {
        day: "2-digit", month: "short", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
    };
    return d.toLocaleString("th-TH", opts);
};

const StatusBadge = ({ status }) => {
    const map = {
        VOTED: "bg-green-100 text-green-700 ring-green-200",
        ABSTAIN: "bg-yellow-100 text-yellow-800 ring-yellow-200",
        MISSED: "bg-rose-100 text-rose-700 ring-rose-200",
        PENDING: "bg-gray-100 text-gray-700 ring-gray-200",
    };
    const label = {
        VOTED: "ใช้สิทธิ์",
        ABSTAIN: "งดออกเสียง",
        MISSED: "ขาดใช้สิทธิ์",
        PENDING: "ยังไม่เริ่ม/ยังไม่สิ้นสุด",
    }[status] || status;

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${map[status] || map.PENDING}`}>
            {label}
        </span>
    );
};

export default function VoteHistory() {
    const [rows, setRows] = useState([]);
    const [yearFilter, setYearFilter] = useState("ALL");
    const [q, setQ] = useState("");

    useEffect(() => {
        (async () => {
            const res = await apiFetch(`/api/vote-history/my`);
            if (res?.success) setRows(res.history || []);
        })();
    }, []);

    // รายการปี พ.ศ. จากข้อมูล
    const years = useMemo(() => {
        const set = new Set(rows.map(r => r.year_be).filter(Boolean));
        return ["ALL", ...Array.from(set).sort((a, b) => b - a)];
    }, [rows]);

    const filtered = useMemo(() => {
        return rows.filter(r => {
            const okYear = yearFilter === "ALL" ? true : r.year_be === yearFilter;
            const okQuery = q.trim()
                ? (r.election_name || "").toLowerCase().includes(q.trim().toLowerCase())
                : true;
            return okYear && okQuery;
        });
    }, [rows, yearFilter, q]);

    const summary = useMemo(() => {
        const s = { VOTED: 0, ABSTAIN: 0, MISSED: 0, PENDING: 0 };
        filtered.forEach(r => { s[r.status] = (s[r.status] || 0) + 1; });
        return s;
    }, [filtered]);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-purple-100 py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-6">
                        ประวัติการใช้สิทธิ์
                    </h1>

                    {/* แถบกรอง */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">ปี พ.ศ.</label>
                                <select
                                    className="w-full md:w-auto border border-gray-300 rounded-lg px-3 py-2"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y === "ALL" ? "ทั้งหมด" : y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    placeholder="ค้นหารายการเลือกตั้ง..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* สรุปสั้นๆ */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                            <span className="text-gray-600">สรุป:</span>
                            <StatusBadge status="VOTED" /> <span>{summary.VOTED} รายการ</span>
                            <StatusBadge status="ABSTAIN" /> <span>{summary.ABSTAIN} รายการ</span>
                            <StatusBadge status="MISSED" /> <span>{summary.MISSED} รายการ</span>
                            <StatusBadge status="PENDING" /> <span>{summary.PENDING} รายการ</span>
                        </div>
                    </div>

                    {/* ตาราง */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">ปี พ.ศ.</th>
                                        <th className="px-4 py-3 text-left font-semibold">รายการเลือกตั้ง</th>
                                        <th className="px-4 py-3 text-left font-semibold">ช่วงเวลา</th>
                                        <th className="px-4 py-3 text-left font-semibold">สถานะการใช้สิทธิ์</th>
                                        <th className="px-4 py-3 text-left font-semibold">วันที่ใช้สิทธิ์</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                ไม่พบรายการ
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((r) => (
                                            <tr key={r.election_id} className="border-t border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3">{r.year_be || (r.start_date ? beYear(r.start_date) : "-")}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{r.election_name}</td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    <div>{fmtDateTime(r.start_date)} — {fmtDateTime(r.end_date)}</div>
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                                <td className="px-4 py-3">{fmtDateTime(r.voted_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
