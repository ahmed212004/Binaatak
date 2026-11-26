import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Tag, Time, Empty } from "../components/Shared";
import { taxonomy, type TaxonomyNode } from "../data/mockData";
import { apiRequest } from "../services/api";
import { guestProfile, type ProfileState } from "../types/app";

function checkIsAdmin(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (!val) continue;

      if (val.startsWith("{")) {
        try {
          const obj = JSON.parse(val);
          if (obj?.email?.toLowerCase() === "admin@buildlink.com") return true;
          if (obj?.user?.email?.toLowerCase() === "admin@buildlink.com") return true;
          if (obj?.role === "Admin" || obj?.roles?.includes?.("Admin")) return true;
          if (typeof obj?.token === "string" && obj.token.includes(".")) {
            const p = JSON.parse(
              atob(obj.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            const r =
              p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
              p.role;
            if (r === "Admin" || (Array.isArray(r) && r.includes("Admin")))
              return true;
          }
        } catch {}
      }

      if (val.split(".").length === 3) {
        try {
          const p = JSON.parse(
            atob(val.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          );
          const r =
            p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            p.role;
          if (r === "Admin" || (Array.isArray(r) && r.includes("Admin")))
            return true;
          if (p.email?.toLowerCase() === "admin@buildlink.com") return true;
        } catch {}
      }
    }
    return false;
  } catch {
    return false;
  }
}

export default function HomePage({
  profile = guestProfile,
  posts = [],
  taxNodes = taxonomy,
  onPost,
  onLike,
  onDeletePost,
}: {
  profile?: ProfileState;
  posts?: any[];
  rfqs?: any[];
  taxNodes?: TaxonomyNode[];
  onPost: () => void;
  onLike: (id: string | number) => void;
  onSetup?: () => void;
  onDeletePost?: (id: string | number) => void;
}) {
  const safeTaxNodes =
    Array.isArray(taxNodes) && taxNodes.length > 0 ? taxNodes : taxonomy;

  const [localPosts, setLocalPosts] = useState<any[]>(
    Array.isArray(posts) ? posts : []
  );
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  useEffect(() => {
    setLocalPosts(Array.isArray(posts) ? posts : []);
  }, [posts]);

  const isAdmin = checkIsAdmin();

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

  const filtered = localPosts.filter((p) => {
    if (selectedMain && p.category?.trim() !== selectedMain.trim()) return false;
    if (selectedSub && p.subCategory?.trim() !== selectedSub.trim()) return false;
    if (selectedSpecialty && p.specialty?.trim() !== selectedSpecialty.trim())
      return false;
    return true;
  });

  const handleAdminDelete = async (postId: string | number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟")) return;

    setDeletingId(postId);
    try {
      await apiRequest(`/Feed/${postId}`, {
        method: "DELETE",
      });

      setLocalPosts((prev) => prev.filter((item) => item.id !== postId));
      if (onDeletePost) {
        onDeletePost(postId);
      }
    } catch (err: any) {
      alert(err?.message || "تعذر حذف المنشور، تأكد من صلاحيات الأدمن أو مسار الحذف.");
    } finally {
      setDeletingId(null);
    }
  };

  const initialLetter = profile?.name?.trim()?.[0] || "ب";
  const hasFilter = Boolean(selectedMain || selectedSub || selectedSpecialty);

  const resetFilters = () => {
    setSelectedMain("");
    setSelectedSub("");
    setSelectedSpecialty("");
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 space-y-4">
      {/* صندوق إنشاء منشور */}
      <button
        type="button"
        className="panel w-full p-4 text-right hover:border-amber-300 transition"
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

      {/* شريط الفلترة حسب التصنيفات */}
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

      {/* قائمة المنشورات */}
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
                <div className="flex items-center gap-2">
                  <Tag>{p.type}</Tag>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleAdminDelete(p.id)}
                      disabled={deletingId === p.id}
                      title="حذف المنشور (صلاحية الأدمن)"
                      className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap gap-1.5">
                  <Tag color="slate">{p.category}</Tag>
                  {p.subCategory && <Tag color="blue">{p.subCategory}</Tag>}
                  {p.specialty && <Tag color="green">{p.specialty}</Tag>}
                </div>
                <p className="leading-8 text-sm mt-3 whitespace-pre-line">
                  {p.body}
                </p>

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
                    p.isLiked
                      ? "text-rose-600 font-bold"
                      : "text-slate-500 hover:text-rose-500"
                  }`}
                  onClick={() => onLike(p.id)}
                >
                  <Heart size={17} fill={p.isLiked ? "currentColor" : "none"} />{" "}
                  {p.likes} إعجاب
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
    </div>
  );
}