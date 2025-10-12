import { useEffect, useState } from "react";
// import Header from "../Header";
import { Header } from "components";

// import { ApplicationCard } from "./ApplicationCard";
import { ApplicationCard } from "components/Student";
import { apiFetch } from "utils/apiFetch";

export default function StudentApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updated, setUpdated] = useState(false);

    // โหลดข้อมูลใบสมัครของฉัน
    useEffect(() => {
        (async () => {
            const data = await apiFetch("/api/applications/my-all");
            if (data?.success) {
                setApplications(data.applications || []);
            }
            setLoading(false);
        })();
    }, [updated]);

    const handleUpdate = async (application_id, policy, file) => {
        const formData = new FormData();
        formData.append("application_id", application_id);
        formData.append("policy", policy);
        // formData.append("photo", file);
        if (file) formData.append("photo", file);

        const res = await apiFetch("/api/applications/update-my", {
            method: "PUT",
            body: formData,
        });
        if (res?.success) setUpdated((prev) => !prev);
    };

    if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

    return (
        <>
            <Header /> {/* ไม่ต้องส่ง studentName แล้ว */}
            <div className="p-6 max-w-4xl mx-auto  bg-purple-100">
            {/* <div className="max-w-4xl mx-auto bg-purple-100 p-8"> */}

                <h1 className="text-xl font-bold mb-6">รายการใบสมัครของคุณ</h1>

                {applications.length === 0 ? (
                    <p className="text-red-500">คุณยังไม่มีใบสมัคร</p>
                ) : (
                    applications.map((app) => (
                        <ApplicationCard key={app.application_id} app={app} onUpdate={handleUpdate} />
                    ))
                )}
            </div>
        </>
    );
}
