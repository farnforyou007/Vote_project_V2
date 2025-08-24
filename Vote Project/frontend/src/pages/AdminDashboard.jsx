import React, { useState, useMemo } from "react";
import Header from "../components/Header";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

// ------------------------------
// MOCK DATA
// ------------------------------
const kpis = {
    users: 1248, eligible: 1193, elections: 12, ongoing: 2,
    candidates: 56, admins: 4, committee: 22, votesUsed: 842, votesRemaining: 351,
};
const turnoutHistory = [
    { name: "กย. 67", turnout: 66 }, { name: "กพ. 68", turnout: 71 },
    { name: "กค. 68", turnout: 63 }, { name: "สค. 68", turnout: 74 }, { name: "มีค. 69", turnout: 69 },
];
const ballotSplit = [
    { name: "โหวต", value: 72 }, { name: "งดออกเสียง", value: 8 }, { name: "ไม่มาโหวต", value: 20 },
];
const deptData = [
    { name: "วิศวกรรม", students: 320 }, { name: "บัญชี", students: 280 }, { name: "คอมธุรกิจ", students: 210 },
    { name: "การโรงแรม", students: 180 }, { name: "ไฟฟ้า", students: 120 },
];
const yearData = [
    { name: "ปี 1", count: 410 }, { name: "ปี 2", count: 385 }, { name: "ปี 3", count: 320 }, { name: "ปี 4", count: 78 },
];
const activityLogs = [
    { id: 1, time: "วันนี้ 09:12", text: "แอดมินเพิ่มผู้สมัคร 2 คน ใน \"สภานักเรียน 2568\"" },
    { id: 2, time: "วันนี้ 08:40", text: "กรรมการปิดการเลือกตั้ง \"ชมรมสิ่งแวดล้อม\" และเผยแพร่ผล" },
    { id: 3, time: "เมื่อวาน 16:05", text: "อัปเดตประกาศ: ปิดปรับปรุงระบบ 22 ส.ค. 20:00-21:00" },
];
const currentElections = [
    { id: 101, name: "สภานักเรียน 2568", status: "voting", start: "2025-08-18 09:00", end: "2025-08-21 16:00", candidates: 12, turnout: 74 },
    { id: 102, name: "ชมรมกีฬา เลือกตั้งประธาน", status: "recruiting", start: "2025-08-25 09:00", end: "2025-08-28 16:00", candidates: 3, turnout: 0 },
    { id: 99, name: "สภาวิชาการ 1/2568", status: "closed", start: "2025-07-01 09:00", end: "2025-07-03 16:00", candidates: 18, turnout: 71 },
];
const currentTurnout = Math.round((kpis.votesUsed / (kpis.votesUsed + kpis.votesRemaining)) * 100);

// -------------------------------------
// UI Primitives
// -------------------------------------
function BentoCard({ children, className = "", header, actions }) {
    return (
        <section className={`rounded-xl border border-black/5 bg-white/90 dark:bg-zinc-900/70 shadow-sm p-3 md:p-4 ${className}`}>
            {(header || actions) && (
                <div className="mb-2 flex items-center justify-between">
                    {header && <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{header}</h2>}
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}

// ✅ KPI card: ไอคอนอยู่ขวา + ไล่เฉดสวย + ตัวเลขเด่น
function Kpi({
    title, value, icon = "👥",
    gradient = "from-sky-500/15 via-sky-400/10 to-sky-300/0",
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-black/5 shadow-sm">
            {/* gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="relative p-3.5 md:p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-gray-600 dark:text-zinc-400">{title}</p>
                        <p className="mt-1 text-[28px] leading-none font-bold text-gray-900 dark:text-zinc-100">{value}</p>
                    </div>
                    {/* icon on the right */}
                    <span className="inline-flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-white/80 dark:bg-zinc-800/70 ring-1 ring-black/5 text-xl">
                        {icon}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Badge เล็กๆ
function StatusBadge({ status }) {
    const map = {
        recruiting: { text: "เปิดรับสมัคร", cls: "bg-blue-100 text-blue-700" },
        voting: { text: "กำลังลงคะแนน", cls: "bg-green-100 text-green-700" },
        closed: { text: "ปิดแล้ว", cls: "bg-gray-200 text-gray-700" },
    };
    const it = map[status] || { text: status, cls: "bg-zinc-100 text-zinc-700" };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${it.cls}`}>{it.text}</span>;
}

// -------------------------------------
// Pie styles switcher (Donut / Ring / Half‑Donut)
// -------------------------------------
// -------------------------------------
// Pie styles with percentage labels
// -------------------------------------
const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

// label ตำแหน่งกึ่งกลางเนื้อพาย อ่านง่ายทั้ง donut/ring/half
const RADIAN = Math.PI / 180;
function renderRadialLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    const val = `${Math.round(percent * 100)}%`;
    return (
        <text x={x} y={y} fill="#111827" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
            {val}
        </text>
    );
}

function DonutPie({ data }) {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    return (
        <div className="w-full h-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        label={false}  // ไม่วาง % บนชิ้น
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* custom legend พร้อม % */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-[12px] text-gray-700">
                {data.map((entry, i) => {
                    const percent = Math.round((entry.value / total) * 100);
                    return (
                        <div key={entry.name} className="flex items-center gap-1">
                            <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span>{entry.name} {percent}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function RingPie({ data }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={80}
                    cornerRadius={6}
                    startAngle={90}
                    endAngle={450}
                    labelLine={false}
                    label={renderRadialLabel}
                >
                    {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}

function HalfDonutPie({ data }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    startAngle={180}
                    endAngle={0}
                    labelLine={false}
                    label={renderRadialLabel}
                >
                    {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}


export default function AdminDashboard() {
    const [pieStyle, setPieStyle] = useState("donut"); // donut | ring | half
    const PieRenderer = useMemo(() => {
        if (pieStyle === "ring") return RingPie;
        if (pieStyle === "half") return HalfDonutPie;
        return DonutPie;
    }, [pieStyle]);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <main className="px-3 sm:px-6 py-4 max-w-7xl mx-auto space-y-4">

                    {/* KPIs — ไอคอนขวา + gradient เฉพาะใบ */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Kpi title="ผู้ใช้ทั้งหมด" value={kpis.users} icon="👥" gradient="from-sky-500/20 via-indigo-400/10 to-indigo-300/0" />
                        <Kpi title="ผู้มีสิทธิ์โหวต" value={kpis.eligible} icon="✅" gradient="from-emerald-500/20 via-teal-400/10 to-teal-300/0" />
                        <Kpi title="ผู้สมัคร" value={kpis.candidates} icon="🏷️" gradient="from-fuchsia-500/20 via-pink-400/10 to-pink-300/0" />
                        <Kpi title="กรรมการ" value={kpis.committee} icon="🧑‍⚖️" gradient="from-amber-500/25 via-orange-400/10 to-orange-300/0" />
                        <Kpi title="แอดมิน" value={kpis.admins} icon="🛡️" gradient="from-rose-500/25 via-rose-400/10 to-rose-300/0" />
                    </div>

                    {/* Turnout + Pie + Summary */}
                    <div className="grid grid-cols-12 gap-3">
                        <BentoCard className="col-span-12 lg:col-span-7" header="Turnout ปัจจุบัน (Real‑time)">
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={turnoutHistory} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 2" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="turnout" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </BentoCard>

                        <BentoCard
                            className="col-span-12 md:col-span-6 lg:col-span-3"
                            header={
                                <div className="flex items-center gap-2">
                                    <span>กราฟวงกลม</span>
                                    <select
                                        className="ml-auto text-xs border rounded px-2 py-1"
                                        value={pieStyle}
                                        onChange={(e) => setPieStyle(e.target.value)}
                                    >
                                        <option value="donut">Donut</option>
                                        <option value="ring">Ring</option>
                                        <option value="half">Half‑Donut</option>
                                    </select>
                                </div>
                            }
                        >
                            <div className="h-40">
                                <PieRenderer data={ballotSplit} />
                                {/* คำอธิบายย่อ */}
                                <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-gray-600">
                                    {ballotSplit.map((s, i) => (
                                        <div key={s.name} className="flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="truncate">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BentoCard>

                        <BentoCard className="col-span-12 md:col-span-6 lg:col-span-2" header="สรุปการเลือกตั้ง">
                            <ul className="space-y-1.5 text-sm">
                                <li>ทั้งหมด: {kpis.elections}</li>
                                <li>เปิดรับสมัคร: {kpis.recruiting || 3}</li>
                                <li>กำลังลงคะแนน: {kpis.voting || 2}</li>
                                <li>เสร็จสิ้น: {kpis.closed || 7}</li>
                            </ul>
                        </BentoCard>
                    </div>

                    {/* Dept & Year */}
                    <div className="grid grid-cols-12 gap-3">
                        <BentoCard className="col-span-12 lg:col-span-6" header="นักศึกษาแต่ละแผนก">
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deptData} layout="vertical" margin={{ top: 6, right: 8, left: 24, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 2" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={84} />
                                        <Tooltip />
                                        <Bar dataKey="students" fill="#10b981" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </BentoCard>

                        <BentoCard className="col-span-12 lg:col-span-6" header="นักศึกษาแยกตามชั้นปี">
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 2" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </BentoCard>
                    </div>

                    {/* ตาราง */}
                    <BentoCard header="สถานะรายการเลือกตั้งปัจจุบัน">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left py-2 px-2">ชื่อการเลือกตั้ง</th>
                                        <th className="text-left px-2">สถานะ</th>
                                        <th className="text-left px-2">ช่วงเวลา</th>
                                        <th className="text-left px-2">ผู้สมัคร</th>
                                        <th className="text-left px-2">Turnout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentElections.map((e) => (
                                        <tr key={e.id} className="border-b">
                                            <td className="py-2 px-2 whitespace-nowrap">{e.name}</td>
                                            <td className="px-2"><StatusBadge status={e.status} /></td>
                                            <td className="px-2 text-xs">{e.start} – {e.end}</td>
                                            <td className="px-2">{e.candidates}</td>
                                            <td className="px-2">{e.turnout}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </BentoCard>

                    {/* Logs ล่างสุด */}
                    <BentoCard header="บันทึกกิจกรรมล่าสุด">
                        <ul className="divide-y">
                            {activityLogs.map((log) => (
                                <li key={log.id} className="py-2.5 flex items-start gap-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-sm text-gray-800">{log.text}</p>
                                        <p className="text-xs text-gray-500">{log.time}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </BentoCard>

                </main>
            </div>
        </>
    );
}
