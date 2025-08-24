export default function UserEditModal({
  editForm, setEditForm,
  departments, educationLevels, years,
  onSubmit, onCancel,
  handleEditRoleChange
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
        <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
          แก้ไขข้อมูลผู้ใช้
        </h2>
        <form className="grid grid-cols-2 gap-4">
          <label htmlFor="รหัสนักศึกษา/ชื่อผู้ใช้งาน" className="text-sm font-medium text-gray-700">รหัสนักศึกษา/ชื่อผู้ใช้งาน
            <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="student_id"
              value={editForm.student_id || ''} onChange={e =>
                setEditForm(prev => ({ ...prev, student_id: e.target.value }))}
              placeholder="รหัสนักศึกษา" />
          </label>

          <label htmlFor="รหัสผ่าน" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน
            <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="password" type="p assword"
              value={editForm.password || ''} onChange={e =>
                setEditForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="รหัสผ่าน (ใหม่ ถ้าไม่เปลี่ยนให้เว้น)" />
          </label>

          <label htmlFor="ชื่อ" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ
            <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="first_name"
              value={editForm.first_name || ''} onChange={e =>
                setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="ชื่อ" />
          </label>

          <label htmlFor="นามสกุล" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล
            <input className="mt-1 border border-purple-300 p-2 rounded w-full"
              name="last_name"
              value={editForm.last_name || ''}
              onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="นามสกุล" />
          </label>

          <label htmlFor="อีเมล" className="block text-sm font-medium text-gray-700 mb-1">อีเมล
            <input className="mt-1 border border-purple-300 p-2 rounded w-full"
              name="email" type="email"
              value={editForm.email || ''}
              onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="อีเมล" />
          </label>

          <label htmlFor="แผนก" className="block text-sm font-medium text-gray-700 mb-1">แผนก
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.department_id || ''}
              onChange={e => setEditForm(prev => ({ ...prev, department_id: parseInt(e.target.value) }))}>
              <option value="">เลือกแผนก</option>
              {departments.map(d =>
                <option key={d.department_id}
                  value={d.department_id}>{d.department_name}</option>)}
            </select>
          </label>

          <label htmlFor="ระดับการศึกษา" className="block text-sm font-medium text-gray-700 mb-1">ระดับการศึกษา
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.level_id || ''}
              onChange={e => setEditForm(prev => ({ ...prev, level_id: parseInt(e.target.value) }))}>
              <option value="">เลือกระดับชั้น</option>
              {educationLevels.map(l =>
                <option key={l.level_id} value={l.level_id}>{l.level_name}</option>)}
            </select>
          </label>

          <label htmlFor="ปีที่" className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.year_id || ''}
                onChange={e => setEditForm(prev => ({ ...prev, year_id: parseInt(e.target.value) }))}>
                  <option value="">เลือกชั้นปี</option>
                    {years.filter(y => !editForm.level_id || y.level_id === parseInt(editForm.level_id)).map(y =>
                  <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
            </select>
          </label>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
            <div className="flex gap-4 flex-wrap">
              {[{ id: 1, label: "นักศึกษา" }, { id: 2, label: "ผู้สมัคร" }, { id: 3, label: "กรรมการ" }, { id: 4, label: "ผู้ดูแล" }].map(role => (
                <label key={role.id}>
                  <input
                    type="checkbox"
                    checked={editForm.roles?.includes(role.id)}
                    onChange={() => handleEditRoleChange(role.id)}
                  /> {role.label}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex justify-center gap-4 mt-4">
            <button type="button" onClick={onSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
              บันทึก
            </button>
            <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}