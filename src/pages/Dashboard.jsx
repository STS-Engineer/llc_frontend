import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";

const API = "http://localhost:3001/api";
const BACKEND = "http://localhost:3001";

// -------------------- helpers --------------------
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text().catch(() => "");
  return text;
}

function fmtDate(d) {
  try {
    if (!d) return "";
    return new Date(d).toLocaleDateString();
  } catch {
    return d ?? "";
  }
}

function normalize(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");

  if (typeof v === "string") {
    const s = v.trim();
    if (
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith("{") && s.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.join(", ");
        return JSON.stringify(parsed);
      } catch {}
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return fmtDate(s);
  }

  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const fileUrl = (storage_path) => `${BACKEND}/${storage_path}`;

const SCOPE = {
  BAD_PART: "BAD_PART",
  GOOD_PART: "GOOD_PART",
  SITUATION_BEFORE: "SITUATION_BEFORE",
  SITUATION_AFTER: "SITUATION_AFTER",
};

function byScope(rowAttachments, scope) {
  const arr = Array.isArray(rowAttachments) ? rowAttachments : [];
  return arr.filter((a) => a && a.scope === scope);
}

// detect images
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
function isImage(filename) {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

const PM_DECISION_UI = {
  PENDING_FOR_VALIDATION: {
    label: "PENDING FOR VALIDATION",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  APPROVED: {
    label: "APPROVED",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  REJECTED: {
    label: "REJECTED",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

function PmDecisionBadge({ value }) {
  const ui = PM_DECISION_UI[value];
  if (!ui) return <span className="text-slate-400">—</span>;

  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
        ui.className,
      ].join(" ")}
    >
      {ui.label}
    </span>
  );
}

const FINAL_DECISION_UI = {
  PENDING_FOR_VALIDATION: {
    label: "PENDING FOR VALIDATION",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  APPROVED: {
    label: "APPROVED",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  REJECTED: {
    label: "REJECTED",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

function FinalDecisionBadge({ value }) {
  const ui = FINAL_DECISION_UI[value];
  if (!ui) return <span className="text-slate-400">—</span>;

  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
        ui.className,
      ].join(" ")}
    >
      {ui.label}
    </span>
  );
}

// -------------------- UI small components --------------------
function Chevron({ open }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center h-8 w-8 rounded-lg",
        "border border-slate-200 bg-white text-slate-700",
        "transition-transform",
        open ? "rotate-90" : "rotate-0",
      ].join(" ")}
      aria-hidden="true"
    >
      ▶
    </span>
  );
}

function AttachmentThumbnail({ attachment }) {
  if (!attachment) return null;
  const url = fileUrl(attachment.storage_path);

  if (!isImage(attachment.filename)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sky-700 hover:underline text-xs"
        title={attachment.filename}
      >
        {attachment.filename}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="relative inline-block group"
      title={attachment.filename}
    >
      <img
        src={url}
        alt={attachment.filename}
        className="h-8 w-8 object-cover rounded-lg border border-slate-200 transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-full
          z-50
          mt-2
          hidden
          -translate-x-1/2
          group-hover:block
        "
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-2 w-36">
          <img
            src={url}
            alt={attachment.filename}
            className="h-38 w-full object-cover rounded-xl"
            loading="lazy"
          />
          <div className="mt-2 text-[11px] text-slate-700 break-words">
            {attachment.filename}
          </div>
        </div>
      </div>
    </a>
  );
}

function DocxThumb({ url, title }) {
  const [open, setOpen] = useState(false);

  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url
  )}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col items-center gap-1"
        title="View document"
      >
        <div className="h-12 w-10 rounded-lg border border-slate-200 bg-sky-50 flex items-center justify-center shadow-sm group-hover:shadow-md transition">
          📄
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-800">{title}</div>
              <div className="flex gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-sky-700 hover:underline"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <iframe
              src={viewerUrl}
              className="w-full h-full"
              frameBorder="0"
              title="DOCX preview"
            />
          </div>
        </div>
      )}
    </>
  );
}

function AttachCell({ attachments }) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a) => (
        <AttachmentThumbnail
          key={a.id ?? `${a.filename}-${a.storage_path}`}
          attachment={a}
        />
      ))}
    </div>
  );
}

// -------------------- Root cause columns (expanded row) --------------------
const ROOT_CAUSE_COLUMNS = [
  { label: "Root cause", key: "root_cause" },
  { label: "Detailed cause description", key: "detailed_cause_description" },
  { label: "Solution description", key: "solution_description" },
  { label: "Conclusion", key: "conclusion" },
  { label: "Process", key: "process" },
  { label: "Origin", key: "origin" },
  { label: "Attachments", key: "__attachments", isAttachments: true },
];

// -------------------- expanded content row --------------------
function ExpandedRow({ details, loading, error }) {
  if (loading) return <div className="p-5 text-slate-600">Loading details...</div>;
  if (error) return <div className="p-5 text-red-600 font-semibold">{error}</div>;
  if (!details) return <div className="p-5 text-slate-500">No details.</div>;

  const rc = Array.isArray(details.rootCauses) ? details.rootCauses : [];

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-2">
        <div className="text-sm font-bold text-slate-800">Root causes</div>

        {rc.length === 0 ? (
          <div className="text-slate-500">No root causes.</div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-auto bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left">
                    {ROOT_CAUSE_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className="p-3 whitespace-nowrap font-semibold text-slate-700"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rc.map((rci) => (
                    <tr
                      key={rci.id ?? JSON.stringify(rci)}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      {ROOT_CAUSE_COLUMNS.map((c) => (
                        <td key={c.key} className="p-3 text-slate-600 align-top">
                          <div className="max-w-[520px] break-words">
                            {c.isAttachments ? (
                              <AttachCell attachments={rci.attachments} />
                            ) : (
                              normalize(rci[c.key])
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionsCell({ row, onEdit, onDelete }) {
  // ✅ edit allowed when PM rejected OR FINAL rejected
  const canEdit = row.pm_decision === "REJECTED" || row.final_decision === "REJECTED";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(row.id)}
        disabled={!canEdit}
        className={[
          "px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200",
          canEdit
            ? "hover:bg-slate-50 text-slate-700"
            : "text-slate-400 bg-slate-50 cursor-not-allowed opacity-60",
        ].join(" ")}
        title={
          canEdit
            ? "Edit"
            : "Edit available only when PM decision is REJECTED or Final decision is REJECTED"
        }
      >
        ✏️ Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(row.id)}
        className="px-3 py-1 rounded-xl text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50"
        title="Delete"
      >
        🗑️ Delete
      </button>
    </div>
  );
}

function Toast({ show, message, type = "success", onClose }) {
  if (!show) return null;

  return (
    <div className="fixed top-5 right-5 z-[100]">
      <div
        className={[
          "rounded-2xl border shadow-xl px-4 py-3 text-sm font-semibold",
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">{message}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-xl border border-slate-200 hover:bg-white/60 text-slate-700"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title = "Confirm action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading,
  variant = "danger",
}) {
  if (!open) return null;
  const danger = variant === "danger";

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
          "border-slate-200",
          "overflow-hidden",
          "animate-[pop_.14s_ease-out]",
        ].join(" ")}
      >
        <div
          className={[
            "h-1 w-full",
            danger
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-400"
              : "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500",
          ].join(" ")}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={[
                "shrink-0 h-12 w-12 rounded-2xl border flex items-center justify-center",
                danger
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-sky-50 border-sky-200 text-sky-700",
              ].join(" ")}
              aria-hidden="true"
            >
              {danger ? "🗑️" : "ℹ️"}
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
                "active:bg-slate-300",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-4 focus:ring-slate-300/60",
                loading ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={[
                "px-4 py-2.5 rounded-2xl text-sm font-semibold",
                "focus:outline-none focus:ring-4",
                danger
                  ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200"
                  : "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-200",
                loading ? "opacity-70 cursor-not-allowed" : "",
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

// -------------------- ✅ Statuses config --------------------
const STATUSES = [
  { key: "IN_PREPARATION", label: "LLC in preparation", value: "IN_PREPARATION" },
  { key: "WAITING_FOR_VALIDATION", label: "Waiting for validation", value: "WAITING_FOR_VALIDATION" },
  { key: "DEPLOYMENT_IN_PROGRESS", label: "Deployment in progress", value: "DEPLOYMENT_IN_PROGRESS" },
  { key: "DEPLOYMENT_PROCESSING", label: "Deployment processing", value: "DEPLOYMENT_PROCESSING" },
  { key: "DEPLOYMENT_REJECTED", label: "Deployment rejected", value: "DEPLOYMENT_REJECTED" },
  { key: "DEPLOYMENT_VALIDATION", label: "Deployment validation", value: "DEPLOYMENT_VALIDATION" },
  { key: "CLOSED", label: "Closed", value: "CLOSED" },
];

// -------------------- ✅ Columns PER TABLE --------------------
const COLUMNS_BASE = [
  { label: "Problem description", key: "problem_short" },
  { label: "Category", key: "category" },
  { label: "LLC of type", key: "llc_type" },
  { label: "Customer", key: "customer" },
  { label: "Product family", key: "product_family" },
  { label: "Product type", key: "product_type" },
  { label: "Quality detection", key: "quality_detection" },
  { label: "Application label", key: "application_label" },
  { label: "Product line label", key: "product_line_label" },
  { label: "Part / Machine number", key: "part_or_machine_number" },
  { label: "Editor", key: "editor" },
  { label: "Plant", key: "plant" },
  { label: "Failure mode", key: "failure_mode" },
  { label: "Detailed problem description", key: "problem_detail" },
  { label: "Bad Part", key: "__bad", scope: SCOPE.BAD_PART, isScopeAttachments: true },
  { label: "Good Part", key: "__good", scope: SCOPE.GOOD_PART, isScopeAttachments: true },
  { label: "Conclusions", key: "conclusions" },
  { label: "Situation Before", key: "__before", scope: SCOPE.SITUATION_BEFORE, isScopeAttachments: true },
  { label: "Situation After", key: "__after", scope: SCOPE.SITUATION_AFTER, isScopeAttachments: true },
  { label: "Validator", key: "validator" },
  { label: "LLC generated", key: "__generated_docx", isGeneratedDocx: true },
  { label: "Creation date", key: "created_at", isDate: true },
  { label: "PM decision", key: "pm_decision" },
];

const COLUMNS_BY_STATUS = {
  // ✅ we will inject PM validation date + Final decision dynamically ONLY when final rejected exists
  IN_PREPARATION: [...COLUMNS_BASE, { label: "Actions", key: "__actions", isActions: true }],

  WAITING_FOR_VALIDATION: [
    ...COLUMNS_BASE,
    { label: "PM validation date", key: "pm_validation_date", isDate: true },
    { label: "Final decision", key: "final_decision" },
  ],

  DEPLOYMENT_IN_PROGRESS: [
    ...COLUMNS_BASE,
    { label: "PM validation date", key: "pm_validation_date", isDate: true },
    { label: "Final decision", key: "final_decision" },
    { label: "Final validation date", key: "final_validation_date", isDate: true },
  ],

  DEPLOYMENT_PROCESSING: [...COLUMNS_BASE],
  DEPLOYMENT_REJECTED: [...COLUMNS_BASE],
  DEPLOYMENT_VALIDATION: [...COLUMNS_BASE],
  CLOSED: [...COLUMNS_BASE],
};

// -------------------- main --------------------
export default function Dashboard() {
  const [rowsByStatus, setRowsByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, []]))
  );
  const [loadingByStatus, setLoadingByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, true]))
  );
  const [errorByStatus, setErrorByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, ""]))
  );

  // ✅ GLOBAL search to filter status tables by name
  const [statusSearch, setStatusSearch] = useState("");

  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [detailsById, setDetailsById] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  async function loadStatusList(statusValue, statusKey) {
    setLoadingByStatus((p) => ({ ...p, [statusKey]: true }));
    setErrorByStatus((p) => ({ ...p, [statusKey]: "" }));

    try {
      const data = await fetchWithAuth(
        `${API}/llc?status=${encodeURIComponent(statusValue)}`,
        { method: "GET" }
      );
      setRowsByStatus((p) => ({ ...p, [statusKey]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error("loadStatusList error:", statusKey, e);
      setRowsByStatus((p) => ({ ...p, [statusKey]: [] }));
      setErrorByStatus((p) => ({ ...p, [statusKey]: e?.message || "Failed to load list" }));
    } finally {
      setLoadingByStatus((p) => ({ ...p, [statusKey]: false }));
    }
  }

  async function loadAllLists() {
    await Promise.all(STATUSES.map((s) => loadStatusList(s.value, s.key)));
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    loadAllLists();
  }, []);

  async function ensureDetails(id) {
    const existing = detailsById[id];
    if (existing?.data || existing?.loading) return;

    setDetailsById((prev) => ({
      ...prev,
      [id]: { data: null, loading: true, error: "" },
    }));

    try {
      const data = await fetchWithAuth(`${API}/llc/${id}`, { method: "GET" });
      setDetailsById((prev) => ({
        ...prev,
        [id]: { data, loading: false, error: "" },
      }));
    } catch (e) {
      console.error("ensureDetails error:", e);
      setDetailsById((prev) => ({
        ...prev,
        [id]: {
          data: null,
          loading: false,
          error: e?.message || "Failed to load details",
        },
      }));
    }
  }

  async function toggleExpand(id) {
    const isExpanding = !expandedIds.has(id);

    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (isExpanding) await ensureDetails(id);
  }

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 2500);
  }

  function requestDelete(id) {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;

    setDeleting(true);
    try {
      await fetchWithAuth(`${API}/llc/${deleteTargetId}`, { method: "DELETE" });
      setConfirmOpen(false);
      setDeleteTargetId(null);

      await loadAllLists();
      showToast("✅ LLC deleted successfully", "success");
    } catch (e) {
      showToast(e?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteTargetId(null);
  }

  function onEditRow(id) {
    window.location.href = `/llc/${id}/edit`;
  }

  // ✅ filter the status tables shown
  const visibleStatuses = useMemo(() => {
    const q = statusSearch.trim().toLowerCase();
    if (!q) return STATUSES;

    return STATUSES.filter((s) => {
      const hay = `${s.label} ${s.key} ${s.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [statusSearch]);

  function StatusTable({ title, statusKey }) {
    const rows = rowsByStatus[statusKey] || [];
    const loading = !!loadingByStatus[statusKey];
    const listError = errorByStatus[statusKey] || "";

    // ✅ base columns
    let columns = COLUMNS_BY_STATUS[statusKey] || [];

    // ✅ Only for IN_PREPARATION:
    // add PM validation date + Final decision ONLY if there is at least one FINAL REJECTED row
    const hasFinalRejected =
      statusKey === "IN_PREPARATION" &&
      rows.some((x) => x.final_decision === "REJECTED");

    if (hasFinalRejected) {
      const extra = [
        { label: "PM validation date", key: "pm_validation_date", isDate: true },
        { label: "Final decision", key: "final_decision" },
      ];

      // insert right after pm_decision
      const idxPm = columns.findIndex((c) => c.key === "pm_decision");
      if (idxPm >= 0) {
        columns = [
          ...columns.slice(0, idxPm + 1),
          ...extra,
          ...columns.slice(idxPm + 1),
        ];
      } else {
        columns = [...columns, ...extra];
      }
    }

    const totalCols = 1 + columns.length;

    return (
      <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 mt-1">
              {loading
                ? "Loading..."
                : `${rows.length} ${rows.length === 1 ? "record" : "records"}`}
              {listError ? (
                <span className="ml-3 text-red-600 font-semibold">{listError}</span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const cfg = STATUSES.find((s) => s.key === statusKey);
              if (cfg) loadStatusList(cfg.value, cfg.key);
            }}
            className="px-3 py-1.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                <th className="p-4 whitespace-nowrap font-semibold text-slate-700 w-14" />
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="p-4 whitespace-nowrap font-semibold text-slate-700"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const open = expandedIds.has(r.id);
                const detailsState = detailsById[r.id] || {
                  data: null,
                  loading: false,
                  error: "",
                };

                return (
                  <React.Fragment key={r.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          className="focus:outline-none"
                          aria-label={open ? "Collapse" : "Expand"}
                          title={open ? "Collapse" : "Expand"}
                        >
                          <Chevron open={open} />
                        </button>
                      </td>

                      {columns.map((c) => (
                        <td key={c.key} className="p-4 text-slate-600 align-top">
                          <div className="max-w-[420px] break-words">
                            {c.isActions ? (
                              <ActionsCell row={r} onEdit={onEditRow} onDelete={requestDelete} />
                            ) : c.isGeneratedDocx ? (
                              r.generated_llc ? (
                                <DocxThumb url={fileUrl(r.generated_llc)} title={`LLC #${r.id}`} />
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : c.isScopeAttachments ? (
                              <AttachCell attachments={byScope(r.attachments, c.scope)} />
                            ) : c.isDate ? (
                              r[c.key] ? fmtDate(r[c.key]) : <span className="text-slate-400">—</span>
                            ) : c.key === "pm_decision" ? (
                              <PmDecisionBadge value={r.pm_decision} />
                            ) : c.key === "final_decision" ? (
                              // ✅ SPECIAL RULE: in IN_PREPARATION, don't show PENDING, show "__"
                              statusKey === "IN_PREPARATION" &&
                              (!r.final_decision || r.final_decision === "PENDING_FOR_VALIDATION") ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <FinalDecisionBadge value={r.final_decision} />
                              )
                            ) : (
                              normalize(r[c.key])
                            )}
                          </div>
                        </td>
                      ))}

                    </tr>

                    {open && (
                      <tr className="border-b border-slate-100 bg-white">
                        <td colSpan={totalCols} className="bg-white">
                          <ExpandedRow
                            details={detailsState.data}
                            loading={detailsState.loading}
                            error={detailsState.error}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {!loading && rows.length === 0 && !listError && (
                <tr>
                  <td colSpan={totalCols} className="p-8 text-center text-slate-600">
                    No records.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={totalCols} className="p-8 text-center text-slate-600">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6 md:pl-12">
        {/* ✅ ONE header*/}
        <div className="rounded-3xl bg-white shadow-xl shadow-[#046eaf]/5 border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="relative px-8 py-7 bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf] bg-[length:200%_100%]">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: title */}
              <div className="flex items-center gap-5 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    Quality Lesson Learned
                  </h1>
                  <p className="mt-1 text-sm text-white/80">
                    Global search filters status tables
                  </p>
                </div>
              </div>

              {/* Right: actions (LIKE 2nd CODE) */}
              <div className="flex items-center gap-3">
                {/* 🔎 Search */}
                <div className="relative w-64">
                  <label htmlFor="status-search" className="sr-only">
                    Search status
                  </label>
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                  />
                  <input
                    id="status-search"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    placeholder="Search status"
                    className="
                      w-full rounded-2xl
                      bg-white/10
                      border border-white/20
                      py-2 pl-9 pr-3
                      text-sm text-white
                      placeholder:text-white/60
                      outline-none
                      focus:ring-4 focus:ring-white/20
                    "
                  />
                </div>

                {/* 🔄 Refresh */}
                <button
                  type="button"
                  onClick={loadAllLists}
                  className="
                    inline-flex items-center gap-2
                    rounded-2xl
                    border border-white/20
                    bg-white/10
                    px-4 py-2
                    text-sm font-semibold text-white
                    transition
                    hover:bg-white/20
                    focus:outline-none focus:ring-4 focus:ring-white/20
                  "
                >
                  <RefreshCcw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-[#f8fafc] border-b border-[#c5c5c4]/20">
            <div className="flex items-center gap-2 text-xs text-[#585858]"></div>
          </div>
        </div>

        {/* ✅ tables */}
        <div className="space-y-6">
          {visibleStatuses.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center text-slate-600">
              No status matches this search.
            </div>
          ) : (
            visibleStatuses.map((s) => (
              <StatusTable key={s.key} title={s.label} statusKey={s.key} />
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm deletion"
        message={`Are you sure you want to delete LLC #${deleteTargetId}? This cannot be undone.`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
