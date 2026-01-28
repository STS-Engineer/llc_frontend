// src/pages/DeploymentReviewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const API = "https://llc-back.azurewebsites.net/api";
const BACKEND = "https://llc-back.azurewebsites.net";

const fileUrl = (p) => (p ? `${BACKEND}/${p}` : "");

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

function normalize(v) {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// -------------------- Reject modal --------------------
function RejectModal({
  open,
  title = "Reject action",
  message = "Please provide a rejection reason (required).",
  confirmText = "Confirm reject",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading,
  value,
  setValue,
}) {
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    if (!open) {
      setLocalErr("");
      setValue?.("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const canConfirm = value.trim().length >= 3 && !loading;

  function handleConfirm() {
    const v = value.trim();
    if (v.length < 3) {
      setLocalErr("Reject reason is required.");
      return;
    }
    setLocalErr("");
    onConfirm(v);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={loading ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative w-full max-w-md",
          "rounded-3xl border bg-white/95 shadow-2xl",
          "border-slate-200 overflow-hidden",
          "animate-[pop_.14s_ease-out]",
        ].join(" ")}
      >
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={[
                "shrink-0 h-12 w-12 rounded-2xl border flex items-center justify-center",
                "bg-red-50 border-red-200 text-red-700",
              ].join(" ")}
              aria-hidden="true"
            >
              ❌
            </div>

            <div className="min-w-0">
              <div className="text-lg font-extrabold text-slate-900 leading-snug">
                {title}
              </div>
              <div className="mt-1 text-sm text-slate-600 leading-relaxed">
                {message}
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={[
                "ml-auto h-9 w-9 rounded-2xl border border-slate-200",
                "text-slate-600 hover:bg-slate-50",
                "focus:outline-none focus:ring-4 focus:ring-slate-200/70",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">
              Reject reason <span className="text-red-600">*</span>
            </label>
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (localErr) setLocalErr("");
              }}
              rows={5}
              disabled={loading}
              placeholder="Write the reason…"
              className={[
                "mt-2 w-full rounded-2xl border p-3 text-sm outline-none",
                localErr
                  ? "border-red-300 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:ring-4 focus:ring-slate-200/70",
                loading ? "opacity-80" : "",
              ].join(" ")}
            />
            {localErr ? (
              <div className="mt-2 text-sm font-semibold text-red-700">
                {localErr}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">
                Minimum 3 characters.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={[
                "px-4 py-2.5 rounded-2xl text-sm font-semibold",
                "border border-slate-300",
                "bg-slate-100 text-slate-600",
                "hover:bg-slate-200 hover:text-slate-700",
                "active:bg-slate-300 transition-colors duration-150",
                "focus:outline-none focus:ring-4 focus:ring-slate-300/60",
                loading ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={[
                "px-4 py-2.5 rounded-2xl text-sm font-semibold",
                "focus:outline-none focus:ring-4",
                "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
                !canConfirm ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pop {
            from { transform: translateY(8px) scale(.98); opacity: .0; }
            to   { transform: translateY(0)   scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// -------------------- Page --------------------
export default function DeploymentReviewPage() {
  const { processingId } = useParams(); // route: /dep-review/:processingId?token=...
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const pid = useMemo(() => Number(processingId), [processingId]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    try {
      setErr("");
      setData(null);

      if (!pid || !token) throw new Error("Invalid link (missing id/token).");

      const res = await fetch(
        `${API}/dep-processing/${pid}/review?token=${encodeURIComponent(token)}`
      );
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Failed to load Deployment");

      setData(js);
    } catch (e) {
      setErr(e?.message || "Error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, token]);

  async function decide(action, reason = "") {
    try {
      setBusy(true);
      setErr("");

      const res = await fetch(`${API}/dep-processing/${pid}/review/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action, // "approve" | "reject"
          reason: action === "reject" ? reason : "",
        }),
      });

      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Action failed");

      await load();
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800">Deployment Review</h1>
          <p className="mt-3 text-red-600 font-semibold">{err}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 p-6">
          <div className="text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  // backend expected fields:
  // data.generated_dep (pdf path)
  // data.dep_decision ("APPROVED"|"REJECTED"|...)
  // data.dep_decision_at, data.dep_reject_reason
  const decided = ["APPROVED", "REJECTED"].includes(data.dep_decision);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
            <h1 className="text-2xl font-bold text-white">Deployment Review</h1>
            <p className="text-white/80 text-sm mt-1">
              LLC #{normalize(data.llc_id)} — Processing #{normalize(data.id)}
            </p>
          </div>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <b>Evidence plant:</b> {normalize(data.evidence_plant)}
              </div>
              <div>
                <b>Applicability:</b> {normalize(data.deployment_applicability)}
              </div>
              <div>
                <b>Deployment date:</b> {fmt(data.deployment_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 p-8 space-y-5">
          {data.generated_dep ? (
            <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">
                  Deployment generated (PDF)
                </div>

                <a
                  href={fileUrl(data.generated_dep)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-sky-700 hover:underline"
                >
                  Open in new tab
                </a>
              </div>

              <iframe
                src={fileUrl(data.generated_dep)}
                title={`DEP ${data.llc_id} / ${data.evidence_plant} PDF`}
                className="w-full h-[80vh]"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              PDF not generated yet.
            </div>
          )}

          {/* Decision */}
          <div className="pt-4 border-t border-slate-100">
            {decided ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-slate-800 font-bold">
                  Decision:{" "}
                  <span
                    className={
                      data.dep_decision === "APPROVED"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }
                  >
                    {data.dep_decision}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  <div>
                    <b>Decision date:</b> {fmt(data.dep_decision_at)}
                  </div>

                  {data.dep_decision === "REJECTED" ? (
                    <div className="mt-2">
                      <b>Reject reason:</b> {normalize(data.dep_reject_reason)}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-700">Action</div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    disabled={busy}
                    onClick={() => decide("approve")}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    ✅ Approve
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => setRejectOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    ❌ Reject
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  This link is temporary. Once approved or rejected, the action cannot be performed again.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <RejectModal
        open={rejectOpen}
        title="Reject deployment approval"
        message="Please provide a rejection reason (required)."
        confirmText="Confirm reject"
        cancelText="Cancel"
        loading={busy}
        value={rejectReason}
        setValue={setRejectReason}
        onCancel={() => setRejectOpen(false)}
        onConfirm={async (reason) => {
          await decide("reject", reason);
          setRejectOpen(false);
        }}
      />
    </div>
  );
}
