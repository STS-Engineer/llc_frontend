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
  ReferenceLine,
  LabelList,
} from "recharts";

const API = "https://llc-back.azurewebsites.net/api";

// -------------------- helpers --------------------
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

// ✅ English month label: "June 2024"
function monthLabel(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function pickDate(row) {
  return row?.deployed_at || row?.created_at;
}

function safeStatus(r) {
  return (r?.status || "Unknown").toString().trim() || "Unknown";
}

function safePlant(r) {
  return (r?.plant || "Unknown").toString().trim() || "Unknown";
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

  // ✅ English month sort
  const monthsIdx = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  const toSortKey = (label) => {
    const parts = label.split(" ");
    const year = Number(parts[parts.length - 1]);
    const mo = parts.slice(0, -1).join(" ");
    return year * 100 + (monthsIdx[mo] ?? 0);
  };

  const data = Array.from(monthMap.values()).sort(
    (a, b) => toSortKey(a.month) - toSortKey(b.month)
  );

  return { data, plants: Array.from(plants).sort() };
}

// ✅ Admin chart: stacked status per plant
function buildStatusStackByPlant(rows) {
  const plants = new Set();
  const statuses = new Set();
  const map = new Map(); // plant -> { plant, total, status1:n ... }

  for (const r of rows) {
    const p = safePlant(r);
    const s = safeStatus(r);
    plants.add(p);
    statuses.add(s);

    if (!map.has(p)) map.set(p, { plant: p, total: 0 });
    const obj = map.get(p);
    obj[s] = (obj[s] || 0) + 1;
    obj.total += 1;
  }

  const data = Array.from(map.values()).sort((a, b) =>
    a.plant.localeCompare(b.plant)
  );

  const statusKeys = Array.from(statuses).sort();
  return { data, plants: Array.from(plants).sort(), statusKeys };
}

// stable palette
const COLORS = [
  "#0ea5e9",
  "#1d4ed8",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#22c55e",
  "#64748b",
  "#f59e0b",
];

function Card({ title, subtitle, right, children }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSearch, setStatusSearch] = useState("");

  // ✅ read user from localStorage (UI only)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "admin";

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

  const computed = useMemo(() => {
    const q = statusSearch.trim().toLowerCase();

    const filtered = !q
      ? rows
      : rows.filter((r) => {
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

    // status distribution (bar)
    const statusDist = groupCount(filtered, "status");

    // deployed / in prep
    const deployed = filtered.filter((r) => safeStatus(r) === "CLOSED");
    const inPrep = filtered.filter((r) => safeStatus(r) === "IN_PREPARATION");

    // Monthly number of Lessons Learned generated (ONE series)
    const monthlyGeneratedMap = new Map();
    for (const r of filtered) {
      const m = monthLabel(pickDate(r));
      if (!m) continue;
      if (!monthlyGeneratedMap.has(m))
        monthlyGeneratedMap.set(m, { month: m, value: 0 });
      monthlyGeneratedMap.get(m).value += 1;
    }

    const monthsIdx = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
    };
    const toSortKey = (label) => {
      const parts = label.split(" ");
      const year = Number(parts[parts.length - 1]);
      const mo = parts.slice(0, -1).join(" ");
      return year * 100 + (monthsIdx[mo] ?? 0);
    };

    const monthlyGenerated = Array.from(monthlyGeneratedMap.values()).sort(
      (a, b) => toSortKey(a.month) - toSortKey(b.month)
    );


    // ✅ Admin extra charts
    const deployedPerPlant = groupCount(deployed, "plant"); // for pie
    const statusStack = buildStatusStackByPlant(filtered); // stacked bars

    return {
      total,
      filtered,
      statusDist,
      deployed,
      inPrep,
      monthlyGenerated,

      // admin
      deployedPerPlant,
      statusStack,
    };
  }, [rows, statusSearch]);

  const pieTotalDeployed = useMemo(() => {
    return computed.deployedPerPlant.reduce((s, x) => s + (x.value || 0), 0);
  }, [computed.deployedPerPlant]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6 md:pl-12">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-xl shadow-[#046eaf]/5 border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="relative px-8 py-7 bg-gradient-to-r from-[#046eaf] via-[#0e4e78] to-[#046eaf] bg-[length:200%_100%]">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-white leading-tight">
                  {isAdmin ? "Admin Dashboard" : "Dashboard"}
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {isAdmin
                    ? "All plants – Charts & insights for Quality Lesson Learned"
                    : "Charts & insights for Quality Lesson Learned"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <label htmlFor="kpi-search" className="sr-only">
                    Search
                  </label>
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                  />
                  <input
                    id="kpi-search"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    placeholder="Search (status, category...)"
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
              <span className="text-slate-500">Tip: use search to filter charts</span>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">
              Total number of LLC
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.total}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">
              IN PREPARATION
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.inPrep.length}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
            <div className="text-sm font-semibold text-slate-600">CLOSED</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : computed.deployed.length}
            </div>
          </div>
        </div>

        {/* Base dashboard for ALL roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Monthly number of Lessons Learned generated"
          >
            <div className="h-[360px]">
              {!loading && computed.monthlyGenerated?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computed.monthlyGenerated}
                    margin={{ top: 18, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />

                    <Bar
                      dataKey="value"
                      name="Quality Lesson Learned"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v) => (v > 0 ? v : "")}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No monthly data.</div>
              )}
            </div>
          </Card>

          <Card title="LLC status">
            <div className="h-[320px]">
              {!loading && computed.statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computed.statusDist}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
        </div>

        {/* ✅ ADMIN ONLY extra dashboard */}
        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1) Accumulated deployed per plant (Pie) */}
            <Card
              title="Accumulated LLC deployed per plant"
              subtitle={!loading ? `Total deployed: ${computed.deployed.length}` : undefined}
            >
              <div className="h-[320px]">
                {!loading && computed.deployedPerPlant?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(value, name) => {
                          const pct = pieTotalDeployed
                            ? ((Number(value) / pieTotalDeployed) * 100).toFixed(1)
                            : "0.0";
                          return [`Count: ${value} (${pct}%)`, name];
                        }}
                      />
                      <Legend />
                      <Pie
                        data={computed.deployedPerPlant}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        outerRadius={110}
                        labelLine={false}
                      >
                        {computed.deployedPerPlant.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-600">No deployed data.</div>
                )}
              </div>
            </Card>

            {/* 2) Accumulated status per plant (Stacked bar) */}
            <Card title="Accumulated LLC status per plant">
              <div className="h-[360px]">
                {!loading && computed.statusStack?.data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={computed.statusStack.data}
                      margin={{ top: 18, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plant" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />

                      {/* total at top */}
                      <Bar dataKey="total" hide>
                        <LabelList dataKey="total" position="top" />
                      </Bar>

                      {computed.statusStack.statusKeys.map((k, idx) => (
                        <Bar
                          key={k}
                          dataKey={k}
                          stackId="a"
                          name={k}
                          fill={COLORS[idx % COLORS.length]}
                        >
                          <LabelList
                            dataKey={k}
                            position="center"
                            formatter={(v) => (v > 0 ? v : "")}
                          />
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-600">No data.</div>
                )}
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
