import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API = "http://localhost:3001/api";

// -------------------- helpers (same spirit as your QLL) --------------------
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

function monthLabel(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const months = [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre"
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function pickDate(row) {
  // adapte si tu veux: deployed_at, updated_at, created_at...
  return row?.deployed_at || row?.created_at;
}

function groupCount(rows, key) {
  const map = new Map();
  rows.forEach((r) => {
    const k = (r?.[key] || "Unknown").toString().trim() || "Unknown";
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// BarChart monthly per plant: [{ month, PlantA: n, PlantB: n, ... }]
function buildMonthlyPerPlant(rows, plantKey = "plant") {
  const monthMap = new Map();
  const plants = new Set();

  for (const r of rows) {
    const m = monthLabel(pickDate(r));
    if (!m) continue;

    const plant = (r?.[plantKey] || "Unknown").toString().trim() || "Unknown";
    plants.add(plant);

    if (!monthMap.has(m)) monthMap.set(m, { month: m });
    const obj = monthMap.get(m);
    obj[plant] = (obj[plant] || 0) + 1;
  }

  const monthsIdx = {
    janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
    juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
  };
  const toSortKey = (label) => {
    const [mo, year] = label.split(" ");
    return Number(year) * 100 + (monthsIdx[mo] ?? 0);
  };

  const data = Array.from(monthMap.values()).sort(
    (a, b) => toSortKey(a.month) - toSortKey(b.month)
  );

  return { data, plants: Array.from(plants).sort() };
}

// stable palette
const COLORS = ["#0ea5e9", "#1d4ed8", "#a855f7", "#f97316", "#ec4899", "#22c55e", "#64748b", "#f59e0b"];

function Card({ title, subtitle, right, children }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// -------------------- statuses (same keys as your QLL) --------------------
const STATUSES = [
  "IN_PREPARATION",
  "WAITING_FOR_VALIDATION",
  "DEPLOYMENT_IN_PROGRESS",
  "DEPLOYMENT_PROCESSING",
  "DEPLOYMENT_REJECTED",
  "DEPLOYMENT_VALIDATION",
  "CLOSED",
  "DEPLOYED", // si tu l’utilises côté backend (sinon enlève)
];

function safeStatus(r) {
  const s = (r?.status || "Unknown").toString().trim() || "Unknown";
  return s;
}

export default function KpisPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSearch, setStatusSearch] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`${API}/llc`, { method: "GET" });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    loadAll();
  }, []);

  // --------- computed data (charts) ----------
  const computed = useMemo(() => {
    const q = statusSearch.trim().toLowerCase();

    const filtered = !q
      ? rows
      : rows.filter((r) => {
          // global search like your dashboard: status/plant/category/problem...
          const hay = [
            r?.status,
            r?.plant,
            r?.category,
            r?.llc_type,
            r?.customer,
            r?.product_family,
            r?.problem_short,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });

    const total = filtered.length;

    // status distribution
    const statusDist = groupCount(filtered, "status");

    // deployed / in prep
    const deployed = filtered.filter((r) => safeStatus(r) === "DEPLOYED");
    const inPrep = filtered.filter((r) => safeStatus(r) === "IN_PREPARATION");

    const deployedPerPlant = groupCount(deployed, "plant");
    const inPrepPerPlant = groupCount(inPrep, "plant");

    const { data: monthlyDeployedPerPlant, plants } = buildMonthlyPerPlant(deployed, "plant");

    return {
      total,
      filtered,
      statusDist,
      deployed,
      inPrep,
      deployedPerPlant,
      inPrepPerPlant,
      monthlyDeployedPerPlant,
      plantsForBars: plants,
    };
  }, [rows, statusSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6 md:pl-12">
        {/* ✅ Header (same style as QLL) */}
        <div className="rounded-3xl bg-white shadow-xl shadow-[#046eaf]/5 border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="relative px-8 py-7 bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf] bg-[length:200%_100%]">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Left */}
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-white leading-tight">
                  KPIs Dashboard
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  Charts & insights for Quality Lesson Learned
                </p>
              </div>

              {/* Right actions (like your 2nd code) */}
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <label htmlFor="kpi-search" className="sr-only">Search</label>
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                  />
                  <input
                    id="kpi-search"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    placeholder="Search (status, plant, category...)"
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

                <button
                  type="button"
                  onClick={loadAll}
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
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {loading ? (
                <span>Loading...</span>
              ) : (
                <span>
                  {computed.total} {computed.total === 1 ? "record" : "records"}
                </span>
              )}
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Tip: utilisez la recherche pour filtrer les charts
              </span>
            </div>
          </div>
        </div>

        {/* ✅ KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">Total LLC</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.total}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">DEPLOYED</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.deployed.length}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">IN PREPARATION</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.inPrep.length}
            </div>
          </div>
        </div>

        {/* ✅ Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1) BAR: status distribution */}
          <Card
            title="LLC status"
          >
            <div className="h-[320px]">
              {!loading && computed.statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computed.statusDist}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="LLC"
                      fill="#0ea5e9"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No data.</div>
              )}
            </div>
          </Card>

          {/* 2) PIE: deployed per plant */}
          <Card
            title="Accumulated DEPLOYED per plant"
            subtitle="Share of deployed LLC by plant"
          >
            <div className="h-[320px]">
              {!loading && computed.deployedPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computed.deployedPerPlant}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {computed.deployedPerPlant.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No deployed data.</div>
              )}
            </div>
          </Card>

          {/* 3) BAR: monthly deployed per plant */}
          <Card
            title="Monthly DEPLOYED per Plant"
            subtitle="Grouped bars by plant"
          >
            <div className="h-[360px]">
              {!loading && computed.monthlyDeployedPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computed.monthlyDeployedPerPlant}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {computed.plantsForBars.map((plant, idx) => (
                      <Bar
                        key={plant}
                        dataKey={plant}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[8, 8, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No monthly deployed data.</div>
              )}
            </div>
          </Card>

          {/* 4) BAR: in preparation per plant */}
          <Card
            title="Accumulated IN_PREPARATION per plant"
            subtitle="Counts by plant"
          >
            <div className="h-[360px]">
              {!loading && computed.inPrepPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computed.inPrepPerPlant}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="LLC in preparation"
                      fill="#8b5cf6"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No in-preparation data.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
