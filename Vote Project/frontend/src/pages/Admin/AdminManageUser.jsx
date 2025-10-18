// // src/pages/AdminManageUsers.jsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Header } from "components";
import {
    UserFilterBar,
    UserTable,
    UserFormModal,
    UserEditModal,
} from "components/AdminManageUser";
import { apiFetch } from "utils/apiFetch";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export default function AdminManageUsers() {
    // โปรไฟล์/สิทธิ์
    const [roles, setRoles] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    // ข้อมูลผู้ใช้/ตัวกรอง
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [educationLevels, setEducationLevels] = useState([]);

    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);  // limit
    const [totalPages, setTotalPages] = useState(1);

    const [formErrors, setFormErrors] = useState({});
    // ฟอร์มเพิ่ม/แก้ไข
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const [formData, setFormData] = useState({
        student_id: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        department_id: '',
        level_id: '',
        year_id: '',
        roles: []
    });
    const [editForm, setEditForm] = useState({});
    const [editFormErrors, setEditFormErrors] = useState({});

    // โหลดโปรไฟล์/สิทธิ์
    const loadMe = async () => {
        const meRes = await apiFetch("/api/users/me");
        if (meRes?.success) {
            setRoles(meRes.user.roles || []);
        }
        setLoadingMe(false);
    };

    // โหลดลิสต์ผู้ใช้ตามตัวกรอง
    const fetchUsers = useCallback(async () => {
        try {
            const query = [];
            if (selectedDept) query.push(`department_id=${selectedDept}`);
            if (selectedYear) query.push(`year_id=${selectedYear}`);
            if (selectedLevel) query.push(`level_id=${selectedLevel}`);
            query.push(`limit=${rowsPerPage}`);
            query.push(`page=${page}`);
            if (search) query.push(`search=${encodeURIComponent(search)}`);
            const qs = query.length ? `?${query.join("&")}` : "";

            const data = await apiFetch(`/api/users/filtered-users${qs}`);
            if (!data) return;
            if (data.success)
                setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("โหลด users ผิดพลาด:", err);
        }
    }, [selectedDept, selectedYear, selectedLevel, rowsPerPage, page, search]);

    // โหลดตัวเลือก แผนก/ปี/ระดับ
    const loadLookups = async () => {
        const results = await Promise.allSettled([
            apiFetch("/api/users/departments"), // d
            apiFetch("/api/users/years"),       // y   
            apiFetch("/api/users/levels"),      // l
        ]);
        const pick = i => results[i].status === "fulfilled" ? results[i].value : null;
        console.log('lookup results', results);
        console.log('pick', pick(0), pick(1), pick(2));
        const d = pick(0),
            y = pick(1),
            l = pick(2);
        setDepartments(d?.departments || []);
        setYears(y?.years || []);
        setEducationLevels(l?.levels || []);
    };

    useEffect(() => {
        (async () => {
            await Promise.all([loadMe(), loadLookups()]);
            await fetchUsers();
        })();
    }, [fetchUsers]);
    // console.log('users', users);

    const toggleRole = (roles, roleId) =>
        roles.includes(roleId)
            ? roles.filter(id => id !== roleId)
            : [...roles, roleId];

    const handleRoleChange = (roleId) => {
        setFormData({ ...formData, roles: toggleRole(formData.roles, roleId) });
    };

    const handleEditRoleChange = (roleId) => {
        setEditForm({ ...editForm, roles: toggleRole(editForm.roles || [], roleId) });
    };

    // เพิ่มผู้ใช้
    const handleAddUser = async () => {
        const confirm = await Swal.fire({
            title: "ยืนยันการเพิ่มผู้ใช้?",
            text: "โปรดตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "เพิ่มผู้ใช้",
            cancelButtonText: "ยกเลิก",
        });
        if (!confirm.isConfirmed) return;
        try {
            const data = await apiFetch('/api/users/add', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (data?.success) {
                toast.success('เพิ่มผู้ใช้สำเร็จ');

                setShowAddForm(false);
                setFormData({
                    student_id: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    email: '',
                    department_id: '',
                    level_id: '',
                    year_id: '',
                    roles: []
                });
                fetchUsers();
            } else {
                // ถ้า backend ส่ง status/409 = อีเมลซ้ำ
                if (data?.status === 409) {
                    const msg = String(data?.message || '');
                    const next = {};
                    if (/อีเมล/i.test(msg)) next.email = 'อีเมลนี้ถูกใช้งานแล้ว';
                    if (/รหัสนักศึกษา/i.test(msg) || /student/i.test(msg)) next.student_id = 'รหัสนักศึกษานี้ถูกใช้งานแล้ว';
                    if (Object.keys(next).length) {
                        setFormErrors(prev => ({ ...prev, ...next })); // ✅ ส่งลงไปโชว์ใต้ input
                        return;
                    }
                }
                Swal.fire({ icon: 'error', title: 'เพิ่มผู้ใช้ไม่สำเร็จ', text: data?.message || 'กรุณาลองใหม่อีกครั้ง' });
            }
        } catch (err) {
            console.error('เพิ่มผู้ใช้ผิดพลาด:', err);
            Swal.fire({
                icon: "error",
                title: "Server error",
                text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
            });
        }
    };

    // เริ่มแก้ไข
    const handleEditClick = (user) => {
        setEditingUserId(user.user_id);
        setEditFormErrors({});
        setEditForm({
            ...user,
            roles: user.roles_array?.split(',').map(Number) || [],
            department_id: user.department_id || '',
            year_id: user.year_id || '',
            level_id: user.level_id || '',
        });
        console.log('editForm', editForm);
        console.log('usertole : ', roles);
    };

    // อัปเดตผู้ใช้
    const handleUpdateUser = async () => {
        const confirm = await Swal.fire({
            title: "ยืนยันการแก้ไข ?",
            text: "คุณแน่ใจหรือไม่ว่าต้องการแก้ไขผู้ใช้",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
        });
        if (!confirm.isConfirmed) return;

        try {
            const data = await apiFetch(`/api/users/update/${editingUserId}`, {
                method: "PUT",
                body: JSON.stringify(editForm),
            });
            if (data?.success) {
                await Swal.fire("แก้ไขสำเร็จ!", "", "success");
                toast.success("แก้ไขข้อมูลเรียบร้อย");

                setEditingUserId(null);
                fetchUsers();
            } else {
                if (data?.status === 409) {
                    const msg = String(data?.message || '');
                    const next = {};
                    if (/อีเมล/i.test(msg)) next.email = 'อีเมลนี้ถูกใช้งานแล้ว';
                    if (/รหัสนักศึกษา/i.test(msg) || /student/i.test(msg)) next.student_id = 'รหัสนักศึกษานี้ถูกใช้งานแล้ว';
                    if (Object.keys(next).length) {
                        setEditFormErrors(prev => ({ ...prev, ...next }));   // ✅ ส่งลงโมดัลแก้ไข
                        return;
                    }
                }
                Swal.fire({ icon: 'error', title: 'แก้ไขไม่สำเร็จ', text: data?.message || 'กรุณาลองใหม่อีกครั้ง' });
            }
        } catch (err) {
            console.error(err);
            alert("Server Error");
        }
    };

    // ลบผู้ใช้
    const handleDeleteUser = async (userId) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบผู้ใช้?",
            text: "คุณไม่สามารถกู้คืนข้อมูลได้หลังจากลบ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก",
        });

        if (!confirm.isConfirmed) return;
        try {
            const data = await apiFetch(`/api/users/delete/${userId}`, {
                method: "DELETE",
            });
            if (data?.success) {
                await Swal.fire("ลบสำเร็จ!", "", "success");
                toast.success("ลบสำเร็จ");
                fetchUsers();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "ลบไม่สำเร็จ",
                    text: data?.message || "ลบไม่สำเร็จ",
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
            });
        }
    };

    // สร้างแผนที่ year_id -> level_id จากรายการปีที่มีอยู่
    const yearToLevel = useMemo(() => {
        const m = {};
        years.forEach(y => { m[String(y.year_id)] = String(y.level_id); });
        return m;
    }, [years]);

    // เมื่อเปลี่ยน 'ชั้นปี' ให้เซ็ต level ให้สอดคล้องอัตโนมัติ
    const handleYearChange = (yearId) => {
        setSelectedYear(yearId);
        if (!yearId) {
            setSelectedLevel(''); // เลือก "ค่าเริ่มต้น" ของชั้นปี → รีเซ็ตระดับ
        }
        const nextLevel = yearToLevel[String(yearId)] || '';

        if (nextLevel !== String(selectedLevel)) {
            setSelectedLevel(nextLevel);     // ⬅️ อัปเดตระดับให้ตรงกับชั้นปีที่เลือก
        }

        setPage(1);                        // รีเซ็ตหน้าให้เติมเต็มก่อน
    };

    // ปีที่แสดงต้องกรองตาม level ที่เลือก (dependent dropdown เดิม)
    const yearsOptions = useMemo(
        () => years.filter(y => !selectedLevel || String(y.level_id) === String(selectedLevel)),
        [years, selectedLevel]
    );
    const EMPTY_FORM = {
        student_id: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        department_id: "",
        level_id: "",
        year_id: "",
        roles: [],
    };

    const handleOpenAddUser = () => {
        setFormData(EMPTY_FORM);   // เคลียร์ก่อนเปิด
        setFormErrors({});
        setShowAddForm(true);      // เปิดโมดอลเพิ่ม
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

            <div className="min-h-screen flex flex-col bg-purple-100">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 py-6">
                        <h1 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                        <div className="mb-4">

                            <UserFilterBar
                                search={search}
                                setSearch={(v) => { setSearch(v); setPage(1); }}
                                selectedDept={selectedDept} setSelectedDept={(d) => { setSelectedDept(d); setPage(1); }}
                                selectedYear={selectedYear} setSelectedYear={handleYearChange}   // ← ใช้ handler ที่ map ปี -> ระดับ
                                selectedLevel={selectedLevel} setSelectedLevel={(l) => { setSelectedLevel(l); setSelectedYear(''); setPage(1); }}
                                rowsPerPage={rowsPerPage} setRowsPerPage={(n) => { setRowsPerPage(n); setPage(1); }}
                                departments={departments} years={yearsOptions} levels={educationLevels}  // ← ส่งปีที่กรองแล้ว
                                onAddUserClick={handleOpenAddUser}
                            />
                        </div>

                        {/* ตาราง: ห่อด้วย overflow-x-auto ป้องกันล้นแนวนอนบนมือถือ */}
                        <div className="overflow-x-auto bg-white rounded-xl shadow">
                            <UserTable
                                // users={filteredUsers}
                                // rowsPerPage={rowsPerPage}
                                users={users} rowsPerPage={rowsPerPage}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteUser}
                                page={page}
                            />
                        </div>

                        {/* Pagination ตรงกลางใต้ตาราง */}
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                ก่อนหน้า
                            </button>
                            <span>หน้า {page} / {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                </main>
            </div>


            {showAddForm && (
                <UserFormModal
                    formData={formData}
                    setFormData={setFormData}
                    departments={departments}
                    educationLevels={educationLevels}
                    years={years}
                    onSubmit={handleAddUser}
                    onCancel={() => setShowAddForm(false)}
                    handleRoleChange={handleRoleChange}
                    checkStudentid={users}
                    serverErrors={formErrors}
                />
            )}

            {editingUserId && (
                <UserEditModal
                    editForm={editForm}
                    setEditForm={setEditForm}
                    departments={departments}
                    educationLevels={educationLevels}
                    years={years}
                    onSubmit={handleUpdateUser}
                    onCancel={() => setEditingUserId(null)}
                    handleEditRoleChange={handleEditRoleChange}
                    serverErrors={editFormErrors}
                />
            )}



        </>
    );
}