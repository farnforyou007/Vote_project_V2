// ver2
// src/components/AdminManageUser/UserFormModal.jsx
// src/components/AdminManageUser/UserFormModal.jsx
import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function UserFormModal({
  formData, setFormData,
  departments, educationLevels, years,
  onSubmit, onCancel,
  handleRoleChange,
  existingUsers = [] // <<-- เพิ่ม: ใช้ตรวจ student_id ซ้ำจากลิสต์ผู้ใช้ปัจจุบัน
}) {
  // error รายช่อง
  const [errors, setErrors] = useState({
    student_id: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    department_id: "",
    level_id: "",
    year_id: "",
    roles: "",
  });

  // สร้าง set สำหรับเช็คซ้ำแบบเร็ว (case-insensitive + trim)
  const studentIdSet = useMemo(() => {
    const s = new Set();
    (existingUsers || []).forEach(u => {
      if (u?.student_id) s.add(String(u.student_id).trim().toLowerCase());
    });
    return s;
  }, [existingUsers]);

  const isStudentIdDuplicate = (val) =>
    !!val && studentIdSet.has(String(val).trim().toLowerCase());

  const onChangeField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" })); // เคลียร์ error ช่องนั้นเมื่อเริ่มพิมพ์ใหม่
  };

  const validate = () => {
    const e = {};
    const fd = formData || {};

    // --- บังคับกรอก ---
    if (!fd.student_id || !String(fd.student_id).trim()) e.student_id = "กรุณากรอกรหัสนักศึกษา/ชื่อผู้ใช้งาน";
    if (!fd.password || String(fd.password).length < 8) e.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (!fd.first_name || !String(fd.first_name).trim()) e.first_name = "กรุณากรอกชื่อ";
    if (!fd.last_name || !String(fd.last_name).trim()) e.last_name = "กรุณากรอกนามสกุล";
    if (!fd.email || !String(fd.email).includes("@")) e.email = "รูปแบบอีเมลไม่ถูกต้อง (ต้องมี @)";
    if (!fd.department_id) e.department_id = "กรุณาเลือกแผนก";
    if (!fd.level_id) e.level_id = "กรุณาเลือกระดับการศึกษา";
    if (!fd.year_id) e.year_id = "กรุณาเลือกชั้นปี";
    if (!Array.isArray(fd.roles) || fd.roles.length === 0) e.roles = "กรุณาเลือกอย่างน้อย 1 บทบาท";

    // --- เช็ค student_id ซ้ำ (จากลิสต์ที่ส่งเข้ามา) ---
    if (!e.student_id && isStudentIdDuplicate(fd.student_id)) {
      e.student_id = "รหัสนี้ถูกใช้แล้ว กรุณาใช้รหัสอื่น";
    }

    setErrors(e);
    const ok = Object.keys(e).length === 0;
    return { ok, e };
  };

  const handleConfirm = async () => {
    const { ok, e } = validate();
    if (!ok) {
      const msgs = Object.values(e).filter(Boolean);
      await Swal.fire({
        icon: "warning",
        title: "กรุณาตรวจสอบข้อมูล",
        html: `<div style="text-align:left">${msgs.map(m => `•  ${m}`).join("<br/>")}</div>`,
        confirmButtonText: "รับทราบ",
      });
      return;
    }
    // ผ่านทั้งหมด → ส่งต่อให้ parent ยิง API
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl shadow-xl">
        <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4">
          เพิ่มผู้ใช้งาน
        </h2>

        {/* กด Enter ให้ validate ได้ */}
        <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
          {/* student_id */}
          <label className="text-sm font-medium text-gray-700">
            รหัสนักศึกษา/ชื่อผู้ใช้งาน
            <input
              className={`mt-1 border p-2 rounded w-full ${errors.student_id ? "border-red-500" : "border-purple-300"}`}
              name="student_id"
              value={formData.student_id}
              onChange={e => onChangeField("student_id", e.target.value)}
              onBlur={() => {
                // เช็คซ้ำแบบทันทีตอน blur
                const val = String(formData.student_id || "").trim();
                if (val && isStudentIdDuplicate(val)) {
                  setErrors(prev => ({ ...prev, student_id: "รหัสนี้ถูกใช้แล้ว กรุณาใช้รหัสอื่น" }));
                }
              }}
              placeholder="รหัสนักศึกษา / ชื่อผู้ใช้งาน"
            />
            {errors.student_id && <p className="mt-1 text-xs text-red-600">{errors.student_id}</p>}
          </label>

          {/* password */}
          <label className="block text-sm font-medium text-gray-700">
            รหัสผ่าน
            <input
              className={`mt-1 border p-2 rounded w-full ${errors.password ? "border-red-500" : "border-purple-300"}`}
              name="password"
              type="password"
              value={formData.password}
              onChange={e => onChangeField("password", e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
              minLength={8}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </label>

          {/* first_name */}
          <label className="block text-sm font-medium text-gray-700">
            ชื่อ
            <input
              className={`mt-1 border p-2 rounded w-full ${errors.first_name ? "border-red-500" : "border-purple-300"}`}
              name="first_name"
              value={formData.first_name}
              onChange={e => onChangeField("first_name", e.target.value)}
              placeholder="ชื่อ"
            />
            {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
          </label>

          {/* last_name */}
          <label className="block text-sm font-medium text-gray-700">
            นามสกุล
            <input
              className={`mt-1 border p-2 rounded w-full ${errors.last_name ? "border-red-500" : "border-purple-300"}`}
              name="last_name"
              value={formData.last_name}
              onChange={e => onChangeField("last_name", e.target.value)}
              placeholder="นามสกุล"
            />
            {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
          </label>

          {/* email */}
          <label className="block text-sm font-medium text-gray-700">
            อีเมล
            <input
              className={`mt-1 border p-2 rounded w-full ${errors.email ? "border-red-500" : "border-purple-300"}`}
              name="email"
              type="email"
              value={formData.email}
              onChange={e => onChangeField("email", e.target.value)}
              placeholder="อีเมล (ต้องมี @)"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </label>

          {/* department */}
          <label className="block text-sm font-medium text-gray-700">
            แผนก
            <select
              className={`mt-1 border p-2 rounded w-full bg-violet-50 ${errors.department_id ? "border-red-500" : "border-violet-300"}`}
              value={formData.department_id}
              onChange={e => onChangeField("department_id", parseInt(e.target.value))}
            >
              <option value="">เลือกแผนก</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
            {errors.department_id && <p className="mt-1 text-xs text-red-600">{errors.department_id}</p>}
          </label>

          {/* level */}
          <label className="block text-sm font-medium text-gray-700">
            ระดับการศึกษา
            <select
              className={`mt-1 border p-2 rounded w-full bg-violet-50 ${errors.level_id ? "border-red-500" : "border-violet-300"}`}
              value={formData.level_id}
              onChange={e => onChangeField("level_id", parseInt(e.target.value))}
            >
              <option value="">เลือกระดับการศึกษา</option>
              {educationLevels.map(l => (
                <option key={l.level_id} value={l.level_id}>{l.level_name}</option>
              ))}
            </select>
            {errors.level_id && <p className="mt-1 text-xs text-red-600">{errors.level_id}</p>}
          </label>

          {/* year */}
          <label className="block text-sm font-medium text-gray-700">
            ชั้นปี
            <select
              className={`mt-1 border p-2 rounded w-full bg-violet-50 ${errors.year_id ? "border-red-500" : "border-violet-300"}`}
              value={formData.year_id}
              onChange={e => onChangeField("year_id", parseInt(e.target.value))}
            >
              <option value="">เลือกชั้นปี</option>
              {years
                .filter(y => !formData.level_id || y.level_id === parseInt(formData.level_id))
                .map(y => (
                  <option key={y.year_id} value={y.year_id}>{y.year_name}</option>
                ))}
            </select>
            {errors.year_id && <p className="mt-1 text-xs text-red-600">{errors.year_id}</p>}
          </label>

          {/* roles */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
            <div className={`flex gap-4 flex-wrap p-2 rounded ${errors.roles ? "ring-1 ring-red-500" : ""}`}>
              {[{ id: 1, label: "นักศึกษา" }, { id: 2, label: "ผู้สมัคร" }, { id: 3, label: "กรรมการ" }, { id: 4, label: "ผู้ดูแล" }].map(role => (
                <label key={role.id} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(formData.roles || []).includes(role.id)}
                    onChange={() => handleRoleChange(role.id)}
                  />
                  {role.label}
                </label>
              ))}
            </div>
            {errors.roles && <p className="mt-1 text-xs text-red-600">{errors.roles}</p>}
          </div>

          <div className="col-span-2 flex justify-center gap-4 mt-4">
            <button
              type="submit"
              onClick={handleConfirm}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ยืนยัน
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}






// ver1
// export default function UserFormModal({
//   formData, setFormData,
//   departments, educationLevels, years,
//   onSubmit, onCancel,
//   handleRoleChange
// }) {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
//         <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
//           เพิ่มผู้ใช้งาน
//         </h2>
//         <form className="grid grid-cols-2 gap-4">
//           <label htmlFor="รหัสนักศึกษา/ชื่อผู้ใช้งาน" className="text-sm font-medium text-gray-700">รหัสนักศึกษา/ชื่อผู้ใช้งาน
//             <input className="mt-1 border border-purple-300 p-2 rounded w-full"
//               name="student_id" value={formData.student_id} onChange={e => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
//               placeholder="รหัสนักศึกษา / ชื่อผู้ใช้งาน" />
//           </label>
//           <label htmlFor="รหัสผ่าน" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน
//             <input className="mt-1 border border-purple-300 p-2 rounded w-full"
//               name="password" type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
//               placeholder="รหัสผ่าน" />
//           </label>
//           <label htmlFor="ชื่อ" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ
//             <input className="mt-1 border border-purple-300 p-2 rounded w-full"
//               name="first_name" value={formData.first_name} onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
//               placeholder="ชื่อ" />
//           </label>

//           <label htmlFor="นามสกุล" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล
//             <input className="mt-1 border border-purple-300 p-2 rounded w-full"
//               name="last_name" value={formData.last_name} onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
//               placeholder="นามสกุล" />
//           </label>

//           <label htmlFor="อีเมล" className="block text-sm font-medium text-gray-700 mb-1">อีเมล
//             <input className="mt-1 border border-purple-300 p-2 rounded w-full"
//               name="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
//               placeholder="อีเมล" />
//           </label>

//           <label htmlFor="แผนก" className="block text-sm font-medium text-gray-700 mb-1">แผนก
//             <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.department_id} onChange={e => setFormData(prev => ({ ...prev, department_id: parseInt(e.target.value) }))}>
//               <option value="">เลือกแผนก</option>
//               {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
//             </select>
//           </label>

//           <label htmlFor="ระดับการศึกษา" className="block text-sm font-medium text-gray-700 mb-1">ระดับการศึกษา
//             <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.level_id} onChange={e => setFormData(prev => ({ ...prev, level_id: parseInt(e.target.value) }))}>
//               <option value="">เลือกระดับการศึกษา</option>
//               {educationLevels.map(l => <option key={l.level_id} value={l.level_id}>{l.level_name}</option>)}
//             </select>
//           </label>

//           <label htmlFor="ปีที่" className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี 
//             <select className="mt-1 border p-2 rounded w-full bg-violet-50 border-violet-300" value={formData.year_id} onChange={e => setFormData(prev => ({ ...prev, year_id: parseInt(e.target.value) }))}>
//               <option value="">เลือกชั้นปี</option>
//               {years.filter(y => !formData.level_id || y.level_id === parseInt(formData.level_id)).map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
//             </select>
//           </label>

//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
//             <div className="flex gap-4 flex-wrap">
//               {[{ id: 1, label: "นักศึกษา" }, { id: 2, label: "ผู้สมัคร" }, { id: 3, label: "กรรมการ" }, { id: 4, label: "ผู้ดูแล" }].map(role => (
//                 <label key={role.id}>
//                   <input type="checkbox" checked={formData.roles.includes(role.id)} onChange={() => handleRoleChange(role.id)} /> {role.label}
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div className="col-span-2 flex justify-center gap-4 mt-4">
//             <button type="button" onClick={onSubmit} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
//               ยืนยัน
//             </button>
//             <button type="button" onClick={onCancel} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
//               ยกเลิก
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
