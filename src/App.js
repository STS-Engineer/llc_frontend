import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";

import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";

import QualityLessonLearned from "./pages/QualityLessonLearned";
import LlcForm from "./pages/LlcForm";
import Dashboard from "./pages/Dashboard";

import PmReviewPage from "./pages/PmReviewPage";
import FinalReviewPage from "./pages/FinalReviewPage";
import LlcEdit from "./pages/LlcEdit";

import DeploymentReviewPage from "./pages/DeploymentReviewPage";

export default function App() {
  return (
    <Routes>
      {/* ✅ au démarrage de l'app */}
      <Route path="/" element={<Navigate to="/signin" replace />} />

      {/* public */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />

      {/* protected + sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/qualityLessonLearned" element={<QualityLessonLearned />} />
          <Route element={<ProtectedRoute allowedRoles={["quality_manager"]} />}>
            <Route path="/llc/new" element={<LlcForm />} />
            <Route path="/llc/:id/edit" element={<LlcEdit />} />
          </Route>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pm-review/:id" element={<PmReviewPage />} />
          <Route path="/final-review/:id" element={<FinalReviewPage />} />
          <Route path="/dep-review/:processingId" element={<DeploymentReviewPage />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
