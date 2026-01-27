import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";

export default function SignIn() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const redirect = sp.get("redirect");

  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(redirect || "/qualityLessonLearned", { replace: true });
    } catch (e) {
      setErr(e?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl shadow-sky-100 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-sky-700 to-sky-900">
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="text-white/80 text-sm mt-1">Access your dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-4">
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}

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
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            className="w-full px-5 py-2.5 rounded-xl bg-sky-800 text-white font-semibold hover:bg-sky-900 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-sm text-slate-600">
            No account?{" "}
            <Link to="/signup" className="text-sky-700 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
