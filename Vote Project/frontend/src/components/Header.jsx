import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaAddressCard } from "react-icons/fa";
import { MdHowToVote } from "react-icons/md";
import { IoHomeSharp } from "react-icons/io5";
import { IoLogOut, IoLogIn } from "react-icons/io5";
import { FaClipboardCheck, FaUserCog } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { apiFetch } from "../utils/apiFetch";
import { tokenService } from "../utils/tokenService";
import { MdDashboardCustomize } from "react-icons/md";
import { FaGear } from "react-icons/fa6";
export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    // const isLoggedIn = !!studentName;
    const [me, setMe] = useState(null);
    const isLoggedIn = !!me;
    const location = useLocation();
    const isLoginPage = location.pathname === "/login";
    const [hasApplied, setHasApplied] = useState(false);

    // const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    // const [selectedRole, setSelectedRole] = useState(() => {
    //     return localStorage.getItem("selectedRole") || "";
    // });
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");

    useEffect(() => {
        // const roleInStorage = localStorage.getItem("selectedRole");
        // if (!roleInStorage && roles.length > 0) {
        //     // ถ้ายังไม่มี selectedRole ให้ตั้งค่าตัวแรกใน roles
        //     localStorage.setItem("selectedRole", roles[0]);
        //     setSelectedRole(roles[0]);
        // } else {
        //     setSelectedRole(roleInStorage || "");
        // }
        // const updateRole = () => {
        //     const role = localStorage.getItem("selectedRole") || "";
        //     setSelectedRole(role);
        // };

        // window.addEventListener("role-changed", updateRole);

        // // initial load
        // updateRole();

        // return () => {
        //     window.removeEventListener("role-changed", updateRole);
        // };
        (async () => {
            const meRes = await apiFetch("http://localhost:5000/api/users/me");
            if (meRes?.success) {
                setMe(meRes.user);
                setRoles(meRes.user.roles || []);
                setSelectedRole(sessionStorage.getItem("selectedRole") || (meRes.user.roles?.[0] || ""));
            }
        })();
        const updateRole = () => {
            setSelectedRole(sessionStorage.getItem("selectedRole") || "");
        };
        window.addEventListener("role-changed", updateRole);
        return () => window.removeEventListener("role-changed", updateRole);
    }, []);


    useEffect(() => {
        const checkApplicationStatus = async () => {
            if (selectedRole !== "นักศึกษา") return;
            const data = await apiFetch("/api/applications/check");
            // if (data) setHasApplied(data.hasApplied);
            if (!data) return;
            setHasApplied(data.hasApplied);
        };
        checkApplicationStatus();
    }, [selectedRole]);



    const handleLogout = () => {
        localStorage.clear();
        // sessionStorage.removeItem("token");
        tokenService.remove();
        setRoles([]);
        setSelectedRole("");
        window.location.href = "/";
    };
    
    console.log("role : ", selectedRole);
    const MenuItem = ({ href, icon, label }) => (
        <li>
            <a
                href={href}
                className="flex items-center gap-2 p-2 rounded-md bg-white hover:bg-purple-200 transition-colors"
            >
                <span className="text-purple-600">{icon}</span>
                <span className="text-gray-800">{label}</span>
            </a>
        </li>
    );

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between bg-purple-300 p-3 relative">
                {/* ซ้าย */}
                <div className="flex items-center space-x-1">
                    <button
                        className="text-2xl text-black focus:outline-none"
                        onClick={() => setMenuOpen(true)}
                    >
                        &#9776;
                    </button>
                    <img src={logo} alt="Logo" className="w-10 h-10" />
                </div>

                {/* กลาง */}
                <div className="flex-1 flex justify-center px-2">
                    <span className="font-semibold text-sm md:text-base text-center truncate max-w-[200px] md:max-w-none text-black">
                        ระบบการเลือกตั้งออนไลน์ วิทยาลัยอาชีวศึกษายะลา
                    </span>
                </div>

                {/* ขวา */}
                <div className="flex items-center space-x-1">
                    <span className="text-sm md:text-base truncate max-w-[80px] md:max-w-none text-black">
                        {/* {studentName || "ผู้ใช้งาน"} */}
                        {me ? ` ${me.first_name} ${me.last_name}` : "ชื่อผู้ใช้งาน "}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-purple-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
            </header>

            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 transition-opacity ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                onClick={() => setMenuOpen(false)}
            >
                <div className="absolute inset-0 bg-black bg-opacity-40" />
            </div>

            {/* Sidebar slide-in */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-purple-100 shadow-lg z-50 transform transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 flex justify-between items-center border-b border-purple-200 bg-purple-300">
                    <span className="font-semibold text-black">เมนู</span>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="text-2xl text-black"
                    >
                        ✕
                    </button>
                </div>
                <ul className="p-4 space-y-2">
                    <MenuItem href="/elections" label="หน้าหลัก" icon={<IoHomeSharp className="text-xl text-purple-700" />} />

                    {/* {!studentName && ( */}
                    {!me && (

                        <MenuItem
                            href="/login"
                            label="เข้าสู่ระบบ"
                            icon={<IoLogIn className="text-lg text-emerald-500" size={22} />}
                        />
                    )}

                    {/* {!studentName && <MenuItem href="/login" />} */}

                    {selectedRole === "นักศึกษา" && (
                        <>
                            <MenuItem
                                href="/my-votes-history"
                                label="ประวัติการใช้สิทธิ์"
                                icon={<MdHowToVote className="text-2xl text-purple-700" />}
                            />
                            <MenuItem
                                href="/profile"
                                icon={<FaAddressCard className="text-xl text-purple-700" />}
                                label="ประวัติส่วนตัว"

                            />
                            <MenuItem
                                href="/check-eligibility"
                                label="ตรวจสอบสิทธิ์"
                                icon={<FaClipboardCheck className="text-xl text-purple-700" />}
                            />
                            {hasApplied && (
                                <MenuItem
                                    // href="/application-status"
                                    href="/applicationPage"

                                    label="ตรวจสอบใบสมัคร"
                                    icon={<FaEye className="text-xl text-purple-700" />}
                                />
                            )}
                        </>
                    )}

                    {selectedRole === "กรรมการ" && (
                        <>

                            <MenuItem
                                href="/profile"
                                icon={<FaAddressCard className="text-xl text-purple-700" />}
                                label="ประวัติส่วนตัว"

                            />
                            <MenuItem
                                href="/review-applications"
                                label="จัดการใบสมัคร"
                                icon={<FaEye className="text-xl text-purple-700" />}
                            />

                        </>

                    )}

                    {selectedRole === "ผู้สมัคร" && (
                        <>
                            <MenuItem
                                href="/my-votes"
                                label="ประวัติการใช้สิทธิ์"
                                icon={<MdHowToVote className="text-2xl text-purple-700" />}
                            />
                            <MenuItem
                                href="/profile"
                                icon={<FaAddressCard className="text-xl text-purple-700" />}
                                label="ประวัติส่วนตัว"

                            />

                            <MenuItem
                                href="/applicationPage"
                                label="ตรวจสอบใบสมัคร"
                                icon={<FaEye className="text-xl text-purple-700" />}

                            />

                        </>
                    )}

                    {roles.includes("ผู้ดูแล") && (
                        <>
                            <MenuItem
                                href="/admin/dash-board"
                                icon={<MdDashboardCustomize className="text-xl text-purple-700" />}
                                label="แดชบอร์ด"

                            />
                            <MenuItem
                                href="/profile"
                                icon={<FaAddressCard className="text-xl text-purple-700" />}
                                label="ประวัติส่วนตัว"

                            />
                            <MenuItem
                                href="/admin/manage-users"
                                label="จัดการผู้ใช้"
                                icon={<FaUserCog className="text-xl text-purple-700" />}


                            />
                            <MenuItem
                                href="/admin/elections"
                                label="จัดการรายการเลือกตั้ง"
                                icon={<FaGear  className="text-xm text-purple-700" />}

                            />



                        </>
                    )}

                    <li>
                        {isLoggedIn && !isLoginPage && (

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full text-left p-2 rounded-md bg-white hover:bg-red-100 transition-colors text-red-600"
                            >
                                <span><IoLogOut className="text-xl text-red-700" /></span>
                                ออกจากระบบ
                            </button>
                        )}
                    </li>
                </ul>
            </aside>
        </>
    );
}
