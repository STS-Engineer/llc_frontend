// src/auth.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);
const API = "http://localhost:3001/api";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  async function signIn({ email, password }) {
    const r = await fetch(`${API}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Sign in failed");

    setToken(data.token);
    setUser(data.user);
  }

  async function signUp({ name, email, password }) {
    const r = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Sign up failed");

    // option: auto-login après sign up
    setToken(data.token);
    setUser(data.user);
  }

  function signOut() {
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, signIn, signUp, signOut, isAuthed: !!token }),
    [token, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// fetch helper avec token
export async function apiFetch(url, options = {}, token = "") {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
