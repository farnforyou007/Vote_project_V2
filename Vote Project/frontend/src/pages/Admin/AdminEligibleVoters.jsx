// src/pages/AdminEligibleVoters.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "components";

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { apiFetch } from "utils/apiFetch";
import { formatDate } from "../../utils/dateUtils";

export default function ManageEligibilityPage() {
    const { id } = useParams(); // election_id

    const [me, setMe] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const loadMe = async () => {
        const meRes = await apiFetch(`/api/users/me`);
        if (meRes?.success) {
            setMe(meRes.user);
            setRoles(meRes.user.roles || []);
        }
        setLoadingMe(false);
    };
    const [filter, setFilter] = useState({
    department: "",
    year: "",
    level: "",
    keyword: "",
    allYears: false,
    });

  const [selectedIds, setSelectedIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const [levels, setLevels] = useState([]);
  const [limit, setLimit] = useState(20);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [electionInfo, setElectionInfo] = useState(null);

const fetchElectionInfo = async () => {
  try {
    const data = await apiFetch(`/api/elections/${id}`);
    if (data) {
        setElectionInfo(data.election || data.data || null);

    }
  } catch (err) {
    console.error("❌ fetchElectionInfo error:", err);
  }
};
  // ---------- Loaders ----------
  const fetchStudents = async () => {
    const query = [];
    if (filter.level) query.push(`level=${parseInt(filter.level)}`);
    if (!filter.allYears && filter.year) query.push(`year=${filter.year}`);
    if (filter.department) query.push(`department=${filter.department}`);

    try {
      const data = await apiFetch(`/api/users/students${query.length ? `?${query.join("&")}` : ""}`);
      setStudents(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      console.error("❌ fetchStudents error:", err);
      setStudents([]);
    }
  };

  const fetchEligibleUsers = async () => {
    const data = await apiFetch(`/api/elections/${id}/eligible-users`);
    setStudents(Array.isArray(data?.users) ? data.users : []);
  };

  const loadLookups = async () => {
    const [deptData, yearData, levelData] = await Promise.all([
      apiFetch(`/api/users/departments`),
      apiFetch(`/api/users/years`),
      apiFetch(`/api/users/levels`),
    ]);
    setDepartments(deptData?.departments || []);
    setYears(yearData?.years || []);
    setLevels(levelData?.levels || []);
  };

  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
        await loadMe();
        await fetchElectionInfo();
        await loadLookups();
        await fetchStudents();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // รีโหลดตามตัวกรอง/โหมด
  useEffect(() => {
    (async () => {
      if (onlyEligible) await fetchEligibleUsers();
      else await fetchStudents();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.level, filter.year, filter.department, filter.allYears, onlyEligible]);

  // กรองตาม keyword เมื่อรายการ/คีย์เวิร์ดเปลี่ยน
  useEffect(() => {
    const keyword = (filter.keyword || "").toLowerCase().trim();

    const next = (students || []).filter((s) => {
      const matchDept = !filter.department || String(s.department_id) === filter.department;
      const matchLevel = !filter.level || String(s.level_id) === filter.level;
      const matchYear = filter.allYears || String(s.year_id) === filter.year;

      const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const sid = String(s.student_id || "").toLowerCase();

      const matchKeyword = !keyword || fullName.includes(keyword) || sid.includes(keyword);
      return matchDept && matchLevel && matchYear && matchKeyword;
    });

    setFiltered(next);
  }, [students, filter.keyword, filter.department, filter.level, filter.year, filter.allYears]);

  // ---------- Selects ----------
  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = useMemo(
    () => filtered.length > 0 && selectedIds.length === filtered.length,
    [filtered.length, selectedIds.length]
  );

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map((s) => s.user_id));
  };

  // ---------- Actions ----------
  const handleAddSelected = async () => {
    if (selectedIds.length === 0) {
      await Swal.fire({ icon: "warning", title: "กรุณาเลือกนักศึกษาก่อนเพิ่ม", confirmButtonText: "ตกลง" });
      return;
    }
    if (selectedIds.length > 100) {
      toast.error("กรุณาเลือกไม่เกิน 100 คน");
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการเพิ่มสิทธิ์?",
      text: `ต้องการเพิ่มสิทธิ์ให้ผู้ใช้ที่เลือกจำนวน ${selectedIds.length} คน`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    const data = await apiFetch(`/api/elections/${id}/eligibility/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: selectedIds }),
    });

    if (!data) return; // 401 → apiFetch จัดการแล้ว
    if (data.success) {
      toast.success("เพิ่มผู้มีสิทธิ์เรียบร้อย");
      setSelectedIds([]);
      if (onlyEligible) await fetchEligibleUsers();
      else await fetchStudents();
    } else if (data.alreadyExists) {
        await Swal.fire({icon: "error" ,title : "นักศึกษาบางรายมีสิทธิ์อยู่แล้ว",confirmButtonText: "ยืนยัน"})
      toast.error("นักศึกษาบางรายมีสิทธิ์อยู่แล้ว");
    } else {
      await Swal.fire({ icon: "error", title: "เพิ่มไม่สำเร็จ", text: data.message || "กรุณาลองใหม่" });
    }
  };

  const handleAddAll = async () => {
    const confirm = await Swal.fire({
      title: "ยืนยันการเพิ่มทั้งหมด?",
      text: "ต้องการเพิ่มสิทธิ์ให้นักศึกษาทั้งหมดตามตัวกรองปัจจุบัน",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันเพิ่ม",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    const data = await apiFetch(`/api/elections/${id}/eligibility/add-all`, { method: "POST" });
    if (!data) return;

    if (!data.success) {
      await Swal.fire({ icon: "error", title: "เพิ่มไม่สำเร็จ", text: data.message || "กรุณาลองใหม่" });
      return;
    }

    if (data.affectedRows === 0) {
      await Swal.fire({ icon: "info", title: "ไม่มีรายการใหม่", text: "มีสิทธิ์ครบอยู่แล้ว" ,confirmButtonText: "ยืนยัน"});
      return;
    }
    await Swal.fire({ icon: "success", title: `เพิ่มผู้มีสิทธิ์ทั้งหมดแล้ว: ${data.affectedRows} คน` });
    toast.success(`เพิ่มผู้มีสิทธิ์ทั้งหมดแล้ว: ${data.affectedRows} คน`);
    if (onlyEligible) await fetchEligibleUsers();
    else await fetchStudents();
  };

  const handleRemove = async (user_id) => {
    if (!onlyEligible) {
      await Swal.fire({
        icon: "info",
        title: "ไม่สามารถลบได้",
        text: "กรุณาเลือกโหมด 'แสดงเฉพาะผู้มีสิทธิ์' ก่อน",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณไม่สามารถกู้คืนได้หลังจากลบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    const data = await apiFetch(`/api/elections/${id}/eligibility-delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    if (!data) return;
    if (data.success) {
        await Swal.fire({ icon: "success", title: 'ลบผู้มีสิทธิ์สำเร็จ' });
        toast.success("ลบผู้มีสิทธิ์สำเร็จ");
        setSelectedIds((prev) => prev.filter((sid) => sid !== user_id));
        await fetchEligibleUsers();
    } else {
      await Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: data.message || "กรุณาลองใหม่" });
    }
  };

  const handleRemoveSelected = async () => {
    if (!onlyEligible) {
      await Swal.fire({
        icon: "info",
        title: "ลบไม่ได้",
        text: "กรุณาแสดงเฉพาะผู้มีสิทธิ์ก่อนลบแบบกลุ่ม",
      });
      return;
    }
    if (selectedIds.length === 0) {
      await Swal.fire({ icon: "warning", title: "กรุณาเลือกผู้มีสิทธิ์ที่จะลบ" });
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการลบสิทธิ์ที่เลือก?",
      text: `จำนวน ${selectedIds.length} คน`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    const data = await apiFetch(`/api/elections/${id}/eligibility/bulk-delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: selectedIds }),
    });

    if (!data) return;
    if (data.success) {
        await Swal.fire({ icon: "success", title: 'ลบผู้มีสิทธิ์ที่เลือกสำเร็จ' });
        toast.success("ลบผู้มีสิทธิ์ที่เลือกสำเร็จ");

      setSelectedIds([]);
      await fetchEligibleUsers();
    } else {
      await Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: data.message || "กรุณาลองใหม่" });
    }
  };

  const toggleOnlyEligible = async () => {
    const checked = !onlyEligible;
    setOnlyEligible(checked);
    if (checked) await fetchEligibleUsers();
    else await fetchStudents();
  };

    if (loadingMe) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-700 text-lg font-medium">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    </div>
  );
}

if (!roles.includes("ผู้ดูแล")) {
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
        <p className="text-red-600 text-lg font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <p className="text-gray-500 text-sm">โปรดติดต่อผู้ดูแลระบบ หากคิดว่านี่คือความผิดพลาด</p>
      </div>
    </div>
  );
}

  return (
    <>
      <Header />

      <div className="p-6 bg-purple-100 min-h-screen">
        <h1 className="text-xl font-bold mb-4">จัดการผู้มีสิทธิ์ลงคะแนน</h1>
        {electionInfo && (
                            <div className="mb-6 px-4 py-3 bg-white rounded shadow text-sm text-gray-800 space-y-1">
                                <p>
                                    <strong>📌 รายการ:</strong> {electionInfo.election_name}
                                </p>
                                <p>
                                    <strong>🗓️ เปิดสมัคร :</strong>{" "}
                                    {formatDate(electionInfo.registration_start?.slice(0, 10))} - {formatDate(electionInfo.registration_end?.slice(0, 10))}
                                </p>
                                <p>
                                    <strong>🗳️ เปิดลงคะแนน :</strong>{" "}
                                    {formatDate(electionInfo.start_date?.slice(0, 10))} - {formatDate(electionInfo.end_date?.slice(0, 10))}
                                </p>
                            </div>
                        )}
        {/* แถวบน */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="border p-2 rounded bg-white border-violet-300"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} แถว
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ค้นหาชื่อ / รหัสนักศึกษา"
            value={filter.keyword}
            onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
            className="border p-2 rounded bg-white flex-1 border-violet-300"
          />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyEligible} onChange={toggleOnlyEligible} />
            แสดงเฉพาะผู้มีสิทธิ์ในรายการนี้
          </label>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleAddAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              + เพิ่มผู้มีสิทธิ์ทั้งหมด
            </button>
          </div>
        </div>

        {/* แถวล่าง */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <select
            value={filter.level}
            onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value, allYears: true }))}
            className="border p-2 rounded bg-white border-violet-300"
          >
            <option value="">เลือกระดับชั้น</option>
            {levels.map((l) => (
              <option key={l.level_id} value={l.level_id}>
                {l.level_name}
              </option>
            ))}
          </select>

          <select
            value={filter.year}
            onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
            disabled={filter.allYears}
            className="border p-2 rounded bg-white border-violet-300"
          >
            <option value="">เลือกชั้นปี</option>
            {years
              .filter((y) => !filter.level || y.level_id === parseInt(filter.level))
              .map((y) => (
                <option key={y.year_id} value={y.year_id}>
                  {y.year_name}
                </option>
              ))}
          </select>

          <label className="flex items-center gap-2 ">
            <input
              type="checkbox"
              checked={filter.allYears}
              onChange={(e) => setFilter((f) => ({ ...f, allYears: e.target.checked }))}
            />
            ทุกชั้นปี
          </label>

          <select
            value={filter.department}
            onChange={(e) => setFilter((f) => ({ ...f, department: e.target.value }))}
            className="border p-2 rounded bg-white border-violet-300"
          >
            <option value="">เลือกแผนก</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              onClick={toggleSelectAll}
              className={`text-white px-4 py-2 rounded ${
                allSelected ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
            <button
              onClick={handleAddSelected}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              เพิ่มผู้มีสิทธิ์
            </button>
            <button
              onClick={handleRemoveSelected}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              ลบผู้มีสิทธิ์ที่เลือก
            </button>
          </div>
        </div>

        {/* ตาราง */}
        <table className="min-w-full bg-white border border-gray-300 text-sm text-center">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-2 text-center">เลือก</th>
              <th className="p-2">รหัสนักศึกษา</th>
              <th className="p-2">ชื่อ-สกุล</th>
              <th className="p-2">แผนก</th>
              <th className="p-2">ชั้นปี</th>
              <th className="p-2 text-center">เมนู</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="999" className="text-center text-gray-500 py-4">
                  ไม่พบนักศึกษาตามเงื่อนไขที่เลือก กรุณาเปลี่ยนเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              filtered.slice(0, limit).map((u,index) => (
                <tr key={u.user_id}
                // className="border-t"
                  className={`border-t hover:bg-zinc-200 ${index % 2 === 0 ? "bg-white " : "bg-slate-200"}`} >
                
                
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.user_id)}
                      onChange={() => toggleSelect(u.user_id)}
                    />
                  </td>
                  <td className="p-2">{u.student_id}</td>
                  <td className="p-2">
                    {(u.first_name || "") + " " + (u.last_name || "")}
                  </td>
                  <td className="p-2">{u.department_name}</td>
                  <td className="p-2">{u.year_name}</td>
                  <td className="p-2 text-center align-middle">
                    <button
                      onClick={() => handleRemove(u.user_id)}
                      title={onlyEligible ? "" : "กรุณาแสดงเฉพาะผู้มีสิทธิ์ก่อนจึงจะลบได้"}
                      disabled={!onlyEligible}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded ${
                        onlyEligible
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <FaTrash size={12} /> ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
