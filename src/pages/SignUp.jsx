import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plant, setPlant] = useState(""); 
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signUp({ name, email, password, plant }); 
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
          <h1 className="text-2xl font-bold text-white">Sign up</h1>
          <p className="text-white/80 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-4">
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Plant</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="" disabled>
                Select a plant
              </option>
              <option value="Plant 1">FRANKFURT Plant</option>
              <option value="Plant 2">CHENNAI Plant</option>
              <option value="Plant 3">MONTERREY Plant</option>
              <option value="Plant 4">TIANJIN Plant</option>
              <option value="Plant 5">CYCLAM Plant</option>
              <option value="Plant 6">ANHUI Plant</option>
              <option value="Plant 7">SCEET Plant</option>
              <option value="Plant 8">KUNSHAN Plant</option>
              <option value="Plant 9">SAME Plant</option>
              <option value="Plant 10">POITIERS Plant</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            disabled={loading}
            className="w-full px-5 py-2.5 rounded-xl bg-sky-800 text-white font-semibold hover:bg-sky-900 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-sky-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
