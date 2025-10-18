import { useEffect, useState } from "react";
// import Header from "../Header";
import { Header } from "components";

import { formatDate, formatTime, formatDateTime } from "utils/dateUtils";
import { apiFetch } from "utils/apiFetch";

export default function CheckEligibilityPage() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);           // เก็บข้อมูล user จาก /me
    const [roles, setRoles] = useState([]);
    const studentName = me ? `${me.first_name} ${me.last_name}` : "";


    useEffect(() => {
        const fetchData = async () => {
            // โหลดโปรไฟล์ก่อน
            const meRes = await apiFetch("/api/users/me");
            if (meRes?.success) {
                setMe(meRes.user);
                setRoles(meRes.user.roles || []);
            }
            try {
                const data = await apiFetch("/api/eligibility/list-my");
                if (!data) return;
                if (data.success) {
                    setElections(data.elections || []);
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

    return (
        <>
            {/* <Header studentName={localStorage.getItem("studentName")} /> */}
            <Header studentName={studentName} />

            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-purple-700 border-b pb-2">รายการเลือกตั้งที่คุณมีสิทธิ์</h1>

                {loading ? (
                    <p>กำลังโหลด...</p>
                ) : !Array.isArray(elections) || elections.length === 0 ? (
                    <p className="text-red-500">คุณไม่มีสิทธิ์ในรายการเลือกตั้งใดเลย</p>
                ) : (
                    <ul className="space-y-4">
                        {elections.map((election) => (
                            <li
                                key={election.election_id}
                                className="flex justify-between items-start border p-4 rounded-lg bg-white shadow hover:shadow-md transition"
                            >
                                <div>
                                    <h2 className="font-semibold text-lg text-gray-800">{election.election_name}</h2>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">
                                        เริ่ม : {formatDateTime(election.start_date)} {"\n"}
                                        สิ้นสุด : {formatDateTime(election.end_date)}

                                    </p>
                                </div>

                                <div className="text-sm font-semibold text-right">
                                    {election.can_vote === 1 ? (
                                        <span className="text-green-600">✅ มีสิทธิ์ลงคะแนน</span>
                                    ) : (
                                        <span className="text-red-500">❌ ไม่มีสิทธิ์ลงคะแนน</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
