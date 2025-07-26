import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";
import { formatDateTime , translateStatus} from "./utils/dateUtils";


export default function ElectionList() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);


    // ชื่อผู้ใช้และ Role จาก LocalStorage
    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");

    const isLoggedIn = !!studentName; // ถ้าไม่มีชื่อ แปลว่ายังไม่ได้ login

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/elections", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await res.json();
                if (data.success) {
                    setElections(data.elections);
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
    }, []);

    if (loading) return <p className="p-8">กำลังโหลดข้อมูล...</p>;

    return (
        <>
            <Header studentName={studentName} />

            <div className="min-h-screen bg-purple-100 p-8">
                <h1 className="text-2xl font-bold mb-6">รายการเลือกตั้ง</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {elections.map((election) => (
                        <div
                            key={election.election_id}
                            className="bg-white p-4 rounded shadow"
                        >
                            <img
                                src={`http://localhost:5000${election.image_path}`}
                                alt="election"
                                className="w-full h-48 object-cover rounded mb-4"
                            />
                            <p className="font-semibold mb-2">{election.election_name}</p>
                            <p className="text-sm text-gray-700 mb-2">
                                {election.description}
                            </p>

                            <p className="text-sm mt-2">
                                <span className="font-semibold">วันที่เปิดรับสมัคร:</span>{" "}
                                {formatDateTime(election.registration_start)}
                            </p>
                            <p className="text-sm">
                                <span className="font-semibold">วันที่สิ้นสุดรับสมัคร:</span>{" "}
                                {formatDateTime(election.registration_end)}
                            </p>
                            <p className="text-sm mt-2">
                                <span className="font-semibold">วันที่เริ่มลงคะแนน:</span>{" "}
                                {formatDateTime(election.start_date)}
                            </p>
                            <p className="text-sm">
                                <span className="font-semibold">วันที่สิ้นสุดการลงคะแนน:</span>{" "}
                                {formatDateTime(election.end_date)}
                            </p>

                            <p className="text-sm mt-2">
                                <span className="font-semibold">สถานะ:</span>{" "}
                                <span className={`px-2 py-1 rounded text-white text-xs ${election.computed_status === "registration" ? "bg-yellow-500" :
                                        election.computed_status === "active" ? "bg-green-500" :
                                            election.computed_status === "closed" ? "bg-gray-500" :
                                                election.computed_status === "completed" ? "bg-blue-500" : "bg-purple-500"
                                    }`}>
                                    {translateStatus(election.computed_status)}
                                </span>
                            </p>

                            <div className="mt-4 flex flex-col space-y-2">
                                {/* ปุ่มดูรายละเอียด ทุกคนเห็น */}
                                <Link
                                    to={`/election/${election.election_id}`}
                                    className="block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                                >
                                    ดูรายละเอียด
                                </Link>

                                {/* ถ้า Login แล้ว */}
                                {isLoggedIn && (
                                    <>
                                        {/* นักศึกษา: เปิดรับสมัคร */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "registration" && (
                                            <button className="w-full bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600">
                                                สมัครเป็นผู้สมัคร
                                            </button>
                                        )}

                                        {/* นักศึกษา: เปิดโหวต */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "active" && (
                                            <button className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600">
                                                โหวต
                                            </button>
                                        )}

                                        {/* นักศึกษา: ปิดโหวต */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "closed" && (
                                            <button className="w-full bg-gray-400 text-white py-1 rounded cursor-not-allowed">
                                                ปิดโหวตแล้ว
                                            </button>
                                        )}

                                        {/* นักศึกษา: เสร็จสิ้น */}
                                        {roles.includes("นักศึกษา") && election.computed_status === "completed" && (
                                            <button className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600">
                                                ดูผลคะแนน
                                            </button>
                                        )}

                                        {/* ผู้ดูแล: ปุ่มจัดการ */}
                                        {roles.includes("ผู้ดูแล") && (
                                            <button className="w-full bg-purple-500 text-white py-1 rounded hover:bg-purple-600">
                                                จัดการการเลือกตั้ง
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
