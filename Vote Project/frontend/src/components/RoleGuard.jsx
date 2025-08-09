export default function RoleGuard({ allowed, children }) {
    const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    console.log("🛡️ RoleGuard: roles =", roles);
    if (!roles.some(r => allowed.includes(r))) return null;
    return children;
}
