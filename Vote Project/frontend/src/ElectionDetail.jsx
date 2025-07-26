import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header";

const formatDateTime = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export default function ElectionDetail() {
    const { id } = useParams();
    const [election, setElection] = useState(null);
    const [loading, setLoading] = useState(true);

    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    const isLoggedIn = !!studentName;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                // const res = await fetch(`http://localhost:5000/api/elections/${id}`);
                const res = await fetch(`http://localhost:5000/api/elections/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setElection(data.election);
                } else {
                    alert("ไม่สามารถโหลดข้อมูลได้");
                }
            } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดกับ server");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>;
    if (!election) return <p className="p-8">ไม่พบข้อมูลการเลือกตั้ง</p>;

    return (
        <>
            <Header studentName={studentName} />
            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-4">
                    {election.election_name}
                </h1>
                <img
                    src={`http://localhost:5000${election.image_path}`}
                    alt="election"
                    className="w-full h-128 object-cover rounded mb-4"
                />
                <p className="text-gray-700 mb-2">{election.description}</p>
                <p className="text-sm">
                    <strong>วันที่เปิดรับสมัคร:</strong>{" "}
                    {formatDateTime(election.registration_start)}
                </p>
                <p className="text-sm">
                    <strong>วันที่สิ้นสุดรับสมัคร:</strong>{" "}
                    {formatDateTime(election.registration_end)}
                </p>
                <p className="text-sm">
                    <strong>วันที่เริ่มลงคะแนน:</strong>{" "}
                    {formatDateTime(election.start_date)}
                </p>
                <p className="text-sm">
                    <strong>วันที่สิ้นสุดการลงคะแนน:</strong>{" "}
                    {formatDateTime(election.end_date)}
                </p>
                <p className="text-sm mt-2">
                    <strong>สถานะ:</strong>{" "}
                    <span className="text-green-600 font-bold">{election.status}</span>
                </p>

                {/* ตัวอย่างปุ่มตามบทบาท */}
                <div className="mt-4 flex flex-col space-y-2">
                    {isLoggedIn && roles.includes("นักศึกษา") && election.status === "active" && (
                        <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                            โหวต
                        </button>
                    )}
                    {isLoggedIn && roles.includes("นักศึกษา") && election.status === "registration" && (
                        <button className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
                            สมัครเป็นผู้สมัคร
                        </button>
                    )}
                    {isLoggedIn && roles.includes("ผู้ดูแล") && (
                        <button className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600">
                            จัดการการเลือกตั้ง
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
