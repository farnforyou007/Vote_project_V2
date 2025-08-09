import { useState } from "react";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';


export default function AddElectionModal({ onClose, onSave }) {
    const [form, setForm] = useState({
        election_name: "",
        description: "",
        registration_start: "",
        registration_end: "",
        start_date: "",
        end_date: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ เพิ่ม popup ยืนยันก่อน
        const result = await Swal.fire({
            title: 'ยืนยันการบันทึก?',
            text: 'คุณแน่ใจหรือไม่ว่าต้องการเพิ่มรายการเลือกตั้งนี้',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน !',
            cancelButtonText: 'ยกเลิก'
        });

        if (!result.isConfirmed) {
            // onClose(); // ❌ ปิด modal ถ้าไม่กดตกลง
        return; // ❌ ถ้าไม่กดตกลง ให้หยุดไว้
        }
        if (result.isConfirmed) {
            Swal.fire("เพิ่มรายการเลือกตั้งสำเร็จ!", "", "success");
        }
        // ✅ ดำเนินการต่อหลังจากกดตกลงแล้ว
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
        const res = await fetch("http://localhost:5000/api/elections", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await res.json();
        if (data.success) {
            toast.success("เพิ่มรายการสำเร็จ");
            await onSave(formData);
            onClose();
        } else {
            alert("เกิดข้อผิดพลาด: " + (data.message || "ไม่สามารถเพิ่มได้"));
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-[90%] max-w-2xl relative shadow-xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
                    เพิ่มรายการเลือกตั้ง
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
