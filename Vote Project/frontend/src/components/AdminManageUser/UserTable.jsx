export default function UserTable({ users, rowsPerPage, onEdit, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-purple-200 text-left">
                    <tr>
                        <th className="p-2">บทบาท</th>
                        <th className="p-2">รหัสนักศึกษา</th>
                        <th className="p-2">ชื่อผู้ใช้งาน</th>
                        <th className="p-2">อีเมล</th>
                        <th className="p-2">แผนก</th>
                        <th className="p-2">ชั้นปี</th>
                        <th className="p-2 text-center">เมนูจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {users.slice(0, rowsPerPage).map((user, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2">{user.roles}</td>
                            <td className="p-2">{user.student_id}</td>
                            <td className="p-2">{user.first_name} {user.last_name}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">{user.department_name}</td>
                            <td className="p-2">{user.year_name}</td>
                            <td className="p-2 flex justify-center space-x-2">
                                <button onClick={() => onEdit(user)} className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">แก้ไข</button>
                                <button onClick={() => onDelete(user.user_id)} className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">ลบ</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
