import React, { useEffect, useMemo, useState } from "react";                    // ใช้ state/effect เตรียมข้อมูลชาร์ตและโหลด API
import Header from "../components/Header";                                      // หัวหน้าระบบ แสดงชื่อระบบ/ปุ่มออกจากระบบ (เหมือนหน้าแอดมินอื่น) :contentReference[oaicite:4]{index=4}
import { apiFetch } from "../utils/apiFetch";                                   // ยูทิลเรียก API พร้อมแนบ token ตามมาตรฐานโปรเจ็กต์คุณ :contentReference[oaicite:5]{index=5}

// ----- Chart.js (v4) + react-chartjs-2 -----
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from "chart.js";                                                               // ต้อง register scale/element ที่ใช้ ตามสไลด์ Chart.pdf :contentReference[oaicite:6]{index=6}
import { Bar, Doughnut } from "react-chartjs-2";                                 // คอมโพเนนต์ React สำหรับ Bar/Doughnut

import {
    UserGroupIcon,
    IdentificationIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    Cog6ToothIcon,
    RectangleGroupIcon,
    PencilSquareIcon,
    CursorArrowRaysIcon,
    FlagIcon,
} from "@heroicons/react/24/solid";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend); // register องค์ประกอบที่ชาร์ตต้องใช้

// ---- โทนสีเดียวกับแดชบอร์ดเดิม (ปรับใช้ซ้ำได้) ----
const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4"]; // พาเล็ตต์หลัก

export default function AdminDashboard() {
    // -------- สถานะผู้ใช้/บทบาท (สไตล์เดียวกับ AdminElectionList.jsx) --------
    const [me, setMe] = useState(null);                                           // ข้อมูลผู้ใช้ปัจจุบัน
    const [roles, setRoles] = useState([]);                                       // รายชื่อบทบาท (ต้องมี "ผู้ดูแล")
    const [loadingMe, setLoadingMe] = useState(true);                             // สถานะโหลดโปรไฟล์
    const [error, setError] = useState(null);                                     // เก็บข้อความ error ถ้ามี
    // :contentReference[oaicite:7]{index=7}
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [allElections, setAllElections] = useState([]);
    // state เดิมมี allElections แล้ว
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | REGISTERING | VOTING | FINISHED

    // -------- สถานะข้อมูลชาร์ต/การ์ด KPI --------
    const [kpis, setKpis] = useState(null);                                       // การ์ดตัวเลข: users/eligible/elections/ongoing/candidates
    const [turnout, setTurnout] = useState([]);                                   // ซีรีส์ % turnout (แกนเวลา)
    const [ballotSplit, setBallotSplit] = useState([]);                           // โดนัท: โหวต/งด/ไม่มา
    const [deptDist, setDeptDist] = useState([]);                                 // แผนก
    const [yearDist, setYearDist] = useState([]);                                 // ชั้นปี
    const [activeElections, setActiveElections] = useState([]);                   // ตารางรายการเลือกตั้งที่ยังเปิด/ล่าสุด
    const [loadingData, setLoadingData] = useState(true);                         // สถานะโหลดข้อมูลแดชบอร์ด
    const [electionSummary, setElectionSummary] = useState({ total: 0, registering: 0, voting: 0, finished: 0 });
    // -------- โหลดสิทธิ์/บทบาทผู้ใช้ (ตามแพทเทิร์นหน้าแอดมินเดิม) --------
    useEffect(() => {
        (async () => {
            try {
                const meRes = await apiFetch("/api/users/me");                          // ดึงโปรไฟล์/บทบาทปัจจุบัน :contentReference[oaicite:8]{index=8}
                if (meRes?.success) {
                    setMe(meRes.user);                                                    // เก็บข้อมูลผู้ใช้
                    setRoles(meRes.user.roles || []);                                     // เก็บบทบาท (ต้องมี "ผู้ดูแล")
                }
            } catch (e) {
                setError(e?.message || "โหลดโปรไฟล์ไม่สำเร็จ");
            } finally {
                setLoadingMe(false);                                                    // จบโหลดโปรไฟล์
            }
        })();
    }, []);

    // -------- โหลดข้อมูลแดชบอร์ด (เรียก API ใหม่ที่เพิ่มฝั่ง backend) --------
    useEffect(() => {
        (async () => {
            setLoadingData(true);

            // ยิงพร้อมกัน แต่ไม่ให้ทั้งชุดพังถ้ามีตัวใดตัวหนึ่ง error
            const results = await Promise.allSettled([
                apiFetch("/api/dashboard/kpis"),
                apiFetch("/api/dashboard/turnout-history"),
                apiFetch("/api/dashboard/ballot-split/"),        // ยังไม่มีข้อมูล → อาจ 500
                apiFetch("/api/dashboard/department-distribution"),
                apiFetch("/api/dashboard/year-distribution"),
                apiFetch("/api/dashboard/active-elections"),
                apiFetch("/api/dashboard/election-summary"),
            ]);

            // helper ดึงค่าจาก Promise.allSettled
            const pick = (idx) => results[idx]?.status === "fulfilled" ? results[idx].value : null;

            const k = pick(0), t = pick(1), b = pick(2), d = pick(3), y = pick(4), a = pick(5), es = pick(6);


            // เซ็ตเฉพาะตัวที่สำเร็จ; ตัวที่ล้มตั้งเป็นค่าเริ่มต้น
            if (k?.success) setKpis(k.data); else setKpis({ users: 0, eligible: 0, elections: 0, ongoing: 0, candidates: 0 });
            setTurnout(Array.isArray(t?.data) ? t.data : []);                // ถ้า error → []
            setBallotSplit(Array.isArray(b?.data) ? b.data : []);            // ถ้า error → []
            setDeptDist(Array.isArray(d?.data) ? d.data : []);
            setYearDist(Array.isArray(y?.data) ? y.data : []);
            setActiveElections(Array.isArray(a?.data) ? a.data : []);
            if (es?.success)
                setElectionSummary(es.data);

            // else setElectionSummary({ total: 0, registering: 0, voting: 0, finished: 0 });
            // ไม่ต้อง setError ทั้งหน้า เพียง log ไว้ก็พอ
            if (results.some(r => r.status === 'rejected')) {
                console.warn('[dashboard] some endpoints failed', results.filter(r => r.status === 'rejected'));
            }

            setLoadingData(false);
        })().catch(e => {
            // เกิดข้อผิดพลาดแบบไม่คาดคิด
            console.error(e);
            setLoadingData(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedElectionId) { setBallotSplit([]); return; }
        const electionId = selectedElectionId;

        apiFetch(`/api/dashboard/ballot-split/${electionId}`)
            .then(res => setBallotSplit(res?.data || []))
            .catch(() => setBallotSplit([]));
    }, [selectedElectionId]);

    useEffect(() => {
        apiFetch("/api/dashboard/all-elections").then(res => {
            const list = Array.isArray(res?.data) ? res.data : [];
            setAllElections(list);
        });
    }, []);


    const filteredElections = useMemo(() => {
        const list = allElections.map(e => ({ ...e, _status: e.status || getElectionStatus(e) }));
        if (statusFilter === "ALL") return list;
        return list.filter(e => e._status === statusFilter);
    }, [allElections, statusFilter]);

    // ถ้าเปลี่ยนฟิลเตอร์แล้ว option เดิมไม่อยู่ในลิสต์ → รีเซ็ตการเลือก
    useEffect(() => {
        if (!selectedElectionId) return;
        const stillExists = filteredElections.some(e => String(e.id) === String(selectedElectionId));
        if (!stillExists) {
            setSelectedElectionId(filteredElections[0]?.id ? String(filteredElections[0].id) : "");
        }
    }, [filteredElections, selectedElectionId]);

    // จำค่าฟิลเตอร์
    useEffect(() => {
        const s = localStorage.getItem("admin_dash_status_filter");
        if (s) setStatusFilter(s);
    }, []);
    useEffect(() => {
        localStorage.setItem("admin_dash_status_filter", statusFilter);
        setSelectedElectionId("");
        setBallotSplit([]);
    }, [statusFilter]);


    // -------- เตรียมข้อมูลสำหรับ Bar/Doughnut (Chart.js) --------
    // แนวทาง map labels/datasets ตามสไลด์ Chart.pdf
    // :contentReference[oaicite:9]{index=9}
    const turnoutData = useMemo(() => ({
        labels: turnout.map(i => i.label),                                           // ป้ายแกน X (เช่น "Aug 25")
        datasets: [{ label: "% Turnout", data: turnout.map(i => i.turnout), backgroundColor: COLORS[0], borderRadius: 8 }],
    }), [turnout]);

    const turnoutOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,                                // ให้ยืดหยุ่นกับความสูง container
        plugins: { legend: { display: false }, title: { display: true, text: "Turnout (ย้อนหลัง)" } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + "%" } }, x: { grid: { display: false } } }
    }), []);

    const ballotData = useMemo(() => ({
        labels: ballotSplit.map(i => i.name),                                        // ["โหวต","งดออกเสียง","ไม่มาโหวต"]
        datasets: [{ data: ballotSplit.map(i => i.value), backgroundColor: COLORS.slice(0, 3) }],
    }), [ballotSplit]);

    const ballotOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const dataset = ctx.dataset.data;
                        const total = dataset.reduce((a, b) => a + b, 0) || 1;
                        const val = ctx.raw;
                        const p = ((val / total) * 100).toFixed(1);
                        return `${ctx.label}: ${val} (${p}%)`;
                    }
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 20,             // ขนาดกล่องสี
                    padding: 15,              // ระยะห่างระหว่างแต่ละอัน
                },
            },
            title: {
                display: true,
                text: "สัดส่วนบัตรโหวต"
            }
        },
        cutout: "60%"
    };

    const deptData = useMemo(() => ({
        labels: deptDist.map(i => i.name || "ไม่ระบุ"),                              // รายชื่อแผนก
        datasets: [{ label: "จำนวนนักศึกษา", data: deptDist.map(i => i.total), backgroundColor: COLORS }],
    }), [deptDist]);

    const deptOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, text: "นักศึกษาตามแผนก" } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    }), []);

    const yearData = useMemo(() => ({
        labels: yearDist.map(i => i.name || "ไม่ระบุ"),                              // รายชื่อชั้นปี
        datasets: [{ label: "จำนวนนักศึกษา", data: yearDist.map(i => i.total), backgroundColor: COLORS }],
    }), [yearDist]);

    const yearOptions = useMemo(() => ({
        indexAxis: "y",                                                              // แท่งแนวนอน
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, text: "นักศึกษาตามชั้นปี" } },
        scales: { x: { beginAtZero: true } }
    }), []);

    // -------- Loading / No-permission (สไตล์เดียวกับ AdminElectionList.jsx) --------
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

    if (!roles.includes("ผู้ดูแล")) {                                             // ต้องเป็น "ผู้ดูแล" เท่านั้น
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
    // :contentReference[oaicite:10]{index=10}

    // -------- UI หลัก (โทน/กริดตามแดชบอร์ดเดิม) --------
    return (
        <>
            <Header />                                                                  {/* ส่วนหัวแบบเดียวกับหน้าผู้ดูแลอื่น ๆ */}
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
                <main className="px-3 sm:px-6 py-4 max-w-7xl mx-auto space-y-4">
                    {/* KPI Cards: ยึดโทนจาก AdminDashboard.jsx (ตัวเลขเด่น+การ์ดคุมโทน) */} {/* :contentReference[oaicite:11]{index=11} */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <Kpi title="ผู้ใช้ทั้งหมด" value={kpis?.users ?? "-"} color="blue" Icon={UserGroupIcon} />
                        <Kpi title="ผู้มีสิทธิ์โหวต (รวม)" value={kpis?.eligible ?? "-"} color="green" Icon={IdentificationIcon} />
                        <Kpi title="ผู้มีสิทธิ์โหวต (ไม่ซ้ำ)" value={kpis?.eligible_unique ?? "-"} color="indigo" Icon={IdentificationIcon} />
                        <Kpi title="ผู้สมัคร" value={kpis?.candidates ?? "-"} color="purple" Icon={UserPlusIcon} />
                        <Kpi title="กรรมการ" value={kpis?.committee ?? "-"} color="cyan" Icon={ShieldCheckIcon} />
                        <Kpi title="แอดมิน" value={kpis?.admin ?? "-"} color="pink" Icon={Cog6ToothIcon} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <Kpi title="รายการเลือกตั้ง (ทั้งหมด)" value={electionSummary?.total ?? "-"} color="amber" Icon={RectangleGroupIcon} />
                        <Kpi title="เปิดรับสมัคร" value={electionSummary?.registering ?? "-"} color="yellow" Icon={PencilSquareIcon} />
                        <Kpi title="เปิดลงคะแนน" value={electionSummary?.voting ?? "-"} color="orange" Icon={CursorArrowRaysIcon} />

                        <Kpi title="เสร็จสิ้น" value={electionSummary?.finished ?? "-"} color="red" Icon={FlagIcon} />
                    </div>

                    {/* <select
                        className="border rounded px-2 py-1 text-sm"
                        value={selectedElectionId || ""}
                        onChange={(e) => setSelectedElectionId(e.target.value)}
                    >
                        <option value="">เลือกการเลือกตั้ง</option>
                        {activeElections.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select> */}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        {/* ตัวกรองสถานะ */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">สถานะ: </label>
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">ทั้งหมด</option>
                                <option value="REGISTERING">เปิดรับสมัคร</option>
                                <option value="VOTING">กำลังโหวต</option>
                                <option value="FINISHED">เสร็จสิ้น</option>
                            </select>
                        </div>

                        {/* เลือกรายการเลือกตั้ง (จากทุกรายการที่ผ่านฟิลเตอร์) */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">เลือกการเลือกตั้ง: </label>
                            {/* <select
                                className="border rounded px-2 py-1 text-sm min-w-56"
                                value={selectedElectionId || ""}
                                onChange={(e) => setSelectedElectionId(e.target.value)}
                            >
                                {filteredElections.length === 0 && <option value="">— ไม่มีรายการ —</option>}
                                {filteredElections.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select> */}
                            <select
                                className="border rounded px-2 py-1 text-sm min-w-56"
                                value={selectedElectionId}
                                onChange={(e) => setSelectedElectionId(e.target.value)}
                            >
                                <option value="">เลือกการเลือกตั้ง</option>
                                {filteredElections.map(e => (
                                    <option key={e.id} value={String(e.id)}>{e.name}</option>
                                ))}
                            </select>

                        </div>
                    </div>


                    {/* แถวบน: Turnout + Ballot */}
                    <section className="grid grid-cols-12 gap-3">
                        <Card className="col-span-12 lg:col-span-7" header="Turnout (ย้อนหลัง)">
                            <div style={{ height: 280 }}>
                                <Bar data={turnoutData} options={turnoutOptions} />               {/* แท่ง % turnout (Chart.js) */}
                            </div>
                        </Card>

                        {/* <Card className="col-span-12 lg:col-span-5" header="สัดส่วนบัตรโหวต">
                            <div style={{ height: 280 }}>
                                <Doughnut data={ballotData} options={ballotOptions} />
                            </div>
                        </Card> */}
                        <Card className="col-span-12 lg:col-span-5" header="สัดส่วนบัตรโหวต">
                            {selectedElectionId && (
                                <p className="text-center text-sm text-gray-600 mb-1">
                                    รายการเลือกตั้ง : {filteredElections.find(e => String(e.id) === String(selectedElectionId))?.name}
                                </p>
                            )}
                            <div style={{ height: 280 }}>
                                {!selectedElectionId ? (
                                    <EmptyChart message="กรุณาเลือก ‘รายการเลือกตั้ง’ ด้านบน เพื่อแสดงสัดส่วนบัตรโหวต" />
                                ) :
                                    (
                                        <Doughnut data={ballotData} options={ballotOptions} />
                                    )}
                            </div>
                        </Card>



                    </section>




                    {/* แถวล่าง: Dept + Year */}
                    <section className="grid grid-cols-12 gap-3">
                        <Card className="col-span-12 lg:col-span-6" header="นักศึกษาตามแผนก">
                            <div style={{ height: 300 }}>
                                <Bar data={deptData} options={deptOptions} />
                            </div>
                        </Card>

                        <Card className="col-span-12 lg:col-span-6" header="นักศึกษาตามชั้นปี">
                            <div style={{ height: 300 }}>
                                <Bar data={yearData} options={yearOptions} />
                            </div>
                        </Card>
                    </section>

                    {/* ตาราง: รายการเลือกตั้ง (กำลังเปิด/ล่าสุด) */}
                    <Card header="รายการเลือกตั้ง (กำลังเปิด/ล่าสุด)">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="py-2 pr-3">ชื่อ</th>
                                        <th className="py-2 px-3">สมัคร</th>
                                        <th className="py-2 px-3">โหวต</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeElections || []).map((e) => (
                                        <tr key={e.id} className="border-b last:border-0">
                                            <td className="py-2 pr-3">{e.name}</td>
                                            <td className="py-2 px-3">
                                                {new Date(e.registration_start).toLocaleString()} – {new Date(e.registration_end).toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3">
                                                {new Date(e.start_date).toLocaleString()} – {new Date(e.end_date).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>


                </main>
            </div>
        </>
    );
}

// ---------------- UI primitives (โทนเดียวกับหน้าเดิม) ----------------
function Card({ header, children, className = "" }) {
    return (
        <section className={`rounded-xl border border-black/5 bg-white shadow-sm p-3 md:p-4 ${className}`}>
            {header && <h2 className="mb-2 text-sm font-semibold">{header}</h2>}
            {children}
        </section>
    );
}

function Kpi({ title, value, color = "blue", Icon }) {
    const BG = {
        blue: "from-sky-400/70 to-sky-200/30",
        green: "from-emerald-400/70 to-emerald-200/30",
        indigo: "from-indigo-400/70 to-indigo-200/30",
        purple: "from-violet-400/70 to-violet-200/30",
        cyan: "from-cyan-400/70 to-cyan-200/30",
        pink: "from-pink-400/70 to-pink-200/30",
        gray: "from-slate-400/70 to-slate-200/30",
        amber: "from-amber-400/70 to-amber-200/30",
        yellow: "from-yellow-400/70 to-yellow-200/30",
        orange: "from-orange-400/70 to-orange-200/30",
        red: "from-rose-400/70 to-rose-200/30",
    }[color];

    const ICON_COLOR = {
        blue: "text-sky-700", green: "text-emerald-700", indigo: "text-indigo-700",
        purple: "text-violet-700", cyan: "text-cyan-700", pink: "text-pink-700",
        gray: "text-slate-700", amber: "text-amber-700", yellow: "text-yellow-700",
        orange: "text-orange-700", red: "text-rose-700",
    }[color];

    return (
        <div className="relative overflow-hidden rounded-lg border border-black/5 shadow-sm hover:shadow-md transition">
            {/* พื้นหลัง gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${BG}`} />

            {/* เนื้อการ์ด */}
            <div className="relative p-3 md:p-4 flex flex-col h-24">
                {/* หัวข้อ */}
                <p className="text-sm font-bold tracking-wide text-zinc-800">
                    {title}
                </p>

                {/* ตัวเลข + ไอคอน */}
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[24px] font-bold text-stone-700">{value}</span>
                    {Icon && <Icon className={`w-8 h-8 ${ICON_COLOR}`} />}
                </div>
            </div>
        </div>
    );
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
    return "UPCOMING"; // ยังไม่เริ่มสมัคร
}

function EmptyChart({ message }) {
    return (
        <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
}
