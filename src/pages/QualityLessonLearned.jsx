import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw, Filter, ChevronRight, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const API = "https://llc-back.azurewebsites.net/api";
const BACKEND = "https://llc-back.azurewebsites.net";

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

function TextHoverPreview({ text, maxChars = 80, maxWidthClass = "max-w-[280px]" }) {
  const value = normalize(text);
  if (!value) return <span className="text-slate-400">—</span>;

  const isLong = value.length > maxChars;
  const preview = isLong ? value.slice(0, maxChars) + "…" : value;

  return (
    <div className={`relative inline-block group ${maxWidthClass}`}>
      {/* visible truncated text */}
      <div className="truncate text-slate-600 group-hover:text-slate-800 transition-colors">
        {preview}
      </div>

      {/* hover bubble (full text) */}
      {isLong && (
        <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden group-hover:block">
          <div className="rounded-xl border border-[#ef7807]/20 bg-white shadow-xl p-3 w-[420px] backdrop-blur-sm">
            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-[#ef7807]/20 rotate-45" />
            <div className="text-xs font-semibold text-slate-500 mb-1">Full text</div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">
              {value}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

// ==================== COULEURS DE LA CHARTE AVEC ORANGE ====================
const COLORS = {
  BLUE: "#046eaf",
  DARK_BLUE: "#0e4e78",
  ORANGE: "#ef7807",
  ORANGE_LIGHT: "#ff9d45",
  ORANGE_DARK: "#c45f00",
  GREY: "#c5c5c4",
  DARK_GREY: "#585858",
  RED: "#dc2626",
  GREEN: "#059669",
  YELLOW: "#d97706"
};

const PM_DECISION_UI = {
  PENDING_FOR_VALIDATION: {
    label: "PENDING FOR VALIDATION",
    icon: <AlertCircle size={12} />,
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  APPROVED: {
    label: "APPROVED",
    icon: <CheckCircle size={12} />,
    className: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  REJECTED: {
    label: "REJECTED",
    icon: <XCircle size={12} />,
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

function PmDecisionBadge({ value }) {
  const ui = PM_DECISION_UI[value];
  if (!ui) return <span className="text-slate-400">—</span>;

  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          ui.className,
        ].join(" ")}
      >
        {ui.icon}
        {ui.label}
      </span>
    </div>
  );
}

const FINAL_DECISION_UI = {
  PENDING_FOR_VALIDATION: {
    label: "PENDING FOR VALIDATION",
    icon: <AlertCircle size={12} />,
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  APPROVED: {
    label: "APPROVED",
    icon: <CheckCircle size={12} />,
    className: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  REJECTED: {
    label: "REJECTED",
    icon: <XCircle size={12} />,
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

function FinalDecisionBadge({ value }) {
  const ui = FINAL_DECISION_UI[value];
  if (!ui) return <span className="text-slate-400">—</span>;

  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          ui.className,
        ].join(" ")}
      >
        {ui.icon}
        {ui.label}
      </span>
    </div>
  );
}

// -------------------- UI small components --------------------
function Chevron({ open }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center h-8 w-8 rounded-lg",
        "border border-slate-200 bg-white text-slate-700",
        "transition-transform duration-300 hover:border-orange-300",
        open ? "rotate-90" : "rotate-0",
      ].join(" ")}
      aria-hidden="true"
    >
      ▶
    </span>
  );
}

function OrangeDot() {
  return (
    <div className="h-2 w-2 rounded-full bg-[#ef7807] animate-pulse" />
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
        className="text-[#046eaf] hover:text-[#ef7807] hover:underline text-xs font-medium transition-colors group flex items-center gap-1"
        title={attachment.filename}
      >
        <span className="truncate max-w-[120px]">{attachment.filename}</span>
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
      <div className="relative">
        <img
          src={url}
          alt={attachment.filename}
          className="h-10 w-10 object-cover rounded-lg border border-slate-200 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-[#ef7807]/30"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[#ef7807]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 hidden -translate-x-1/2 group-hover:block">
        <div className="rounded-xl border border-[#ef7807]/20 bg-white shadow-xl p-2 w-40 backdrop-blur-sm">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-[#ef7807]/20 rotate-45" />
          <img
            src={url}
            alt={attachment.filename}
            className="h-36 w-full object-cover rounded-lg mb-2"
            loading="lazy"
          />
          <div className="text-[11px] text-slate-700 break-words px-1">
            {attachment.filename}
          </div>
        </div>
      </div>
    </a>
  );
}

function PdfThumb({ url, title }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col items-center gap-1"
        title="View PDF"
      >
        <div className="h-14 w-12 rounded-lg border border-slate-200 bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all hover:scale-105 hover:border-[#ef7807]/40">
          <div className="text-xl">📕</div>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#ef7807] border border-white" />
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#ef7807]/20">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-orange-50">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <OrangeDot />
                {title}
              </div>

              <div className="flex gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#046eaf] hover:text-[#ef7807] hover:underline px-3 py-1.5 rounded-lg hover:bg-white transition-colors flex items-center gap-1"
                >
                  <span>Open</span>
                  <ChevronRight size={14} />
                </a>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <iframe
              src={url}
              className="w-full h-full"
              title="PDF preview"
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

function byScopeProcessing(processingAttachments, scope) {
  const arr = Array.isArray(processingAttachments) ? processingAttachments : [];
  return arr.filter((a) => a && a.scope === scope);
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
  if (loading) return (
    <div className="p-5">
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-2 border-[#ef7807] border-t-transparent animate-spin"></div>
        <span className="ml-3 text-slate-600">Loading details...</span>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-5 text-red-600 font-semibold bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        {error}
      </div>
    </div>
  );
  if (!details) return (
    <div className="p-5 text-slate-500 bg-gradient-to-r from-slate-50 to-orange-50/20 rounded-lg border border-slate-100">
      No details available.
    </div>
  );

  const rc = Array.isArray(details.rootCauses) ? details.rootCauses : [];

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-3">
        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>Root causes</span>
          <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {rc.length} {rc.length === 1 ? 'cause' : 'causes'} found
          </span>
        </div>

        {rc.length === 0 ? (
          <div className="text-slate-500 bg-gradient-to-r from-slate-50 to-orange-50/30 p-6 rounded-lg border border-slate-100 text-center">
            <div className="text-slate-400 mb-2">No root causes identified</div>
            <div className="text-xs text-slate-500">Add root causes in the edit view</div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-auto bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e2e8f0] border-b border-slate-300">
                  <tr className="text-left">
                    {ROOT_CAUSE_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className="p-4 whitespace-nowrap font-semibold text-slate-800 border-r border-slate-300 last:border-r-0"
                      >
                        <div className="flex items-center gap-1.5">
                          {c.label}

                          {/* Icône date si colonne date */}
                          {(c.key.includes("date") || c.isDate) && (
                            <span className="text-[10px] text-slate-600 font-normal">📅</span>
                          )}

                          {c.key === "root_cause"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>


                <tbody>
                  {rc.map((rci, index) => (
                    <tr
                      key={rci.id ?? JSON.stringify(rci)}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {ROOT_CAUSE_COLUMNS.map((c) => (
                        <td key={c.key} className="p-3 text-slate-600 align-top border-r border-slate-100 last:border-r-0">
                          <div className="max-w-[520px] break-words">
                            {c.isAttachments ? (
                              <AttachCell attachments={rci.attachments} />
                            ) : (
                              <div className="group">
                                {normalize(rci[c.key])}
                                {c.key === 'conclusion' && rci[c.key] && (
                                  <div className="mt-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to expand
                                  </div>
                                )}
                              </div>
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
  const canEdit = row.pm_decision === "REJECTED" || row.final_decision === "REJECTED";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(row.id)}
        disabled={!canEdit}
        className={[
          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5",
          canEdit
            ? "bg-gradient-to-r from-[#046eaf] to-[#0e4e78] text-white hover:shadow-md hover:scale-105 border-transparent"
            : "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed",
        ].join(" ")}
        title={
          canEdit
            ? "Edit"
            : "Edit available only when PM decision is REJECTED or Final decision is REJECTED"
        }
      >
        <span className="text-[10px]">✏️</span>
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(row.id)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 hover:bg-gradient-to-r hover:from-red-100 hover:to-orange-100 hover:shadow-sm transition-all duration-200 flex items-center gap-1.5"
        title="Delete"
      >
        <span className="text-[10px]">🗑️</span>
        Delete
      </button>
    </div>
  );
}

function Toast({ show, message, type = "success", onClose }) {
  if (!show) return null;

  const bgColor = type === "success" 
    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200" 
    : "bg-gradient-to-r from-red-50 to-orange-50 border-red-200";
  const textColor = type === "success" ? "text-emerald-800" : "text-red-800";

  return (
    <div className="fixed top-5 right-5 z-[100] animate-slide-in">
      <div
        className={[
          "rounded-xl border shadow-xl px-4 py-3 text-sm font-semibold",
          bgColor,
          textColor,
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          {type === "success" ? (
            <CheckCircle size={16} className="text-emerald-600" />
          ) : (
            <AlertCircle size={16} className="text-red-600" />
          )}
          <div className="flex-1">{message}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-white/60 text-slate-700 transition-colors flex items-center justify-center"
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
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={loading ? undefined : onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative w-full max-w-md",
          "rounded-xl border bg-white/95 shadow-2xl",
          "border-slate-200",
          "overflow-hidden",
          "animate-pop",
        ].join(" ")}
      >
        <div
          className={[
            "h-1.5 w-full",
            danger
              ? "bg-gradient-to-r from-red-500 via-[#ef7807] to-orange-500"
              : "bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf]",
          ].join(" ")}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={[
                "shrink-0 h-12 w-12 rounded-xl border flex items-center justify-center",
                danger
                  ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200 text-red-700"
                  : "bg-gradient-to-br from-blue-50 to-cyan-50 border-[#046eaf]/20 text-[#046eaf]",
              ].join(" ")}
              aria-hidden="true"
            >
              {danger ? "🗑️" : "ℹ️"}
            </div>

            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900 leading-snug">
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
                "ml-auto h-9 w-9 rounded-xl border border-slate-200",
                "text-slate-600 hover:bg-slate-50 hover:text-[#ef7807]",
                "focus:outline-none focus:ring-2 focus:ring-slate-200",
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
                "px-4 py-2.5 rounded-lg text-sm font-semibold",
                "border border-slate-300",
                "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600",
                "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-slate-700",
                "transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-slate-300",
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
                "px-4 py-2.5 rounded-lg text-sm font-semibold",
                "focus:outline-none focus:ring-2 transition-all",
                danger
                  ? "bg-gradient-to-r from-red-600 to-[#ef7807] text-white hover:shadow-md hover:scale-105 focus:ring-red-200"
                  : "bg-gradient-to-r from-[#046eaf] to-[#0e4e78] text-white hover:shadow-md hover:scale-105 focus:ring-[#046eaf]/20",
                loading ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {confirmText}
                  {danger && <ChevronRight size={14} />}
                </span>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pop {
            from { transform: translateY(8px) scale(.98); opacity: 0; }
            to   { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// -------------------- ✅ Statuses config --------------------
const STATUSES = [
  { key: "IN_PREPARATION", label: "LLC in preparation", value: "IN_PREPARATION", icon: "📝", color: "#84898b" },
  { key: "WAITING_FOR_VALIDATION", label: "Waiting for validation", value: "WAITING_FOR_VALIDATION", icon: "⏳", color: "#ef7807" },
  { key: "DEPLOYMENT_IN_PROGRESS", label: "Deployment in progress", value: "DEPLOYMENT_IN_PROGRESS", icon: "🚀", color: "#059669" },
  { key: "DEPLOYMENT_PROCESSING", label: "Deployment processing", value: "DEPLOYMENT_PROCESSING", icon: "⚙️", color: "#0e4e78" },
  { key: "DEPLOYMENT_VALIDATED", label: "Deployment validated", value: "DEPLOYMENT_VALIDATED", icon: "✅", color: "#059669" },
  { key: "DEPLOYMENT_REJECTED", label: "Deployment rejected", value: "DEPLOYMENT_REJECTED", icon: "❌", color: "#dc2626" },
  { key: "CLOSED", label: "Closed", value: "CLOSED", icon: "🔒", color: "#585858" },
];

// -------------------- ✅ Columns PER TABLE --------------------
const COLUMNS_BASE = [
  { label: "Problem description", key: "problem_short" },
  { label: "Category", key: "category" },
  { label: "LLC type", key: "llc_type" },
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
  { label: "Validator of LLC", key: "validator" },
  { label: "LLC generated", key: "__generated_docx", isGeneratedDocx: true },
  { label: "Creation date", key: "created_at", isDate: true },
  { label: "PM decision", key: "pm_decision" },
];

const COLUMNS_DEPLOYMENT_PROCESSING = [
  { label: "Evidence plant", key: "evidence_plant" },
  { label: "Deployment applicability", key: "deployment_applicability" },
  { label: "Why not apply", key: "why_not_apply" },
  { label: "Person", key: "person" },
  { label: "Before Dep", key: "__before_dep", scope: "BEFORE_DEP", isProcessingAttachments: true },
  { label: "After Dep", key: "__after_dep", scope: "AFTER_DEP", isProcessingAttachments: true },
  { label: "Files", key: "__evidence_files", scope: "EVIDENCE_FILE", isProcessingAttachments: true },
  { label: "Deployment description", key: "deployment_description" },
  { label: "Validator of LLC deployment", key: "pm" },
  { label: "Dep generated", key: "__dep_pdf", isDepPdf: true },
  { label: "Deployment date", key: "deployment_date", isDate: true },
];

const COLUMNS_BY_STATUS = {
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
    { label: "Deployment progress", key: "deployment_progress" }, 
  ],
  DEPLOYMENT_PROCESSING: [...COLUMNS_BASE, 
    { label: "PM validation date", key: "pm_validation_date", isDate: true },
    { label: "Final decision", key: "final_decision" },
    { label: "Final validation date", key: "final_validation_date", isDate: true },
    ...COLUMNS_DEPLOYMENT_PROCESSING],
  DEPLOYMENT_VALIDATED: [...COLUMNS_BASE,
    { label: "PM validation date", key: "pm_validation_date", isDate: true },
    { label: "Final decision", key: "final_decision" },
    { label: "Final validation date", key: "final_validation_date", isDate: true },
    ...COLUMNS_DEPLOYMENT_PROCESSING],
  DEPLOYMENT_REJECTED: [...COLUMNS_BASE,
    { label: "PM validation date", key: "pm_validation_date", isDate: true },
    { label: "Final decision", key: "final_decision" },
    { label: "Final validation date", key: "final_validation_date", isDate: true },
    ...COLUMNS_DEPLOYMENT_PROCESSING],
  CLOSED: [...COLUMNS_BASE],
};

// -------------------- main --------------------
export default function QualityLessonLearned() {
  const [rowsByStatus, setRowsByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, []]))
  );
  const [loadingByStatus, setLoadingByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, true]))
  );
  const [errorByStatus, setErrorByStatus] = useState(() =>
    Object.fromEntries(STATUSES.map((s) => [s.key, ""]))
  );

  const [statusSearch, setStatusSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [detailsById, setDetailsById] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const [role, setRole] = useState(null);

  // récupère le rôle depuis le JWT (ex: token payload { role: "QUALITY_MANAGER" })
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload?.role || payload?.user?.role || null);
    } catch (e) {
      console.warn("Unable to decode token role", e);
      setRole(null);
    }
  }, []);

  const isQualityManager = role === "quality_manager";

  
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
    }, 3000);
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
    const statusConfig = STATUSES.find(s => s.key === statusKey);

    let columns = COLUMNS_BY_STATUS[statusKey] || [];

    const hasFinalRejected =
      statusKey === "IN_PREPARATION" &&
      rows.some((x) => x.final_decision === "REJECTED");

    if (hasFinalRejected) {
      const extra = [
        { label: "PM validation date", key: "pm_validation_date", isDate: true },
        { label: "Final decision", key: "final_decision" },
      ];

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

    // ✅ Actions visible only for Quality Manager
    if (!isQualityManager) {
      columns = columns.filter((c) => !c.isActions && c.key !== "__actions");
    }

    const totalCols = 1 + columns.length;

    return (
      <div className="rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            
            {/* Icône avec fond coloré */}
            <div
              className="h-10 w-10 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: `${statusConfig?.color}15`,
                borderColor: `${statusConfig?.color}40`,
                color: statusConfig?.color,
              }}
            >
              <span className="text-lg">{statusConfig?.icon || "📋"}</span>
            </div>

            <div className="min-w-0">
              {/* Titre coloré */}
              <div
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: statusConfig?.color }}
              >
                {title}

                {/* Point couleur statut */}
                <span
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ backgroundColor: statusConfig?.color }}
                />
              </div>

              <div className="mt-1">
                {loading ? (
                  <span className="text-xs text-slate-400">Loading...</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                                  bg-slate-100 text-slate-700 border border-slate-200">
                    {rows.length} {rows.length === 1 ? "record" : "records"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton refresh neutre */}
<button
  type="button"
  onClick={() => {
    const cfg = STATUSES.find((s) => s.key === statusKey);
    if (cfg) loadStatusList(cfg.value, cfg.key);
  }}
  className="
    group
    inline-flex items-center gap-1.5
    px-3 py-1.5
    rounded-md
    border border-slate-300
    bg-white
    text-sm font-semibold text-slate-700
    transition-all duration-200
    hover:bg-slate-100
    hover:border-[#046eaf]
    hover:shadow-sm
    hover:-translate-y-[1px]
    focus:outline-none focus:ring-2 focus:ring-[#046eaf]/40
    active:translate-y-0 active:shadow-none
  "
>
  <RefreshCcw
    size={14}
    className="
      text-slate-600
      transition-transform duration-300
      group-hover:rotate-180
      group-hover:text-[#046eaf]
    "
  />
  Refresh
</button>


        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#e2e8f0] border-b border-slate-300">
              <tr className="text-left">
                <th className="p-4 whitespace-nowrap font-semibold text-slate-800 w-14 border-r border-slate-300">
                  <div className="flex items-center justify-center">
                    <Filter size={12} className="text-slate-700" />
                  </div>
                </th>

                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="p-4 whitespace-nowrap font-semibold text-slate-800 border-r border-slate-300 last:border-r-0"
                  >
                    <div className="flex items-center gap-1.5">
                      {c.label}
                      {(c.key.includes("date") || c.isDate) && (
                        <span className="text-[10px] text-slate-600 font-normal">📅</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, rowIndex) => {
                const open = expandedIds.has(r.id);
                const detailsState = detailsById[r.id] || {
                  data: null,
                  loading: false,
                  error: "",
                };

                return (
                  <React.Fragment key={r.id}>
                    <tr className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}>
                      <td className="p-4 align-top border-r border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          className="focus:outline-none hover:scale-110 transition-transform"
                          aria-label={open ? "Collapse" : "Expand"}
                          title={open ? "Collapse" : "Expand"}
                        >
                          <Chevron open={open} />
                        </button>
                      </td>

                      {columns.map((c) => (
                        <td key={c.key} className="p-4 text-slate-600 align-top border-r border-slate-100 last:border-r-0 group">
                          <div className="max-w-[280px] break-words">
                            {c.isActions ? (
                              <ActionsCell row={r} onEdit={onEditRow} onDelete={requestDelete} />
                            ) : c.isGeneratedDocx ? (
                              r.generated_llc ? (
                                <PdfThumb url={fileUrl(r.generated_llc)} title={`LLC #${r.id}`} />
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : c.isDepPdf ? (
                              r.generated_dep ? (
                                <PdfThumb
                                  url={fileUrl(r.generated_dep)}
                                  title={`DEP LLC #${r.id} - ${r.evidence_plant}`}
                                />
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : c.isScopeAttachments ? (
                              <AttachCell attachments={byScope(r.attachments, c.scope)} />
                            ) : c.isDate ? (
                              r[c.key] ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-[#ef7807]">📅</span>
                                  {fmtDate(r[c.key])}
                                </div>
                              ) : <span className="text-slate-400">—</span>
                            ) : c.key === "pm_decision" ? (
                              <PmDecisionBadge value={r.pm_decision} />
                            ) : c.key === "final_decision" ? (
                              statusKey === "IN_PREPARATION" &&
                              (!r.final_decision || r.final_decision === "PENDING_FOR_VALIDATION") ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <FinalDecisionBadge value={r.final_decision} />
                              )
                            ) : c.isProcessingAttachments ? (
                              <AttachCell attachments={byScopeProcessing(r.processing_attachments, c.scope)} />
                            ) : (
                              <TextHoverPreview text={r[c.key]} maxChars={90} maxWidthClass="max-w-[280px]" />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {open && (
                      <tr className="border-b border-slate-200">
                        {/* Cellule vide sous la 1ère colonne (Filter/Expand) */}
                        <td className="w-14 bg-transparent" />

                        {/* Contenu expanded qui commence sous la 2ème colonne */}
                        <td
                          colSpan={totalCols - 1}
                          className="bg-slate-50/60"
                        >
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
                  <td colSpan={totalCols} className="p-8 text-center text-slate-500 bg-gradient-to-r from-slate-50 to-orange-50/20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-slate-100 to-orange-100 flex items-center justify-center">
                        <span className="text-xl">📭</span>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">No records found in this status</div>
                        <div className="text-xs text-slate-500">Click Refresh to reload or check other statuses</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={totalCols} className="p-8 text-center text-slate-600 bg-gradient-to-r from-slate-50 to-orange-50/20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full border-2 border-[#ef7807] border-t-transparent animate-spin flex items-center justify-center">
                        <OrangeDot />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Loading records...</span>
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#ef7807] animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="h-1.5 w-1.5 rounded-full bg-[#ef7807] animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="h-1.5 w-1.5 rounded-full bg-[#ef7807] animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                      </div>
                    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-sky-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header principal avec accent orange */}
        <div className="rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          <div className="relative px-8 py-6 bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf]">
            {/* Éléments décoratifs orange */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ef7807]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#ef7807]/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5 min-w-0">
                <div className="relative">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    Quality Lesson Learned
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-72">
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
                    placeholder="Search status tables..."
                    className="
                      w-full rounded-lg
                      bg-white/10
                      border border-white/20
                      py-2.5 pl-10 pr-3
                      text-sm text-white
                      placeholder:text-white/60
                      outline-none
                      focus:ring-2 focus:ring-[#ef7807]/50
                      transition-all
                      hover:bg-white/15
                    "
                  />
                  {statusSearch && (
                    <button
                      onClick={() => setStatusSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={loadAllLists}
                  className="
                    inline-flex items-center gap-2
                    rounded-lg
                    border border-white/20
                    bg-gradient-to-r from-white/10 to-white/5
                    px-4 py-2.5
                    text-sm font-semibold text-white
                    transition-all
                    hover:bg-gradient-to-r hover:from-[#046eaf] hover:to-[#0e4e78]
                    hover:shadow-lg
                    hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-[#ef7807]/50
                  "
                >
                  <RefreshCcw size={16} />
                  Refresh All
                </button>
              </div>
            </div>
          </div>

<div className="px-8 py-2 bg-gradient-to-r from-slate-50 to-orange-50/30 border-b border-slate-200">
  <div className="flex justify-center">
    <span
      className="
        inline-flex items-center gap-2
        px-4 py-1.5
        rounded-full
        bg-slate-100
        border border-slate-200
        text-sm font-semibold text-slate-700
      "
    >
      <span className="font-bold text-[#046eaf]">
        {Object.values(rowsByStatus).flat().length}
      </span>
      total records
    </span>
  </div>
</div>

        </div>

        {/* Tables de statut */}
        <div className="space-y-6">
          {visibleStatuses.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-slate-600">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-slate-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-400" />
              </div>
              <div className="text-slate-400 mb-2">No status matches this search</div>
              <div className="text-sm text-slate-500">Try a different search term or clear the search</div>
              <button
                onClick={() => setStatusSearch('')}
                className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ef7807] to-orange-600 text-white text-sm font-medium hover:shadow-md transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : (
            visibleStatuses.map((s) => (
              <div id={`status-${s.key}`} key={s.key}>
                <StatusTable title={s.label} statusKey={s.key} />
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm deletion"
        message={`Are you sure you want to delete LLC #${deleteTargetId}? This action cannot be undone.`}
        confirmText="Delete LLC"
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
