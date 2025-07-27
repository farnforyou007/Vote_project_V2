import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function EditElectionModal({ election, onClose, onSave }) {
  const [form, setForm] = useState({
    election_name: "",
    description: "",
    registration_start: "",
    registration_end: "",
    start_date: "",
    end_date: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [preview, setPreview] = useState(null);

  const [electionToEdit, setElectionToEdit] = useState(null);

  // useEffect(() => {
  //   if (election) {
  //     setForm({
  //       election_name: election.election_name || "",
  //       description: election.description || "",
  //       registration_start: election.registration_start?.slice(0, 16) || "",
  //       registration_end: election.registration_end?.slice(0, 16) || "",
  //       start_date: election.start_date?.slice(0, 16) || "",
  //       end_date: election.end_date?.slice(0, 16) || "",
  //     });

  //     if (election.image_url) {
  //       setPreview(`http://localhost:5000${election.image_url}`); // ✅ ใช้ URL รูปเดิม
  //     } else {
  //       setPreview(null);
  //     }
  //   }
  // }, [election]);

  // useEffect(() => {
  //   if (election) {
  //     setForm({
  //       election_name: election.election_name || "",
  //       description: election.description || "",
  //       registration_start: election.registration_start?.slice(0, 16) || "",
  //       registration_end: election.registration_end?.slice(0, 16) || "",
  //       start_date: election.start_date?.slice(0, 16) || "",
  //       end_date: election.end_date?.slice(0, 16) || "",
  //       image_url: election.image_url || ""
  //     });

  //     // ✅ ตั้งค่ารูป preview ถ้ามี image_url
  //     if (election.image_url) {
  //       const fullUrl = `http://localhost:5000${election.image_url}`;
  //       console.log("📸 ตั้ง preview จาก image_url:", fullUrl);
  //       setPreview(fullUrl);
  //     }
  //   }
  // }, [election]);

  useEffect(() => {
    if (election) {
      setForm({
        election_name: election.election_name || "",
        description: election.description || "",
        registration_start: election.registration_start?.slice(0, 16) || "",
        registration_end: election.registration_end?.slice(0, 16) || "",
        start_date: election.start_date?.slice(0, 16) || "",
        end_date: election.end_date?.slice(0, 16) || "",
        image_url: election.image_url || election.image_path || "" // ✅ แก้ตรงนี้
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


  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const formData = new FormData();

  //   formData.append("election_name", form.election_name);
  //   formData.append("description", form.description);
  //   formData.append("registration_start", form.registration_start);
  //   formData.append("registration_end", form.registration_end);
  //   formData.append("start_date", form.start_date);
  //   formData.append("end_date", form.end_date);

  //   if (imageFile) {
  //     formData.append("image", imageFile);
  //   }

  //   const token = localStorage.getItem("token");

  //   const res = await fetch(`http://localhost:5000/api/elections/${election.election_id}`, {
  //     method: "PUT",
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: formData,
  //   });

  //   // ✅ Validate วันที่ก่อนส่ง
  //   const startReg = new Date(form.registration_start);
  //   const endReg = new Date(form.registration_end);
  //   const startVote = new Date(form.start_date);
  //   const endVote = new Date(form.end_date);

  //   if (startReg >= endReg) {
  //     toast.error("วันเริ่มรับสมัครต้องมาก่อนวันสิ้นสุดรับสมัคร");
  //     return;
  //   }
  //   if (startVote >= endVote) {
  //     toast.error("วันเริ่มลงคะแนนต้องมาก่อนวันสิ้นสุดลงคะแนน");
  //     return;
  //   }

  //   const data = await res.json();
  //   if (data.success) {
  //     // toast.success("อัปเดตสำเร็จ"); // หรือ alert ก็ได้
  //     alert("อัปเดตสำเร็จ");
  //     await onSave(formData);          // ✅ รอให้ parent fetch เสร็จ
  //     onClose();

  //   } else {
  //     alert("เกิดข้อผิดพลาด: " + data.message || "ไม่สามารถอัปเดตได้");
  //   }
  // };

const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Validate วันที่ก่อนส่ง (ควรอยู่ในนี้เท่านั้น!)
  const startReg = new Date(form.registration_start);
  const endReg = new Date(form.registration_end);
  const startVote = new Date(form.start_date);
  const endVote = new Date(form.end_date);

  if (startReg >= endReg) {
    toast.error("วันเริ่มรับสมัครต้องมาก่อนวันสิ้นสุดรับสมัคร");
    return;
  }
  if (startVote >= endVote) {
    toast.error("วันเริ่มลงคะแนนต้องมาก่อนวันสิ้นสุดลงคะแนน");
    return;
  }

  const formData = new FormData();
  formData.append("election_name", form.election_name);
  formData.append("description", form.description);
  formData.append("registration_start", form.registration_start);
  formData.append("registration_end", form.registration_end);
  formData.append("start_date", form.start_date);
  formData.append("end_date", form.end_date);

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/api/elections/${election.election_id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (data.success) {
    toast.success("อัปเดตสำเร็จ");
    await onSave(formData);
    onClose();
  } else {
    alert("เกิดข้อผิดพลาด: " + (data.message || "ไม่สามารถอัปเดตได้"));
  }
};

if (!election || !onClose || !onSave) {
  return <div className="text-red-500 p-4">มีข้อมูลไม่ครบ (election / onClose / onSave)</div>;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-full max-w-3xl relative shadow-xl">
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
              onChange={handleChange}
              className="w-full border border-purple-300 p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-purple-300 p-2 rounded"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เริ่มรับสมัคร</label>
              <input
                type="datetime-local"
                name="registration_start"
                value={form.registration_start}
                onChange={handleChange}
                className="w-full border border-purple-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สิ้นสุดรับสมัคร</label>
              <input
                type="datetime-local"
                name="registration_end"
                value={form.registration_end}
                onChange={handleChange}
                className="w-full border border-purple-300 p-2 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เริ่มลงคะแนน</label>
              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full border border-purple-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สิ้นสุดลงคะแนน</label>
              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full border border-purple-300 p-2 rounded"
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพประกอบ</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-purple-300 p-2 rounded bg-white"
          />
          {/* {previewUrl && (
              <img src={previewUrl} alt="preview" className="w-32 mt-2 rounded shadow" />
            )} */}

          {/* {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-32 h-auto mt-2 border rounded" />
            )} */}


          {!preview && form.image_url && (
            <div className="mb-2">
              <img
                src={`http://localhost:5000${form.image_url}`}
                alt="ภาพเก่า"
                className="h-40 object-contain mx-auto rounded shadow"
              />
            </div>
          )}


          {preview && (
            <div className="mb-2">
              <img src={preview} alt="preview" className="h-40 object-contain mx-auto rounded shadow" />
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
