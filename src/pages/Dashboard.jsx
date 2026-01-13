import React, { useEffect, useMemo, useState } from "react";

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

  // ✅ Better error diagnostics
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
  }

  // try json first, fallback to text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text().catch(() => "");
  return text;
}

function fmtDate(d) {
  try {
    if (!d) return "";
    return new Date(d).toLocaleString();
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

  if (!ui) {
    return <span className="text-slate-400">—</span>;
  }

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
      {/* small thumb */}
      <img
        src={url}
        alt={attachment.filename}
        className="h-8 w-8 object-cover rounded-lg border border-slate-200 transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />

      {/* hover preview */}
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

  // Microsoft Office Viewer
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url
  )}`;

  return (
    <>
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col items-center gap-1"
        title="View document"
      >
        <div
          className="h-12 w-10 rounded-lg border border-slate-200 bg-sky-50
                        flex items-center justify-center shadow-sm
                        group-hover:shadow-md transition"
        >
          📄
        </div>
        <span className="text-[10px] text-slate-600">DOCX</span>
      </button>

      {/* Modal preview */}
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
        <AttachmentThumbnail key={a.id ?? `${a.filename}-${a.storage_path}`} attachment={a} />
      ))}
    </div>
  );
}

// -------------------- columns --------------------
const LLC_COLUMNS = [
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
  { label: "PM Validation date", key: "pm_validation_date", isDate: true },
  { label: "Decision ", key: "pm_decision"},
  { label: "Actions", key: "__actions", isActions: true },
];

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
  if (loading) {
    return <div className="p-5 text-slate-600">Loading details...</div>;
  }
  if (error) {
    return <div className="p-5 text-red-600 font-semibold">{error}</div>;
  }
  if (!details) {
    return <div className="p-5 text-slate-500">No details.</div>;
  }

  const rc = Array.isArray(details.rootCauses) ? details.rootCauses : [];

  return (
    <div className="p-5 space-y-5">
      {/* Root causes table */}
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
  const canEdit = row.pm_decision === "REJECTED";

  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <button
          type="button"
          onClick={() => onEdit(row.id)}
          className="px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50"
          title="Edit (only when REJECTED)"
        >
          ✏️ Edit
        </button>
      ) : (
        <span className="text-slate-400 text-xs">—</span>
      )}

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

// -------------------- main --------------------
export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // expanded state
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // details cache: { [llcId]: { data, loading, error } }
  const [detailsById, setDetailsById] = useState({});

  const totalCols = useMemo(() => 1 + LLC_COLUMNS.length, []);

  async function loadList() {
    setLoading(true);
    setListError("");
    try {
      const data = await fetchWithAuth(`${API}/llc?status=IN_PREPARATION`, {
        method: "GET",
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadList error:", e);
      setRows([]);
      setListError(e?.message || "Failed to load list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  const token = localStorage.getItem("token");
    if (!token) return;      
    loadList();
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

    if (isExpanding) {
      await ensureDetails(id);
    }
  }

  function onEditRow(id) {
    // Exemple: navigation vers page edit
    // si tu utilises react-router:
    // navigate(`/llc/${id}/edit`);
    window.location.href = `/llc/${id}/edit`; // simple
  }

  async function onDeleteRow(id) {
    const ok = window.confirm(`Delete LLC #${id}? This cannot be undone.`);
    if (!ok) return;

    try {
      await fetchWithAuth(`${API}/llc/${id}`, { method: "DELETE" });
      // refresh list
      await loadList();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6 md:pl-12">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-white/80 text-sm mt-1">LLC in preparation</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              {loading ? "Loading..." : `${rows.length} ${rows.length === 1 ? "record" : "records"}`}
              {listError ? (
                <div className="mt-1 text-xs font-semibold text-red-600">
                  {listError}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={loadList}
              className="text-sm font-semibold text-slate-700 hover:text-sky-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left">
                  <th className="p-4 whitespace-nowrap font-semibold text-slate-700 w-14" />
                  {LLC_COLUMNS.map((c) => (
                    <th key={c.key} className="p-4 whitespace-nowrap font-semibold text-slate-700">
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

                        {LLC_COLUMNS.map((c) => (
                          <td key={c.key} className="p-4 text-slate-600 align-top">
                            <div className="max-w-[420px] break-words">
                              {c.isActions ? (
                                <ActionsCell row={r} onEdit={onEditRow} onDelete={onDeleteRow} />
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
                              ) : (
                                c.key === "pm_decision"
                                  ? <PmDecisionBadge value={r.pm_decision} />
                                  : normalize(r[c.key])
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
                      No LLC in preparation.
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
      </div>
    </div>
  );
}
