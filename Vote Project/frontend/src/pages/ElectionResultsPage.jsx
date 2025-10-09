import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Header from "../components/Header";
import { apiFetch } from "../utils/apiFetch";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

/**
 * ElectionResultsPage
 * - แสดงผู้ชนะ คะแนน และสถิติรวม
 * - กราฟคะแนนผู้สมัคร (Bar)
 * - กราฟแยกชั้นปี (Doughnut)
 * - กราฟแยกตามแผนก (Bar)
 *
 * API ที่ใช้ (อิงจาก backend ที่ให้มา):
 *   GET /api/elections/:id/results  -> ผลรวมและสรุป
 *   GET /api/elections/:id/breakdown?group=year        -> (ตัวเลือก) สถิติแยกชั้นปี
 *   GET /api/elections/:id/breakdown?group=department  -> (ตัวเลือก) สถิติแยกแผนก
 *
 * ถ้าสอง endpoint หลังไม่พร้อม หน้าเพจจะ fallback เป็น placeholder ที่อ่านง่าย
 */

const currency = (n) => new Intl.NumberFormat().format(Number(n || 0));
const percent = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

function StatCard({ icon, label, value, tone = "emerald" }) {
    const toneMap = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        rose: "bg-rose-50 text-rose-700 ring-rose-200",
        amber: "bg-amber-50 text-amber-700 ring-amber-200",
        violet: "bg-violet-50 text-violet-700 ring-violet-200",
        slate: "bg-slate-50 text-slate-700 ring-slate-200",
    };
    const toneCls = toneMap[tone] || toneMap.slate;
    return (
        <div className={`rounded-2xl ring-1 ${toneCls} p-5 flex items-center gap-4 shadow-sm`}>
            <div className="text-3xl">{icon}</div>
            <div className="flex-1">
                <div className="text-sm opacity-80">{label}</div>
                <div className="text-2xl font-semibold tracking-tight">{currency(value)}</div>
            </div>
        </div>
    );
}

function WinnerCard({ winner, totalVotes }) {
    if (!winner) return (
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-6">
            <div className="text-lg font-semibold">ผลการเลือกตั้ง</div>
            <div className="mt-2 text-slate-600">ยังไม่มีผู้ชนะ (ผลยังไม่ถูกสรุป)</div>
        </div>
    );
    return (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">ผู้ชนะการเลือกตั้ง</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{winner.name}</div>
            <div className="mt-1 text-sm text-slate-500">หมายเลข {winner.candidate_id}</div>
            <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-rose-500 text-white p-4 text-center">
                    <div className="text-sm opacity-90">คะแนนที่ได้</div>
                    <div className="text-3xl font-bold">{currency(winner.vote_count)}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 text-center">
                    <div className="text-sm text-slate-600">สัดส่วนจากคะแนนทั้งหมด</div>
                    <div className="text-3xl font-bold text-slate-800">
                        {totalVotes > 0 ? percent((winner.vote_count / totalVotes) * 100) : "0.00"}%
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ElectionResultsPage() {
    const { id } = useParams();
    const electionId = Number(id);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState({
        eligible_count: 0,
        voted_count: 0,
        abstain_count: 0,
        not_vote_count: 0,
        turnout_percent: 0,
    });
    const [results, setResults] = useState([]); // [{candidate_id, name, vote_count, ranking, is_winner}]

    // breakdowns
    const [yearData, setYearData] = useState(null);      // { labels:[], voted:[], abstain:[], notVote:[] }
    const [deptData, setDeptData] = useState(null);      // { labels:[], voted:[], abstain:[], notVote:[] }

    useEffect(() => {
        let isMounted = true;

        async function fetchAll() {
            setLoading(true);
            setError("");

            try {
                // ✅ ใช้ apiFetch (แนบ Authorization: Bearer <token> ให้อัตโนมัติ)
                const r = await apiFetch(`/api/elections/${electionId}/results`);

                if (!r?.success) throw new Error(r?.message || "Load failed");
                if (!isMounted) return;

                const s = r.data?.summary || {};
                const rs = r.data?.results || [];
                setSummary(s);
                setResults(rs);

                // (ถ้ามี endpoint breakdown จริง ให้เรียกด้วย apiFetch แบบนี้)
                try {
                    const y = await apiFetch(`/api/elections/${electionId}/breakdown?group=year`);
                    if (y?.success && isMounted) setYearData(toStackedShape(y.data));
                } catch { }

                try {
                    const d = await apiFetch(`/api/elections/${electionId}/breakdown?group=department`);
                    if (d?.success && isMounted) setDeptData(toStackedShape(d.data));
                } catch { }

            } catch (err) {
                // ถ้าโทเค็นหมดอายุ/ไม่ถูกต้อง apiFetch มักจะโยน error ที่มี status 401
                if (String(err?.status) === "401") {
                    // ล้าง token ที่เสีย + ส่งผู้ใช้ไปล็อกอินใหม่ (ปรับให้ตรงแอปคุณ)
                    ["token", "access_token", "jwt"].forEach(k => localStorage.removeItem(k));
                    // navigate("/login"); // ถ้าใช้ react-router
                }
                setError(err?.message || "Load failed");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchAll();
        return () => { isMounted = false; };
    }, [electionId]);

    // ถ้า backend ยังไม่มี breakdown API -> เตรียม placeholder อ่านง่าย
    const placeholderYear = useMemo(() => ({
        labels: ["ปี 1", "ปี 2", "ปี 3", "ปี 4"],
        voted: [12, 22, 18, 15],
        abstain: [1, 3, 2, 2],
        notVote: [7, 5, 10, 8],
    }), []);

    const placeholderDept = useMemo(() => ({
        labels: ["เทคโนโลยีดิจิทัล", "การตลาด", "การบัญชี", "การท่องเที่ยว"],
        voted: [80, 65, 40, 30],
        abstain: [4, 3, 2, 1],
        notVote: [16, 12, 8, 6],
    }), []);

    // winner & totalVotes
    const totalVotes = useMemo(() => results.reduce((sum, r) => sum + (r.vote_count || 0), 0), [results]);
    const winner = useMemo(() => results.find((r) => r.is_winner), [results]);

    // Chart datasets
    const candidateBarData = useMemo(() => {
        const labels = results.map((r) => r.name);
        const data = results.map((r) => r.vote_count);
        return {
            labels,
            datasets: [
                {
                    label: "คะแนน",
                    data,
                    borderWidth: 1,
                },
            ],
        };
    }, [results]);

    const candidateBarOpts = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
            legend: { display: false },
            title: { display: true, text: "สรุปผลคะแนนผู้สมัคร" },
            tooltip: { callbacks: { label: (ctx) => `${ctx.raw} คะแนน` } },
        },
        scales: { x: { ticks: { precision: 0 } } },
    }), []);

    const yData = yearData || placeholderYear;
    const dData = deptData || placeholderDept;

    const yearDoughnutData = useMemo(() => {
        // แสดงสัดส่วนผู้มาใช้สิทธิ์ของแต่ละชั้นปี
        const voted = yData.voted || [];
        const labels = yData.labels || [];
        return {
            labels,
            datasets: [
                {
                    data: voted,
                    borderWidth: 1,
                },
            ],
        };
    }, [yData]);

    const deptBarData = useMemo(() => {
        const labels = dData.labels || [];
        return {
            labels,
            datasets: [
                { label: "มาใช้สิทธิ์", data: dData.voted || [], borderWidth: 1 },
                { label: "งดออกเสียง", data: dData.abstain || [], borderWidth: 1 },
                { label: "ไม่มาใช้สิทธิ์", data: dData.notVote || [], borderWidth: 1 },
            ],
        };
    }, [dData]);

    const deptBarOpts = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: "แยกตามแผนก" },
        },
        scales: { y: { ticks: { precision: 0 } } },
    }), []);

    return (
        <>
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ผลการเลือกตั้ง</h1>
                        <p className="text-slate-600 mt-1">หน้าแสดงผลสรุปภาพรวมและกราฟสถิติ</p>
                    </div>
                </header>

                {/* Alerts */}
                {error && (
                    <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-4">
                        ไม่สามารถโหลดข้อมูลได้: {error}
                    </div>
                )}

                {/* Top section: winner + KPIs */}
                <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1">
                        <WinnerCard winner={winner} totalVotes={totalVotes} />
                    </div>
                    <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon="👥" label="จำนวนผู้มีสิทธิ์เลือกตั้ง" value={summary.eligible_count} tone="emerald" />
                        <StatCard icon="✅" label="จำนวนผู้ลงคะแนน" value={summary.voted_count} tone="amber" />
                        <StatCard icon="🚫" label="งดออกเสียง" value={summary.abstain_count} tone="rose" />
                        <StatCard icon="🚫" label="ไม่มาใช้สิทธิ์" value={summary.not_vote_count} tone="rose" />
                        <StatCard icon="%" label="คิดเป็นร้อยละ" value={summary.turnout_percent} tone="violet" />
                    </div>
                </section>

                {/* Candidate bar + Year doughnut */}
                <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2 h-[380px] rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                        {loading && results.length === 0 ? (
                            <div className="h-full grid place-items-center text-slate-500">กำลังโหลดกราฟ…</div>
                        ) : (
                            <Bar data={candidateBarData} options={candidateBarOpts} />
                        )}
                    </div>
                    <div className="h-[380px] rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                        <div className="text-sm text-slate-600 mb-2">แยกตามชั้นปี</div>
                        <Doughnut data={yearDoughnutData} options={{ maintainAspectRatio: false }} />
                        <div className="mt-3 text-xs text-slate-500">
                            * แสดงเฉพาะจำนวนผู้มาใช้สิทธิ์ของแต่ละชั้นปี
                        </div>
                    </div>
                </section>

                {/* Department stacked bar */}
                <section className="mt-8">
                    <div className="h-[420px] rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
                        <Bar data={deptBarData} options={deptBarOpts} />
                    </div>
                </section>

                {/* Footer note */}
                <p className="mt-6 text-xs text-slate-500">
                    เคล็ดลับ: ถ้าคุณเพิ่งกดสรุปผล โปรดรีเฟรชหน้านี้เพื่อดึงข้อมูลล่าสุด หรือดึงข้อมูลใหม่อัตโนมัติด้วย SWR/React Query ตามต้องการ
                </p>
            </div>
        </>
    );
}

// --- helper: ปรับรูปแบบ breakdown API ให้กลายเป็น shape ที่กราฟใช้ได้สะดวก ---
function toStackedShape(src) {
    // คาดโครงสร้าง: [{ label, voted_count, abstain_count, not_vote_count }]
    const labels = (src || []).map((x) => x.label ?? x.name ?? "");
    const voted = (src || []).map((x) => Number(x.voted_count ?? x.voted ?? 0));
    const abstain = (src || []).map((x) => Number(x.abstain_count ?? x.abstain ?? 0));
    const notVote = (src || []).map((x) => Number(x.not_vote_count ?? x.notVote ?? 0));
    return { labels, voted, abstain, notVote };
}
