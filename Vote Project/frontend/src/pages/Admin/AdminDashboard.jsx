

// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Header } from "components";

import { translateStatus } from "utils/electionStatus"

import { formatDateTimeShort, formatDate2, formatTime2 } from "utils/dateUtils";

import { apiFetch } from "utils/apiFetch";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

import {
    Users,
    UserCheck,
    UserPlus,
    ShieldCheck,
    Cog,
    Layers,
    Pencil,
    MousePointerClick,
    Flag,
    BarChart3,
    PieChart,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// สีหลัก
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

/* -------- helpers -------- */
// บางฐานส่ง name ต่างกัน (department_name, dept, year, year_name ฯลฯ) -> ทำให้เป็น {name, total}
function normalizeDist(arr, type /* 'dept' | 'year' */) {
    if (!Array.isArray(arr)) return [];
    return arr.map((i) => {
        let label =
            i.name ??
            i.department_name ??
            i.department ??
            i.dept ??
            i.year_name ??
            i.year ??
            i.class_year ??
            "ไม่ระบุ";
        // กันกรณีแผนกถูกส่งเป็นตัวเลข/ชั้นปีส่งเป็นสตริง
        if (type === "year" && typeof label === "number") label = `ปี ${label}`;
        return { name: String(label), total: Number(i.total ?? i.count ?? 0) };
    });
}

function getElectionStatus(e) {
    const now = Date.now();
    const regStart = new Date(e.registration_start).getTime();
    const regEnd = new Date(e.registration_end).getTime();
    const voteStart = new Date(e.start_date).getTime();
    const voteEnd = new Date(e.end_date).getTime();
    if (now >= voteStart && now <= voteEnd) return "VOTING";
    if (now >= regStart && now <= regEnd) return "REGISTERING";
    if (now > voteEnd) return "FINISHED";
    return "UPCOMING";
}

/* -------- components (UI) -------- */
function KPICard({ icon, label, value, bgColor, iconColor }) {
    return (
        <div className={`${bgColor} rounded-xl shadow-sm p-4 h-full flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700">{label}</div>
                <div className={iconColor}>{icon}</div>
            </div>
            <div className="text-2xl font-black text-gray-800">{value}</div>
        </div>
    );
}

function ChartCard({ icon, title, actions = null, className = "", children }) {
    return (
        <section className={`bg-white rounded-2xl shadow-lg p-4 border border-purple-100 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                        {icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

function ScopeToggle({ scope, setScope }) {
    return (
        <div className="inline-flex rounded-lg border border-purple-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setScope("single")}
                className={`px-3 py-1 text-sm ${scope === "single" ? "bg-purple-600 text-white" : "bg-white text-gray-700"}`}
                aria-pressed={scope === "single"}
            >
                ต่อรายการ
            </button>
            <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-3 py-1 text-sm ${scope === "all" ? "bg-purple-600 text-white" : "bg-white text-gray-700"}`}
                aria-pressed={scope === "all"}
            >
                ทั้งหมด
            </button>
        </div>
    );
}

function EmptyChart({ message }) {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center">{message}</p>
        </div>
    );
}

/* ===================== Page ===================== */
export default function AdminDashboard() {
    // สิทธิ์ผู้ใช้
    const [roles, setRoles] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    // ฟิลเตอร์
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [allElections, setAllElections] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [scope, setScope] = useState("all"); // single | all

    // ข้อมูล
    const [kpis, setKpis] = useState(null);
    const [turnout, setTurnout] = useState([]); // [{label, turnout}]
    const [turnoutBoard, setTurnoutBoard] = useState([]);
    const [ballotSplit, setBallotSplit] = useState([]); // [{name, value}]
    const [deptDist, setDeptDist] = useState([]); // [{name, total}]
    const [yearDist, setYearDist] = useState([]); // [{name, total}]
    const [activeElections, setActiveElections] = useState([]);
    const [electionSummary, setElectionSummary] = useState({ total: 0, registering: 0, voting: 0, finished: 0 });

    const [loadingData, setLoadingData] = useState(true);
    const turnoutTitle =
        scope === "single"
            ? "อัตราการมาใช้สิทธิ์ของการเลือกตั้งนี้ (%)"
            : "อัตราการมาใช้สิทธิ์แต่ละรายการ (%)";

    const turnoutSubtitle =
        scope === "single"
            ? "แสดงเปอร์เซ็นต์ผู้มาโหวตจากจำนวนผู้มีสิทธิ์ทั้งหมดของรายการที่เลือก"
            : "แสดงเปอร์เซ็นต์ผู้มาโหวตจากจำนวนผู้มีสิทธิ์ทั้งหมดของแต่ละรายการ";

    /* ---- load profile ---- */
    useEffect(() => {
        (async () => {
            try {
                const meRes = await apiFetch("/api/users/me");
                if (meRes?.success) setRoles(meRes.user.roles || []);
            } catch {
                // noop
            } finally {
                setLoadingMe(false);
            }
        })();
    }, []);

    /* ---- initial dashboard ---- */
    useEffect(() => {
        (async () => {
            setLoadingData(true);
            const results = await Promise.allSettled([
                apiFetch("/api/dashboard/kpis"), // 0
                apiFetch("/api/dashboard/ballot-split/2"), // 1 (default dummy)
                apiFetch("/api/dashboard/department-distribution"), // 2
                apiFetch("/api/dashboard/year-distribution"), // 3
                apiFetch("/api/dashboard/active-elections"), // 4
                apiFetch("/api/dashboard/election-summary"), // 5
            ]);

            const pick = (i) => (results[i]?.status === "fulfilled" ? results[i].value : null);
            const _kpis = pick(0);
            const _ballot = pick(1);
            const _dept = pick(2);
            const _year = pick(3);
            const _active = pick(4);
            const _summary = pick(5);

            setKpis(
                _kpis?.success
                    ? _kpis.data
                    : { users: 0, eligible: 0, eligible_unique: 0, elections: 0, ongoing: 0, candidates: 0, committee: 0, admin: 0 }
            );

            setBallotSplit(Array.isArray(_ballot?.data) ? _ballot.data : []);

            // ✅ normalize เพื่อกันสลับ/คีย์ไม่ตรง
            const _deptNorm = normalizeDist(_dept?.data, "dept");
            const _yearNorm = normalizeDist(_year?.data, "year");

            if (!_deptNorm.length) console.warn("[dashboard] department-distribution empty or invalid");
            if (!_yearNorm.length) console.warn("[dashboard] year-distribution empty or invalid");

            setDeptDist(_deptNorm);
            setYearDist(_yearNorm);

            setActiveElections(Array.isArray(_active?.data) ? _active.data : []);
            if (_summary?.success) setElectionSummary(_summary.data);

            setLoadingData(false);
        })().catch(() => setLoadingData(false));
    }, []);

    /* ---- change election -> ballot & turnout(single) ---- */
    useEffect(() => {
        if (!selectedElectionId) { setBallotSplit([]); setTurnout([]); return; }

        apiFetch(`/api/dashboard/ballot-split/${selectedElectionId}`)
            .then(res => setBallotSplit(res?.data || []))
            .catch(() => setBallotSplit([]));

        apiFetch(`/api/dashboard/turnout/${selectedElectionId}`)
            .then(res => {
                if (res?.success) {
                    setTurnout([{
                        label: res.data.name,
                        turnout: Number(res.data.turnout_percent),   // 0–100
                        voters: Number(res.data.voters || 0),
                        eligible: Number(res.data.eligible || 0),
                    }]);
                } else {
                    setTurnout([]);
                }
            })
            .catch(() => setTurnout([]));
    }, [selectedElectionId]);


    /* ---- leaderboard (all) ---- */
    useEffect(() => {
        if (scope !== "all") return;
        apiFetch(`/api/dashboard/turnout-leaderboard?status=FINISHED&limit=10`)
            .then((res) => setTurnoutBoard(Array.isArray(res?.data) ? res.data : []))
            .catch(() => setTurnoutBoard([]));
    }, [scope]);

    /* ---- all elections + filters ---- */
    useEffect(() => {
        apiFetch("/api/dashboard/all-elections").then((res) => {
            const list = Array.isArray(res?.data) ? res.data : [];
            setAllElections(list);
        });
    }, []);

    const filteredElections = useMemo(() => {
        const list = allElections.map((e) => ({ ...e, _status: e.status || getElectionStatus(e) }));
        if (statusFilter === "ALL") return list;
        return list.filter((e) => e._status === statusFilter);
    }, [allElections, statusFilter]);

    useEffect(() => {
        if (!selectedElectionId) return;
        const stillExists = filteredElections.some((e) => String(e.id) === String(selectedElectionId));
        if (!stillExists) setSelectedElectionId(filteredElections[0]?.id ? String(filteredElections[0].id) : "");
    }, [filteredElections, selectedElectionId]);

    useEffect(() => {
        const s = localStorage.getItem("admin_dash_status_filter");
        if (s) setStatusFilter(s);
    }, []);
    useEffect(() => {
        localStorage.setItem("admin_dash_status_filter", statusFilter);
        setSelectedElectionId("");
        setBallotSplit([]);
    }, [statusFilter]);

    /* ---- chart data ---- */
    const turnoutData = useMemo(
        () => ({
            labels: turnout.map((i) => i.label),
            datasets: [{ label: "% Turnout", data: turnout.map((i) => i.turnout), backgroundColor: COLORS[0], borderRadius: 8 }],
        }),
        [turnout]
    );

    const turnoutOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const pct = ctx.raw; // 0–100
                        const row = turnout[ctx.dataIndex];
                        const x = row?.voters ?? "-";
                        const y = row?.eligible ?? "-";
                        // Tooltip ตัวอย่าง: Turnout: 78% (450/575 คน)
                        return `อัตราการมาใช้สิทธิ์ : ${pct}% (${x}/${y} คน)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: (v) => v + "%" },
                title: { display: true, text: "เปอร์เซ็นต์ผู้มาใช้สิทธิ์ (%)" }
            },
            x: {
                grid: { display: false }
                // single มีแท่งเดียว/ชื่อรายการเดียว จึงไม่ต้องตั้ง title
            }
        },
    }), [turnout]);



    const ballotData = useMemo(
        () => ({
            labels: ballotSplit.map((i) => i.name),
            datasets: [{ data: ballotSplit.map((i) => i.value), backgroundColor: [COLORS[1], COLORS[2], COLORS[3]], borderWidth: 0 }],
        }),
        [ballotSplit]
    );
    const ballotOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const dataset = ctx.dataset.data;
                        const total = dataset.reduce((a, b) => a + b, 0) || 1;
                        const val = ctx.raw;
                        const p = ((val / total) * 100).toFixed(1);
                        return `${ctx.label}: ${val} (${p}%)`;
                    },
                },
            },
        },
        cutout: "60%",
    };

    // ✅ DEPT ใช้ deptDist (normalize แล้ว)
    const deptData = useMemo(
        () => ({
            labels: deptDist.map((i) => i.name),
            datasets: [{ label: "จำนวนนักศึกษา", data: deptDist.map((i) => i.total), backgroundColor: COLORS, borderRadius: 8 }],
        }),
        [deptDist]
    );
    const deptOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
        }),
        []
    );

    // ✅ YEAR ใช้ yearDist (normalize แล้ว) และเป็นแท่งแนวนอน
    const yearData = useMemo(
        () => ({
            labels: yearDist.map((i) => i.name),
            datasets: [{ label: "จำนวนนักศึกษา", data: yearDist.map((i) => i.total), backgroundColor: COLORS, borderRadius: 8 }],
        }),
        [yearDist]
    );
    const yearOptions = useMemo(
        () => ({
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } } },
        }),
        []
    );

    const turnoutBoardData = useMemo(
        () => ({
            labels: turnoutBoard.map((i) => i.name),
            datasets: [{ label: "Turnout (%)", data: turnoutBoard.map((i) => i.turnout_percent), borderWidth: 0, backgroundColor: "#22c55e", borderRadius: 8 }],
        }),
        [turnoutBoard]
    );

    const turnoutBoardOptions = useMemo(() => ({
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const pct = ctx.raw; // 0–100
                        return `อัตราการมาใช้สิทธิ์ : ${pct}%`;
                    },
                    afterLabel: (ctx) => {
                        const row = turnoutBoard[ctx.dataIndex];
                        return row ? `\n${row.voters}/${row.eligible} คน` : "";
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: "เปอร์เซ็นต์ผู้มาใช้สิทธิ์ (%)" }
            },
            y: {
                title: { display: true, text: "รายการเลือกตั้ง" }
            }
        }
    }), [turnoutBoard]);

    /* ---- guards ---- */
    if (loadingMe || loadingData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    <p className="text-gray-700 text-lg font-medium">กำลังโหลดแดชบอร์ด…</p>
                </div>
            </div>
        );
    }
    if (!roles.includes("ผู้ดูแล")) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-3 border border-red-200">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                    <p className="text-red-600 text-lg font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
                    <p className="text-gray-500 text-sm">โปรดติดต่อผู้ดูแลระบบ หากคิดว่านี่คือความผิดพลาด</p>
                </div>
            </div>
        );
    }

    function statusPillClass(key) {
        switch (key) {
            case "REGISTRATION_OPEN": return "bg-violet-500";
            case "VOTING_OPEN": return "bg-green-500";
            case "CLOSED_BY_ADMIN": return "bg-gray-500";
            case "ENDED": return "bg-slate-500";
            case "UPCOMING_REGISTRATION":
            case "WAITING_VOTE": return "bg-amber-500";
            default: return "bg-purple-500";
        }
    }



    /* ---- UI ---- */
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow">
                                <Cog className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">แดชบอร์ดผู้ดูแลระบบ</h1>
                        </div>
                        <p className="pl-10 text-gray-600 text-sm">ภาพรวมระบบและสถิติการเลือกตั้งทั้งหมด</p>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <KPICard icon={<Users className="w-5 h-5" />} label="ผู้ใช้ทั้งหมด" value={kpis?.users ?? "-"} bgColor="bg-blue-100" iconColor="text-blue-600" />
                        {/* <KPICard icon={<UserCheck className="w-5 h-5" />} label="ผู้มีสิทธิ์โหวต (ทุกรายการ)" value={kpis?.eligible ?? "-"} bgColor="bg-emerald-100" iconColor="text-emerald-600" /> */}
                        <KPICard icon={<UserCheck className="w-5 h-5" />} label="ผู้มีสิทธิ์โหวต" value={kpis?.eligible_unique ?? "-"} bgColor="bg-indigo-100" iconColor="text-indigo-600" />
                        <KPICard icon={<UserPlus className="w-5 h-5" />} label="ผู้สมัคร" value={kpis?.candidates ?? "-"} bgColor="bg-purple-100" iconColor="text-purple-600" />
                        <KPICard icon={<ShieldCheck className="w-5 h-5" />} label="กรรมการ" value={kpis?.committee ?? "-"} bgColor="bg-cyan-100" iconColor="text-cyan-600" />
                        <KPICard icon={<Cog className="w-5 h-5" />} label="แอดมิน" value={kpis?.admin ?? "-"} bgColor="bg-pink-100" iconColor="text-pink-600" />
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KPICard icon={<Layers className="w-5 h-5" />} label="รายการเลือกตั้ง (ทั้งหมด)" value={electionSummary?.total ?? "-"} bgColor="bg-amber-100" iconColor="text-amber-600" />
                        <KPICard icon={<Pencil className="w-5 h-5" />} label="เปิดรับสมัคร" value={electionSummary?.registering ?? "-"} bgColor="bg-yellow-100" iconColor="text-yellow-600" />
                        <KPICard icon={<MousePointerClick className="w-5 h-5" />} label="เปิดลงคะแนน" value={electionSummary?.voting ?? "-"} bgColor="bg-orange-100" iconColor="text-orange-600" />
                        <KPICard icon={<Flag className="w-5 h-5" />} label="เสร็จสิ้น" value={electionSummary?.finished ?? "-"} bgColor="bg-rose-100" iconColor="text-rose-600" />
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">สถานะ: </label>
                                <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="ALL">ทั้งหมด</option>
                                    <option value="REGISTERING">เปิดรับสมัคร</option>
                                    <option value="VOTING">กำลังโหวต</option>
                                    <option value="FINISHED">เสร็จสิ้น</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">เลือกรายการเลือกตั้ง: </label>
                                <select className="border rounded px-2 py-1 text-sm min-w-56" value={selectedElectionId} onChange={(e) => setSelectedElectionId(e.target.value)}>
                                    <option value="">เลือกการเลือกตั้ง</option>
                                    {filteredElections.map((e) => (
                                        <option key={e.id} value={String(e.id)}>
                                            {e.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Turnout + Donut */}
                    <div className="grid grid-cols-12 gap-4">
                        <ChartCard
                            icon={<BarChart3 className="w-4 h-4" />}
                            // title="สัดส่วนผู้มาใช้สิทธิ์"
                            title={turnoutTitle}
                            actions={<ScopeToggle scope={scope} setScope={setScope} />}
                            className="col-span-12 lg:col-span-7"
                        >
                            <p className="text-xs text-gray-500 mb-2">{turnoutSubtitle}</p>
                            {scope === "single" && selectedElectionId && turnout[0] && (
                                <p className="text-sm text-gray-600 mb-2">
                                    ผู้มาใช้สิทธิ์: <span className="font-semibold">{turnout[0].voters}</span> /
                                    <span className="font-semibold"> {turnout[0].eligible}</span> คน
                                </p>
                            )}

                            <div className="h-[300px]">
                                {scope === "single" ? (
                                    !selectedElectionId ? (
                                        <EmptyChart message="กรุณาเลือก ‘รายการเลือกตั้ง’ ด้านบน เพื่อดู Turnout ของรายการนั้น" />
                                    ) : (
                                        <Bar data={turnoutData} options={turnoutOptions} />
                                    )
                                ) : turnoutBoard.length === 0 ? (
                                    <EmptyChart message="ยังไม่มีข้อมูลเปรียบเทียบ Turnout" />
                                ) : (
                                    <Bar data={turnoutBoardData} options={turnoutBoardOptions} />
                                )}
                            </div>
                        </ChartCard>

                        <ChartCard icon={<PieChart className="w-4 h-4" />} title="สัดส่วนบัตรโหวต" className="col-span-12 lg:col-span-5">
                            {selectedElectionId && (
                                <p className="text-center text-sm text-gray-600 mb-1">
                                    รายการเลือกตั้ง : {filteredElections.find((e) => String(e.id) === String(selectedElectionId))?.name}
                                </p>
                            )}
                            <div className="h-[300px] flex items-center justify-center">
                                {!selectedElectionId ? <EmptyChart message="กรุณาเลือก ‘รายการเลือกตั้ง’ ด้านบน เพื่อแสดงสัดส่วนบัตรโหวต" /> : <Doughnut data={ballotData} options={ballotOptions} />}
                            </div>
                        </ChartCard>
                    </div>

                    {/* Row 2: Dept + Year */}
                    <div className="grid grid-cols-12 gap-4">
                        <ChartCard icon={<BarChart3 className="w-4 h-4" />} title="นักศึกษาตามแผนก" className="col-span-12 lg:col-span-6">
                            <div className="h-[300px]">{deptDist.length ? <Bar data={deptData} options={deptOptions} /> : <EmptyChart message="ยังไม่มีข้อมูลแผนก" />}</div>
                        </ChartCard>

                        <ChartCard icon={<BarChart3 className="w-4 h-4" />} title="นักศึกษาตามชั้นปี" className="col-span-12 lg:col-span-6">
                            <div className="h-[300px]">{yearDist.length ? <Bar data={yearData} options={yearOptions} /> : <EmptyChart message="ยังไม่มีข้อมูลชั้นปี" />}</div>
                        </ChartCard>
                    </div>

                    {/* ตาราง */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            รายการเลือกตั้ง (กำลังเปิด/ล่าสุด)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <tr>
                                        <th className="p-2 text-left font-semibold text-gray-700">ชื่อ</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">สมัคร</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">โหวต</th>
                                        <th className="p-2 text-center font-semibold text-gray-700">สถานะ</th> {/* เพิ่ม */}
                                    </tr>
                                </thead>

                                <tbody>
                                    {(activeElections || []).map((e, i) => {
                                        const statusKey = e.effective_status || e.auto_status; // ✅ ใช้ของแบ็กเอนด์
                                        return (
                                            <tr key={e.id} className={`border-t border-gray-100 hover:bg-purple-50/50 ${i % 2 === 0 ? "bg-gray-50/30" : ""}`}>
                                                <td className="p-2 font-medium text-gray-800">{e.name || e.election_name}</td>
                                                <td className="p-2 text-gray-600">
                                                    {/* {formatDateTimeShort(e.registration_start).toLocaleString()} - {formatDateTimeShort(e.registration_end).toLocaleString()} */}
                                                    เริ่ม&nbsp;
                                                    {formatDate2(e.registration_start)}
                                                    {formatTime2(e.registration_start)} - <br />
                                                    สิ้นสุด&nbsp;
                                                    {formatDate2(e.registration_end)}
                                                    {formatTime2(e.registration_end)}
                                                </td>
                                                <td className="p-2 text-gray-600">
                                                    {/* {formatDateTimeShort(e.start_date).toLocaleString()} – {formatDateTimeShort(e.end_date).toLocaleString()} */}
                                                    เริ่ม&nbsp;
                                                    {formatDate2(e.start_date)}
                                                    {formatTime2(e.start_date)} - <br />
                                                    สิ้นสุด&nbsp;
                                                    {formatDate2(e.end_date)}
                                                    {formatTime2(e.end_date)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <span className={`px-2 py-1 rounded text-white text-xs ${statusPillClass(statusKey)}`}>
                                                        {translateStatus(statusKey)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                </tbody>


                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
