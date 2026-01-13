import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const API = "http://localhost:3001/api";
const BACKEND = "http://localhost:3001";

const fileUrl = (p) => (p ? `${BACKEND}/${p}` : "");

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function PmReviewPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const llcId = useMemo(() => Number(id), [id]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  async function load() {
    try {
      setErr("");
      setData(null);

      if (!llcId || !token) {
        throw new Error("Lien invalide (id/token manquant).");
      }

      const res = await fetch(`${API}/llc/${llcId}/pm-review?token=${encodeURIComponent(token)}`);
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Impossible de charger le LLC");

      setData(js);
    } catch (e) {
      setErr(e?.message || "Erreur");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llcId, token]);

  async function decide(action) {
    try {
      setBusy(true);
      setErr("");

      const res = await fetch(`${API}/llc/${llcId}/pm-review/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action, // "approve" | "reject"
          reason: action === "reject" ? reason : "",
        }),
      });

      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Action échouée");

      // On recharge les données pour afficher décision + dates
      await load();
    } catch (e) {
      setErr(e?.message || "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800">PM Review</h1>
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

  const decided = Boolean(data.pm_decision);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
            <h1 className="text-2xl font-bold text-white">PM Review</h1>
            <p className="text-white/80 text-sm mt-1">LLC #{data.id}</p>
          </div>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div><b>Plant:</b> {data.plant || "—"}</div>
              <div><b>Validator:</b> {data.validator || "—"}</div>
              <div><b>Created:</b> {fmt(data.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 p-8 space-y-5">
          <div>
            <div className="text-sm font-semibold text-slate-700">Problem description</div>
            <div className="mt-1 text-slate-800">{data.problem_short || "—"}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700">Detailed problem</div>
            <div className="mt-1 text-slate-800 whitespace-pre-wrap">{data.problem_detail || "—"}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700">Conclusions</div>
            <div className="mt-1 text-slate-800 whitespace-pre-wrap">{data.conclusions || "—"}</div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="text-sm font-semibold text-slate-700">LLC generated (DOCX)</div>
            <div className="mt-2">
              {data.generated_llc ? (
                <a
                  href={fileUrl(data.generated_llc)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 font-semibold hover:underline"
                >
                  Download DOCX
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
          </div>

          {/* Decision */}
          <div className="pt-4 border-t border-slate-100">
            {decided ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-slate-800 font-bold">
                  Decision:{" "}
                  <span className={data.pm_decision === "APPROVED" ? "text-emerald-700" : "text-red-700"}>
                    {data.pm_decision}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  <div><b>Decision at:</b> {fmt(data.pm_decision_at)}</div>
                  <div><b>Validation date PM:</b> {fmt(data.pm_validation_date)}</div>
                  {data.pm_decision === "REJECTED" ? (
                    <div className="mt-2">
                      <b>Reject reason:</b> {data.pm_reject_reason || "—"}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-700">Action</div>

                <div className="mt-3">
                  <label className="text-sm font-semibold text-slate-700">Reject reason (optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm"
                    placeholder="Write a short reason if you refuse..."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    disabled={busy}
                    onClick={() => decide("approve")}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    ✅ Valider
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => decide("reject")}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    ❌ Refuser
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Ce lien est temporaire. Une fois validé/refusé, l’action ne peut pas être refaite.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
