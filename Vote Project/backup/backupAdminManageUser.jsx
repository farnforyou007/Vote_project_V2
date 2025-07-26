import { useEffect, useState } from 'react';
import Header from "./Header";
import { Link } from "react-router-dom";

export default function AdminManageUsers() {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showAddForm, setShowAddForm] = useState(false);


    const studentName = localStorage.getItem("studentName") || "ผู้ดูแล";

    const fetchUsers = async () => {
        try {
            const query = [];
            if (selectedDept) query.push(`department_id=${selectedDept}`);
            if (selectedYear) query.push(`year_id=${selectedYear}`);
            const res = await fetch(`http://localhost:5000/api/users/filtered-users?${query.join('&')}`);
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (err) {
            console.error('โหลด users ผิดพลาด:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [selectedDept, selectedYear]);

    useEffect(() => {
        fetch('http://localhost:5000/api/users/departments')
            .then(res => res.json())
            .then(data => setDepartments(data.departments || []));

        fetch('http://localhost:5000/api/users/years')
            .then(res => res.json())
            .then(data => setYears(data.years || []));
    }, []);

    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
            fullName.includes(search.toLowerCase()) ||
            user.student_id.toLowerCase().includes(search.toLowerCase())
        );
    });

    return (
        <>
            <Header studentName={studentName} />
            <div className="p-6 bg-gray-100 min-h-screen ">
                <h1 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h1>

                <div className="flex flex-wrap gap-4 mb-4 items-center">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                        className="border p-2 rounded bg-violet-50 border border-violet-300"
                    >
                        {[5, 10, 20, 50].map(n => (
                            <option key={n} value={n}>{n} แถว</option>
                        ))}
                    </select>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="border p-2 rounded bg-violet-50 border border-violet-300"
                    >
                        <option value="">เลือกแผนก</option>
                        {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="border p-2 rounded bg-violet-50 border border-violet-300"
                    >
                        <option value="">เลือกชั้นปี</option>
                        {years.map((y) => (
                            <option key={y.year_id} value={y.year_id}>{y.year_name}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหรือรหัส"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 rounded flex-1 bg-violet-50 border border-violet-300"
                    />

                    <button onClick={() => setShowAddForm(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        เพิ่มผู้ใช้งาน
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead className="bg-purple-300">
                            <tr>
                                <th className="p-2 text-left">บทบาท</th>
                                <th className="p-2 text-left">รหัสนักศึกษา</th>
                                <th className="p-2 text-left">ชื่อผู้ใช้งาน</th>
                                <th className="p-2 text-left">อีเมล</th>
                                <th className="p-2 text-left">แผนก</th>
                                <th className="p-2 text-left">ชั้นปี</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.slice(0, rowsPerPage).map((user, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="p-2">{user.roles}</td>
                                    <td className="p-2">{user.student_id}</td>
                                    <td className="p-2">{user.first_name} {user.last_name}</td>
                                    <td className="p-2">{user.email}</td>
                                    <td className="p-2">{user.department_name}</td>
                                    <td className="p-2">{user.year_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-purple-100 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
                        <h2 className="text-center text-xl font-bold text-purple-800 mb-4">เพิ่มผู้ใช้งาน</h2>
                        <form className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="ชื่อผู้ใช้" className="border border-purple-300 p-2 rounded" />
                            <input type="password" placeholder="รหัสผ่าน" className="border border-purple-300 p-2 rounded" />
                            <input type="text" placeholder="ชื่อ" className="border border-purple-300 p-2 rounded" />
                            <input type="text" placeholder="นามสกุล" className="border border-purple-300 p-2 rounded" />
                            <input type="text" placeholder="รหัสนักศึกษา" className="border border-purple-300 p-2 rounded" />
                            <input type="email" placeholder="อีเมล" className="border border-purple-300 p-2 rounded" />

                            <select className="border border-purple-300 p-2 rounded">
                                <option>เลือกแผนก</option>
                                {departments.map((d) => (
                                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <input type="text" placeholder="ระดับชั้น" className="w-1/2 border border-purple-300 p-2 rounded" />
                                <input type="number" placeholder="ปีที่" className="w-1/2 border border-purple-300 p-2 rounded" />
                            </div>

                            <div className="col-span-2 flex gap-4 items-center flex-wrap">
                                <label className="flex items-center gap-1">
                                    <input type="checkbox" /> นักศึกษา
                                </label>
                                <label className="flex items-center gap-1">
                                    <input type="checkbox" /> ผู้สมัคร
                                </label>
                                <label className="flex items-center gap-1">
                                    <input type="checkbox" /> กรรมการ
                                </label>
                                <label className="flex items-center gap-1">
                                    <input type="checkbox" /> ผู้ดูแล
                                </label>
                            </div>

                            <div className="col-span-2 flex justify-center gap-4 mt-4">
                                <button
                                    type="button"
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    ยืนยัน
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </>
    );
}
