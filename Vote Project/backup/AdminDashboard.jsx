import React from "react";
import Header from "../components/Header";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";

// ------------------------------
// 🔢 MOCK DATA (เชื่อม API จริงได้ทีหลัง)
// ------------------------------
const kpis = {
    users: 1248,
    eligible: 1193,
    elections: 12,
    ongoing: 2,
    candidates: 56,
    admins: 4,
    committee: 22,
    votesUsed: 842,
    votesRemaining: 351,
};

const turnoutHistory = [
    { name: "กย. 67", turnout: 66 },
    { name: "กพ. 68", turnout: 71 },
    { name: "กค. 68", turnout: 63 },
    { name: "สค. 68", turnout: 74 },
    { name: "มีค. 69", turnout: 69 },
];

const ballotSplit = [
    { name: "โหวต", value: 72 },
    { name: "งดออกเสียง", value: 8 },
    { name: "ไม่มาโหวต", value: 20 },
];

const deptData = [
    { name: "วิศวกรรม", students: 320 },
    { name: "บัญชี", students: 280 },
    { name: "คอมธุรกิจ", students: 210 },
    { name: "การโรงแรม", students: 180 },
    { name: "ไฟฟ้า", students: 120 },
];

const yearData = [
    { name: "ปี 1", count: 410 },
    { name: "ปี 2", count: 385 },
    { name: "ปี 3", count: 320 },
    { name: "ปี 4", count: 78 },
];

const activityLogs = [
    { id: 1, time: "วันนี้ 09:12", text: "แอดมินเพิ่มผู้สมัคร 2 คน ใน \"สภานักเรียน 2568\"" },
    { id: 2, time: "วันนี้ 08:40", text: "กรรมการปิดการเลือกตั้ง \"ชมรมสิ่งแวดล้อม\" และเผยแพร่ผล" },
    { id: 3, time: "เมื่อวาน 16:05", text: "อัปเดตประกาศ: ปิดปรับปรุงระบบ 22 ส.ค. 20:00-21:00" },
];
// ✅ การเลือกตั้งปัจจุบัน/ใกล้เคียง (mock)
const currentElections = [
    { id: 101, name: "สภานักเรียน 2568", status: "voting", start: "2025-08-18 09:00", end: "2025-08-21 16:00", candidates: 12, turnout: 74 },
    { id: 102, name: "ชมรมกีฬา เลือกตั้งประธาน", status: "recruiting", start: "2025-08-25 09:00", end: "2025-08-28 16:00", candidates: 3, turnout: 0 },
    { id: 99, name: "สภาวิชาการ 1/2568", status: "closed", start: "2025-07-01 09:00", end: "2025-07-03 16:00", candidates: 18, turnout: 71 },
];

const pieColors = ["#3b82f6", "#fbbf24", "#ef4444"]; // ฟ้า/เหลือง/แดง

// คำนวณ Turnout ปัจจุบัน (จากใช้สิทธิ์แล้ว / ทั้งหมด)
const currentTurnout = Math.round(
    (kpis.votesUsed / (kpis.votesUsed + kpis.votesRemaining)) * 100
);

export default function AdminDashboard() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-purple-100">
                {/* Topbar */}
                <header className="bg-white shadow px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <h1 className="text-xl font-bold">แดชบอร์ดแอดมิน · ระบบเลือกตั้งวิทยาลัย</h1>
                        <div className="hidden sm:flex gap-2">
                            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">ส่งออก CSV</button>
                            <button className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm">สร้างการเลือกตั้ง</button>
                        </div>
                    </div>
                </header>

                <main className="p-6 max-w-7xl mx-auto">
                    {/* KPI Row – responsive */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <Kpi title="ผู้ใช้ทั้งหมด" value={kpis.users} accent="from-sky-500/10 to-sky-500/0" icon="👥" />
                        <Kpi title="ผู้มีสิทธิ์โหวต" value={kpis.eligible} accent="from-emerald-500/10 to-emerald-500/0" icon="✅" />
                        <Kpi title="ผู้สมัคร" value={kpis.candidates} accent="from-fuchsia-500/10 to-fuchsia-500/0" icon="🏷️" />
                        <Kpi title="กรรมการ" value={kpis.committee} accent="from-amber-500/10 to-amber-500/0" icon="🧑‍⚖️" />
                        <Kpi title="แอดมิน" value={kpis.admins} accent="from-rose-500/10 to-rose-500/0" icon="🛡️" />
                    </section>

                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Kpi title="การเลือกตั้งทั้งหมด" value={kpis.elections} icon="🗳️" />
                        <Kpi title="เปิดรับสมัคร" value={kpis.recruiting || 3} icon="📥" />
                        <Kpi title="กำลังลงคะแนน" value={kpis.voting || 2} icon="🔊" />
                        <Kpi title="เสร็จสิ้น" value={kpis.closed || 7} icon="✅" />
                    </section>



                    {/* Real-time Turnout */}
                    <section className="bg-white shadow rounded-lg p-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="font-semibold">Turnout ปัจจุบัน (Real-time)</h2>
                            <p className="text-sm text-gray-500">อัปเดตจากจำนวนผู้ใช้สิทธิ์ล่าสุด</p>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>ใช้สิทธิ์แล้ว</span>
                                <span>
                                    {kpis.votesUsed} / {kpis.votesUsed + kpis.votesRemaining} คน · {currentTurnout}%
                                </span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${currentTurnout}%` }}
                                />
                            </div>
                        </div>
                        {/* TODO: เชื่อม WebSocket/SSE เพื่ออัปเดตแบบเรียลไทม์ */}
                    </section>

                    {/* Charts Row */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Turnout History */}
                        <div className="bg-white shadow rounded-lg p-4 lg:col-span-2">
                            <h2 className="font-semibold mb-2">อัตราการมาใช้สิทธิ์ย้อนหลัง (Turnout)</h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={turnoutHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="turnout" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Ballot Split */}
                        <div className="bg-white shadow rounded-lg p-4">
                            <h2 className="font-semibold mb-2">สัดส่วนบัตรเลือกตั้ง</h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={ballotSplit} dataKey="value" nameKey="name" outerRadius={90} label>
                                        {ballotSplit.map((entry, i) => (
                                            <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Users Breakdown: Department & Year */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white shadow rounded-lg p-4">
                            <h2 className="font-semibold mb-2">จำนวนนักศึกษาแต่ละแผนก</h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={90} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="students" fill="#10b981" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>

                        </div>

                        <div className="bg-white shadow rounded-lg p-4">
                            <h2 className="font-semibold mb-2">นักศึกษาแยกตามชั้นปี</h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={yearData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                    {/* Current Elections (สถานะรายการเลือกตั้งปัจจุบัน) */}
                    <section className="bg-white shadow rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">สถานะรายการเลือกตั้งปัจจุบัน</h2>
                            <button className="text-sm text-blue-600 hover:underline">ดูทั้งหมด</button>
                        </div>

                        <div className="mt-3 overflow-x-auto">
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
                                            <td className="px-2 text-gray-600 text-xs sm:text-sm">
                                                {e.start} – {e.end}
                                            </td>
                                            <td className="px-2">{e.candidates}</td>
                                            <td className="px-2">
                                                <div className="w-28 sm:w-40 h-2 bg-gray-200 rounded-full overflow-hidden inline-block align-middle">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${e.turnout}%` }} />
                                                </div>
                                                <span className="ml-2 text-xs text-gray-600 align-middle">{e.turnout}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Activity Logs */}
                    <section className="bg-white shadow rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">บันทึกกิจกรรมล่าสุด</h2>
                            <button className="text-sm text-blue-600 hover:underline">ดูทั้งหมด</button>
                        </div>
                        <ul className="mt-3 divide-y">
                            {activityLogs.map((log) => (
                                <li key={log.id} className="py-3 flex items-start gap-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800">{log.text}</p>
                                        <p className="text-xs text-gray-500">{log.time}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>


                    {/* Helper Note */}
                    <p className="text-xs text-gray-400 mt-6">
                        *ข้อมูลเป็นตัวอย่าง – เชื่อมต่อจริงได้ที่ API: /api/users/stats, /api/users/by-department, /api/users/by-year, /api/votes/turnout, /api/logs
                    </p>
                </main>
            </div>
        </>
    );
}

// ------------------------------
// 🧩 Small components
// ------------------------------
// function Kpi({ title, value, accent = "from-indigo-500/10 to-indigo-500/0", icon = "👥" }) {
//     return (
//         <div className={`relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow`}>
//             <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
//             <div className="relative p-4">
//                 <div className="flex items-center justify-between">
//                     <p className="text-xs font-medium text-gray-500">{title}</p>
//                     <span className="text-lg">{icon}</span>
//                 </div>
//                 <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
//             </div>
//         </div>
//     );
// }

function Kpi({ title, value, accent = "from-indigo-500/10 to-indigo-500/0", icon = "👥" }) {
    return (
        <div className={`relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
            <div className="relative p-4">
                <p className="text-xs font-medium text-gray-500">{title}</p>
                <div className="mt-1 flex items-center justify-between">
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}




function StatusBadge({ status }) {
    const map = {
        recruiting: { text: "เปิดรับสมัคร", cls: "bg-blue-100 text-blue-700" },
        voting: { text: "กำลังลงคะแนน", cls: "bg-green-100 text-green-700" },
        closed: { text: "ปิดแล้ว", cls: "bg-gray-200 text-gray-700" },
        hidden: { text: "ซ่อน", cls: "bg-zinc-200 text-zinc-700" },
    };
    const it = map[status] || { text: status, cls: "bg-zinc-100 text-zinc-700" };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${it.cls}`}>{it.text}</span>;
}
