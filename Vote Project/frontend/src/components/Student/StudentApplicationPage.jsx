import { useEffect, useState } from "react";
import Header from "../Header";
import ApplicationCard from "./ApplicationCard";

export default function StudentApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updated, setUpdated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/applications/my-all", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setApplications(data.applications || []);
                setLoading(false);
            });
    }, [updated]);

    const handleUpdate = async (application_id, policy, file) => {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("application_id", application_id);
        formData.append("policy", policy);
        if (file) formData.append("photo", file);

        const res = await fetch("http://localhost:5000/api/applications/update-my", {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const result = await res.json();
        if (result.success) setUpdated(!updated);
    };

    if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

    return (
        <>
            <Header studentName={localStorage.getItem("studentName")} />
            <div className="p-6 max-w-4xl mx-auto">
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
