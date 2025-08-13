import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Swal from 'sweetalert2';
import { toast } from "react-toastify";
import { confirmToast } from "../utils/confirmToast";
import { FaTrash } from "react-icons/fa";


export default function ManageEligibilityPage() {
    // const navigate = useNavigate();
    const { id } = useParams(); // election_id
    const studentName = localStorage.getItem("studentName") || "";

    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [filter, setFilter] = useState({ department: "", year: "", level: "", keyword: "", allYears: false });

    const [selectedIds, setSelectedIds] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [levels, setLevels] = useState([]);
    const [limit, setLimit] = useState(20);
    const [onlyEligible, setOnlyEligible] = useState(false);

    const fetchStudents = async () => {
        const token = localStorage.getItem("token");
        const query = [];
        if (filter.level) {
            query.push(`level=${parseInt(filter.level)}`);
        }

        if (!filter.allYears && filter.year) query.push(`year=${filter.year}`);
        if (filter.department) query.push(`department=${filter.department}`);

        try {
            const res = await fetch(`http://localhost:5000/api/users/students?${query.join("&")}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStudents(Array.isArray(data.users) ? data.users : []); // ✅ fallback ปลอดภัย
        } catch (err) {
            console.error("❌ fetchStudents error:", err);
            setStudents([]); // fallback
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchMeta();
    }, []);

    // ✅ เพิ่ม useEffect สำหรับ fetchStudents เมื่อ filter level/year/department/allYears เปลี่ยน
    useEffect(() => {
        if (!onlyEligible) {
            fetchStudents();
        } else {
            fetchEligibleUsers(); // ✅ ต้องใส่ไว้ด้วย
        }
    }, [filter.level, filter.year, filter.department, filter.allYears, onlyEligible]);

    // ✅ เพิ่ม useEffect ให้ filterStudents ทำงานเมื่อ students หรือ keyword เปลี่ยน
    useEffect(() => {
        filterStudents();
    }, [students, filter.keyword]);

    const fetchMeta = async () => {
        const token = localStorage.getItem("token");
        const [deptRes, yearRes, levelRes] = await Promise.all([
            fetch("http://localhost:5000/api/users/departments", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            fetch("http://localhost:5000/api/users/years", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            fetch("http://localhost:5000/api/users/levels", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
        ]);
        const [deptData, yearData, levelData] = await Promise.all([
            deptRes.json(),
            yearRes.json(),
            levelRes.json()
        ]);
        setDepartments(deptData.departments);
        setYears(yearData.years);
        setLevels(levelData.levels);
    };


    const filterStudents = () => {
        console.log("🧪 Filtering...", students);
        const keyword = filter.keyword.toLowerCase();

        const filteredList = students.filter((s) => {
            const matchDept = !filter.department || String(s.department_id) === filter.department;
            const matchLevel = !filter.level || String(s.level_id) === filter.level;
            const matchYear = filter.allYears || String(s.year_id) === filter.year;
            const matchKeyword =
                s.first_name.toLowerCase().includes(keyword) ||
                s.last_name.toLowerCase().includes(keyword) ||
                s.student_id.includes(keyword);

            return matchDept && matchLevel && matchYear && matchKeyword;
        });

        setFiltered(filteredList);
        console.log("Filter =", filter);
    };



    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    // ✅ ฟังก์ชันนี้จะเลือกหรือยกเลิกการเลือกผู้ใช้ทั้งหมดที่ตรงกับเงื่อนไขการกรอง
    const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]); // ยกเลิกทั้งหมด
        } else {
            setSelectedIds(filtered.map(s => s.user_id)); // เลือกทั้งหมด
        }
    };

    ///////////////////////////////////////////////////////////
    const handleAddSelected = async () => {
        if (selectedIds.length === 0) {
            // toast.error("กรุณาเลือกนักศึกษาก่อนเพิ่ม");
            // Swal.fire("กรุณาเลือกนักศึกษาก่อนเพิ่ม");
            Swal.fire({
                title: "กรุณาเลือกนักศึกษาก่อนเพิ่ม?",
                icon: "warning",
                confirmButtonText: "ตกลง"
            });
            return;
        }

        if (selectedIds.length > 100) {
            toast.error("กรุณาเลือกไม่เกิน 100 คน");
            return;
        }

        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการเพิ่มสิทธิ์ที่เลือก?");
        if (!confirm) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:5000/api/elections/${id}/eligibility/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_ids: selectedIds })
            });

            const data = await res.json();

            if (data.success) {
                alert(data.message);
                setSelectedIds([]);
                fetchStudents();
            } else if (data.alreadyExists) {
                toast.error("นักศึกษาที่เลือกมีสิทธิ์ในรายการนี้อยู่แล้ว");
            } else {
                alert("เกิดข้อผิดพลาดในการเพิ่มสิทธิ์");
            }

        } catch (err) {
            console.error("❌ fetch error:", err);
            alert("เชื่อมต่อไม่ได้");
        }
    };
    
    const handleAddAll = async () => {
        const token = localStorage.getItem("token");

        // ✅ ถามก่อนว่าต้องการเพิ่มทุกคนหรือไม่ (โดยไม่รู้จำนวนล่วงหน้า)
        // const confirmAdd = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการเพิ่มสิทธิ์ให้กับนักเรียนทั้งหมด?");
        // if (!confirmAdd) return;

        const confirm = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "ต้องการเพิ่มสิทธิ์ให้นักเรียนทั้งหมดในรายการนี้",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยันเพิ่ม",
            cancelButtonText: "ยกเลิก"
        });

        if (!confirm.isConfirmed) return;
        try {
            // ✅ ค่อยยิง API เมื่อยืนยันแล้ว
            const res = await fetch(`http://localhost:5000/api/elections/${id}/eligibility/add-all`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!data.success) {
                Swal.fire("❌ เพิ่มไม่สำเร็จ: " + (data.message || "เกิดข้อผิดพลาด"));
                return;
            }

            if (data.affectedRows === 0) {
                Swal.fire("📌 นักเรียนทั้งหมดมีสิทธิ์ในรายการนี้แล้ว");
                return;
            }

            Swal.fire(`✅ เพิ่มผู้มีสิทธิ์ทั้งหมดแล้ว \n จำนวน: ${data.affectedRows} คน \n(บางคนมีสิทธิ์อยู่แล้ว)`);
            toast.success("เพิ่มสำเร็จ");

            fetchStudents(); // รีโหลด
        } catch (err) {
            console.error("❌ add-all error:", err);
            Swal.fire("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
        }
    };


    const handleRemove = async (user_id) => {
        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสิทธิ์ที่เลือก?");
        if (!confirm) return;

        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/elections/${id}/eligibility-delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id })
        });
        setSelectedIds(prev => prev.filter(id => id !== user_id));
        setStudents(prev => prev.filter(s => s.user_id !== user_id));
        console.log("🧾 ลบผู้มีสิทธิ์:", user_id);
    };

    const handleRemoveSelected = async () => {
        if (!onlyEligible) {
            alert("กรุณาแสดงเฉพาะผู้มีสิทธิ์ก่อนลบ");
            return;
        }

        if (selectedIds.length === 0) {
            alert("กรุณาเลือกผู้มีสิทธิ์ที่ต้องการลบ");
            return;
        }

        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสิทธิ์ที่เลือก?");
        if (!confirm) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:5000/api/elections/${id}/eligibility/bulk-delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_ids: selectedIds })
            });
            console.log("🧾 Election ID", id);
            console.log("🧾 User IDs to delete", selectedIds);
            const data = await res.json();
            if (data.success) {
                alert("ลบผู้มีสิทธิ์เรียบร้อยแล้ว");
                setSelectedIds([]);
                fetchEligibleUsers(); // รีเฟรช
            } else {
                alert("ลบไม่สำเร็จ");
            }
        } catch (err) {
            console.error("❌ ลบสิทธิ์ error:", err);
        }
    };


    const fetchEligibleUsers = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/elections/${id}/eligible-users`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStudents(data.users);
    };

    const toggleOnlyEligible = async () => {
        const checked = !onlyEligible;
        setOnlyEligible(checked);
        if (checked) {
            await fetchEligibleUsers();
        } else {
            await fetchStudents();
        }
    };

    return (

        <>
            <Header studentName={studentName} />
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-xl font-bold mb-4">จัดการผู้มีสิทธิ์ลงคะแนน</h1>

                {/* แถวบน */}
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <select value={limit} onChange={e => setLimit(parseInt(e.target.value))} className="border p-2 rounded bg-white">
                        {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} แถว</option>)}
                    </select>

                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ / รหัสนักศึกษา"
                        value={filter.keyword}
                        onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
                        className="border p-2 rounded bg-white flex-1"
                    />

                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={onlyEligible} onChange={toggleOnlyEligible} />
                        แสดงเฉพาะผู้มีสิทธิ์ในรายการนี้
                    </label>

                    <div className="ml-auto flex gap-2">
                        {/* <button onClick={selectAllFiltered} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">เลือกทั้งหมด</button> */}
                        <button onClick={handleAddAll}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            + เพิ่มผู้มีสิทธิ์ทั้งหมด</button>
                    </div>
                </div>

                {/* แถวล่าง */}
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                    <select
                        value={filter.level}
                        onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value, allYears: true }))}
                        className="..."
                    >
                        <option value="">เลือกระดับชั้น</option>
                        {levels.map((l) => (
                            <option key={l.level_id} value={l.level_id}>{l.level_name}</option>
                        ))}
                    </select>


                    <select value={filter.year} onChange={e => setFilter(f => ({ ...f, year: e.target.value }))} disabled={filter.allYears}
                        className="border p-2 rounded bg-white">
                        <option value="">เลือกชั้นปี</option>
                        {years.filter(y => !filter.level || y.level_id === parseInt(filter.level))
                            .map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                    </select>

                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={filter.allYears} onChange={e => setFilter(f => ({ ...f, allYears: e.target.checked }))} />
                        ทุกชั้นปี
                    </label>

                    <select value={filter.department} onChange={e => setFilter(f => ({ ...f, department: e.target.value }))}
                        className="border p-2 rounded bg-white">
                        <option value="">เลือกแผนก</option>
                        {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                    </select>

                    <div className="ml-auto flex gap-2">
                        <button onClick={toggleSelectAll}
                            className={`bg-${allSelected ? 'red' : 'blue'}-500 text-white px-4 py-2 rounded hover:bg-${allSelected ? 'red' : 'blue'}-600`}>
                            {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                        </button>
                        <button onClick={handleAddSelected} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">เพิ่มผู้มีสิทธิ์</button>
                        <button onClick={handleRemoveSelected} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">ลบผู้มีสิทธิ์ที่เลือก</button>
                    </div>
                </div>

                {/* ตารางคงเดิม */}
                {/* <table className="min-w-full bg-white border border-gray-300 text-sm"> */}
                <table className="min-w-full bg-white border border-gray-300 text-sm text-center">

                    <thead className="bg-gray-200">
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
                            filtered.map((u) => (
                                <tr key={u.user_id} className="border-t">
                                    <td className="p-2 text-center">

                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(u.user_id)}
                                            onChange={() => toggleSelect(u.user_id)}
                                        />
                                    </td>
                                    <td className="p-2">{u.student_id}</td>
                                    <td className="p-2">{u.first_name} {u.last_name}</td>
                                    <td className="p-2">{u.department_name}</td>
                                    <td className="p-2">{u.year_name}</td>
                                    <td className="p-2 text-center align-middle">
                                        <button
                                            onClick={() => handleRemove(u.user_id)}
                                            title={onlyEligible ? "" : "กรุณาแสดงเฉพาะผู้มีสิทธิ์ก่อนจึงจะลบได้"}
                                            disabled={!onlyEligible}
                                            className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded ${onlyEligible
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                }`}
                                        >
                                            <FaTrash size={12} /> ลบ
                                        </button>
                                    </td>



                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
