import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Edit3,
  MapPin,
  Briefcase,
  FileText,
  Package,
  Plus,
  Layers,
  Heart,
  Clock,
  UserCheck,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { Button, Tag, Verified, Location, Time, Empty, Toast } from "../components/Shared";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { rfqService } from "../services/rfqService";
import { jobService, type JobListing, type TalentListing } from "../services/jobService";
import { isServiceProvider, type ProfileState } from "../types/app";

export default function ProfilePage({
  profile,
  listings = [],
  posts = [],
  onEdit,
  onAdd,
}: {
  profile: ProfileState;
  listings?: any[];
  posts?: any[];
  onEdit: () => void;
  onAdd: () => void;
}) {
  const isAuth = authService.isAuthenticated();
  const providerMode = isServiceProvider(profile?.type);

  const [me, setMe] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>(profile?.logoUrl || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [myRfqs, setMyRfqs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<JobListing[]>([]);
  const [myTalent, setMyTalent] = useState<TalentListing | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const [activeTab, setActiveTab] = useState<"posts" | "services" | "rfqs" | "jobs">(
    providerMode ? "services" : "posts"
  );
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    if (profile?.logoUrl) {
      setLogoUrl(profile.logoUrl);
    }
  }, [profile?.logoUrl]);

  useEffect(() => {
    if (!providerMode && activeTab === "services") {
      setActiveTab("posts");
    }
  }, [providerMode, activeTab]);

  useEffect(() => {
    if (!isAuth) {
      setLoadingExtra(false);
      return;
    }

    let cancelled = false;

    const loadProfileDetails = async () => {
      setLoadingExtra(true);
      try {
        const [meData, allRfqs, allJobs, allTalents] = await Promise.all([
          profileService.getMe().catch(() => null),
          rfqService.getRfqs().catch(() => []),
          jobService.getJobs().catch(() => []),
          jobService.getTalents().catch(() => []),
        ]);

        if (cancelled) return;

        if (meData) {
          setMe(meData);
          if (meData.logoUrl) setLogoUrl(meData.logoUrl);

          const myId = String(meData.id || "").toLowerCase();
          if (myId) {
            setMyRfqs(
              (allRfqs ?? []).filter(
                (r: any) => String(r.requesterId || "").toLowerCase() === myId
              )
            );
            setMyJobs(
              (allJobs ?? []).filter(
                (j: JobListing) => String(j.companyId || "").toLowerCase() === myId
              )
            );
            const foundTalent = (allTalents ?? []).find(
              (t: TalentListing) => String(t.userId || "").toLowerCase() === myId
            );
            setMyTalent(foundTalent || null);
          }
        }
      } finally {
        if (!cancelled) setLoadingExtra(false);
      }
    };

    loadProfileDetails();
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  if (!isAuth) {
    return (
      <div className="panel p-10 text-center space-y-4 my-6">
        <h2 className="text-xl font-black text-slate-900">الملف الشخصي وإدارة الحساب</h2>
        <p className="text-sm text-slate-500">
          يرجى تسجيل الدخول لعرض بيانات حسابك، تخصصك الهندسي، منشوراتك، وخدماتك.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/login" className="btn btn-amber">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="btn btn-dark">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    );
  }

  const myUserId = String(me?.id || "").toLowerCase();
  const displayName = me?.displayName || profile?.name || "عضو بناءتك";
  const displayBio = me?.bio ?? profile?.bio ?? "";
  const displayLocation = me?.location ?? profile?.location ?? "";
  const initialLetter = displayName.trim()?.[0] || "ب";

  const myPosts = (posts ?? []).filter((p) =>
    myUserId
      ? String(p.authorId || "").toLowerCase() === myUserId
      : p.author?.trim() === displayName.trim()
  );

  const myListings = (listings ?? []).filter((l) =>
    myUserId
      ? String(l.providerId || "").toLowerCase() === myUserId
      : l.provider?.trim() === displayName.trim()
  );

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadingLogo(true);
    try {
      const res = await profileService.uploadLogo(file);
      if (res?.logoUrl) {
        setLogoUrl(res.logoUrl);
        notify("تم تحديث صورة الحساب بنجاح");
      }
    } catch (err: any) {
      notify(err?.message || "تعذر رفع الصورة، تأكد من صيغة الملف");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* بطاقة الهوية والبيانات الأساسية */}
      <section className="panel overflow-hidden">
        <div className="h-32 bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* صورة الشعار / الصورة الشخصية */}
              <div className="relative w-24 h-24 rounded-2xl bg-white p-1 shadow-md border border-slate-200 shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-amber-500 text-slate-950 font-black text-3xl flex items-center justify-center">
                    {initialLetter}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  title="تغيير الصورة / الشعار"
                  className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow transition"
                >
                  {uploadingLogo ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
              </div>

              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900">
                    {displayName}
                  </h1>
                  {me?.isVerified && <Verified />}
                  <Tag color={providerMode ? "amber" : "blue"}>
                    {profile?.type || "طالب خدمة"}
                  </Tag>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  {displayLocation && (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin size={14} className="text-amber-600" /> {displayLocation}
                    </span>
                  )}
                  {me?.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={14} className="text-slate-400" /> {me.email}
                    </span>
                  )}
                  {me?.phoneNumber && (
                    <span className="inline-flex items-center gap-1" dir="ltr">
                      <Phone size={14} className="text-slate-400" /> {me.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-wrap gap-2">
              <Button variant="dark" onClick={onEdit}>
                <Edit3 size={15} /> تعديل البيانات والتخصص
              </Button>
              {providerMode && (
                <Button variant="amber" onClick={onAdd}>
                  <Plus size={16} /> أضف خدمة للسوق
                </Button>
              )}
            </div>
          </div>

          {/* النبذة والتخصص الهندسي */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="lg:col-span-2 space-y-2">
              <h3 className="text-xs font-extrabold text-slate-400">نبذة عن الحساب / النشاط</h3>
              {displayBio ? (
                <p className="text-sm text-slate-700 leading-7 whitespace-pre-line">
                  {displayBio}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  لم تتم إضافة نبذة تعريفية بعد. اضغط على (تعديل البيانات والتخصص) لإضافة وصف لنشاطك وخبراتك.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-500 inline-flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-600" /> التخصص الهندسي المعتمد
                </span>
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  تعديل
                </button>
              </div>

              {profile?.tax?.category ? (
                <div className="space-y-1.5">
                  <div className="font-black text-sm text-slate-900">
                    {profile.tax.category}
                  </div>
                  {profile.tax.sub && (
                    <div className="text-xs text-slate-600">
                      القسم الفرعي: <b>{profile.tax.sub}</b>
                    </div>
                  )}
                  {profile.tax.specialty && (
                    <div className="pt-1">
                      <Tag color="green">{profile.tax.specialty}</Tag>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  لم يُحدد التخصص التدريجي بعد.
                </div>
              )}
            </div>
          </div>

          {/* شريط الإحصائيات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
            {providerMode && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-center">
                <b className="text-xl font-black text-slate-900 block">{myListings.length}</b>
                <small className="text-xs text-slate-600 font-bold">خدمة ومنتج بالسوق</small>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
              <b className="text-xl font-black text-slate-900 block">{myPosts.length}</b>
              <small className="text-xs text-slate-600 font-bold">منشور وسابقة أعمال</small>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
              <b className="text-xl font-black text-slate-900 block">{myRfqs.length}</b>
              <small className="text-xs text-slate-600 font-bold">طلب توريد وتنفيذ</small>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
              <b className="text-xl font-black text-slate-900 block">
                {myJobs.length + (myTalent ? 1 : 0)}
              </b>
              <small className="text-xs text-slate-600 font-bold">إعلان وظيفي / مهني</small>
            </div>
          </div>
        </div>
      </section>

      {/* تبويبات محتوى الحساب */}
      <div className="filter-pills">
        {providerMode && (
          <button
            type="button"
            className={activeTab === "services" ? "pill active" : "pill"}
            onClick={() => setActiveTab("services")}
          >
            خدماتي ومنتجاتي ({myListings.length})
          </button>
        )}
        <button
          type="button"
          className={activeTab === "posts" ? "pill active" : "pill"}
          onClick={() => setActiveTab("posts")}
        >
          منشوراتي وسابقة الأعمال ({myPosts.length})
        </button>
        <button
          type="button"
          className={activeTab === "rfqs" ? "pill active" : "pill"}
          onClick={() => setActiveTab("rfqs")}
        >
          طلباتي للتوريد والتنفيذ ({myRfqs.length})
        </button>
        <button
          type="button"
          className={activeTab === "jobs" ? "pill active" : "pill"}
          onClick={() => setActiveTab("jobs")}
        >
          الوظائف والملف المهني ({myJobs.length + (myTalent ? 1 : 0)})
        </button>
      </div>

      {/* محتوى التبويب المختار */}
      {activeTab === "services" && providerMode && (
        <section className="space-y-4">
          {myListings.length === 0 ? (
            <div className="panel p-8 text-center space-y-3">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">
                لم تقم بإضافة أي خدمات أو منتجات في السوق حتى الآن.
              </p>
              <Button variant="amber" onClick={onAdd}>
                <Plus size={16} /> أضف أول خدمة الآن
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myListings.map((x) => (
                <article key={x.id} className="panel overflow-hidden flex flex-col">
                  <Link
                    to={`/directory/${x.id}`}
                    className="h-40 bg-slate-100 border-b block overflow-hidden"
                  >
                    {x.coverImage ? (
                      <img
                        src={x.coverImage}
                        alt={x.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={28} className="mb-1 opacity-60" />
                        <span className="text-xs">{x.category}</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-[11px] font-bold text-amber-700">
                      {x.sub || x.category}
                    </div>
                    <Link
                      to={`/directory/${x.id}`}
                      className="font-extrabold text-sm text-slate-900 mt-1 hover:text-amber-700"
                    >
                      {x.title}
                    </Link>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-black text-emerald-700">{x.shortPrice}</span>
                      {x.deliveryDays ? (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock size={12} /> {x.deliveryDays} أيام
                        </span>
                      ) : (
                        <Location>{x.area}</Location>
                      )}
                    </div>
                    <div className="border-t mt-auto pt-3 flex justify-end">
                      <Link
                        to={`/directory/${x.id}`}
                        className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 hover:underline"
                      >
                        عرض صفحة الخدمة <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "posts" && (
        <section className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="panel p-8 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">
                لا توجد منشورات أو سابقة أعمال منشورة من حسابك بعد.
              </p>
              <Link to="/" className="btn btn-amber inline-flex">
                الذهاب للرئيسية ونشر منشور
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPosts.map((p) => (
                <article key={p.id} className="panel p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <Tag>{p.type}</Tag>
                      <Tag color="slate">{p.category}</Tag>
                    </div>
                    <Time>{p.time}</Time>
                  </div>

                  <p className="text-sm text-slate-700 leading-7 whitespace-pre-line">
                    {p.body}
                  </p>

                  {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {p.attachments.slice(0, 2).map((att: any, i: number) =>
                        att.type === "video" ? (
                          <video
                            key={i}
                            src={att.url}
                            controls
                            className="w-full h-40 rounded-lg bg-black object-cover"
                          />
                        ) : (
                          <img
                            key={i}
                            src={att.url}
                            alt=""
                            className="w-full h-40 rounded-lg object-cover border"
                          />
                        )
                      )}
                    </div>
                  )}

                  <div className="border-t pt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                      <Heart size={14} fill="currentColor" /> {p.likes} إعجاب
                    </span>
                    <Link to="/" className="text-amber-700 font-bold hover:underline">
                      عرض في الرئيسية
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "rfqs" && (
        <section className="space-y-4">
          {loadingExtra ? (
            <div className="panel p-8 text-center text-slate-400 text-sm">
              جاري تحميل طلباتك...
            </div>
          ) : myRfqs.length === 0 ? (
            <div className="panel p-8 text-center space-y-3">
              <p className="text-sm font-bold text-slate-600">
                لم تقم بنشر أي طلبات توريد أو تنفيذ أعمال حتى الآن.
              </p>
              <Link to="/rfqs" className="btn btn-amber inline-flex">
                انشر طلبك الأول الآن
              </Link>
            </div>
          ) : (
            <div className="rfq-grid">
              {myRfqs.map((r) => (
                <article key={r.id} className="panel p-4 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <Tag>{r.category}</Tag>
                    <Time>{r.time}</Time>
                  </div>
                  <h3 className="font-extrabold mt-3 text-slate-900">{r.title}</h3>
                  <p className="text-sm text-slate-500 leading-7 mt-2 line-clamp-3">
                    {r.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.specialty && <Tag color="slate">{r.specialty}</Tag>}
                    {r.quantity && <Tag color="green">{r.quantity}</Tag>}
                  </div>
                  <div className="mt-3">
                    <Location>{r.location}</Location>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "jobs" && (
        <section className="space-y-5">
          {loadingExtra ? (
            <div className="panel p-8 text-center text-slate-400 text-sm">
              جاري تحميل بيانات التوظيف...
            </div>
          ) : (
            <>
              {/* بطاقة الباحث عن عمل الخاصة بالمستخدم إن وجدت */}
              {myTalent && (
                <div className="panel p-5 border-amber-300 bg-amber-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-amber-800 inline-flex items-center gap-1.5">
                      <UserCheck size={16} /> ملفك المنشور كباحث عن عمل
                    </span>
                    <Link to="/jobs" className="text-xs font-bold text-amber-700 hover:underline">
                      تعديل من صفحة الوظائف ←
                    </Link>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {myTalent.jobTitle}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 leading-7">{myTalent.skills}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Tag color="green">{myTalent.experienceLabel}</Tag>
                    <Location>{myTalent.location}</Location>
                  </div>
                </div>
              )}

              {/* الوظائف الشاغرة التي نشرتها الشركة */}
              {myJobs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-700">
                    الوظائف الشاغرة التي نشرتها ({myJobs.length})
                  </h3>
                  <div className="listing-grid">
                    {myJobs.map((j) => (
                      <article key={j.id} className="panel p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <b className="text-sm text-slate-900">{j.title}</b>
                          <Time>{j.time}</Time>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Tag color="green">{j.salary}</Tag>
                          <Tag color="slate">{j.type}</Tag>
                        </div>
                        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                          <Location>{j.location}</Location>
                          <span className="font-bold text-amber-700">
                            {j.applicationsCount} متقدم
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {!myTalent && myJobs.length === 0 && (
                <Empty text="لا توجد إعلانات وظائف أو ملف باحث عن عمل مرتبط بحسابك حالياً. يمكنك إضافتها من صفحة (الوظائف والعمل)." />
              )}

              <div className="flex justify-end">
                <Link to="/jobs" className="btn btn-dark">
                  <Briefcase size={15} /> إدارة الوظائف والتوظيف
                </Link>
              </div>
            </>
          )}
        </section>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}