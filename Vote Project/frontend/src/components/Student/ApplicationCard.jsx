import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPen } from "react-icons/fa";
import { formatDate, formatDateTime } from "utils/dateUtils";

export default function ApplicationCard({ app, onUpdate }) {
    const [policy, setPolicy] = useState(app.campaign_slogan || "");
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(app.photo || "");
    const isEditable = app.application_status === "revision_requested";
    console.log("📦 Application data:", app);

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(app.application_id, policy, imageFile);
    };

   

    const renderStatus = () => {
        if (app.application_status === "approved") {
            return (
                <span className="text-green-600 inline-flex items-center gap-1">
                    <FaCheckCircle /> อนุมัติแล้ว
                </span>
            );
        } else if (app.application_status === "rejected") {
            return (
                <span className="text-red-600 inline-flex items-center gap-1">
                    <FaTimesCircle /> ไม่อนุมัติ
                </span>
            );
        } else if (app.application_status === "revision_requested") {
            return (
                <span className="text-blue-600 inline-flex items-center gap-1">
                    {/* ✏️ */}
                    <FaPen /> รอแก้ไขโดยผู้สมัคร
                </span>
            );
        } else {
            return (
                <span className="text-yellow-600 inline-flex items-center gap-1">
                    <FaHourglassHalf /> รอตรวจสอบ
                </span>
            );
        }
    };


    return (
        <div className="border rounded-lg p-6 shadow mb-6 bg-white">
            <div className="flex items-center gap-4 mb-4">
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="รูปผู้สมัคร"
                        className="w-24 h-24 object-cover rounded-full border"
                    />
                )}
                <div>
                    <h2 className="font-semibold text-xl">รายการเลือกตั้ง : {app.election_name}</h2>
                    <p className="text-sm">สถานะ: {renderStatus()}</p>
                    {app.application_status === "rejected" && app.rejection_reason && (
                        <p className="text-sm text-red-500 mt-1">เหตุผลที่ไม่อนุมัติ : {app.rejection_reason}</p>
                    )}
                    {app.application_status === "revision_requested" && app.rejection_reason && (
                        <p className="text-sm text-red-500 mt-1">รายละเอียดที่ต้องแก้ไข : {app.rejection_reason}</p>
                    )}
                    <p className="text-sm text-gray-500">
                        วันที่ส่งใบสมัคร : {formatDateTime(app.submitted_at)}<br />
                        วันที่ลงคะแนน : {formatDate(app.start_date)} - {formatDate(app.end_date)}
                    </p>

                </div>
            </div>

            {isEditable ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-medium block mb-1">นโยบาย</label>
                        <textarea
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            className="w-full border rounded p-2"
                            rows={4}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">อัปโหลดรูปผู้สมัครใหม่</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        บันทึกการแก้ไข
                    </button>
                </form>
            ) : (
                <div className="border p-4 rounded bg-gray-50">
                    <p className="text-sm font-semibold mb-1">นโยบาย:</p>
                    <p className="text-sm whitespace-pre-wrap mb-2">{app.campaign_slogan}</p>
                </div>
            )}
        </div>
    );
}
