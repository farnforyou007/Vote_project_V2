
// ver3

// src/pages/CandidatesList.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "components";
import Swal from "sweetalert2";
import { apiFetch } from "utils/apiFetch";
import { fillApplicationForm } from "utils/fillApplicationForm";

// src/pages/CandidatesList.jsx
// รีแฟกเตอร์ให้ "หน้าตาและ UX" ใกล้เคียง ManageCandidate แต่คง API เดิมจาก CandidatesList/CandidateDetail
// - รายการผู้สมัคร: GET /api/elections/:id/applications
// - ข้อมูลเลือกตั้ง:   GET /api/elections/:id
// - รายละเอียด (โมดอล):  GET /api/applications/:applicationId
// - อนุมัติ:            POST /api/applications/:applicationId/approve
// - ปฏิเสธ:            POST /api/applications/:applicationId/reject  { reason }
// - ลบ:                DELETE /api/applications/:applicationId
// - ดาวน์โหลด PDF:    fillApplicationForm(candidate)



/* -------------------------------- helpers -------------------------------- */
const formatDate = (d) => {
    if (!d) return "-";
    try {
        return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    } catch {
        return d;
    }
};

// รองรับ response รูปแบบต่าง ๆ
const pickArray = (res) =>
    Array.isArray(res) ? res : res?.data || res?.candidates || res?.applications || [];
const pickObject = (res) =>
    res?.data || res?.election || res?.application || res || null;

/* ------------------------------- Detail Modal ---------------------------- */
function CandidateDetailModal({ applicationId, onClose, onChanged }) {
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadDetail = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/applications/${applicationId}`);
            setCandidate(pickObject(data));
        } catch (e) {
            console.error("load detail error:", e);
            Swal.fire("ดึงรายละเอียดไม่สำเร็จ", e?.message || "", "error");
            setCandidate(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId]);

    const handleApprove = async () => {
        const ok = await Swal.fire({
            title: "ยืนยันการอนุมัติ?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
        });
        if (!ok.isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}/approve`, { method: "POST" });
        if (res) {
            Swal.fire("สำเร็จ", "ผู้สมัครได้รับการอนุมัติแล้ว", "success");
            setCandidate((c) => ({ ...c, application_status: "approved", number: res.number }));
            onChanged?.({ application_id: applicationId, application_status: "approved", number: res.number });
        }
    };

    const handleReject = async () => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: "ปฏิเสธการอนุมัติ",
            input: "textarea",
            inputLabel: "ระบุเหตุผล",
            inputPlaceholder: "เช่น เอกสารไม่ครบถ้วน...",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            inputValidator: (v) => (!v?.trim() ? "กรุณาระบุเหตุผล" : undefined),
        });
        if (!isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
        });
        if (res) {
            Swal.fire("บันทึกแล้ว", "ผู้สมัครถูกปฏิเสธ", "success");
            setCandidate((c) => ({
                ...c,
                application_status: "rejected",
                rejection_reason: reason,
                rejection_count: (c?.rejection_count || 0) + 1,
            }));
            onChanged?.({ application_id: applicationId, application_status: "rejected", rejection_reason: reason });
        }
    };

    const handleDelete = async () => {
        const ok = await Swal.fire({
            title: "ลบผู้สมัครนี้?",
            text: "การลบไม่สามารถย้อนกลับได้",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
        });
        if (!ok.isConfirmed) return;
        const res = await apiFetch(`/api/applications/${applicationId}`, { method: "DELETE" });
        if (res) {
            Swal.fire("ลบสำเร็จ", "ผู้สมัครถูกลบแล้ว", "success");
            onChanged?.({ application_id: applicationId, deleted: true });
            onClose();
        }
    };

    const handleDownloadPDF = async () => {
        if (!candidate) return;
        try {
            await fillApplicationForm(candidate);
        } catch (e) {
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถดาวน์โหลดใบสมัครได้", "error");
        }
    };

    // เพิ่มฟังก์ชัน
    const handleRequestRevision = async () => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: "ส่งกลับให้แก้ไข",
            input: "textarea",
            inputLabel: "บอกสิ่งที่ต้องแก้ไข",
            inputPlaceholder: "เช่น เพิ่มรูปหน้าตรง, เติมรายละเอียดนโยบาย...",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            inputValidator: (v) => (!v?.trim() ? "กรุณาระบุสิ่งที่ต้องแก้ไข" : undefined),
        });
        if (!isConfirmed) return;

        const res = await apiFetch(`/api/applications/${applicationId}/request-revision`, { // appicatinon routes
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
        });
        if (res?.success) {
            Swal.fire("บันทึกแล้ว", "ส่งกลับให้นักศึกษาแก้ไข", "success");
            setCandidate((c) => ({ ...c, application_status: "revision_requested", rejection_reason: reason }));
            onChanged?.({ application_id: applicationId, application_status: "revision_requested", rejection_reason: reason });
        }
    };

    const photoUrl = candidate?.photo
        ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${candidate.photo}`
        : "https://via.placeholder.com/100";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg relative">
                <button className="absolute right-3 top-3 text-slate-500 hover:text-red-500" onClick={onClose}>
                    ✕
                </button>

                {/* {loading ? (
                    <div className="py-10 text-center text-slate-600">กำลังโหลด...</div>
                ) : !candidate ? (
                    <div className="py-10 text-center text-red-500">ไม่พบข้อมูล</div>
                ) : ( */}
                {
                    loading ? (
                        // Loading แบบเดียวกับ AdminElectionList
                        <div className="flex items-center justify-center py-16">
                            <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                                <p className="text-gray-700 text-lg font-medium">กำลังโหลดข้อมูล...</p>
                            </div>
                        </div>
                    ) : !candidate ? (
                        // Not found เรียบๆ คล้ายสไตล์เดิม
                        <div className="flex items-center justify-center py-16">
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
                                <p className="text-red-600 text-lg font-semibold">ไม่พบข้อมูล</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700"
                                >
                                    รีเฟรชหน้า
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">รายละเอียดผู้สมัคร</h3>

                            <div className="flex justify-center">
                                <img src={photoUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-purple-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div><div className="text-slate-500">ชื่อ - สกุล</div><div className="bg-purple-50 p-2 rounded">{candidate.name || "-"}</div></div>
                                <div><div className="text-slate-500">รหัสนักศึกษา</div><div className="bg-purple-50 p-2 rounded">{candidate.student_id || "-"}</div></div>
                                <div><div className="text-slate-500">อีเมล</div><div className="bg-purple-50 p-2 rounded">{candidate.email || "-"}</div></div>
                                <div><div className="text-slate-500">ระดับ</div><div className="bg-purple-50 p-2 rounded">{candidate.level_name || "-"}</div></div>
                                <div><div className="text-slate-500">ชั้นปี</div><div className="bg-purple-50 p-2 rounded">{candidate.year_number || "-"}</div></div>
                                <div><div className="text-slate-500">แผนก</div><div className="bg-purple-50 p-2 rounded">{candidate.department || "-"}</div></div>
                                <div className="md:col-span-3"><div className="text-slate-500">นโยบาย</div><div className="bg-purple-50 p-2 rounded whitespace-pre-wrap">{candidate.campaign_slogan || "-"}</div></div>
                                <div className="md:col-span-3"><div className="text-slate-500">หมายเลขผู้สมัคร</div><div className="bg-purple-50 p-2 rounded">{candidate.number || "-"}</div></div>
                                <div className="md:col-span-3">
                                    {/* <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${candidate.application_status === "approved" ? "bg-green-100 text-green-700" :
                                    candidate.application_status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                    สถานะ: {candidate.application_status === "approved" ? "อนุมัติแล้ว" : candidate.application_status === "rejected" ? "ไม่อนุมัติ" : "รอการอนุมัติ"}
                                </div> */}
                                    {/* // โมดอล: แถบสถานะ */}
                                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${candidate.application_status === "approved" ? "bg-green-100 text-green-700" :
                                        candidate.application_status === "rejected" ? "bg-red-100 text-red-700" :
                                            candidate.application_status === "revision_requested" ? "bg-amber-100 text-amber-700" :
                                                "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        สถานะ: {
                                            candidate.application_status === "approved" ? "อนุมัติแล้ว" :
                                                candidate.application_status === "rejected" ? "ไม่อนุมัติ" :
                                                    candidate.application_status === "revision_requested" ? "รอแก้ไข" :
                                                        "รอการอนุมัติ"
                                        }
                                    </div>

                                </div>

                                {candidate.application_status === "rejected" && (
                                    <div className="md:col-span-3 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                                        <div><b>เหตุผลที่ปฏิเสธ:</b> {candidate.rejection_reason || "ไม่ระบุ"}</div>
                                        <div className="text-xs text-red-500 mt-1">ถูกปฏิเสธแล้ว {candidate.rejection_count || 0} ครั้ง</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-end gap-2 pt-2">
                                {/* ปุ่มในส่วน actions ของโมดอล */}
                                {candidate?.application_status === "pending" && (
                                    <>
                                        <button onClick={handleApprove} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                                            อนุมัติ
                                        </button>
                                        <button onClick={handleRequestRevision} className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600">
                                            ส่งกลับให้แก้ไข
                                        </button>
                                        <button onClick={handleReject} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                                            ไม่อนุมัติ
                                        </button>
                                    </>
                                )}
                                {candidate.application_status === "rejected" && (candidate.rejection_count || 0) >= 2 && (
                                    <button onClick={handleDelete} className="rounded-lg bg-black px-4 py-2 text-white hover:bg-black/80">ลบผู้สมัคร</button>
                                )}

                                {candidate.application_status === "approved" && (
                                    <button onClick={handleDownloadPDF} className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600">
                                        ดาวน์โหลดใบสมัคร
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}

/* -------------------------------- Main Page ------------------------------ */
export default function CandidatesList() {
    const { id } = useParams(); // election_id
    const [roles, setRoles] = useState([]);
    const [me, setMe] = useState(null);
    const [loadingMe, setLoadingMe] = useState(true);
    // data
    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);

    // ui states
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState("");
    const [selectedAppId, setSelectedAppId] = useState(null); // สำหรับเปิดโมดอล
    const [loading, setLoading] = useState(true);

    // lookups (เหมือน ManageCandidate)
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [levels, setLevels] = useState([]);
    const [filter, setFilter] = useState({ department: "", year: "", level: "" });

    const loadMe = async () => {
        try {
            const meRes = await apiFetch(`/api/users/me`);
            if (meRes?.success) {
                setMe(meRes.user);
                setRoles(meRes.user.roles || []);
            } else {
                setMe(null); setRoles([]);
            }
        } finally {
            setLoadingMe(false);
        }

    };
    // derived
    const filteredYears = useMemo(
        () => (filter.level ? years.filter((y) => String(y.level_id) === String(filter.level)) : years),
        [years, filter.level]
    );
    const yearToLevel = useMemo(() => {
        const m = {};
        years.forEach((y) => { m[String(y.year_id)] = String(y.level_id); });
        return m;
    }, [years]);
    const handleYearChange = (yearId) => {
        const nextLevel = yearToLevel[String(yearId)] || "";
        setFilter((prev) => ({ ...prev, year: yearId, level: nextLevel }));
    };

    const loadLookups = async () => {
        const [d, y, l] = await Promise.all([
            apiFetch(`/api/users/departments`),
            apiFetch(`/api/users/years`),
            apiFetch(`/api/users/levels`),
        ]);
        setDepartments(d?.departments || []);
        setYears(y?.years || []);
        setLevels(l?.levels || []);
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        (async () => {
            try {
                await Promise.all([loadElection(), loadCandidates(), loadLookups(), loadMe()]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // loaders
    const loadElection = async () => {
        const data = await apiFetch(`/api/elections/${id}`);
        setElection(pickObject(data));
    };
    const loadCandidates = async () => {
        try {
            const data = await apiFetch(`/api/elections/${id}/applications`);
            setCandidates(pickArray(data));
        } catch (e) {
            console.error("loadCandidates error:", e);
            Swal.fire("เกิดข้อผิดพลาด", "โหลดรายชื่อผู้สมัครไม่สำเร็จ", "error");
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };


    // sync จากโมดอล
    const handleModalChanged = (delta) => {
        if (!delta) return;
        setCandidates((prev) => {
            if (delta.deleted) return prev.filter((x) => x.application_id !== delta.application_id);
            return prev.map((x) => (x.application_id === delta.application_id ? { ...x, ...delta } : x));
        });
    };

    const bulkDownloadApproved = async () => {
        const approved = filtered.filter((c) => c.application_status === "approved");
        if (!approved.length) {
            Swal.fire("แจ้งเตือน", "ไม่มีผู้สมัครที่อนุมัติแล้วในรายการปัจจุบัน", "info");
            return;
        }
        const ok = await Swal.fire({
            title: "ยืนยันดาวน์โหลด",
            text: `ดาวน์โหลดใบสมัครทั้งหมด ${approved.length} รายการ`,
            icon: "question",
            showCancelButton: true,
        });
        if (!ok.isConfirmed) return;
        for (const cand of approved) {
            try { await fillApplicationForm(cand); } catch { }
        }
        Swal.fire("สำเร็จ", "เริ่มดาวน์โหลดไฟล์แล้ว", "success");
    };

    const filtered = useMemo(() => {
        const rows = Array.isArray(candidates) ? candidates : [];
        const kw = search.trim().toLowerCase();
        return rows.filter((c) => {
            const matchKw =
                !kw ||
                c.name?.toLowerCase().includes(kw) ||
                String(c.student_id || "").toLowerCase().includes(kw) ||
                c.campaign_slogan?.toLowerCase().includes(kw);

            const matchDept =
                !filter.department ||
                String(c.department_id) === String(filter.department) ||
                (c.department_name && String(c.department_name) === String(filter.department)) ||
                (c.department && String(c.department) === String(filter.department));

            const matchYear =
                !filter.year ||
                String(c.year_id) === String(filter.year) ||
                String(c.year_number) === String(groupsYearNumberFromYearId(filter.year, years));

            const matchLevel =
                !filter.level ||
                String(c.level_id) === String(filter.level) ||
                (c.level_name && String(levelIdFromName(c.level_name, levels)) === String(filter.level));

            return matchKw && matchDept && matchYear && matchLevel;
        });
    }, [candidates, search, filter, years, levels]);

    function groupsYearNumberFromYearId(yearId, yearsList) {
        const y = yearsList.find(yy => String(yy.year_id) === String(yearId));
        return y?.year_number ?? y?.year_name?.replace(/\D/g, "") ?? "";
    }
    function levelIdFromName(name, levelsList) {
        const l = levelsList.find(lv => lv.level_name === name);
        return l?.level_id ?? "";
    }


    if (!roles.includes("กรรมการ")) {
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
    return (
        <div className="min-h-screen bg-purple-100">
            <Header />

            <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">ตรวจสอบผู้สมัครลงเลือกตั้ง</h1>

                {/* ข้อมูลเลือกตั้ง + ปุ่มดาวน์โหลดรวม */}
                <div className="mb-6 px-4 py-3 bg-white rounded shadow text-sm text-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="space-y-1">
                            <p><strong>📌 รายการ:</strong> {election?.election_name || "-"}</p>
                            <p><strong>🗓️ ช่วงรับสมัคร :</strong> {formatDate(election?.start_date)} - {formatDate(election?.end_date)}</p>
                        </div>
                        <button onClick={bulkDownloadApproved} className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600">
                            ดาวน์โหลดใบสมัคร
                        </button>
                    </div>
                </div>

                {/* ฟิลเตอร์ */}
                <div className="flex flex-wrap gap-4 items-center mb-6">
                    <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="border p-2 rounded bg-white border-violet-300">
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n} แถว</option>)}
                    </select>

                    <input type="text" placeholder="ค้นหาชื่อ / รหัส / นโยบาย"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 rounded bg-white flex-1 border-violet-300" />

                    {/* ระดับการศึกษา */}
                    <select
                        value={filter.level}
                        onChange={(e) => setFilter(f => ({ ...f, level: e.target.value, year: "" }))}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกระดับการศึกษา</option>
                        {levels.map(l => (
                            <option key={l.level_id} value={l.level_id}>{l.level_name}</option>
                        ))}
                    </select>

                    {/* ชั้นปี (กรองตามระดับที่เลือก) */}
                    <select
                        value={filter.year}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกชั้นปี</option>
                        {filteredYears.map(y => (
                            <option key={y.year_id} value={y.year_id}>{y.year_name}</option>
                        ))}
                    </select>

                    {/* แผนก */}
                    <select
                        value={filter.department}
                        onChange={(e) => setFilter(f => ({ ...f, department: e.target.value }))}
                        className="border p-2 rounded bg-white border-violet-300"
                    >
                        <option value="">เลือกแผนก</option>
                        {departments.map(d => (
                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                        ))}
                    </select>
                </div>


                {/* ตาราง */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 text-sm">
                        <thead className="bg-gray-200">
                            <tr className="text-center">
                                <th className="p-2">รหัสนักศึกษา</th>
                                <th className="p-2">รูป</th>
                                <th className="p-2">ชื่อ-สกุล</th>
                                <th className="p-2">หมายเลข</th>
                                <th className="p-2">แผนก</th>
                                <th className="p-2">ระดับ</th>
                                <th className="p-2">ปี</th>
                                <th className="p-2">นโยบาย</th>
                                <th className="p-2">สถานะ</th>
                                <th className="p-2">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className="py-6 text-center text-gray-500">กำลังโหลด...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={10} className="py-6 text-center text-gray-500">ไม่พบข้อมูลผู้สมัคร</td></tr>
                            ) : (
                                filtered.slice(0, limit).map((c) => {
                                    const photoUrl = c.photo
                                        ? `${process.env.REACT_APP_API_ORIGIN || "http://localhost:5000"}${c.photo}`
                                        : "https://via.placeholder.com/80";
                                    return (
                                        <tr key={c.application_id} className="border-t hover:bg-gray-50">
                                            <td className="p-2 text-center">{c.student_id}</td>
                                            <td className="p-2">
                                                <div className="flex items-center justify-center">
                                                    <img src={photoUrl} alt="ผู้สมัคร" className="w-10 h-10 object-cover rounded-md" />
                                                </div>
                                            </td>
                                            <td className="p-2">{c.name}</td>
                                            <td className="p-2 text-center">{c.number || "-"}</td>
                                            <td className="p-2">{(c.department_name || c.department || "").replace("แผนกวิชา", "").trim()}</td>
                                            <td className="p-2 text-center">{c.level_name || "-"}</td>
                                            <td className="p-2 text-center">{c.year_number ? `ปี ${c.year_number}` : "-"}</td>
                                            <td className="p-2 max-w-sm"><div className="line-clamp-2">{c.campaign_slogan || "-"}</div></td>
                                            <td className="p-2 text-center">

                                                {/* // โมดอล: แถบสถานะ */}
                                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${c.application_status === "approved" ? "bg-green-100 text-green-700" :
                                                    c.application_status === "rejected" ? "bg-red-100 text-red-700" :
                                                        c.application_status === "revision_requested" ? "bg-amber-100 text-amber-700" :
                                                            "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                    {
                                                        c.application_status === "approved" ? "อนุมัติแล้ว" :
                                                            c.application_status === "rejected" ? "ไม่อนุมัติ" :
                                                                c.application_status === "revision_requested" ? "รอแก้ไข" :
                                                                    "รอการอนุมัติ"
                                                    }
                                                </div>

                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => setSelectedAppId(c.application_id)}
                                                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                                                >
                                                    ใบสมัคร
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedAppId && (
                <CandidateDetailModal
                    applicationId={selectedAppId}
                    onClose={() => setSelectedAppId(null)}
                    onChanged={handleModalChanged}
                />
            )}
        </div>
    );
}
