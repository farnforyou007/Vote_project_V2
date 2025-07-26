export default function UserFormModal({
  formData, setFormData,
  departments, educationLevels, years,
  onSubmit, onCancel,
  handleRoleChange
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
        <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
          เพิ่มผู้ใช้งาน
        </h2>
        <form className="grid grid-cols-2 gap-4">
          <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="student_id" value={formData.student_id} onChange={e => setFormData(prev => ({ ...prev, student_id: e.target.value }))} placeholder="รหัสนักศึกษา" />
          <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="password" type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="รหัสผ่าน" />
          <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="first_name" value={formData.first_name} onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))} placeholder="ชื่อ" />
          <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="last_name" value={formData.last_name} onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))} placeholder="นามสกุล" />
          <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="อีเมล" />

          <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.department_id} onChange={e => setFormData(prev => ({ ...prev, department_id: parseInt(e.target.value) }))}>
            <option value="">เลือกแผนก</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>

          <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.level_id} onChange={e => setFormData(prev => ({ ...prev, level_id: parseInt(e.target.value) }))}>
            <option value="">เลือกระดับชั้น</option>
            {educationLevels.map(l => <option key={l.level_id} value={l.level_id}>{l.level_name}</option>)}
          </select>

          <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.year_id} onChange={e => setFormData(prev => ({ ...prev, year_id: parseInt(e.target.value) }))}>
            <option value="">เลือกชั้นปี</option>
            {years.filter(y => !formData.level_id || y.level_id === parseInt(formData.level_id)).map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
          </select>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
            <div className="flex gap-4 flex-wrap">
              {[{ id: 1, label: "นักศึกษา" }, { id: 2, label: "ผู้สมัคร" }, { id: 3, label: "กรรมการ" }, { id: 4, label: "ผู้ดูแล" }].map(role => (
                <label key={role.id}>
                  <input type="checkbox" checked={formData.roles.includes(role.id)} onChange={() => handleRoleChange(role.id)} /> {role.label}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex justify-center gap-4 mt-4">
            <button type="button" onClick={onSubmit} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              ยืนยัน
            </button>
            <button type="button" onClick={onCancel} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
