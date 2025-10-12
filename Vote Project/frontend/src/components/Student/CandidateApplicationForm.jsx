import { useState } from 'react';
import Swal from "sweetalert2";
import { apiFetch } from "utils/apiFetch";

export default function CandidateApplicationForm({ student, electionId, onClose }) {
    const [policy, setPolicy] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!policy.trim() || !image) {
            Swal.fire("กรอกข้อมูลไม่ครบ", "กรุณากรอกนโยบายและเลือกรูปภาพ", "warning");
            return;
        }

        const { isConfirmed } = await Swal.fire({
            icon: "question",
            title: "ยืนยันส่งใบสมัคร?",
            text: "เมื่อส่งแล้วจะอยู่ระหว่างรออนุมัติจากกรรมการ",
            showCancelButton: true,
            confirmButtonText: "ยืนยันส่ง",
            cancelButtonText: "ยกเลิก"
        });
        if (!isConfirmed) return;

        const formData = new FormData();
        formData.append('user_id', student.user_id);
        formData.append('election_id', electionId);
        formData.append('policy', policy.trim());
        formData.append('photo', image);


        try {
            // const res = await fetch('/api/apply-candidate', {
            //     method: 'POST',
            //     body: formData
            // });
            // const data = await res.json();
            setSubmitting(true);
            const data = await apiFetch('/api/apply-candidate', {
                method: 'POST',
                body: formData
            });
            // if (data.success) {
            //     // alert(data.message || "สมัครสำเร็จ");
            //     Swal.fire("สมัครสำเร็จ!", "", "success");

            //     onClose();
            // } else {
            //     // alert(data.message || "ไม่สามารถสมัครได้");
            //     Swal.fire("สมัครสำเร็จ!", "", "warning");

            // }
            if (data?.success) {
                await Swal.fire("ส่งใบสมัครแล้ว", "รอการอนุมัติจากกรรมการ", "success");
                onClose?.();
            } else if (data?.code === 409) {
                Swal.fire("คุณได้สมัครไปแล้ว", data?.message || "", "warning");
            } else {
                Swal.fire("ไม่สามารถส่งใบสมัครได้", data?.message || "เกิดข้อผิดพลาด", "error");
            }
        } catch (err) {
            console.error(err);
            // alert("เกิดข้อผิดพลาด");
            Swal.fire("เกิดข้อผิดพลาด!", "", "warning");
        } finally {
            setSubmitting(false);
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
                            
                        />
                    </div>

                    {/* รูป */}
                    <div>
                        <label>แนบรูปภาพโปรไฟล์</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            
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
                        {/* <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold"
                        >
                            ส่งใบสมัคร
                        </button> */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded 
                                font-semibold ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                            {submitting ? "กำลังส่ง..." : "ส่งใบสมัคร"}
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
            </div >
        </div >
    );
}
