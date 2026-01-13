import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

// -------------------- small helpers --------------------
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function LinkItem({ to, icon: Icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          "group flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-200",
          isActive
            ? "bg-white text-sky-900 shadow-md shadow-sky-900/10"
            : "text-white/90 hover:bg-white/10 hover:text-white"
        )
      }
    >
      {Icon ? (
        <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center transition group-hover:bg-white/15">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

// -------------------- icons --------------------
const Icons = {
  Menu: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  X: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Home: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Dashboard: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 15v-4" />
      <path d="M12 15v-8" />
      <path d="M17 15v-6" />
    </svg>
  ),
  Logout: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  ),
};

function SidebarContent({ user, onNavigate, onSignOut }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-5">
        <div className="rounded-3xl bg-white/10 border border-white/15 p-4 text-white">
          <div className="text-lg font-bold">LLC App</div>
          <div className="text-xs text-white/80 mt-1 truncate">
            {user?.name || user?.email || "Connected"}
          </div>
        </div>

        <div className="mt-5 text-xs font-semibold text-white/60 uppercase tracking-wider px-2">
          Navigation
        </div>

        <nav className="mt-2 space-y-2">
          <LinkItem to="/dashboard" icon={Icons.Home} onClick={onNavigate}>
            Quality Lesson Learned
          </LinkItem>
          <LinkItem to="/llc/new" icon={Icons.Plus} onClick={onNavigate}>
            LLC Form
          </LinkItem>
          <LinkItem to="/kpis" icon={Icons.Dashboard} onClick={onNavigate}>
            Dashboard
          </LinkItem>
        </nav>
      </div>

      <div className="mt-auto p-5">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                     bg-white/10 hover:bg-white/15 text-white font-semibold
                     transition-all duration-200"
        >
          <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Icons.Logout className="h-5 w-5" />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSignOut = () => {
    signOut();
    navigate("/signup", { replace: true });
  };

  const SIDEBAR_W = "w-72"; // 18rem

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      {/* Desktop sidebar (fixed) */}
      <aside className={cx("hidden md:block fixed inset-y-0 left-0", SIDEBAR_W, "z-40")}>
        <div className={cx("h-full", SIDEBAR_W, "bg-gradient-to-b from-sky-700 via-sky-900 to-sky-700 shadow-2xl")}>
          <SidebarContent user={user} onNavigate={() => {}} onSignOut={onSignOut} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center"
            aria-label="Open menu"
          >
            <Icons.Menu className="h-5 w-5 text-slate-700" />
          </button>

          <div className="text-sm font-bold text-slate-800">LLC App</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-sky-700 via-sky-900 to-sky-700 shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <div className="text-white font-bold">Menu</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center"
                aria-label="Close menu"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent
              user={user}
              onNavigate={() => setMobileOpen(false)}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cx("min-h-screen", "pt-20 md:pt-6", "px-6", "md:pl-72")}>
        <Outlet />
      </main>
    </div>
  );
}
