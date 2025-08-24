// src/components/elections/DeleteElectionButton.jsx
import Swal from 'sweetalert2';
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { apiFetch } from "../../utils/apiFetch";

export default function DeleteElectionButton({ electionId, onDeleted }) {
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการเลือกตั้งนี้',
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
            Swal.fire("ลบรายการเลือกตั้งสำเร็จ!", "", "success");
        }
        try {
            // const token = localStorage.getItem("token");
            // const data = await apiFetch(`http://localhost:5000/api/elections/${electionId}`, {
            //     method: "DELETE",
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            const data = await apiFetch(`/api/elections/${electionId}`, {
                method: "DELETE",
            });


            // const data = await res.json();
            if (!data) return;
            if (data.success) {
                toast.success("ลบสำเร็จ");
                if (onDeleted) onDeleted(electionId);
            } else {
                toast.error("ลบไม่สำเร็จ: " + (data.message || ""));
            }
        } catch (err) {
            console.error(err);
            alert("Server Error");
        }
    };

    return (
        <button
            onClick={handleDelete}
            // className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"

        >
            <FaTrash size={12} />  ลบ
        </button>
    );
}
