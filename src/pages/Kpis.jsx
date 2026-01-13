import React, { useEffect, useMemo, useState } from "react";
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

// ---------- helpers ----------
const token = localStorage.getItem("token") || "";

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
  return row?.deployed_at || row?.created_at; // change si besoin
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

// BarChart “monthly per plant”: on veut un tableau [{month, PlantA: n, PlantB: n, ...}]
function buildMonthlyPerPlant(rows, plantKey = "plant") {
  const monthMap = new Map(); // month => { month, plant1: count, ... }
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

  // tri chronologique simple (en re-parsant)
  const toSortKey = (label) => {
    // label = "novembre 2024"
    const [mo, year] = label.split(" ");
    const months = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    };
    return Number(year) * 100 + (months[mo] ?? 0);
  };

  const data = Array.from(monthMap.values()).sort((a, b) => toSortKey(a.month) - toSortKey(b.month));
  return { data, plants: Array.from(plants).sort() };
}

// Couleurs stables (sans trop se prendre la tête)
const COLORS = ["#0ea5e9", "#1d4ed8", "#a855f7", "#f97316", "#ec4899", "#22c55e", "#64748b", "#f59e0b"];

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100">
        <div className="text-sm font-bold text-slate-800">{title}</div>
        {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function KpisPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ⚠️ Si ton backend supporte: /llc?status=DEPLOYED / IN_PREPARATION etc, c’est mieux.
        const r = await fetch(`${API}/llc`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error("Fetch failed");
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const {
    deployedRows,
    inPrepRows,
    deployedPerPlant,
    inPrepPerPlant,
    monthlyDeployedPerPlant,
    plantsForBars,
    totalAccumulated,
  } = useMemo(() => {
    const deployed = rows.filter((r) => r?.status === "DEPLOYED"); // adapte
    const inPrep = rows.filter((r) => r?.status === "IN_PREPARATION"); // adapte

    const deployedPerPlant = groupCount(deployed, "plant");
    const inPrepPerPlant = groupCount(inPrep, "plant");

    const { data: monthly, plants } = buildMonthlyPerPlant(deployed, "plant");

    return {
      deployedRows: deployed,
      inPrepRows: inPrep,
      deployedPerPlant,
      inPrepPerPlant,
      monthlyDeployedPerPlant: monthly,
      plantsForBars: plants,
      totalAccumulated: rows.length,
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="px-6 py-8 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Header */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
              <h1 className="text-2xl font-bold text-white">KPIs</h1>
              <p className="text-white/80 text-sm mt-1">Charts view</p>
            </div>
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {loading ? "Loading..." : `${totalAccumulated} ${totalAccumulated === 1 ? "record" : "records"}`}
              </span>
            </div>
          </div>

          {/* KPI cards (optionnel) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
              <div className="text-sm font-semibold text-slate-600">Total accumulated LLC</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{loading ? "—" : totalAccumulated}</div>
            </div>
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
              <div className="text-sm font-semibold text-slate-600">LLC deployed</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{loading ? "—" : deployedRows.length}</div>
            </div>
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100 p-6">
              <div className="text-sm font-semibold text-slate-600">LLC in preparation</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{loading ? "—" : inPrepRows.length}</div>
            </div>
          </div>

          {/* 1) PIE: Accumulated deployed per plant */}
          <Card
            title="Accumulated LLC deployed per plant"
            subtitle="Share of deployed LLC by plant"
          >
            <div className="h-[320px]">
              {!loading && deployedPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deployedPerPlant}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {deployedPerPlant.map((_, idx) => (
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

          {/* 2) BAR: Monthly deployed per plant (grouped bars) */}
          <Card
            title="Monthly number of Lessons Learned deployed per Plant"
            subtitle="Grouped by plant"
          >
            <div className="h-[340px]">
              {!loading && monthlyDeployedPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyDeployedPerPlant} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {plantsForBars.map((plant, idx) => (
                      <Bar key={plant} dataKey={plant} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600">No monthly deployed data.</div>
              )}
            </div>
          </Card>

          {/* 3) BAR: In preparation per plant (comme ta capture “safety status per plant”) */}
          <Card
            title="Accumulated LLC (in preparation) per plant"
            subtitle="Counts by plant"
          >
            <div className="h-[320px]">
              {!loading && inPrepPerPlant.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inPrepPerPlant} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="LLC in preparation" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
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
