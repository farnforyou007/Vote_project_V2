import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

import EditElectionButton from "../components/AdminManageElections/EditElectionButton";
import DeleteElectionButton from "../components/AdminManageElections/DeleteElectionButton";
import ApplicantsButton from "../components/AdminManageElections/ApplicantsButton";

import ManageVoteButton from "../components/AdminManageElections/ManageVoteButton";
import ViewResultButton from "../components/AdminManageElections/ViewResultButton";
import EditElectionModal from "../components/AdminManageElections/EditElectionModal";
import AddElectionModal from "../components/AdminManageElections/AddElectionModal";
import { formatDate, formatTime } from "../utils/dateUtils";
import { translateStatus } from "../utils/electionStatus"
import { apiFetch } from "../utils/apiFetch";

import { FaEye, FaEyeSlash } from "react-icons/fa";


export default function AdminElectionList() {
    const [elections, setElections] = useState([]);
    const [search, setSearch] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

    const studentName = localStorage.getItem("studentName") || "";
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");

    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [electionToEdit, setElectionToEdit] = useState(null);

    const fetchElections = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await apiFetch("http://localhost:5000/api/elections", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            // const data = await res.json();
                if (!data) return;

            if (data.success) {
                // setElections(data.data);
                setElections(data.data || data.elections || []);
            } else {
                alert("ไม่สามารถโหลดข้อมูลได้");
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดกับ server");
        }
    };

    useEffect(() => {
        fetchElections();
    }, []);

    // const handleSave = async (formData) => {
    //     const token = localStorage.getItem("token");

    //     const res = await fetch(`http://localhost:5000/api/elections/${electionToEdit.election_id}`, {
    //         method: "PUT",
    //         headers: { Authorization: `Bearer ${token}` },
    //         body: formData,
    //     });

    //     const data = await res.json();
    //     if (data.success) {
    //         // alert("อัปเดตสำเร็จ");

    //         // ✅ โหลดข้อมูลใหม่หลังอัปเดต
    //         await fetchElections();

    //         setShowEditModal(false); // ✅ ปิด modal ทีหลัง
    //     } else {
    //         alert("อัปเดตไม่สำเร็จ");
    //     }
    // };

    const handleEdit = (election) => {
        setElectionToEdit(election);
        // fetchElections();
        setShowEditModal(true);

    };

    // const handleDelete = async (id) => {
    //     if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) return;
    //     try {
    //         const token = localStorage.getItem("token");
    //         const res = await fetch(`http://localhost:5000/api/elections/${id}`, {
    //             method: "DELETE",
    //             headers: { Authorization: `Bearer ${token}` },
    //         });
    //         const data = await res.json();
    //         if (data.success) {
    //             alert("ลบสำเร็จ");
    //             setElections(prev => prev.filter(e => e.election_id !== id));
    //         } else {
    //             alert("ลบไม่สำเร็จ");
    //         }
    //     } catch (err) {
    //         console.error(err);
    //         alert("Server Error");
    //     }
    // };

    const toggleVisibility = async (election) => {
        const token = localStorage.getItem("token");
        try {
            const data = await apiFetch(`http://localhost:5000/api/elections/${election.election_id}/visibility`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_hidden: !election.is_hidden }),
            });
            // const data = await res.json();
            if(!data) return;

            if (data.success) {
                // refresh เฉพาะแถว หรือจะ refetch ทั้งหน้าก็ได้
                setElections(prev =>
                    prev.map(it => it.election_id === election.election_id ? { ...it, is_hidden: !election.is_hidden } : it)
                );
            } else {
                alert("สลับการซ่อนล้มเหลว");
            }
        } catch (err) {
            console.error(err);
            alert("สลับการซ่อนล้มเหลว (เครือข่าย)");
        }
    };


    const filtered = (elections || []).filter(e =>
        e.election_name.toLowerCase().includes(search.toLowerCase())
    );


    if (!roles.includes("ผู้ดูแล")) {
        return <p className="text-red-500 p-10 text-center">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>;
    }

    return (

        <>
            <Header studentName={studentName} />
            <div className="p-6 bg-gray-100 min-h-screen">
                <h1 className="text-xl font-bold mb-4">จัดการรายการเลือกตั้ง</h1>

                {/* Tools */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}
                        className="border p-2 rounded bg-gray-100">
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n} แถว</option>)}
                    </select>

                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหารายการเลือกตั้ง" className="border p-2 rounded flex-1 bg-gray-100" />

                    <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-semibold"
                        onClick={() => setShowAddModal(true)}>
                        + เพิ่มรายการเลือกตั้ง
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 text-sm">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 text-center">ลำดับ</th>
                                <th className="p-2">รายการเลือกตั้ง</th>
                                <th className="p-2 text-center">วันที่ลงคะแนน</th>
                                <th className="p-2 text-center">เวลา</th>
                                <th className="p-2 text-center">สถานะ</th>
                                <th className="p-2 text-center">เมนูจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, rowsPerPage).map((e, index) => (
                                <tr key={e.election_id} className="border-t hover:bg-gray-50">
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2">{e.election_name}
                                        {e.is_hidden ? (
                                            <span
                                                className="ml-2 text-[11px] bg-gray-600 text-white px-2 py-0.5 rounded align-middle"
                                            // className="bg-gr-500 text-white px-2 py-1 rounded  hover:bg-yellow-600"
                                            >
                                                ซ่อนอยู่
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="p-2 text-center">
                                        {formatDate(e.start_date)} - {formatDate(e.end_date)}
                                    </td>
                                    <td className="p-2 text-center">
                                        {formatTime(e.start_date)} - {formatTime(e.end_date)}
                                    </td>
                                    <td className="p-2 text-center">
                                        {/* <span
                                            className={`px-2 py-1 rounded text-white ${e.computed_status === "registration"
                                                ? "bg-violet-500"
                                                : e.computed_status === "active"
                                                    ? "bg-green-500"
                                                    : e.computed_status === "closed"
                                                        ? "bg-gray-500"
                                                        : e.computed_status === "completed"
                                                            ? "bg-slate-500"
                                                            : "bg-purple-500"
                                                }`}
                                        > */}
                                        <span className={`px-2 py-1 rounded text-white text-xs 
                                            ${e.effective_status === "REGISTRATION_OPEN" ? "bg-violet-500" :
                                                e.effective_status === "VOTING_OPEN" ? "bg-green-500" :
                                                    e.effective_status === "CLOSED_BY_ADMIN" ? "bg-gray-500" :
                                                        e.effective_status === "ENDED" ? "bg-slate-500" :
                                                            e.effective_status === "WAITING_VOTE" ? "bg-amber-500" :
                                                                "bg-purple-500"
                                            }`
                                        }>
                                            {translateStatus(e.effective_status || e.auto_status)}
                                        </span>


                                    </td>
                                    {/* <td className="p-2 text-center space-x-1"> */}
                                    <td className="p-2 text-center">
                                        {/* <div className="flex items-center justify-center gap-2 flex-nowrap"> */}
                                        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto whitespace-nowrap justify-start md:justify-center">
                                            <ManageVoteButton onClick={() => navigate(`/admin/election/${e.election_id}/eligibility`)} />

                                            <ApplicantsButton electionId={e.election_id} />

                                            <EditElectionButton onClick={() => handleEdit(e)} />


                                            {/* <DeleteElectionButton electionId={e.election_id} onDeleted={handleDelete} /> */}
                                            <DeleteElectionButton
                                                electionId={e.election_id}
                                                onDeleted={(deletedId) =>
                                                    setElections((prev) => prev.filter((el) => el.election_id !== deletedId))
                                                }
                                            />

                                            <ViewResultButton electionId={e.election_id} />

                                            <button
                                                onClick={() => toggleVisibility(e)}
                                                className={`${e.is_hidden ? 'bg-gray-500 hover:bg-gray-600' : 'bg-slate-500 hover:bg-slate-600'} text-white px-2 py-1 rounded`}
                                                title={e.is_hidden ? 'แสดงบนหน้ารวม' : 'ซ่อนจากหน้ารวม'}
                                            >
                                                {e.is_hidden ? <FaEye className="inline" size={16} /> : <FaEyeSlash className="inline" size={16} />}
                                                {/* {' '} {e.is_hidden ? 'เลิกซ่อน' : 'ซ่อน'} */}
                                            </button>
                                        </div>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showEditModal && (
                <EditElectionModal
                    election={electionToEdit}
                    onClose={() => setShowEditModal(false)}
                    // onSave={handleSave}
                    onSave={fetchElections}
                />
            )}
            {elections.length === 0 && (
                <p className="text-center text-gray-500 mt-6">ไม่มีรายการเลือกตั้ง</p>
            )}

            {showAddModal && (
                <AddElectionModal
                    onClose={() => setShowAddModal(false)}
                    onSave={fetchElections}
                />
            )}

        </>
    );
}
