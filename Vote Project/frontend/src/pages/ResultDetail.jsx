// ver4
// src/pages/ResultDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "utils/apiFetch";
import { Header } from "components";
import { Users, UserCheck, UserX, Ban, TrendingUp, Trophy, BarChart3, PieChart, Info } from "lucide-react";
import { translateStatus } from "utils/electionStatus";

// Chart.js
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export default function ResultDetail() {
    const { id } = useParams();
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);

    const candidateData = useMemo(() => {
        if (!payload?.success) return null;
        const { results } = payload;
        // const labels = results.map(r => r.candidate_name);
        const labels = results.map(r =>
            (r?.candidate_number !== undefined && r?.candidate_number !== null)
                ? `# ${r.candidate_number} ${r.candidate_name}`
                : r.candidate_name
        );
        const votes = results.map(r => r.vote_count);
        return {
            labels,
            datasets: [{
                label: "คะแนน",
                data: votes,
                borderWidth: 0,
                backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
                borderRadius: 8,
            }]
        };
    }, [payload]);

    useEffect(() => {
        (async () => {
            const res = await apiFetch(`/api/elections/${id}/results/full`);
            setPayload(res);
            setLoading(false);
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-700 text-lg font-medium">กำลังโหลดผลการเลือกตั้ง…...</p>
                </div>
            </div>
        );
    }

    if (!payload?.success) {
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
                    <p className="text-red-600 text-lg font-semibold">เกิดข้อผิดพลาด</p>
                    <p className="text-gray-700 text-center">{payload?.message}</p>
                    <p className="text-gray-700 text-center">{"ไม่สามารถโหลดผลการเลือกตั้งได้"}</p>
                </div>
            </div>
        );
    }

    const meta = payload?.meta;
    if (meta && meta.has_candidates === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#efe0ff]">
                <div className="bg-white border border-amber-200 shadow rounded-2xl px-6 py-5 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 grid place-items-center rounded-full bg-amber-50">
                        <UserX className="h-10 w-10 text-amber-600" />
                    </div>
                    <p className="text-amber-700 font-semibold text-lg">ยังไม่มีผู้ลงสมัครในรายการนี้</p>
                    <p className="text-slate-500 text-sm mt-1">โปรดตรวจสอบอีกครั้งภายหลัง</p>
                </div>
            </div>

        );
    }

    const hasCandidates = payload?.meta?.has_candidates;
    const hasVotes = payload?.meta?.has_votes;

    if (hasCandidates && !hasVotes) {
        // แสดงข้อความ “ยังไม่มีคะแนน/ยังไม่ปิดเลือกตั้ง”
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#efe0ff]">
                <div className="bg-white border border-amber-200 shadow rounded-2xl px-6 py-5 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 grid place-items-center rounded-full bg-amber-50">
                        <Info className="h-10 w-10 text-amber-600" />
                    </div>
                    <p className="text-amber-700 font-semibold text-lg">ยังไม่มีคะแนน</p>
                    <p className="text-slate-500 text-sm mt-1">โปรดตรวจสอบอีกครั้งภายหลัง</p>
                </div>
            </div>
        );
    }

    const { election, kpis, results, winners, breakdownByYear, breakdownByDepartment } = payload;
    const winnerNames = winners.map(w => w.candidate_name).join(", ");
    const totalValidVotes = results.reduce((sum, r) => sum + (r.vote_count || 0), 0);
    const resultsWithPercent = results.map(r => ({
        ...r,
        percentDisplay: totalValidVotes ? ((r.vote_count / totalValidVotes) * 100).toFixed(2) : '0.00'
    }));

    const winnerVotes = winners[0]?.vote_count || 0;

    const candidateOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            y: { grid: { display: false } }
        }
    };

    const donutData = {
        labels: ["ผู้ลงคะแนน", "งดออกเสียง", "ไม่มาโหวต"],
        datasets: [{
            data: [kpis.voters_total, kpis.abstain_total, Math.max(kpis.eligible_total - kpis.voters_total, 0)],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 0,
        }]
    };

    const yearData = {
        labels: breakdownByYear.map(x => x.name),
        datasets: [
            { label: "มาใช้สิทธิ์", data: breakdownByYear.map(x => x.voted), backgroundColor: COLORS[0], borderRadius: 6 },
            { label: "ไม่มาใช้สิทธิ์", data: breakdownByYear.map(x => x.not_voted), backgroundColor: COLORS[3], borderRadius: 6 }
        ]
    };
    const yearOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: false }, legend: { position: 'top' } },
        scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, y: { grid: { display: false } } }
    };

    const deptData = {
        labels: breakdownByDepartment.map(x => x.name),
        datasets: [
            { label: "มาใช้สิทธิ์", data: breakdownByDepartment.map(x => x.voted), backgroundColor: COLORS[0], borderRadius: 6 },
            { label: "ไม่มาใช้สิทธิ์", data: breakdownByDepartment.map(x => x.not_voted), backgroundColor: COLORS[3], borderRadius: 6 }
        ]
    };
    const deptOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: false }, legend: { position: 'top' } },
        scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                ผลการลงคะแนน
                            </h1>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pl-10">
                            <div className="text-base font-semibold text-gray-800">{election.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>ปิดโหวต: {new Date(election.end_date).toLocaleString()}</span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    {election.status}
                                    {/* {translateStatus(election.status || election.auto_status)} */}

                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <KPICard
                            icon={<Users className="w-5 h-5" />}
                            label="ผู้มีสิทธิ์ทั้งหมด"
                            value={kpis.eligible_total}
                            bgColor="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                        <KPICard
                            icon={<UserCheck className="w-5 h-5" />}
                            label="ผู้ลงคะแนนทั้งหมด"
                            value={kpis.voters_total}
                            bgColor="bg-emerald-100"
                            iconColor="text-emerald-600"
                        />
                        <KPICard
                            icon={<Ban className="w-5 h-5" />}
                            label="งดออกเสียง"
                            value={kpis.abstain_total}
                            bgColor="bg-purple-100"
                            iconColor="text-purple-600"
                        />
                        <KPICard
                            icon={<UserX className="w-5 h-5" />}
                            label="ไม่มาใช้สิทธิ์"
                            value={Math.max(kpis.eligible_total - kpis.voters_total, 0)}
                            bgColor="bg-cyan-100"
                            iconColor="text-cyan-600"
                        />
                        <KPICard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="คิดเป็นร้อยละ"
                            value={`${kpis.turnout_percent}%`}
                            bgColor="bg-pink-100"
                            iconColor="text-pink-600"
                        />
                    </div>

                    {/* Winner Card - Center */}
                    <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 border-4 border-yellow-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-3">
                                <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
                            </div>
                            <div className="text-sm font-semibold text-amber-900 mb-2">🎉 ผู้ชนะการเลือกตั้ง 🎉</div>


                            <div className="w-32 h-32 rounded-full bg-white shadow-2xl mb-4 overflow-hidden border-4 border-white">
                                {winners[0]?.photo_url ? (
                                    <img
                                        src={winners[0].photo_url}
                                        alt={winnerNames}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-orange-200">
                                        <Trophy className="w-16 h-16 text-amber-600" />
                                    </div>
                                )}
                            </div>
                            {typeof winners[0]?.candidate_number !== 'undefined' && (
                                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-amber-700 text-sm font-bold shadow">
                                    หมายเลข {winners[0].candidate_number}
                                </div>
                            )}
                            <div className="text-3xl font-black text-white mb-2 drop-shadow-md">{winnerNames || '-'}</div>
                            {winners[0]?.department_name && (
                                <div className="text-lg text-gray-600 mt-1">
                                    แผนก: {winners[0].department_name}
                                </div>
                            )}
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
                                <div className="text-xs text-gray-600 mb-1">คะแนนที่ได้</div>
                                <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                    {winnerVotes}
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Charts - 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Candidate Bar Chart */}
                        <ChartCard
                            icon={<BarChart3 className="w-4 h-4" />}
                            title="สรุปผลคะแนน (ต่อผู้สมัคร)"
                        >
                            <div className="h-[300px]">
                                <Bar data={candidateData} options={candidateOptions} />
                            </div>
                        </ChartCard>

                        {/* Donut Chart */}
                        <ChartCard
                            icon={<PieChart className="w-4 h-4" />}
                            title="สัดส่วนการใช้สิทธิ์"
                        >
                            <div className="h-[300px] flex items-center justify-center">
                                <Doughnut data={donutData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }
                                }} />
                            </div>
                        </ChartCard>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
                        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            ตารางผลคะแนน
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <tr>
                                        <th className="p-2 text-left font-semibold text-gray-700">อันดับ</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">ชื่อ-สกุล</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">หมายเลข</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">รูป</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">รหัสนักศึกษา</th>
                                        <th className="p-2 text-left font-semibold text-gray-700">แผนก</th>
                                        <th className="p-2 text-right font-semibold text-gray-700">คะแนน</th>
                                        <th className="p-2 text-right font-semibold text-gray-700">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultsWithPercent.map((r, idx) => (
                                        <tr key={r.candidate_id} className={`border-t border-gray-100 hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                                            <td className="p-2">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                                                    {r.ranking}
                                                </span>
                                            </td>
                                            <td className="p-2 font-medium text-gray-800">
                                                {r.candidate_name}
                                                {r.is_winner && <span className="ml-2">🏆</span>}
                                            </td>
                                            <td className="p-2 font-semibold text-gray-800">
                                                {typeof r.candidate_number !== 'undefined' ? r.candidate_number : '-'}
                                            </td>

                                            <td className="p-2">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border">
                                                    {r.photo_url ? (
                                                        <img src={r.photo_url} alt={r.candidate_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-gray-600">{r.student_id}</td>
                                            <td className="p-2">{r.department_name || '-'}</td>
                                            <td className="p-2 text-right font-bold text-gray-800">{r.vote_count}</td>
                                            {/* <td className="p-2 text-right text-gray-600">{r.percent}%</td> */}
                                            <td className="p-2 text-right text-gray-600">{r.percentDisplay}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Year Breakdown */}
                        <ChartCard
                            icon={<BarChart3 className="w-4 h-4" />}
                            title="การลงคะแนนแยกตามชั้นปี"
                        >
                            <div className="h-[280px]">
                                <Bar data={yearData} options={yearOptions} />
                            </div>
                        </ChartCard>

                        {/* Department Breakdown */}
                        <ChartCard
                            icon={<BarChart3 className="w-4 h-4" />}
                            title="การลงคะแนนแยกตามแผนก"
                        >
                            <div className="h-[280px]">
                                <Bar data={deptData} options={deptOptions} />
                            </div>
                        </ChartCard>
                    </div>
                    {/* // Results Table */}
                </div>
            </div>
        </>
    );
}

function KPICard({ icon, label, value, bgColor, iconColor }) {
    return (
        <div className={`${bgColor} rounded-xl shadow-sm p-4 h-full flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700">{label}</div>
                <div className={iconColor}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-black text-gray-800">{value}</div>
        </div>
    );
}

function ChartCard({ icon, title, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                    {icon}
                </div>
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            </div>
            {children}
        </div>
    );
}