import React from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import { ROLES } from "../contexts/AuthContext";

/**
 * 👑 PAGE ADMIN
 * Route /admin - accessible uniquement aux administrateurs
 */
const AdminPage = () => {
    return (
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Sidebar />
        </ProtectedRoute>
    );
};

export default AdminPage;
