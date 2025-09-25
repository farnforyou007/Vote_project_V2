import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import { apiFetch } from "../../utils/apiFetch";
import DescriptionEditor from "./DescriptionEditor";
import { formatForInputDateTime, formatForBackend } from "../../utils/dateUtils"


export default function EditElectionModal({ election, onClose, onSave }) {
  const [form, setForm] = useState({
    election_name: "",
    description: "",
    registration_start: "",
    registration_end: "",
    start_date: "",
    end_date: "",
    manual_override: "AUTO",
    status_note: "",
    is_hidden: false
  });
  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({}); 

  useEffect(() => {
    if (election) {
      setForm({
        election_name: election.election_name || "",
        description: election.description || "",
        registration_start: formatForInputDateTime(election.registration_start) || "",
        registration_end: formatForInputDateTime(election.registration_end) || "",
        start_date: formatForInputDateTime(election.start_date) || "",
        end_date: formatForInputDateTime(election.end_date) || "",
        image_url: election.image_url || election.image_path || "",
        // status: election.status || "registration"   // << เพิ่มตรงนี้
        manual_override: election.manual_override || "AUTO",
        status_note: election.status_note || "",
        is_hidden: !!election.is_hidden
      });

      const image = election.image_url || election.image_path;
      if (image) {
        const fullUrl = `http://localhost:5000${image}`;
        setPreview(fullUrl);
        console.log("📸 ตั้ง preview จาก:", fullUrl);
      }
    }
  }, [election]);

  console.log("🧪 Props ที่ได้รับ:", { election, onClose, onSave });
  console.log("🖼️ image_url ที่ได้จาก backend:", election?.image_url);
  console.log("📸 preview ที่ตั้งค่า:", preview);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const validate = () => {
    const e = {};
    const {
      election_name,
      registration_start,
      registration_end,
      start_date,
      end_date,
    } = form;

    if (!election_name.trim())
      e.election_name = "กรุณากรอกชื่อรายการเลือกตั้ง";
    if (!registration_start)
      e.registration_start = "กรุณาเลือกวัน-เวลาเริ่มรับสมัคร";
    if (!registration_end)
      e.registration_end = "กรุณาเลือกวัน-เวลา สิ้นสุดรับสมัคร";
    if (!start_date) e.start_date = "กรุณาเลือกวัน-เวลาเริ่มลงคะแนน";
    if (!end_date) e.end_date = "กรุณาเลือกวัน-เวลาสิ้นสุดลงคะแนน";

    // ตรวจ logic วันเวลา (เหมือน Add)
    if (registration_start && registration_end) {
      if (new Date(registration_end) < new Date(registration_start)) {
        e.registration_end = "วันสิ้นสุดรับสมัครต้องหลังจากวันเริ่มต้น";
      }
    }
    if (start_date && end_date) {
      if (new Date(end_date) < new Date(start_date)) {
        e.end_date = "วันสิ้นสุดลงคะแนนต้องหลังจากวันเริ่มต้น";
      }
    }
    setErrors(e);
    return { ok: Object.keys(e).length === 0, e };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ok } = validate();
    if (!ok) return;
    // 1) ยืนยันก่อนแก้ไข
    const result = await Swal.fire({
      title: "ยืนยันการแก้ไข?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการแก้ไขรายการเลือกตั้งนี้",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน!",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    try {
      // const token = localStorage.getItem("token");

      // 3) อัปเดตข้อมูลทั่วไป (PUT) — ไม่ต้องส่ง status แล้ว
      const formData = new FormData();
      formData.append("election_name", form.election_name);
      formData.append("description", form.description);
      // formData.append("registration_start", form.registration_start);
      // formData.append("registration_end", form.registration_end);
      // formData.append("start_date", form.start_date);
      // formData.append("end_date", form.end_date);
      formData.append("registration_start", formatForBackend(form.registration_start));
      formData.append("registration_end", formatForBackend(form.registration_end));
      formData.append("start_date", formatForBackend(form.start_date));
      formData.append("end_date", formatForBackend(form.end_date));
      if (imageFile) formData.append("image", imageFile);

      const putData = await apiFetch(`http://localhost:5000/api/elections/${election.election_id}`, {
        method: "PUT",
        // headers: { Authorization: `Bearer ${token}` }, // ห้ามใส่ Content-Type เอง
        body: formData,
      });
      // const putData = await putRes.json();
      if (!putData) return;

      if (!putData.success) {
        toast.error("อัปเดตข้อมูลทั่วไปไม่สำเร็จ");
        return;
      }

      // 4) เช็กว่ามีการเปลี่ยน manual_override/status_note จริงไหม
      const oldOverride = election.manual_override || "AUTO";
      const oldNote = election.status_note || "";
      const ovChanged =
        form.manual_override !== oldOverride ||
        form.status_note !== oldNote;

      // 5) ถ้าเปลี่ยน → PATCH สถานะ
      if (ovChanged) {
        const patchData = await apiFetch(`http://localhost:5000/api/elections/${election.election_id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            manual_override: form.manual_override,
            status_note: form.status_note,
          }),
        });
        // const patchData = await patchRes.json();
        if (!patchData) return;

        if (!patchData.success) {
          toast.error("อัปเดตสถานะ (override) ไม่สำเร็จ");
          return;
        }
      }

      // 6) visibility (ถ้ามีการเปลี่ยน)
      const oldHidden = !!election.is_hidden;
      if (form.is_hidden !== oldHidden) {
        const visData = await apiFetch(`http://localhost:5000/api/elections/${election.election_id}/visibility`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_hidden: form.is_hidden }),
        });
      
        if (!visData) return;

        if (!visData.success) {
          toast.error("อัปเดตการซ่อนล้มเหลว");
          return;
        }
      }

      // 6) สำเร็จทั้งหมด → refresh + แจ้งผล + ปิดโมดัล
      await onSave(); // แนะนำให้ส่งเป็น fetchElections มาจากหน้าพ่อ
      toast.success("แก้ไขสำเร็จ");
      await Swal.fire("แก้ไขรายการเลือกตั้งสำเร็จ!", "", "success");
      onClose();

    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดจากเครือข่าย/เซิร์ฟเวอร์");
    }
  };


  if (!election || !onClose || !onSave) {
    return <div className="text-red-500 p-4">มีข้อมูลไม่ครบ (election / onClose / onSave)</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-[90%] max-w-2xl relative shadow-xl overflow-y-auto max-h-[90vh]">

        <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
          แก้ไขรายการเลือกตั้ง
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการเลือกตั้ง</label>
            <input
              type="text"
              name="election_name"
              value={form.election_name}
              // onChange={handleChange}
              onChange={(e) => setField("election_name", e.target.value)}
              className="w-full border border-purple-300 p-2 rounded"

            />
            {errors.election_name && (
              <p className="mt-1 text-xs text-red-600">
                {errors.election_name}
              </p>
            )}
          </div>

          <DescriptionEditor
            value={form.description}
            onChange={(v) => setField("description", v)}
            rows={3}
            required={false}
            error={errors.description}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เริ่มรับสมัคร (ปี ค.ศ.)</label>
              <input
                type="datetime-local"
                name="registration_start"
                value={form.registration_start}
                // onChange={handleChange}
                onChange={(e) =>
                  setField("registration_start", e.target.value)
                }
                className="w-full border border-purple-300 p-2 rounded"
              />
              {errors.registration_start && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.registration_start}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สิ้นสุดรับสมัคร</label>
              <input
                type="datetime-local"
                name="registration_end"
                value={form.registration_end}
                // onChange={handleChange}
                onChange={(e) => setField("registration_end", e.target.value)}
                className="w-full border border-purple-300 p-2 rounded"
              />
              {errors.registration_end && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.registration_end}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เริ่มลงคะแนน (ปี ค.ศ.)</label>
              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                // onChange={handleChange}
                onChange={(e) => setField("start_date", e.target.value)}
                className="w-full border border-purple-300 p-2 rounded"
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สิ้นสุดลงคะแนน</label>
              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                // onChange={handleChange}
                // className="w-full border border-purple-300 p-2 rounded"
                onChange={(e) => setField("end_date", e.target.value)}
                className="w-full border border-purple-300 p-2 rounded"
              />

              {errors.end_date && (
                <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
              )}

            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              name="manual_override"
              value={form.manual_override}
              onChange={handleChange}
              className="w-full border border-purple-300 p-2 rounded"
            >
              <option value="AUTO">ให้ระบบคำนวณอัตโนมัติ</option>
              <option value="FORCE_OPEN">บังคับ “เปิดลงคะแนน”</option>
              <option value="FORCE_CLOSED">บังคับ “ปิดชั่วคราว”</option>
            </select>


            <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">หมายเหตุผู้ดูแล (ถ้ามี)</label>
            <input
              type="text"
              name="status_note"
              value={form.status_note}
              onChange={handleChange}
              className="w-full border border-purple-300 p-2 rounded"
            />

            <label
              className="flex items-center gap-2 mt-3"
            >
              <input
                type="checkbox"
                checked={!!form.is_hidden}
                onChange={(e) => setForm(f => ({ ...f, is_hidden: e.target.checked }))}
              />
              ซ่อนจากหน้ารวมผู้ใช้
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพประกอบ</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-purple-300 p-2 rounded bg-white"
          />

          {/* {!preview && form.image_url && (
            <div className="mb-2">
              <img
                src={`http://localhost:5000${form.image_url}`}
                alt="ภาพเก่า"
                className="h-40 object-contain mx-auto rounded shadow"
              />
            </div>
          )} */}


          {preview && (
            <div className="mb-2">
              <img src={preview} alt="preview" className="h-32 object-contain mx-auto rounded shadow" />
            </div>
          )}


          <div className="flex justify-center gap-4 mt-4">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              บันทึก
            </button>
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
