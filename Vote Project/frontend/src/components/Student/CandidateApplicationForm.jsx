import { useState } from 'react';
import Swal from "sweetalert2";
export default function CandidateApplicationForm({ student, electionId, onClose }) {
    const [policy, setPolicy] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('user_id', student.user_id);
        formData.append('election_id', electionId);
        formData.append('policy', policy);
        formData.append('image', image);

        try {
            const res = await fetch('/api/apply-candidate', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.status === 409) {
                Swal.fire("แจ้งเตือน", data.message || "คุณได้สมัครไปแล้ว", "warning");
                onClose();
                return;
            }

            if (data.success) {
                alert(data.message || "สมัครสำเร็จ");
                onClose();
            } else {
                alert(data.message || "ไม่สามารถสมัครได้");
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-3xl shadow-lg overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold text-center text-purple-700 mb-4">สมัครเป็นผู้สมัคร</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ข้อมูลผู้สมัคร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label>ชื่อ</label>
                            <input value={student.first_name} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div>
                            <label>นามสกุล</label>
                            <input value={student.last_name} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div>
                            <label>รหัสนักศึกษา</label>
                            <input value={student.student_id} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div>
                            <label>อีเมล</label>
                            <input value={student.email} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div>
                            <label>ระดับชั้นปี</label>
                            <input value={student.year_level} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                        <div>
                            <label>แผนก</label>
                            <input value={student.department} readOnly className="w-full bg-gray-100 p-2 rounded" />
                        </div>
                    </div>

                    {/* นโยบาย */}
                    <div>
                        <label>นโยบาย</label>
                        <textarea
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            placeholder="เขียนนโยบายที่คุณต้องการผลักดัน"
                            className="w-full border p-2 rounded"
                            rows={4}
                            required
                        />
                    </div>

                    {/* รูป */}
                    <div>
                        <label>แนบรูปภาพโปรไฟล์</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                            className="w-full"
                        />

                        {preview && (
                            <div className="mt-2 text-center">
                                <p className="text-sm mb-1 text-gray-500">ภาพตัวอย่าง:</p>
                                <img
                                    src={preview}
                                    alt="preview"
                                    className="h-32 mx-auto block rounded shadow border object-contain"
                                />
                            </div>
                        )}
                    </div>



                    {/* ปุ่ม */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold"
                        >
                            ส่งใบสมัคร
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
