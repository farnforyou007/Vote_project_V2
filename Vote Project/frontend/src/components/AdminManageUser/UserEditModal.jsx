import { useState, useEffect } from "react";

export default function UserEditModal({
  editForm, setEditForm,
  departments, educationLevels, years,
  onSubmit, onCancel,
  handleEditRoleChange,
  serverErrors = {},
}) {
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length) {
      setErrors(prev => ({ ...prev, ...serverErrors }));
    }
  }, [serverErrors]);

  const validate = () => {
    const error = {};
    const fd = editForm || {};

    // --- บังคับกรอก ---
    if (!fd.student_id || !String(fd.student_id).trim()) error.student_id = "กรุณากรอกรหัสนักศึกษา/ชื่อผู้ใช้งาน";
    if (!fd.first_name || !String(fd.first_name).trim()) error.first_name = "กรุณากรอกชื่อ";
    if (!fd.last_name || !String(fd.last_name).trim()) error.last_name = "กรุณากรอกนามสกุล";
    if (!fd.department_id) error.department_id = "กรุณาเลือกแผนก";
    if (!fd.level_id) error.level_id = "กรุณาเลือกระดับการศึกษา";
    if (!fd.year_id) error.year_id = "กรุณาเลือกชั้นปี";
    if (!Array.isArray(fd.roles) || fd.roles.length === 0) error.roles = "กรุณาเลือกอย่างน้อย 1 บทบาท";
    if (fd.roles && fd.roles.includes(4) && fd.roles.length > 1) {
      error.roles = "บทบาท ผู้ดูแล ไม่สามารถเลือกพร้อมบทบาทอื่นได้";
    } else if (fd.roles && fd.roles.includes(1) && fd.roles.includes(3)) {
      error.roles = "บทบาท นักศึกษา ไม่สามารถเลือกพร้อมบทบาท กรรมการ ได้";
    } else if (fd.roles && fd.roles.includes(2) && fd.roles.includes(3)) {
      error.roles = "บทบาท ผู้สมัคร ไม่สามารถเลือกพร้อมบทบาท กรรมการ ได้";
    }
    // --- รูปแบบข้อมูล ---
    if (fd.student_id && !/^[a-zA-Z0-9]+$/.test(fd.student_id)) {
      error.student_id = "รหัสนักศึกษาต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น";
    }
    if (fd.email && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(fd.email)) {
      error.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    setErrors(error);
    const ok = Object.keys(error).length === 0;
    return { ok, error };
  };

  const handleConfirm = () => {
    const { ok } = validate();
    if (!ok) return;
    onSubmit();
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
        <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
          แก้ไขข้อมูลผู้ใช้
        </h2>
        <form className="grid grid-cols-2 gap-4">
          <label htmlFor="รหัสนักศึกษา/ชื่อผู้ใช้งาน" className="text-sm font-medium text-gray-700">รหัสนักศึกษา/ชื่อผู้ใช้งาน
            <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="student_id"
              value={editForm.student_id || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, student_id: e.target.value }))}
              placeholder="รหัสนักศึกษา" />
            {errors.student_id && <p className="text-xs text-red-600">{errors.student_id}</p>}
          </label>

          <div >
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>

            {!showPasswordInput ? (
              <div className="flex items-center gap-3">
                {/* ช่องว่าง (input dummy) */}
                <input
                  className="flex-1 border border-gray-300 p-2 rounded bg-gray-100 cursor-not-allowed"
                  placeholder="••••••••"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(true)}
                  className="text-sm text-violet-600 underline hover:text-violet-800"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 border border-gray-300 p-2 rounded"
                  name="password"
                  type="password"
                  value={editForm.password || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="ใส่รหัสผ่านใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setEditForm((prev) => ({ ...prev, password: "" }));
                  }}
                  className="px-3 py-2 border rounded text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>


          <label htmlFor="ชื่อ" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ
            <input className="mt-1 border border-purple-300 p-2 rounded w-full" name="first_name"
              value={editForm.first_name || ''} onChange={e =>
                setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="ชื่อ" />
            {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}

          </label>

          <label htmlFor="นามสกุล" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล
            <input className="mt-1 border border-purple-300 p-2 rounded w-full"
              name="last_name"
              value={editForm.last_name || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="นามสกุล" />
            {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}

          </label>

          <label htmlFor="อีเมล" className="block text-sm font-medium text-gray-700 mb-1">อีเมล
            <input className="mt-1 border border-purple-300 p-2 rounded w-full"
              name="email" type="email"
              value={editForm.email || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="อีเมล" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}

          </label>

          <label htmlFor="แผนก" className="block text-sm font-medium text-gray-700 mb-1">แผนก
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.department_id || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, department_id: parseInt(e.target.value) }))}>

              <option value="">เลือกแผนก</option>
              {departments.map(d =>
                <option key={d.department_id}
                  value={d.department_id}>{d.department_name}</option>)}
            </select>
            {errors.department_id && <p className="mt-1 text-xs text-red-600">{errors.department_id}</p>}

          </label>

          <label htmlFor="ระดับการศึกษา" className="block text-sm font-medium text-gray-700 mb-1">ระดับการศึกษา
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.level_id || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, level_id: parseInt(e.target.value) }))}>
              <option value="">เลือกระดับชั้น</option>
              {educationLevels.map(l =>
                <option key={l.level_id} value={l.level_id}>{l.level_name}</option>)}
            </select>
            {errors.level_id && <p className="mt-1 text-xs text-red-600">{errors.level_id}</p>}

          </label>

          <label htmlFor="ปีที่" className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี
            <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300"
              value={editForm.year_id || ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, year_id: parseInt(e.target.value) }))}>
              <option value="">เลือกชั้นปี</option>
              {years.filter
                (y => !editForm.level_id || y.level_id === parseInt
                  (editForm.level_id)).map(y =>
                    <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
            </select>
            {errors.year_id && <p className="mt-1 text-xs text-red-600">{errors.year_id}</p>}


          </label>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
            <div className="flex gap-4 flex-wrap">
              {[{ id: 1, label: "นักศึกษา" },
              { id: 2, label: "ผู้สมัคร" },
              { id: 3, label: "กรรมการ" },
              { id: 4, label: "ผู้ดูแล" }].map(role => (
                <label key={role.id}>
                  <input
                    type="checkbox"
                    checked={editForm.roles?.includes(role.id)}
                    onChange={() => handleEditRoleChange(role.id)}
                  /> {role.label}

                </label>
              ))}
            </div>
            <div>
              {errors.roles && <p className="mt-1 text-xs text-red-600">{errors.roles}</p>}
            </div>
          </div>


          <div className="col-span-2 flex justify-center gap-4 mt-4">
            <button type="button" onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded">
              บันทึก
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

