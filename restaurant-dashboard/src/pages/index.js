import React from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import { ROLES } from "../contexts/AuthContext";

/**
 * 🏠 PAGE D'ACCUEIL
 * Route principale protégée - accessible aux admins et restaurants
 */
const Home = () => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RESTAURANT]}>
      <Sidebar />
    </ProtectedRoute>
  );
};

export default Home;
