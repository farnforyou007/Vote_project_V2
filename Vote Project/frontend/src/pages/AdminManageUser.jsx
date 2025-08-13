// src/pages/AdminManageUsers.jsx
import { useEffect, useState } from 'react';
import Header from "../components/Header";
import UserFilterBar from "../components/AdminManageUser/UserFilterBar";
import UserTable from "../components/AdminManageUser/UserTable";
import UserFormModal from "../components/AdminManageUser/UserFormModal";
import UserEditModal from "../components/AdminManageUser/UserEditModal";
import { apiFetch } from "../utils/apiFetch";

export default function AdminManageUsers() {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [educationLevels, setEducationLevels] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [formData, setFormData] = useState({
        student_id: '', password: '', first_name: '', last_name: '',
        email: '', department_id: '', level_id: '', year_id: '', roles: []
    });
    const [editForm, setEditForm] = useState({});
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const studentName = localStorage.getItem("studentName") || "";

    const handleRoleChange = (roleId) => {
        const newRoles = formData.roles.includes(roleId)
            ? formData.roles.filter(id => id !== roleId)
            : [...formData.roles, roleId];
        setFormData({ ...formData, roles: newRoles });
    };
    const handleEditRoleChange = (roleId) => {
        const newRoles = editForm.roles.includes(roleId)
            ? editForm.roles.filter(id => id !== roleId)
            : [...editForm.roles, roleId];
        setEditForm({ ...editForm, roles: newRoles });
    };

    const fetchUsers = async () => {
        try {
            const query = [];
            if (selectedDept) query.push(`department_id=${selectedDept}`);
            if (selectedYear) query.push(`year_id=${selectedYear}`);
            if (selectedLevel) query.push(`level_id=${selectedLevel}`);
            const token = localStorage.getItem("token");
            const data = await apiFetch(`http://localhost:5000/api/users/filtered-users?${query.join('&')}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            // const data = await res.json();
            if(!data) return;
            if (data.success) setUsers(data.users);
        } catch (err) {
            console.error('โหลด users ผิดพลาด:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [selectedDept, selectedYear, selectedLevel]);
    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch('http://localhost:5000/api/users/departments', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setDepartments(data.departments || []));
        fetch('http://localhost:5000/api/users/years', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setYears(data.years || []));
        fetch('http://localhost:5000/api/users/levels', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setEducationLevels(data.levels || []));
    }, []);

    const handleAddUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:5000/api/users/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert('เพิ่มผู้ใช้สำเร็จ');
                setShowAddForm(false);
                setFormData({ student_id: '', password: '', first_name: '', last_name: '', email: '', department_id: '', level_id: '', year_id: '', roles: [] });
                fetchUsers();
            } else alert(data.message || 'เกิดข้อผิดพลาด');
        } catch (err) {
            console.error('เพิ่มผู้ใช้ผิดพลาด:', err);
            alert('Server error');
        }
    };

    const handleEditClick = (user) => {
        setEditingUserId(user.user_id);
        setEditForm({ ...user, roles: user.roles_array?.split(',').map(Number) || [], department_id: user.department_id || '', year_id: user.year_id || '', level_id: user.level_id || '' });
    };

    const handleUpdateUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/users/update/${editingUserId}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                alert("อัปเดตสำเร็จ");
                setEditingUserId(null);
                fetchUsers();
            } else alert("เกิดข้อผิดพลาด: " + data.message);
        } catch (err) {
            console.error(err);
            alert("Server Error");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/users/delete/${userId}`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert("ลบสำเร็จ");
                fetchUsers();
            } else alert("ลบไม่สำเร็จ");
        } catch (err) {
            console.error(err);
            alert("Server Error");
        }
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) || user.student_id.toLowerCase().includes(search.toLowerCase());
    });

    if (!roles.includes("ผู้ดูแล")) {
        return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
    }

    return (
        <>
            <Header studentName={studentName} />
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                <UserFilterBar
                    search={search} setSearch={setSearch}
                    selectedDept={selectedDept} setSelectedDept={setSelectedDept}
                    selectedYear={selectedYear} setSelectedYear={setSelectedYear}
                    selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel}
                    rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
                    departments={departments} years={years} levels={educationLevels}
                    onAddUserClick={() => setShowAddForm(true)}
                />

                <UserTable
                    users={filteredUsers}
                    rowsPerPage={rowsPerPage}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteUser}
                />
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
