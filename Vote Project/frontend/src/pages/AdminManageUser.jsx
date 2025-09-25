// // src/pages/AdminManageUsers.jsx
// src/pages/AdminManageUsers.jsx
import { useEffect, useState, useMemo } from 'react';
import Header from "../components/Header";
import UserFilterBar from "../components/AdminManageUser/UserFilterBar";
import UserTable from "../components/AdminManageUser/UserTable";
import UserFormModal from "../components/AdminManageUser/UserFormModal";
import UserEditModal from "../components/AdminManageUser/UserEditModal";
import { apiFetch } from "../utils/apiFetch";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export default function AdminManageUsers() {
    // โปรไฟล์/สิทธิ์
    const [me, setMe] = useState(null);
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

    // โหลดโปรไฟล์/สิทธิ์
    const loadMe = async () => {
        const meRes = await apiFetch("/api/users/me");
        if (meRes?.success) {
            setMe(meRes.user);
            setRoles(meRes.user.roles || []);
        }
        setLoadingMe(false);
    };

    // โหลดลิสต์ผู้ใช้ตามตัวกรอง
    const fetchUsers = async () => {
        try {
            const query = [];
            if (selectedDept) query.push(`department_id=${selectedDept}`);
            if (selectedYear) query.push(`year_id=${selectedYear}`);
            if (selectedLevel) query.push(`level_id=${selectedLevel}`);
            query.push(`limit=${rowsPerPage}`);
            query.push(`page=${page}`);
            if (search) query.push(`q=${encodeURIComponent(search)}`);
            const qs = query.length ? `?${query.join("&")}` : "";

            const data = await apiFetch(`/api/users/filtered-users${qs}`);
            if (!data) return; // 401 → apiFetch จัดการแล้ว
            if (data.success)
                setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('โหลด users ผิดพลาด:', err);
        }
    };

    // โหลดตัวเลือก แผนก/ปี/ระดับ
    const loadLookups = async () => {
        const [d, y, l] = await Promise.all([
            apiFetch("/api/users/departments"),
            apiFetch("/api/users/years"),
            apiFetch("/api/users/levels"),
        ]);
        setDepartments(d?.departments || []);
        setYears(y?.years || []);
        setEducationLevels(l?.levels || []);
    };

    useEffect(() => {
        (async () => {
            await Promise.all([loadMe(), loadLookups()]);
            await fetchUsers();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDept, selectedYear, selectedLevel, page, rowsPerPage, search]);


    // จัดการ roles ในฟอร์ม
    const handleRoleChange = (roleId) => {
        const newRoles = formData.roles.includes(roleId)
            ? formData.roles.filter(id => id !== roleId)
            : [...formData.roles, roleId];
        setFormData({ ...formData, roles: newRoles });
    };
    const handleEditRoleChange = (roleId) => {
        const current = editForm.roles || [];
        const newRoles = current.includes(roleId)
            ? current.filter(id => id !== roleId)
            : [...current, roleId];
        setEditForm({ ...editForm, roles: newRoles });
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
                Swal.fire({
                    icon: "error",
                    title: "เพิ่มผู้ใช้ไม่สำเร็จ",
                    text: data?.message || "กรุณาลองใหม่อีกครั้ง",
                });
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
        setEditForm({
            ...user,
            roles: user.roles_array?.split(',').map(Number) || [],
            department_id: user.department_id || '',
            year_id: user.year_id || '',
            level_id: user.level_id || '',
        });
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
                alert("เกิดข้อผิดพลาด: " + (data?.message || ""));
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

    // filter ชื่อและรหัส
    // const filteredUsers = users.filter(user => {
    //     const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    //     return (
    //         fullName.includes(search.toLowerCase()) ||
    //         (user.student_id || "").toLowerCase().includes(search.toLowerCase())
    //     );
    // });

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
        if (nextLevel && nextLevel !== String(selectedLevel)) {
            setSelectedLevel(nextLevel);     // ⬅️ อัปเดตระดับให้ตรงกับชั้นปีที่เลือก
        }

        setPage(1);                        // รีเซ็ตหน้าให้เติมเต็มก่อน
    };

    // ปีที่แสดงต้องกรองตาม level ที่เลือก (dependent dropdown เดิม)
    const yearsOptions = useMemo(
        () => years.filter(y => !selectedLevel || String(y.level_id) === String(selectedLevel)),
        [years, selectedLevel]
    );


    // กันกระพริบสิทธิ์: รอโหลดโปรไฟล์ก่อน
    // if (loadingMe) {
    //     return <div className="p-10 text-center text-gray-600">กำลังตรวจสอบสิทธิ์...</div>;
    // }
    // if (!roles.includes("ผู้ดูแล")) {
    //     return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
    // }

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
            {/* Header โหลด /me เองแล้ว ไม่ต้องส่ง studentName */}
            <div className="min-h-screen flex flex-col bg-purple-100">
                <Header />

                {/* main จะกินพื้นที่ที่เหลือ และค่อยมีสกอลล์เมื่อ “ล้นจริง” */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 py-6">
                        <h1 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                        {/* Filter Bar: บนจอเล็กวางแนวตั้ง, จอใหญ่เป็นแถว */}
                        <div className="mb-4">
                            {/* <UserFilterBar
                                search={search} setSearch={setSearch} */}
                            <UserFilterBar
                                search={search}
                                setSearch={(v) => { setSearch(v); setPage(1); }}
                                selectedDept={selectedDept} setSelectedDept={(d) => { setSelectedDept(d); setPage(1); }}
                                // selectedYear={selectedYear} setSelectedYear={(y) => { setSelectedYear(y); setPage(1); }}
                                // selectedLevel={selectedLevel} setSelectedLevel={(l) => { setSelectedLevel(l); setPage(1); }}
                                // rowsPerPage={rowsPerPage} setRowsPerPage={(n) => { setRowsPerPage(n); setPage(1); }}
                                // departments={departments} years={years} levels={educationLevels}
                                selectedYear={selectedYear} setSelectedYear={handleYearChange}   // ← ใช้ handler ที่ map ปี -> ระดับ
                                selectedLevel={selectedLevel} setSelectedLevel={(l) => { setSelectedLevel(l); setSelectedYear(''); setPage(1); }}
                                rowsPerPage={rowsPerPage} setRowsPerPage={(n) => { setRowsPerPage(n); setPage(1); }}
                                departments={departments} years={yearsOptions} levels={educationLevels}  // ← ส่งปีที่กรองแล้ว
                                onAddUserClick={() => setShowAddForm(true)}
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
                    existingUsers={users}
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
                />
            )}



        </>
    );
}




// ver1
// import { useEffect, useState } from 'react';
// import Header from "../components/Header";
// import UserFilterBar from "../components/AdminManageUser/UserFilterBar";
// import UserTable from "../components/AdminManageUser/UserTable";
// import UserFormModal from "../components/AdminManageUser/UserFormModal";
// import UserEditModal from "../components/AdminManageUser/UserEditModal";
// import { apiFetch } from "../utils/apiFetch";

// export default function AdminManageUsers() {
//     const [users, setUsers] = useState([]);
//     const [departments, setDepartments] = useState([]);
//     const [years, setYears] = useState([]);
//     const [educationLevels, setEducationLevels] = useState([]);
//     const [selectedDept, setSelectedDept] = useState('');
//     const [selectedYear, setSelectedYear] = useState('');
//     const [selectedLevel, setSelectedLevel] = useState('');
//     const [search, setSearch] = useState('');
//     const [rowsPerPage, setRowsPerPage] = useState(10);
//     const [showAddForm, setShowAddForm] = useState(false);
//     const [editingUserId, setEditingUserId] = useState(null);
//     const [formData, setFormData] = useState({
//         student_id: '', password: '', first_name: '', last_name: '',
//         email: '', department_id: '', level_id: '', year_id: '', roles: []
//     });
//     const [editForm, setEditForm] = useState({});
//     // const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
//     // const studentName = localStorage.getItem("studentName") || "";
//     const [me, setMe] = useState(null);
//     const [roles, setRoles] = useState([]);
//     const [loadingMe, setLoadingMe] = useState(true);


//     const loadMe = async () => {
//         const meRes = await apiFetch(`/api/users/me`);
//         if (meRes?.success) {
//             setMe(meRes.user);
//             setRoles(meRes.user.roles || []);
//         }
//         setLoadingMe(false);
//     };

//     const handleRoleChange = (roleId) => {
//         const newRoles = formData.roles.includes(roleId)
//             ? formData.roles.filter(id => id !== roleId)
//             : [...formData.roles, roleId];
//         setFormData({ ...formData, roles: newRoles });
//     };
//     const handleEditRoleChange = (roleId) => {
//         const newRoles = editForm.roles.includes(roleId)
//             ? editForm.roles.filter(id => id !== roleId)
//             : [...editForm.roles, roleId];
//         setEditForm({ ...editForm, roles: newRoles });
//     };

//     const fetchUsers = async () => {
//         try {
//             const query = [];
//             if (selectedDept) query.push(`department_id=${selectedDept}`);
//             if (selectedYear) query.push(`year_id=${selectedYear}`);
//             if (selectedLevel) query.push(`level_id=${selectedLevel}`);
//             // const token = localStorage.getItem("token");
//             const data = await apiFetch(`http://localhost:5000/api/users/filtered-users?${query.join('&')}`, {
//                 headers: { "Content-Type": "application/json" },
//             });
//             // const data = await res.json();
//             if (!data) return;
//             if (data.success) setUsers(data.users);
//         } catch (err) {
//             console.error('โหลด users ผิดพลาด:', err);
//         }
//     };

//     // useEffect(() => {
//     //     fetchUsers();
//     // }, [selectedDept, selectedYear, selectedLevel]);

//     // useEffect(() => {
//     //     const token = localStorage.getItem("token");
//     //     fetch('http://localhost:5000/api/users/departments', { headers: { Authorization: `Bearer ${token}` } })
//     //         .then(res => res.json()).then(data => setDepartments(data.departments || []));
//     //     fetch('http://localhost:5000/api/users/years', { headers: { Authorization: `Bearer ${token}` } })
//     //         .then(res => res.json()).then(data => setYears(data.years || []));
//     //     fetch('http://localhost:5000/api/users/levels', { headers: { Authorization: `Bearer ${token}` } })
//     //         .then(res => res.json()).then(data => setEducationLevels(data.levels || []));
//     // }, []);

//     const loadLookups = async () => {
//         const [d, y, l] = await Promise.all([
//             apiFetch(`/api/users/departments`),
//             apiFetch(`/api/users/years`),
//             apiFetch(`/api/users/levels`),
//         ]);
//         setDepartments(d?.departments || []);
//         setYears(y?.years || []);
//         setEducationLevels(l?.levels || []);
//     };
//     const handleAddUser = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch('http://localhost:5000/api/users/add', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(formData)
//             });
//             const data = await res.json();
//             if (data.success) {
//                 alert('เพิ่มผู้ใช้สำเร็จ');
//                 setShowAddForm(false);
//                 setFormData({ student_id: '', password: '', first_name: '', last_name: '', email: '', department_id: '', level_id: '', year_id: '', roles: [] });
//                 fetchUsers();
//             } else alert(data.message || 'เกิดข้อผิดพลาด');
//         } catch (err) {
//             console.error('เพิ่มผู้ใช้ผิดพลาด:', err);
//             alert('Server error');
//         }
//     };

//     const handleEditClick = (user) => {
//         setEditingUserId(user.user_id);
//         setEditForm({ ...user, roles: user.roles_array?.split(',').map(Number) || [], department_id: user.department_id || '', year_id: user.year_id || '', level_id: user.level_id || '' });
//     };

//     const handleUpdateUser = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:5000/api/users/update/${editingUserId}`, {
//                 method: "PUT",
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(editForm)
//             });
//             const data = await res.json();
//             if (data.success) {
//                 alert("อัปเดตสำเร็จ");
//                 setEditingUserId(null);
//                 fetchUsers();
//             } else alert("เกิดข้อผิดพลาด: " + data.message);
//         } catch (err) {
//             console.error(err);
//             alert("Server Error");
//         }
//     };

//     const handleDeleteUser = async (userId) => {
//         if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?")) return;
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`http://localhost:5000/api/users/delete/${userId}`, {
//                 method: "DELETE",
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
//             });
//             const data = await res.json();
//             if (data.success) {
//                 alert("ลบสำเร็จ");
//                 fetchUsers();
//             } else alert("ลบไม่สำเร็จ");
//         } catch (err) {
//             console.error(err);
//             alert("Server Error");
//         }
//     };

//     const filteredUsers = users.filter(user => {
//         const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
//         return fullName.includes(search.toLowerCase()) || user.student_id.toLowerCase().includes(search.toLowerCase());
//     });
//     useEffect(() => {
//         (async () => {
//             await Promise.all([
//                 loadMe(),
//                 fetchUsers(),
//                 loadLookups(),
//             ]);
//         })();
//     }, [selectedDept, selectedYear, selectedLevel]);

//     // if (!roles.includes("ผู้ดูแล")) {
//     //     return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
//     // }
//     if (loadingMe) {
//         return <p className="p-10 text-center text-gray-600">กำลังตรวจสอบสิทธิ์...</p>;
//     }
//     if (!roles.includes("ผู้ดูแล")) {
//         return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
//     }
//     return (
//         <>
//             {/* <Header studentName={studentName} /> */}
//             <Header />
//             <div className="p-6 bg-gray-100 min-h-screen">
//                 <h1 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

//                 <UserFilterBar
//                     search={search} setSearch={setSearch}
//                     selectedDept={selectedDept} setSelectedDept={setSelectedDept}
//                     selectedYear={selectedYear} setSelectedYear={setSelectedYear}
//                     selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel}
//                     rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
//                     departments={departments} years={years} levels={educationLevels}
//                     onAddUserClick={() => setShowAddForm(true)}
//                 />

//                 <UserTable
//                     users={filteredUsers}
//                     rowsPerPage={rowsPerPage}
//                     onEdit={handleEditClick}
//                     onDelete={handleDeleteUser}
//                 />
//             </div>

//             {showAddForm && (
//                 <UserFormModal
//                     formData={formData}
//                     setFormData={setFormData}
//                     departments={departments}
//                     educationLevels={educationLevels}
//                     years={years}
//                     onSubmit={handleAddUser}
//                     onCancel={() => setShowAddForm(false)}
//                     handleRoleChange={handleRoleChange}
//                 />
//             )}

//             {editingUserId && (
//                 <UserEditModal
//                     editForm={editForm}
//                     setEditForm={setEditForm}
//                     departments={departments}
//                     educationLevels={educationLevels}
//                     years={years}
//                     onSubmit={handleUpdateUser}
//                     onCancel={() => setEditingUserId(null)}
//                     handleEditRoleChange={handleEditRoleChange}
//                 />
//             )}
//         </>
//     );
// }
