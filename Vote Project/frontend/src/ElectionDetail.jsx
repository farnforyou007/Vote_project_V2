import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import { translateStatus } from "./utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
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
    const navigate = useNavigate();
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
                    alert("กรุณาเข้าสู่ระบบใหม่");
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
                    // src={`http://localhost:5000${election.image_path}`}
                    src={`http://localhost:5000${election.image_url}`}
                    alt="election"
                    className="w-full h-128 object-cover rounded mb-4"
                />
                <div className="h-[4.5rem] overflow-hidden">
                    <p className="text-sm text-gray-700 line-clamp-2 break-all">
                        {election.description}
                    </p>
                </div>
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
                {/* <p className="text-sm mt-2">
                    <strong>สถานะ:</strong>{" "}
                    <span className="text-green-600 font-bold">{election.status}</span>
                </p> */}
                <p className="text-sm mt-2">
                    <span className="font-semibold">สถานะ:</span>{" "}
                    <span className={`px-2 py-1 rounded text-white text-xs ${election.computed_status === "registration" ? "bg-violet-500" :
                        election.computed_status === "active" ? "bg-green-500" :
                            election.computed_status === "closed" ? "bg-gray-500" :
                                election.computed_status === "completed" ? "bg-slate-500" : "bg-purple-500"
                        }`}>
                        {translateStatus(election.computed_status)}
                    </span>
                </p>

                {/* ตัวอย่างปุ่มตามบทบาท */}
                <div className="mt-4 flex flex-col space-y-2">
                    <div className="mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                        >
                            ← ย้อนกลับ
                        </button>

                    </div>
                    {/* <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                        ย้อนกลับ
                    </button> */}
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
