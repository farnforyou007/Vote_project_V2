import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import Header from "../Header";
import { toast } from "react-toastify";

export default function StudentProfile() {
    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const [hasChanged, setHasChanged] = useState(false);

    const [form, setForm] = useState({
        student_id: '',
        first_name: '',
        last_name: '',
        email: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        department: '',
        year_level: '',
    });

    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [selectedRole, setSelectedRole] = useState(() => {
        return localStorage.getItem("selectedRole") || roles[0] || "";
    });

    const initialEmail = useRef(localStorage.getItem('email') || '');

    // useEffect(() => {
    //     setForm((prev) => ({
    //         ...prev,
    //         student_id: localStorage.getItem('student_id') || '',
    //         first_name: localStorage.getItem('first_name') || '',
    //         last_name: localStorage.getItem('last_name') || '',
    //         email: localStorage.getItem('email') || '',
    //         department: localStorage.getItem('department') || '',
    //         year_level: localStorage.getItem('year_level') || '',
    //     }));
    //     const emailChanged = form.email !== initialEmail.current;
    //     const passwordChanged = showPasswordFields && form.current_password && form.new_password;
    //     setHasChanged(emailChanged || passwordChanged);
    // }, [form.email, form.current_password, form.new_password, showPasswordFields]);

    useEffect(() => {
        setForm({
            student_id: localStorage.getItem('student_id') || '',
            first_name: localStorage.getItem('first_name') || '',
            last_name: localStorage.getItem('last_name') || '',
            email: localStorage.getItem('email') || '',
            department: localStorage.getItem('department') || '',
            year_level: localStorage.getItem('year_level') || '',
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
    }, []);
    useEffect(() => {
        const emailChanged = form.email !== initialEmail.current;
        const passwordChanged = showPasswordFields && form.current_password && form.new_password;
        setHasChanged(emailChanged || passwordChanged);
    }, [form.email, form.current_password, form.new_password, showPasswordFields]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const updated = { ...prev, [name]: value };

            const changed =
                updated.email !== localStorage.getItem('email') ||
                (showPasswordFields && updated.current_password && updated.new_password);

            setHasChanged(changed);
            return updated;
        });
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (showPasswordFields && form.new_password !== form.confirm_password) {
            return Swal.fire('ผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน', 'error');
        }
        // const hasChanged =
        //     form.email !== localStorage.getItem('email') ||
        //     (showPasswordFields && form.current_password && form.new_password) ||
        //     selectedRole !== roles[0];

        if (!hasChanged) {
            return Swal.fire('ไม่มีการเปลี่ยนแปลง', 'คุณยังไม่ได้แก้ไขข้อมูลใด ๆ', 'info');
        }
        // 🔒 ขอความยืนยันก่อน
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: 'คุณต้องการแก้ไขข้อมูลส่วนตัวของคุณ',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (!result.isConfirmed) return;

        // ✅ ส่งข้อมูลจริง
        const token = localStorage.getItem('token');
        const payload = { email: form.email };
        if (showPasswordFields && form.current_password && form.new_password) {
            payload.current_password = form.current_password;
            payload.new_password = form.new_password;
        }

        const res = await fetch(`http://localhost:5000/api/users/update-email-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
            // 🎉 แจ้งว่าอัปเดตสำเร็จหลังจากยืนยัน
            await Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
            localStorage.setItem('email', form.email);

            localStorage.setItem("selectedRole", selectedRole);
            setForm((prev) => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
            setShowPasswordFields(false);
        } else {
            Swal.fire('ผิดพลาด', data.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };


    return (
        <>
            <Header studentName={studentName} />
            <div className="min-h-screen bg-purple-100 py-10">
                <div className="max-w-2xl mx-auto bg-sky-50 shadow-xl rounded-lg p-8">
                    <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">โปรไฟล์ผู้ใช้งาน</h2>

                    {roles.length > 1 ? (
                        <div className="mb-4">
                            <label className="block font-medium mb-1">บทบาทของคุณ:</label>
                            <select
                                value={selectedRole}
                                // onChange={(e) => {
                                //     setSelectedRole(e.target.value);
                                //     // localStorage.setItem("selectedRole", e.target.value);
                                //     // window.dispatchEvent(new Event("role-changed")); // 🔔 แจ้งให้ Header รู้
                                // }
                                onChange={(e) => {
                                    const newRole = e.target.value;
                                    setSelectedRole(newRole);
                                    localStorage.setItem("selectedRole", newRole);
                                    window.dispatchEvent(new Event("role-changed")); // แจ้ง Header
                                    toast.success(`เปลี่ยนบทบาทเป็น "${newRole}" แล้ว`);
                                }}



                                className="w-full border p-2 rounded"
                            >
                                {roles.map((r, i) => (
                                    <option key={i} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <label className="block font-medium mb-1">บทบาทของคุณ:</label>
                            <input value={roles[0]} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-medium">รหัสนักศึกษา / ชื่อผู้ใช้งาน</label>
                            <input value={form.student_id} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium">ชื่อ</label>
                                <input value={form.first_name} readOnly className="w-full bg-gray-100 p-2 rounded" />
                            </div>
                            <div>
                                <label className="block font-medium">นามสกุล</label>
                                <input value={form.last_name} readOnly className="w-full bg-gray-100 p-2 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium">แผนก</label>
                                <input value={form.department} readOnly className="w-full bg-gray-100 p-2 rounded" />
                            </div>
                            <div>
                                <label className="block font-medium">ชั้นปี</label>
                                <input value={form.year_level} readOnly className="w-full bg-gray-100 p-2 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="block font-medium">อีเมล</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>

                        {!showPasswordFields ? (
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:underline"
                                onClick={() => setShowPasswordFields(true)}
                            >
                                ✏️ เปลี่ยนรหัสผ่าน
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium">รหัสผ่านเดิม</label>
                                    <input
                                        name="current_password"
                                        type="password"
                                        value={form.current_password}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">รหัสผ่านใหม่</label>
                                    <input
                                        name="new_password"
                                        type="password"
                                        value={form.new_password}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium">ยืนยันรหัสผ่านใหม่</label>
                                    <input
                                        name="confirm_password"
                                        type="password"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 mt-6">
                            {hasChanged && (
                                <div className="flex justify-center gap-4 mt-6">
                                    <button
                                        type="submit"
                                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                                    >
                                        บันทึกการเปลี่ยนแปลง
                                    </button>
                                </div>
                            )}

                        </div>
                    </form>
                </div>
            </div >
        </>
    );
}
