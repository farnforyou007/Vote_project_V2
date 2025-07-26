// src/components/elections/DeleteElectionButton.jsx
export default function DeleteElectionButton({ electionId, onDeleted }) {
    const handleDelete = async () => {
        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?");
        if (!confirm) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/elections/${electionId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                alert("ลบสำเร็จ");
                if (onDeleted) onDeleted(electionId);
            } else {
                alert("ลบไม่สำเร็จ: " + (data.message || ""));
            }
        } catch (err) {
            console.error(err);
            alert("Server Error");
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
        >
            ลบ
        </button>
    );
}
