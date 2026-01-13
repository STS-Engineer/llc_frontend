// src/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export default function ProtectedRoute() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/signin" replace />;
  return <Outlet />;
}
