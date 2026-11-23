import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HardHat, Camera } from "lucide-react";
import { Field } from "../components/Shared";
import {
  isServiceProvider,
  providerAccountTypes,
  type AccountType,
} from "../types/app";
import { authService } from "../services/authService";
import { uploadService } from "../services/uploadService";

export default function AuthPage({
  register,
  onSuccess,
}: {
  register: boolean;
  onSuccess?: () => Promise<void> | void;
}) {
  const [type, setType] = useState<AccountType>("طالب خدمة");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const providerMode = isServiceProvider(type);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (register) {
        let logoUrl: string | undefined;
        if (avatarFile) {
          const uploaded = await uploadService.uploadFile(avatarFile);
          logoUrl = uploaded.url;
        }
        await authService.register({
          displayName,
          email,
          phoneNumber,
          password,
          accountType: (type === "طالب خدمة" ? "شخص" : type) as any,
          logoUrl,
        });
      } else {
        await authService.login(email, password);
      }
      if (onSuccess) await onSuccess();
      nav("/");
    } catch (err: any) {
      setError(err.message || "حدث خطأ في البيانات، تأكد من البريد وكلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand justify-center mb-5">
          <span className="brand-icon">
            <HardHat />
          </span>
          <span>
            <b>بناءتك</b>
            <small>سوق البناء والهندسة</small>
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-center">
          {register ? "إنشاء حساب جديد" : "مرحباً بعودتك"}
        </h1>
        <p className="text-center text-slate-500 text-sm mt-2 mb-6">
          {register ? "انضم إلى شبكة المقاولات والتوريدات" : "سجل الدخول لمتابعة أعمالك"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center font-semibold">
            {error}
          </div>
        )}

        {register && (
          <>
            <div className="flex flex-col items-center mb-4">
              <label className="relative cursor-pointer group">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="صورة الحساب"
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 group-hover:border-amber-400">
                    <Camera size={22} />
                    <span className="text-[10px] mt-1">صورة / شعار</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              <span className="text-xs text-slate-400 mt-1">اختياري: أضف صورة شخصية أو شعار الشركة</span>
            </div>

            <Field label="اختر نوع حسابك">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setType("طالب خدمة")}
                  className={`p-3 rounded-xl border text-right transition ${
                    !providerMode
                      ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900">طالب خدمة</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    أبحث عن مهندس أو مقاول أو مواد بناء
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!providerMode) setType("مهندس");
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    providerMode
                      ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900">مقدم خدمة</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    أقدم خدمات هندسية أو مقاولات أو منتجات
                  </div>
                </button>
              </div>
            </Field>

            {providerMode && (
              <Field label="تخصص مقدم الخدمة">
                <div className="grid grid-cols-3 gap-2">
                  {providerAccountTypes.map((t) => (
                    <button
                      type="button"
                      className={`account-option ${type === t ? "selected" : ""}`}
                      onClick={() => setType(t)}
                      key={t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label={providerMode ? "الاسم أو اسم الشركة / المكتب" : "الاسم الكامل"}>
              <input
                className="field"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>

            <Field label="رقم الهاتف">
              <input
                className="field"
                type="tel"
                required
                placeholder="01xxxxxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
          </>
        )}

        <Field label={register ? "البريد الإلكتروني" : "البريد الإلكتروني أو رقم الهاتف"}>
          <input
            className="field"
            type={register ? "email" : "text"}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="كلمة المرور">
          <input
            className="field"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button className="btn btn-amber w-full mt-5" type="submit" disabled={loading}>
          {loading ? "جاري التنفيذ..." : register ? "إنشاء الحساب" : "تسجيل الدخول"}
        </button>

        <p className="text-center text-sm text-slate-500 mt-5">
          {register ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
          <Link className="text-amber-700 font-bold" to={register ? "/login" : "/register"}>
            {register ? "تسجيل الدخول" : "إنشاء حساب"}
          </Link>
        </p>
      </form>
    </div>
  );
}