import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HardHat, Search, Menu, X, FolderTree, ShieldCheck, LogOut, LogIn } from "lucide-react";
import { authService } from "../services/authService";

const links = [
  ["الرئيسية", "/"],
  ["المنتجات والخدمات (12)", "/directory"],
  ["طلبات التوريد والخدمات", "/rfqs"],
  ["الوظائف والعمل", "/jobs"],
  ["الرسائل", "/messages"],
  ["الملف الشخصي", "/profile"],
];

function checkAuthStatus(): { isAuthenticated: boolean; isAdmin: boolean } {
  try {
    let isAuthenticated = false;
    let isAdmin = false;

    if (typeof authService?.isAuthenticated === "function" && authService.isAuthenticated()) {
      isAuthenticated = true;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (!val) continue;

      if (val.startsWith("{")) {
        try {
          const obj = JSON.parse(val);
          if (obj?.token || obj?.email || obj?.user?.email) {
            isAuthenticated = true;
          }
          if (obj?.email?.toLowerCase() === "admin@buildlink.com") isAdmin = true;
          if (obj?.user?.email?.toLowerCase() === "admin@buildlink.com") isAdmin = true;
          if (obj?.role === "Admin" || obj?.roles?.includes?.("Admin")) isAdmin = true;
          if (typeof obj?.token === "string" && obj.token.includes(".")) {
            const p = JSON.parse(atob(obj.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            const r = p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || p.role;
            if (r === "Admin" || (Array.isArray(r) && r.includes("Admin"))) isAdmin = true;
          }
        } catch {}
      }

      if (val.split(".").length === 3) {
        try {
          const p = JSON.parse(atob(val.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          isAuthenticated = true;
          const r = p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || p.role;
          if (r === "Admin" || (Array.isArray(r) && r.includes("Admin"))) isAdmin = true;
          if (p.email?.toLowerCase() === "admin@buildlink.com") isAdmin = true;
        } catch {}
      }
    }

    return { isAuthenticated, isAdmin };
  } catch {
    return { isAuthenticated: false, isAdmin: false };
  }
}

export default function Navigation({ onSetup }: { onSetup: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const { isAuthenticated, isAdmin } = checkAuthStatus();

  const handleLogout = () => {
    if (typeof (authService as any).logout === "function") {
      (authService as any).logout();
    }
    localStorage.clear();
    nav("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="nav-inner" style={{ gap: "10px" }}>
        <button className="mobile-menu" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>

        <div className="brand shrink-0" onClick={() => nav("/")}>
          <span className="brand-icon">
            <HardHat size={24} />
          </span>
          <span>
            <b>Build Link</b>
            <small>شبكة المقاولات والهندسة والتوريدات</small>
          </span>
        </div>

        <form
          className="nav-search"
          style={{ maxWidth: "155px" }}
          onSubmit={(e) => {
            e.preventDefault();
            nav("/directory?q=" + encodeURIComponent(q));
          }}
        >
          <Search size={15} />
          <input
            placeholder="ابحث..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <nav className={open ? "nav-links open" : "nav-links"} style={{ gap: "6px" }}>
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "nav-link active whitespace-nowrap" : "nav-link whitespace-nowrap")}
            >
              {label}
              {path === "/messages" && <i className="unread-dot" />}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/categories"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `nav-link whitespace-nowrap flex items-center gap-1 ${
                    isActive ? "active" : ""
                  }`
                }
                style={{ color: "#fbbf24", fontWeight: 700 }}
              >
                <FolderTree size={15} />
                <span>التصنيفات</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `nav-link whitespace-nowrap flex items-center gap-1 ${
                    isActive ? "active" : ""
                  }`
                }
                style={{ color: "#fbbf24", fontWeight: 700 }}
              >
                <ShieldCheck size={15} />
                <span>المشرفين</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-amber whitespace-nowrap"
            style={{ padding: "8px 12px", fontSize: "13px" }}
            onClick={onSetup}
          >
            تحديد التخصص
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              title="تسجيل خروج"
              className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-950/50 hover:bg-red-600 border border-red-800/60 flex items-center gap-1 whitespace-nowrap transition"
            >
              <LogOut size={14} />
              <span>تسجيل خروج</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => nav("/login")}
              title="تسجيل دخول"
              className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-700/60 flex items-center gap-1 whitespace-nowrap transition"
            >
              <LogIn size={14} />
              <span>تسجيل دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}