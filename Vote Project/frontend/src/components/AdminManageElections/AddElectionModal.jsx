// src/components/AdminManageElections/AddElectionModal.jsx
import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { apiFetch } from "../../utils/apiFetch";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
import { formatForBackend } from "../../utils/dateUtils";
export default function AddElectionModal({ onClose, onSave }) {
    const descRef = useRef(null);
    // ฟังก์ชันช่วย: คร่อม/แทรกข้อความที่เลือกใน textarea
    const wrapSelection = (before, after = "") => {
        const el = descRef.current;
        if (!el) return;
        const start = el.selectionStart;
        console.log("start : " , start);
        const end = el.selectionEnd;
        console.log("end : " , end);
        const value = form.description || "";
        console.log("value : " , value);

        const selected = value.slice(start, end);
        console.log("selected : " , selected);
        
        const next = value.slice(0, start) + before + selected + after + value.slice(end);
        console.log("next : " , next);
        console.log("valueslice : ",value.slice(0, start)," before : ", before," selected : ",selected," after : ",after , " valuesliceEND : ",value.slice(end))
        setField("description", next);
        // จัดตำแหน่งเคอร์เซอร์ใหม่
        const pos = start + before.length + selected.length + after.length;
        console.log("pos : " , pos);
        console.log("start : " , start , "before.length : " ,before.length , "selected.length : ",selected.length,"after.length : ",after.length);

        // const pos = start + before.length; // caret อยู่ระหว่าง before | after

        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    };

    // ฟังก์ชันช่วย: ทำเป็น list โดยเติม "- " นำหน้าทุกบรรทัดที่เลือก
    const makeList = () => {
        const el = descRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const value = form.description || "";
        const before = value.slice(0, start);
        const selected = value.slice(start, end) || "รายการที่ 1\nรายการที่ 2";
        const after = value.slice(end);
        const transformed = selected
            .split(/\r?\n/)
            .map(line => line.trim() ? `- ${line}` : "")
            .join("\n");
        const next = before + transformed + after;
        setField("description", next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = before.length + transformed.length;
            el.setSelectionRange(pos, pos);
        });
    };
    const [form, setForm] = useState({
        election_name: "",
        // description: "",
        description: "",
        registration_start: "",
        registration_end: "",
        start_date: "",
        end_date: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // เคลียร์ error ช่องนั้นเมื่อแก้ไข
    };

    // editor เฉพาะฟิลด์ description
    // const handleDescChange = (html) => {
    //     // html จะเป็นสตริง HTML จาก ReactQuill
    //     setField("description", html);
    // };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setField(name, value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file || null);
        if (file) setPreview(URL.createObjectURL(file));
    };

    const validate = () => {
        const e = {};
        const {
            election_name,
            registration_start,
            registration_end,
            start_date,
            end_date,
            // description,
        } = form;

        // บังคับกรอก
        if (!election_name.trim()) e.election_name = "กรุณากรอกชื่อรายการเลือกตั้ง";
        if (!registration_start) e.registration_start = "กรุณาเลือกวัน-เวลาเริ่มรับสมัคร";
        if (!registration_end) e.registration_end = "กรุณาเลือกวัน-เวลาสิ้นสุดรับสมัคร";
        if (!start_date) e.start_date = "กรุณาเลือกวัน-เวลาเริ่มลงคะแนน";
        if (!end_date) e.end_date = "กรุณาเลือกวัน-เวลาสิ้นสุดลงคะแนน";

        // ถ้าขาดบางช่องอยู่ ยังไม่ต้องตรวจตรรกะวันที่
        if (Object.keys(e).length === 0) {
            const startRegis = new Date(registration_start);
            const endRegis = new Date(registration_end);
            const startVote = new Date(start_date);
            const endVote = new Date(end_date);

            if (startRegis >= endRegis) {
                e.registration_start = "วันเริ่มรับสมัครต้องมาก่อนวันสิ้นสุดรับสมัคร";
                e.registration_end = "วันสิ้นสุดรับสมัครต้องหลังจากวันเริ่มรับสมัคร";
            }
            if (startVote >= endVote) {
                e.start_date = "วันเริ่มลงคะแนนต้องมาก่อนวันสิ้นสุดลงคะแนน";
                e.end_date = "วันสิ้นสุดลงคะแนนต้องหลังจากวันเริ่มลงคะแนน";
            }
            if (startVote < endRegis) {
                // กำหนดให้การลงคะแนนเริ่มหลังปิดรับสมัคร
                e.start_date = "วันเริ่มลงคะแนนต้องหลังจากสิ้นสุดรับสมัคร";
            }
        }

        setErrors(e);
        return { ok: Object.keys(e).length === 0, e };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { ok, e: ve } = validate();
        if (!ok) {
            // รวมข้อความ error แสดงใน SweetAlert
            const msgs = Object.values(ve).filter(Boolean);
            await Swal.fire({
                icon: "warning",
                title: "กรุณาตรวจสอบข้อมูล",
                html: `<div style="text-align:left">${msgs
                    .map((m) => `• ${m}`)
                    .join("<br/>")}</div>`,
                confirmButtonText: "รับทราบ",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: "ยืนยันการบันทึก?",
            text: "คุณแน่ใจหรือไม่ว่าต้องการเพิ่มรายการเลือกตั้งนี้",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#d33",
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
        });
        if (!confirm.isConfirmed) return;

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append("election_name", form.election_name);
            formData.append("description", form.description || "");
            // formData.append("registration_start", form.registration_start);
            // formData.append("registration_end", form.registration_end);
            // formData.append("start_date", form.start_date);
            // formData.append("end_date", form.end_date);
            formData.append("registration_start", formatForBackend(form.registration_start));
            formData.append("registration_end", formatForBackend(form.registration_end));
            formData.append("start_date", formatForBackend(form.start_date));
            formData.append("end_date", formatForBackend(form.end_date));
            if (imageFile) formData.append("image", imageFile);

            const data = await apiFetch("/api/elections", {
                method: "POST",
                body: formData,
            });

            if (!data) return; // 401 → apiFetch จะจัดการแล้ว

            if (data.success) {
                // ✅ ใช้ toast อย่างเดียวตามที่ขอ
                toast.success("เพิ่มรายการเลือกตั้งสำเร็จ");
                await onSave(formData);
                onClose();
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "เพิ่มรายการไม่สำเร็จ",
                    text: data.message || "กรุณาลองใหม่",
                });
            }
        } catch (err) {
            console.error("เพิ่มรายการเลือกตั้งผิดพลาด:", err);
            await Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-6 w-[90%] max-w-2xl relative shadow-xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-center text-xl font-bold text-purple-900 bg-purple-200 rounded py-2 mb-4 shadow-sm">
                    เพิ่มรายการเลือกตั้ง
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ชื่อรายการ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อรายการเลือกตั้ง
                        </label>
                        <input
                            type="text"
                            name="election_name"
                            value={form.election_name}
                            onChange={handleChange}
                            className={`w-full border p-2 rounded ${errors.election_name ? "border-red-500" : "border-purple-300"
                                }`}
                            placeholder="กรอกชื่อรายการเลือกตั้ง"
                        />
                        {errors.election_name && (
                            <p className="mt-1 text-xs text-red-600">{errors.election_name}</p>
                        )}
                    </div>

                    {/*  version plaintext */}
                    {/* รายละเอียด (Plain text + mini toolbar) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รายละเอียด
                        </label>

                        {/* Toolbar เบาๆ */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => wrapSelection("**", "**")}
                                className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50"
                                title="ตัวหนา (สไตล์ **ข้อความ** )"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => wrapSelection("_", "_")}
                                className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50"
                                title="ตัวเอียง (สไตล์ _ข้อความ_ )"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => wrapSelection("## ")}
                                className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50"
                                title="หัวข้อย่อย (## )"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                onClick={makeList}
                                className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50"
                                title="ลิสต์ (- ขีดหน้าแต่ละบรรทัด)"
                            >
                                • List
                            </button>
                            <span className="ml-auto text-xs text-gray-500">
                                รองรับขึ้นบรรทัดใหม่ / ย่อหน้า
                            </span>
                        </div>

                        <textarea
                            ref={descRef}
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={5}
                            placeholder="พิมพ์รายละเอียดได้เลย เช่น จุดประสงค์ กติกา ช่องทางติดต่อ ฯลฯ"
                            className="w-full border border-purple-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                            style={{ resize: "vertical" }}
                        />

                        {/* แสดงตัวอย่าง (Preview แบบเบาๆ) */}
                        <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded">
                            <div className="text-xs font-semibold text-purple-700 mb-1">ตัวอย่างการแสดงผล</div>
                            <div
                                className="text-sm text-gray-800 whitespace-pre-line leading-relaxed"
                                // แปลง **หนา** และ _เอียง_ แบบง่าย ๆ เพื่อ preview เท่านั้น
                                dangerouslySetInnerHTML={{
                                    __html: (form.description || "")
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                                        .replace(/_(.+?)_/g, "<em>$1</em>")
                                        .replace(/^## (.+)$/gm, "<span class='font-semibold text-gray-900'>$1</span>")
                                        .replace(/^- (.+)$/gm, "• $1"),
                                }}
                            />
                        </div>
                    </div>


                    {/* ช่วงรับสมัคร */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เริ่มรับสมัคร (ปี ค.ศ.)
                            </label>
                            <input
                                type="datetime-local"
                                name="registration_start"
                                value={form.registration_start}
                                onChange={handleChange}
                                className={`w-full border p-2 rounded ${errors.registration_start ? "border-red-500" : "border-purple-300"
                                    }`}
                            />
                            {errors.registration_start && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.registration_start}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สิ้นสุดรับสมัคร
                            </label>
                            <input
                                type="datetime-local"
                                name="registration_end"
                                value={form.registration_end}
                                onChange={handleChange}
                                className={`w-full border p-2 rounded ${errors.registration_end ? "border-red-500" : "border-purple-300"
                                    }`}
                            />
                            {errors.registration_end && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.registration_end}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ช่วงลงคะแนน */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เริ่มลงคะแนน (ปี ค.ศ.)
                            </label>
                            <input
                                type="datetime-local"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className={`w-full border p-2 rounded ${errors.start_date ? "border-red-500" : "border-purple-300"
                                    }`}
                            />
                            {errors.start_date && (
                                <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สิ้นสุดลงคะแนน
                            </label>
                            <input
                                type="datetime-local"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                className={`w-full border p-2 rounded ${errors.end_date ? "border-red-500" : "border-purple-300"
                                    }`}
                            />
                            {errors.end_date && (
                                <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    {/* รูปภาพ (ไม่บังคับ) */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        รูปภาพประกอบ (ไม่บังคับ)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full border border-purple-300 p-2 rounded bg-white"
                    />

                    {preview && (
                        <div className="mb-2">
                            <img
                                src={preview}
                                alt="preview"
                                className="h-40 object-contain mx-auto rounded shadow"
                            />
                        </div>
                    )}

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                        >
                            {submitting ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
