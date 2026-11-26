import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../services/api";

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
}

export default function AdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatError = (err: any, fallback: string) => {
    const msg = err?.message || "";
    if (msg.includes("Unexpected end of JSON") || msg.includes("404")) {
      return "تعذر الوصول لنقطة النهاية (Admin API). تأكد من إعادة تشغيل سيرفر الباك إند (.NET API) بعد إضافة AdminController.";
    }
    if (msg.includes("401") || msg.includes("403")) {
      return "ليس لديك صلاحية للوصول إلى هذه الصفحة، تأكد من تسجيل الدخول بحساب الأدمن.";
    }
    return msg || fallback;
  };

  const fetchAdmins = async () => {
    try {
      const data = await apiRequest<AdminUser[]>("/Admin/admins");
      setAdmins(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      setError(formatError(err, "تعذر تحميل قائمة الأدمنز"));
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiRequest<{ message?: string }>("/Admin/admins", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim() || null,
          password: password || null,
        }),
      });

      setSuccess(res?.message || "تم منح صلاحية الأدمن بنجاح");
      setEmail("");
      setDisplayName("");
      setPassword("");
      setShowPassword(false);
      await fetchAdmins();
    } catch (err: any) {
      setError(formatError(err, "حدث خطأ أثناء إضافة الأدمن"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: string, adminEmail: string) => {
    if (!window.confirm(`هل أنت متأكد من سحب صلاحية الأدمن من (${adminEmail})؟`)) return;

    setError("");
    setSuccess("");
    try {
      const res = await apiRequest<{ message?: string }>(`/Admin/admins/${id}`, {
        method: "DELETE",
      });
      setSuccess(res?.message || "تم سحب الصلاحية بنجاح");
      await fetchAdmins();
    } catch (err: any) {
      setError(formatError(err, "تعذر سحب الصلاحية"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-amber-600" size={30} />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            إدارة المشرفين (Admins) - Build Link
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            يمكنك ترقية عضو مسجل بإدخال بريده الإلكتروني فقط، أو إنشاء حساب أدمن جديد بإدخال الاسم وكلمة المرور.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl mb-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-xl mb-4 text-sm font-semibold">
          {success}
        </div>
      )}

      {/* نموذج إضافة أو ترقية أدمن */}
      <form
        onSubmit={handleAddAdmin}
        autoComplete="off"
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4"
      >
        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserPlus size={18} className="text-amber-600" />
          إضافة مشرف جديد أو ترقية عضو حالي
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Mail size={16} className="text-slate-400 absolute right-3 top-3" />
            <input
              type="email"
              name="new-admin-email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني *"
              className="w-full border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-sm"
            />
          </div>

          <div className="relative">
            <User size={16} className="text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              name="new-admin-name"
              autoComplete="off"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="الاسم (للحساب الجديد)"
              className="w-full border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="text-slate-400 absolute right-3 top-3" />
            <input
              type={showPassword ? "text" : "password"}
              name="new-admin-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور (للحساب الجديد)"
              className="w-full border border-slate-300 rounded-xl pr-9 pl-9 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="text-slate-400 hover:text-slate-600 absolute left-3 top-2.5 transition"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: "#d97706", color: "#ffffff" }}
            className="hover:opacity-90 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition disabled:opacity-50 cursor-pointer"
          >
            <UserPlus size={17} />
            <span>{loading ? "جاري الحفظ..." : "منح صلاحية الأدمن"}</span>
          </button>
        </div>
      </form>

      {/* قائمة الأدمنز الحاليين */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
          قائمة المشرفين الحاليين ({admins.length})
        </div>

        {admins.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            لا توجد بيانات معروضة حالياً.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center">
                    {admin.displayName?.[0] || "A"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {admin.displayName}
                      <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5" dir="ltr">
                      {admin.email}
                    </div>
                  </div>
                </div>

                {admin.email?.toLowerCase() !== "admin@buildlink.com" && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                    className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={14} />
                    سحب الصلاحية
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}