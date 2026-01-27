// src/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthed, user } = useAuth();
  const location = useLocation();
  
  // ✅ pas connecté -> go signin + garder la destination
  if (!isAuthed) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/signin?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
