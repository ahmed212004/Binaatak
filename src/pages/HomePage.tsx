import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Plus,
  ArrowLeft,
  Package,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Tag, Verified, Location, Time, Empty } from "../components/Shared";
import { taxonomy, type TaxonomyNode } from "../data/mockData";
import { authService } from "../services/authService";
import { guestProfile, type ProfileState } from "../types/app";

export default function HomePage({
  profile = guestProfile,
  posts = [],
  rfqs = [],
  taxNodes = taxonomy,
  onPost,
  onLike,
  onSetup,
}: {
  profile?: ProfileState;
  posts?: any[];
  rfqs?: any[];
  taxNodes?: TaxonomyNode[];
  onPost: () => void;
  onLike: (id: string | number) => void;
  onSetup: () => void;
}) {
  const safeTaxNodes = Array.isArray(taxNodes) && taxNodes.length > 0 ? taxNodes : taxonomy;
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeRfqs = Array.isArray(rfqs) ? rfqs : [];

  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const activeMainNode: any = safeTaxNodes.find(
    (n) => n.name?.trim() === selectedMain.trim()
  );

  const rawSubs: any[] =
    activeMainNode?.subs ??
    activeMainNode?.subCategories ??
    activeMainNode?.subcategories ??
    activeMainNode?.children ??
    [];

  const subNodes = rawSubs.map((s: any) =>
    typeof s === "string" ? { name: s, specialties: [] } : s
  );

  const activeSubNode: any = subNodes.find(
    (s: any) => s.name?.trim() === selectedSub.trim()
  );

  const rawSpecialties: any[] =
    activeSubNode?.specialties ??
    activeSubNode?.children ??
    activeSubNode?.items ??
    [];

  const specialties: string[] = rawSpecialties.map((sp: any) =>
    typeof sp === "string" ? sp : sp.name
  );

  const filtered = safePosts.filter((p) => {
    if (selectedMain && p.category?.trim() !== selectedMain.trim()) return false;
    if (selectedSub && p.subCategory?.trim() !== selectedSub.trim()) return false;
    if (selectedSpecialty && p.specialty?.trim() !== selectedSpecialty.trim()) return false;
    return true;
  });

  const initialLetter = profile?.name?.trim()?.[0] || "ب";
  const hasFilter = Boolean(selectedMain || selectedSub || selectedSpecialty);

  const resetFilters = () => {
    setSelectedMain("");
    setSelectedSub("");
    setSelectedSpecialty("");
  };

  return (
    <div className="home-grid">
      {/* القائمة الجانبية اليمنى */}
      <aside className="space-y-4">
        <section className="panel p-4">
          <div className="flex items-start gap-3">
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.name}
                className="w-12 h-12 rounded-xl object-cover border"
              />
            ) : (
              <div className="avatar large">{initialLetter}</div>
            )}
            <div className="min-w-0">
              <Link to="/profile" className="font-extrabold text-sm hover:text-amber-700">
                {profile?.name || "عضو بناءتك"}
              </Link>
              <div className="mt-1">
                {authService.isAuthenticated() ? (
                  <Verified />
                ) : (
                  <Link to="/login" className="text-xs text-amber-700 font-bold">
                    تسجيل الدخول أو إنشاء حساب ←
                  </Link>
                )}
              </div>
              <Tag color="blue">{profile?.type || "طالب خدمة"}</Tag>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">التخصص المعتمد</div>
            <b className="text-sm">{profile?.tax?.category || "لم يُحدد بعد"}</b>
            {profile?.tax?.sub && (
              <div className="text-xs text-slate-500 mt-1">
                {profile.tax.sub} ← {profile.tax.specialty}
              </div>
            )}
            <button
              type="button"
              className="text-amber-700 text-xs font-bold mt-2 block"
              onClick={onSetup}
            >
              تعديل التخصص
            </button>
          </div>

          <div className="stats-row">
            <span>
              <b>{safePosts.length}</b>
              <small>منشور نشط</small>
            </span>
            <span>
              <b>{safeRfqs.length}</b>
              <small>طلب توريد</small>
            </span>
            <span>
              <b>{safeTaxNodes.length}</b>
              <small>قطاع هندسي</small>
            </span>
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold">تصفح سريع للتصنيفات ({safeTaxNodes.length})</h3>
            <Link to="/directory" className="text-xs font-bold text-amber-700 hover:underline">
              الكل
            </Link>
          </div>
          <div className="space-y-1">
            {safeTaxNodes.map((c) => (
              <Link
                key={c.name}
                to={`/directory?category=${encodeURIComponent(c.name)}`}
                className="category-row"
              >
                <span className="category-icon">
                  <Package size={15} />
                </span>
                {c.name}
                <ArrowLeft size={14} className="mr-auto text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      </aside>

      {/* العمود الأوسط: المنشورات والفلتر */}
      <section className="space-y-4">
        <button
          type="button"
          className="panel w-full p-4 text-right hover:border-amber-300"
          onClick={onPost}
        >
          <div className="flex items-center gap-3">
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.name}
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="avatar">{initialLetter}</div>
            )}
            <span className="text-slate-400">
              شارك مشروعًا أو خبرًا أو عرض توريد مع مجتمع البناء...
            </span>
            <span className="mr-auto btn btn-amber">
              <Plus size={16} /> إنشاء منشور
            </span>
          </div>
        </button>

        <div className="panel p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              className="field text-sm"
              value={selectedMain}
              onChange={(e) => {
                setSelectedMain(e.target.value);
                setSelectedSub("");
                setSelectedSpecialty("");
              }}
            >
              <option value="">كل التصنيفات الرئيسية</option>
              {safeTaxNodes.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>

            <select
              className="field text-sm"
              value={selectedSub}
              disabled={!selectedMain}
              onChange={(e) => {
                setSelectedSub(e.target.value);
                setSelectedSpecialty("");
              }}
            >
              <option value="">كل التصنيفات الفرعية</option>
              {subNodes.map((s: any) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="field text-sm"
              value={selectedSpecialty}
              disabled={!selectedSub}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">كل التخصصات الدقيقة</option>
              {specialties.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {hasFilter && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-amber-700 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <RotateCcw size={13} /> عرض كل المنشورات
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <Empty text="لا توجد منشورات مطابقة لهذا التصنيف حالياً." />
        ) : (
          filtered.map((p) => {
            const postSummary = p.body
              ? p.body.length > 45
                ? `${p.body.slice(0, 45)}...`
                : p.body
              : p.type;

            return (
              <article className="panel p-4" key={p.id}>
                <div className="flex gap-3 items-center">
                  {p.authorLogoUrl ? (
                    <img
                      src={p.authorLogoUrl}
                      alt={p.author}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="avatar">{p.author?.[0] || "م"}</div>
                  )}
                  <div className="flex-1">
                    <b className="text-sm">{p.author}</b>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{p.role}</span>
                      <Time>{p.time}</Time>
                    </div>
                  </div>
                  <Tag>{p.type}</Tag>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Tag color="slate">{p.category}</Tag>
                    {p.subCategory && <Tag color="blue">{p.subCategory}</Tag>}
                    {p.specialty && <Tag color="green">{p.specialty}</Tag>}
                  </div>
                  <p className="leading-8 text-sm mt-3 whitespace-pre-line">{p.body}</p>

                  {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                    <div
                      className={`mt-3 grid gap-2 ${
                        p.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      }`}
                    >
                      {p.attachments.map((att: any, idx: number) =>
                        att.type === "video" ? (
                          <video
                            key={idx}
                            src={att.url}
                            controls
                            className="w-full max-h-96 rounded-xl bg-black object-contain"
                          />
                        ) : (
                          <img
                            key={idx}
                            src={att.url}
                            alt={att.name || "صورة المنشور"}
                            className="w-full max-h-96 rounded-xl object-cover border"
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t mt-4 pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 text-sm ${
                      p.isLiked ? "text-rose-600 font-bold" : "text-slate-500 hover:text-rose-500"
                    }`}
                    onClick={() => onLike(p.id)}
                  >
                    <Heart size={17} fill={p.isLiked ? "currentColor" : "none"} /> {p.likes} إعجاب
                  </button>
                  <Link
                    className="btn btn-dark"
                    to="/messages"
                    state={{
                      recipientId: p.authorId,
                      recipientName: p.author,
                      contextTitle: postSummary,
                      contextId: p.id,
                    }}
                  >
                    <MessageCircle size={16} /> مراسلة مباشرة
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* القائمة الجانبية اليسرى */}
      <aside className="space-y-4">
        <section className="panel p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold">طلبات شراء وتوريد عاجلة</h3>
            <Tag color="green">مفتوح</Tag>
          </div>
          {safeRfqs.slice(0, 3).map((r) => (
            <div key={r.id} className="border-b last:border-0 py-3">
              <b className="text-sm leading-6">{r.title}</b>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color="slate">{r.specialty}</Tag>
                <Location>{r.location}</Location>
              </div>
              <Link
                to="/messages"
                state={{
                  recipientId: r.requesterId,
                  recipientName: r.requester,
                  contextTitle: r.title,
                  contextId: r.id,
                }}
                className="text-emerald-700 hover:text-emerald-800 text-xs font-bold inline-flex items-center gap-1 mt-2"
              >
                <MessageCircle size={13} /> مراسلة صاحب الطلب
              </Link>
            </div>
          ))}
          <Link to="/rfqs" className="text-amber-700 text-xs font-bold inline-block mt-2">
            عرض كل الطلبات
          </Link>
        </section>

        <section className="navy-card">
          <div className="text-amber-400">
            <SlidersHorizontal size={24} />
          </div>
          <h3 className="font-extrabold text-lg mt-3">تخصصك يوصلك بالفرصة الصح</h3>
          <p className="text-slate-300 text-sm leading-7 mt-2">
            صنّف نشاطك في 3 خطوات بسيطة لتظهر منتجاتك وخدماتك للعملاء المناسبين.
          </p>
          <div className="flex gap-2 mt-4">
            {["رئيسي", "فرعي", "دقيق"].map((x, i) => (
              <span className="step" key={x}>
                {i + 1}. {x}
              </span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}