// import React, { useEffect, useState } from "react";
// import { Header } from "components"; // ใช้ Header แบบแอดมินแดชบอร์ด
// import { apiFetch } from "utils/apiFetch"; // ใช้ตัวเดียวกับ AdminDashboard
// import {
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     Tooltip,
//     Legend,
//     ResponsiveContainer,
//     PieChart,
//     Pie,
//     Cell,
// } from "recharts";

// export default function DashboardCommit() {
//     const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
//     const [yearStats, setYearStats] = useState([]);
//     const [elections, setElections] = useState([]);
//     const [years, setYears] = useState([]); //  รายการปีจากฐานข้อมูล
//     const [selectedElection, setSelectedElection] = useState("");
//     const [selectedYear, setSelectedYear] = useState("");
//     const [electionThisYear, setElectionThisYear] = useState(0);

//     //  โหลด "ปีทั้งหมด" จากฐานข้อมูล (ใช้ apiFetch)
//     useEffect(() => {
//         (async () => {
//             try {
//                 const res = await apiFetch("/api/commit/dashboard/years");
//                 const data = Array.isArray(res) ? res : res?.data ?? res; // รองรับทั้ง [{..}] หรือ {data:[{..}]}
//                 setYears(Array.isArray(data) ? data : []);
//             } catch (err) {
//                 console.error("Error loading years:", err);
//                 setYears([]);
//             }
//         })();
//     }, []);

//     //  โหลดรายการเลือกตั้ง (Dropdown)
//     useEffect(() => {
//         (async () => {
//             try {
//                 const url = selectedYear ? `/api/commit/dashboard/elections?year=${selectedYear}` : "/api/commit/dashboard/elections";
//                 const res = await apiFetch(url);
//                 const data = Array.isArray(res) ? res : res?.data ?? res;
//                 setElections(Array.isArray(data) ? data : []);
//             } catch (err) {
//                 console.error("Error loading elections:", err);
//                 setElections([]);
//             }
//         })();
//     }, [selectedYear]);

//     //  โหลดข้อมูลการ์ดสรุป (Stats)
//     useEffect(() => {
//         (async () => {
//             try {
//                 let url = "/api/commit/dashboard/stats-by-election";
//                 const q = [];
//                 if (selectedElection) q.push(`electionId=${selectedElection}`);
//                 if (selectedYear) q.push(`year=${selectedYear}`);
//                 if (q.length) url += `?${q.join("&")}`;
//                 const res = await apiFetch(url);
//                 const data = res?.data ?? res;
//                 setStats({
//                     total: Number(data?.total ?? 0),
//                     approved: Number(data?.approved ?? 0),
//                     pending: Number(data?.pending ?? 0),
//                     rejected: Number(data?.rejected ?? 0),
//                     revision_requested: Number(data?.revision_requested ?? 0),
//                 });
//             } catch (err) {
//                 console.error("Error loading stats:", err);
//                 setStats({ total: 0, approved: 0, pending: 0, rejected: 0 , revision_requested:0});
//             }
//         })();
//     }, [selectedElection, selectedYear]);

//     //  โหลดข้อมูล BarChart + จำนวนรายการเลือกตั้งปีนี้
//     useEffect(() => {
//         (async () => {
//             try {
//                 const url = selectedYear ? `/api/commit/dashboard/stats-by-year?year=${selectedYear}` : "/api/commit/dashboard/stats-by-year";
//                 const res = await apiFetch(url);
//                 const data = Array.isArray(res) ? res : res?.data ?? [];
//                 const safe = Array.isArray(data) ? data : [];
//                 setYearStats(safe);

//                 if (selectedYear) {
//                     const found = safe.find((y) => y.year === parseInt(selectedYear));
//                     setElectionThisYear(found ? Number(found.election_count || 0) : 0);
//                 } else {
//                     const total = safe.reduce((sum, y) => sum + Number(y.election_count || 0), 0);
//                     setElectionThisYear(total);
//                 }
//             } catch (err) {
//                 console.error("Error loading year stats:", err);
//                 setYearStats([]);
//                 setElectionThisYear(0);
//             }
//         })();
//     }, [selectedYear]);

//     //  เตรียมข้อมูล Pie Chart
//     const pieData = [
//         { name: "อนุมัติแล้ว", value: stats.approved },
//         { name: "รออนุมัติ", value: stats.pending },
//         { name: "รอแก้ไข", value: stats.revision_requested },
//         { name: "ไม่อนุมัติ", value: stats.rejected },
//     ];
//     const COLORS = ["#4ade80", "#facc15", "#60a5fa", "#f87171"];

//     return (
//         <>
//             {/* Header เหมือน AdminDashboard */}
//             <Header />

//             <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
//                 <main className="max-w-7xl mx-auto px-4 py-6">
//                     <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
//                         แดชบอร์ดสถิติผู้สมัคร
//                     </h1>

//                     {/* Controls: ปีการศึกษา + เลือกรายการเลือกตั้ง */}
//                     <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100 mb-6">
//                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
//                             <div className="flex items-center gap-2">
//                                 <label className="text-sm text-gray-700">ปีการศึกษา:</label>
//                                 <select
//                                     value={selectedYear}
//                                     onChange={(e) => setSelectedYear(e.target.value)}
//                                     className="border rounded px-2 py-1 text-sm"
//                                 >
//                                     <option value="">ทั้งหมด</option>
//                                     {years.map((y, i) => (
//                                         <option key={i} value={y.year_th}>
//                                             {y.year_th}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <div className="flex items-center gap-2">
//                                 <label className="text-sm text-gray-700">เลือกรายการเลือกตั้ง:</label>
//                                 <select
//                                     value={selectedElection}
//                                     onChange={(e) => setSelectedElection(e.target.value)}
//                                     className="border rounded px-2 py-1 text-sm min-w-56"
//                                 >
//                                     <option value="">ทั้งหมด</option>
//                                     {elections.map((el) => (
//                                         <option key={el.election_id} value={el.election_id}>
//                                             {el.election_name}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>
//                         </div>
//                     </div>

//                     {/* การ์ดสรุป */}
//                     <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
//                         <div className="bg-purple-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">รายการเลือกตั้งปีนี้</h2>
//                             <p className="text-2xl font-black text-gray-800">{electionThisYear}</p>
//                         </div>
//                         <div className="bg-blue-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">ผู้สมัครทั้งหมด</h2>
//                             <p className="text-2xl font-black text-gray-800">{stats.total}</p>
//                         </div>
//                         <div className="bg-green-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">อนุมัติแล้ว</h2>
//                             <p className="text-2xl font-black text-gray-800">{stats.approved}</p>
//                         </div>
//                         <div className="bg-yellow-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">รออนุมัติ</h2>
//                             <p className="text-2xl font-black text-gray-800">{stats.pending}</p>
//                         </div>

//                         <div className="bg-cyan-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">รอแก้ไข</h2>
//                             <p className="text-2xl font-black text-gray-800">{stats.revision_requested}</p>
//                         </div>

//                         <div className="bg-red-100 p-4 rounded-xl text-center shadow">
//                             <h2 className="text-sm font-semibold text-gray-700">ไม่อนุมัติ</h2>
//                             <p className="text-2xl font-black text-gray-800">{stats.rejected}</p>
//                         </div>
//                     </div>



//                     {/* กราฟ */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Pie Chart */}
//                         <section className="bg-white p-6 rounded-2xl shadow border border-purple-100" style={{ height: 400 }}>
//                             <h2 className="text-base font-bold text-gray-800 mb-4">สัดส่วนผู้สมัครตามสถานะ</h2>
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <PieChart>
//                                     <Pie
//                                         data={pieData}
//                                         cx="50%"
//                                         cy="50%"
//                                         outerRadius={120}
//                                         dataKey="value"
//                                         label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
//                                     >
//                                         {pieData.map((entry, index) => (
//                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip />
//                                     <Legend />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         </section>

//                         {/* Bar Chart */}
//                         <section className="bg-white p-6 rounded-2xl shadow border border-purple-100">
//                             <h2 className="text-base font-bold text-gray-800 mb-4">จำนวนผู้สมัครรวมแต่ละปี</h2>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <BarChart data={yearStats}>
//                                     <XAxis dataKey="year" />
//                                     <YAxis />
//                                     <Tooltip formatter={(value) => [`${value} คน`, "จำนวนผู้สมัคร"]} labelFormatter={(year) => `ปี ${year}`} />
//                                     <Legend />
//                                     <Bar dataKey="applicant_count" fill="#4f46e5" name="จำนวนผู้สมัคร" />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </section>
//                     </div>
//                 </main>
//             </div>
//         </>
//     );
// }


// ver2

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "components"; // ใช้ Header แบบแอดมินแดชบอร์ด
import { apiFetch } from "utils/apiFetch"; // ใช้ตัวเดียวกับ AdminDashboard

// ใช้ Chart.js แบบเดียวกับหน้าแอดมิน
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

// ไอคอนจาก lucide-react ให้หน้าตาเหมือนแอดมินแดชบอร์ด
import {
    BarChart3,
    PieChart as PieChartIcon,
    UserPlus,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Ban,
    Layers,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// สีหลักที่ใช้ซ้ำ (อิงสไตล์ AdminDashboard)
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#8b5cf6", "#f97316", "#84cc16"]; // blue, green, amber, cyan, red, violet, orange, lime

/* ---------- UI Components (ให้โทนเดียวกับแอดมิน) ---------- */
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

function EmptyChart({ message }) {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center">{message}</p>
        </div>
    );
}

/* ===================== Page ===================== */
export default function DashboardCommit() {
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, revision_requested: 0, rejected: 0 });
    const [yearStats, setYearStats] = useState([]); // [{year, applicant_count}]
    const [elections, setElections] = useState([]);
    const [years, setYears] = useState([]); //  รายการปีจากฐานข้อมูล (พ.ศ.)
    const [selectedElection, setSelectedElection] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [electionThisYear, setElectionThisYear] = useState(0);

    /* ---- load years ---- */
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch("/api/commit/dashboard/years");
                const data = Array.isArray(res) ? res : res?.data ?? res;
                setYears(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading years:", err);
                setYears([]);
            }
        })();
    }, []);

    /* ---- load elections by year ---- */
    useEffect(() => {
        (async () => {
            try {
                const url = selectedYear ? `/api/commit/dashboard/elections?year=${selectedYear}` : "/api/commit/dashboard/elections";
                const res = await apiFetch(url);
                const data = Array.isArray(res) ? res : res?.data ?? res;
                setElections(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading elections:", err);
                setElections([]);
            }
        })();
    }, [selectedYear]);

    /* ---- load summary stats ---- */
    useEffect(() => {
        (async () => {
            try {
                let url = "/api/commit/dashboard/stats-by-election";
                const q = [];
                if (selectedElection) q.push(`electionId=${selectedElection}`);
                if (selectedYear) q.push(`year=${selectedYear}`);
                if (q.length) url += `?${q.join("&")}`;
                const res = await apiFetch(url);
                const data = res?.data ?? res;
                setStats({
                    total: Number(data?.total ?? 0),
                    approved: Number(data?.approved ?? 0),
                    pending: Number(data?.pending ?? 0),
                    revision_requested: Number(data?.revision_requested ?? 0),
                    rejected: Number(data?.rejected ?? 0),
                });
            } catch (err) {
                console.error("Error loading stats:", err);
                setStats({ total: 0, approved: 0, pending: 0, revision_requested: 0, rejected: 0 });
            }
        })();
    }, [selectedElection, selectedYear]);

    /* ---- load year stats ---- */
    useEffect(() => {
        (async () => {
            try {
                const url = selectedYear ? `/api/commit/dashboard/stats-by-year?year=${selectedYear}` : "/api/commit/dashboard/stats-by-year";
                const res = await apiFetch(url);
                const data = Array.isArray(res) ? res : res?.data ?? [];
                const safe = Array.isArray(data) ? data : [];
                setYearStats(safe);

                if (selectedYear) {
                    const found = safe.find((y) => y.year === parseInt(selectedYear));
                    setElectionThisYear(found ? Number(found.election_count || 0) : 0);
                } else {
                    const total = safe.reduce((sum, y) => sum + Number(y.election_count || 0), 0);
                    setElectionThisYear(total);
                }
            } catch (err) {
                console.error("Error loading year stats:", err);
                setYearStats([]);
                setElectionThisYear(0);
            }
        })();
    }, [selectedYear]);

    /* ---- chart data ---- */
    const donutData = useMemo(() => {
        const values = [stats.approved, stats.pending, stats.revision_requested, stats.rejected];
        const labels = ["อนุมัติแล้ว", "รออนุมัติ", "รอแก้ไข", "ไม่อนุมัติ"];
        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: [COLORS[1], COLORS[2], COLORS[3], COLORS[4]], // green, amber, cyan, red
                    borderWidth: 0,
                },
            ],
        };
    }, [stats]);

    const donutOptions = {
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

    const yearBarData = useMemo(() => ({
        labels: yearStats.map((i) => String(i.year)),
        datasets: [
            {
                label: "จำนวนผู้สมัคร",
                data: yearStats.map((i) => Number(i.applicant_count || 0)),
                backgroundColor: COLORS[0], // blue
                borderRadius: 8,
            },
        ],
    }), [yearStats]);

    const yearBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
        },
    };

    /* ---- UI ---- */
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                    {/* Title */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">แดชบอร์ดสถิติผู้สมัคร</h1>
                        </div>
                        <p className="pl-10 text-gray-600 text-sm">ภาพรวมผู้สมัครและการเลือกตั้ง (สไตล์เดียวกับแอดมินแดชบอร์ด)</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">ปีการศึกษา:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm"
                                >
                                    <option value="">ทั้งหมด</option>
                                    {years.map((y, i) => (
                                        <option key={i} value={y.year_th}>
                                            {y.year_th}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">เลือกรายการเลือกตั้ง:</label>
                                <select
                                    value={selectedElection}
                                    onChange={(e) => setSelectedElection(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm min-w-56"
                                >
                                    <option value="">ทั้งหมด</option>
                                    {elections.map((el) => (
                                        <option key={el.election_id} value={el.election_id}>
                                            {el.election_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <KPICard icon={<Layers className="w-5 h-5" />} label="รายการเลือกตั้งปีนี้" value={electionThisYear} bgColor="bg-purple-100" iconColor="text-purple-600" />
                        <KPICard icon={<UserPlus className="w-5 h-5" />} label="ผู้สมัครทั้งหมด" value={stats.total} bgColor="bg-blue-100" iconColor="text-blue-600" />
                        <KPICard icon={<CheckCircle2 className="w-5 h-5" />} label="อนุมัติแล้ว" value={stats.approved} bgColor="bg-emerald-100" iconColor="text-emerald-600" />
                        <KPICard icon={<Clock3 className="w-5 h-5" />} label="รออนุมัติ" value={stats.pending} bgColor="bg-amber-100" iconColor="text-amber-600" />
                        <KPICard icon={<RefreshCw className="w-5 h-5" />} label="รอแก้ไข" value={stats.revision_requested} bgColor="bg-cyan-100" iconColor="text-cyan-600" />
                        <KPICard icon={<Ban className="w-5 h-5" />} label="ไม่อนุมัติ" value={stats.rejected} bgColor="bg-rose-100" iconColor="text-rose-600" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Donut: สัดส่วนสถานะผู้สมัคร */}
                        <ChartCard icon={<PieChartIcon className="w-4 h-4" />} title="สัดส่วนผู้สมัครตามสถานะ" className="col-span-12 lg:col-span-5">
                            <div className="h-[300px] flex items-center justify-center">
                                {(stats.total || stats.approved || stats.pending || stats.revision_requested || stats.rejected) ? (
                                    <Doughnut data={donutData} options={donutOptions} />
                                ) : (
                                    <EmptyChart message="ยังไม่มีข้อมูลผู้สมัคร" />
                                )}
                            </div>
                        </ChartCard>

                        {/* Bar: ผู้สมัครรวมแต่ละปี */}
                        <ChartCard icon={<BarChart3 className="w-4 h-4" />} title="จำนวนผู้สมัครรวมแต่ละปี" className="col-span-12 lg:col-span-7">
                            <div className="h-[300px]">
                                {yearStats.length ? (
                                    <Bar data={yearBarData} options={yearBarOptions} />
                                ) : (
                                    <EmptyChart message="ยังไม่มีข้อมูลรายปี" />
                                )}
                            </div>
                        </ChartCard>
                    </div>
                </main>
            </div>
        </>
    );
}
