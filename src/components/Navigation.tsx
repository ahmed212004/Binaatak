import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HardHat, Search, Menu, X } from "lucide-react";
import { authService } from "../services/authService";

const links = [
  ["الرئيسية", "/"],
  ["المنتجات والخدمات (12)", "/directory"],
  ["طلبات التوريد والخدمات", "/rfqs"],
  ["الوظائف والعمل", "/jobs"],
  ["الرسائل", "/messages"],
  ["الملف الشخصي", "/profile"],
];

export default function Navigation({ onSetup }: { onSetup: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const handleLogout = () => {
    if (typeof (authService as any).logout === "function") {
      (authService as any).logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    nav("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <button className="mobile-menu" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>

        <div className="brand" onClick={() => nav("/")}>
          <span className="brand-icon">
            <HardHat size={25} />
          </span>
          <span>
            <b>بناءتك</b>
            <small>شبكة المقاولات والهندسة والتوريدات</small>
          </span>
        </div>

        <form
          className="nav-search"
          onSubmit={(e) => {
            e.preventDefault();
            nav("/directory?q=" + encodeURIComponent(q));
          }}
        >
          <Search size={16} />
          <input
            placeholder="ابحث..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <nav className={open ? "nav-links open" : "nav-links"}>
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {label}
              {path === "/messages" && <i className="unread-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="btn btn-amber nav-cta" onClick={onSetup}>
            تحديد التخصص التدريجي
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}