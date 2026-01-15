import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";

import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";

import Dashboard from "./pages//Dashboard";
import LlcForm from "./pages/LlcForm";
import KpisPage from "./pages/Kpis";

import PmReviewPage from "./PmReviewPage";
import FinalReviewPage from "./FinalReviewPage";
import LlcEdit from "./pages/LlcEdit";

export default function App() {
  return (
    <Routes>
      {/* ✅ au démarrage de l'app */}
      <Route path="/" element={<Navigate to="/signup" replace />} />

      {/* public */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />

      {/* protected + sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/llc/new" element={<LlcForm />} />
          <Route path="/kpis" element={<KpisPage />} />
          <Route path="/pm-review/:id" element={<PmReviewPage />} />
          <Route path="/final-review/:id" element={<FinalReviewPage />} />
          <Route path="/llc/:id/edit" element={<LlcEdit />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
