import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Clock,
  Image as ImageIcon,
  ChevronLeft,
  ArrowRight,
  Building2,
  HardHat,
  Wrench,
  Hammer,
  Ruler,
  Compass,
  Truck,
  Layers,
  PaintBucket,
  Zap,
  Droplets,
  Package,
  Factory,
  Briefcase,
  MessageCircle,
} from "lucide-react";
import {
  Button,
  Verified,
  Location,
  SearchBox,
  Empty,
} from "../components/Shared";
import { taxonomy, type TaxonomyNode } from "../data/mockData";
import { authService } from "../services/authService";
import { isServiceProvider, type ProfileState } from "../types/app";

const CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
];

function getMainCategoryImage(name: string, index: number): string {
  const n = name || "";
  if (n.includes("مواد") || n.includes("حديد") || n.includes("أسمنت")) return CATEGORY_IMAGES[0];
  if (n.includes("مقاول") || n.includes("تنفيذ") || n.includes("بناء")) return CATEGORY_IMAGES[1];
  if (n.includes("هندس") || n.includes("معمار") || n.includes("تصميم")) return CATEGORY_IMAGES[2];
  if (n.includes("تشطيب") || n.includes("ديكور") || n.includes("دهان")) return CATEGORY_IMAGES[3];
  if (n.includes("كهرب") || n.includes("سباك") || n.includes("تكييف")) return CATEGORY_IMAGES[4];
  if (n.includes("معدات") || n.includes("آليات") || n.includes("نقل")) return CATEGORY_IMAGES[5];
  if (n.includes("مصنع") || n.includes("ورشة")) return CATEGORY_IMAGES[6];
  return CATEGORY_IMAGES[index % CATEGORY_IMAGES.length];
}

function getSubCategoryIcon(name: string, index: number) {
  const n = name || "";
  const props = { size: 26, strokeWidth: 1.6, className: "text-slate-700 shrink-0" };
  if (n.includes("حديد") || n.includes("معادن") || n.includes("مواد")) return <Layers {...props} />;
  if (n.includes("معمار") || n.includes("تصميم") || n.includes("مخطط")) return <Compass {...props} />;
  if (n.includes("إنشائ") || n.includes("مساح") || n.includes("استشار")) return <Ruler {...props} />;
  if (n.includes("تشطيب") || n.includes("دهان") || n.includes("ديكور")) return <PaintBucket {...props} />;
  if (n.includes("كهرب") || n.includes("إضاءة") || n.includes("طاقة")) return <Zap {...props} />;
  if (n.includes("سباك") || n.includes("صحي") || n.includes("مياه")) return <Droplets {...props} />;
  if (n.includes("معدات") || n.includes("نقل") || n.includes("حفر")) return <Truck {...props} />;
  if (n.includes("صيان") || n.includes("تركيب")) return <Wrench {...props} />;
  if (n.includes("نجار") || n.includes("حداد") || n.includes("أعمال")) return <Hammer {...props} />;
  if (n.includes("مصنع") || n.includes("إنتاج")) return <Factory {...props} />;
  if (n.includes("إدارة") || n.includes("مناقص")) return <Briefcase {...props} />;

  const fallbackIcons = [
    <Building2 {...props} key="1" />,
    <HardHat {...props} key="2" />,
    <Ruler {...props} key="3" />,
    <Wrench {...props} key="4" />,
    <Layers {...props} key="5" />,
    <Package {...props} key="6" />,
  ];
  return fallbackIcons[index % fallbackIcons.length];
}

export default function DirectoryPage({
  listings = [],
  taxNodes = taxonomy,
  profile,
  onAdd,
}: {
  listings?: any[];
  taxNodes?: TaxonomyNode[];
  profile?: ProfileState;
  onAdd: () => void;
}) {
  const safeTaxNodes = Array.isArray(taxNodes) && taxNodes.length > 0 ? taxNodes : taxonomy;
  const safeListings = Array.isArray(listings) ? listings : [];
  const canAddService = authService.isAuthenticated() && isServiceProvider(profile?.type);

  const [search, setSearch] = useState("");
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const catParam = searchParams.get("category") || "";
    if (catParam) {
      setSelectedMain(catParam);
      setSelectedSub("");
      setSelectedSpecialty("");
    }
  }, [searchParams]);

  const activeMainNode: any = safeTaxNodes.find(
    (n) => n.name?.trim() === selectedMain.trim()
  );

  const subNodes: any[] = (
    activeMainNode?.subs ??
    activeMainNode?.subCategories ??
    activeMainNode?.children ??
    []
  ).map((s: any) => (typeof s === "string" ? { name: s, specialties: [] } : s));

  const activeSubNode: any = subNodes.find(
    (s: any) => s.name?.trim() === selectedSub.trim()
  );

  const specialties: string[] = (
    activeSubNode?.specialties ??
    activeSubNode?.children ??
    []
  ).map((sp: any) => (typeof sp === "string" ? sp : sp.name));

  const filtered = safeListings.filter((x) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !`${x.title} ${x.description} ${x.provider} ${x.specialty} ${x.sub} ${x.category}`
        .toLowerCase()
        .includes(q)
    ) {
      return false;
    }
    if (selectedMain && x.category?.trim() !== selectedMain.trim()) return false;
    if (selectedSub && x.sub?.trim() !== selectedSub.trim()) return false;
    if (selectedSpecialty && x.specialty?.trim() !== selectedSpecialty.trim()) return false;
    return true;
  });

  const countByMain = (name: string) =>
    safeListings.filter((x) => x.category?.trim() === name.trim()).length;

  const countBySub = (subName: string) =>
    safeListings.filter(
      (x) =>
        x.category?.trim() === selectedMain.trim() &&
        x.sub?.trim() === subName.trim()
    ).length;

  const resetAll = () => {
    setSelectedMain("");
    setSelectedSub("");
    setSelectedSpecialty("");
    setSearch("");
  };

  return (
    <div className="space-y-8">
      <div className="panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            سوق الخدمات والمنتجات الهندسية
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {canAddService
              ? "تصفح كافة الخدمات الهندسية ومواد البناء والمقاولات، أو أضف خدمتك وابدأ باستقبال الطلبات"
              : "تصفح كافة الخدمات الهندسية ومواد البناء والمقاولات وتواصل مع مقدمي الخدمات مباشرة"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="ابحث عن خدمة أو منتج..."
            />
          </div>
          {canAddService && (
            <Button variant="amber" onClick={onAdd}>
              <Plus size={18} /> أضف خدمة جديدة
            </Button>
          )}
        </div>
      </div>

      {!selectedMain && !search.trim() && (
        <section className="space-y-5">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              كافة الخدمات الإبداعية والهندسية لتطوير مشاريعك
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              اختر القسم الرئيسي لاستعراض التصنيفات الفرعية ومقدمي الخدمات
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {safeTaxNodes.map((cat, idx) => {
              const count = countByMain(cat.name);
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedMain(cat.name);
                    setSelectedSub("");
                    setSelectedSpecialty("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group relative h-44 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-center focus:outline-none"
                >
                  <img
                    src={getMainCategoryImage(cat.name, idx)}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/55 group-hover:bg-slate-950/45 transition-colors" />

                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
                    <h3 className="text-white font-black text-lg md:text-xl drop-shadow">
                      {cat.name}
                    </h3>
                    <span className="mt-2 text-xs font-bold text-amber-300 bg-black/40 px-2.5 py-0.5 rounded-full">
                      {count} {count === 1 ? "خدمة متاحة" : "خدمات متاحة"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selectedMain && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline"
              >
                <ArrowRight size={14} /> كافة التصنيفات الرئيسية
              </button>
              <ChevronLeft size={14} className="text-slate-400" />
              <button
                type="button"
                onClick={() => {
                  setSelectedSub("");
                  setSelectedSpecialty("");
                }}
                className={`font-bold ${
                  !selectedSub ? "text-slate-900" : "text-amber-700 hover:underline"
                }`}
              >
                {selectedMain}
              </button>
              {selectedSub && (
                <>
                  <ChevronLeft size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-900">{selectedSub}</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="text-slate-500 hover:text-slate-800 font-semibold"
            >
              تغيير القسم الرئيسي
            </button>
          </div>

          {subNodes.length > 0 && (
            <div className="space-y-5 py-2">
              <h2 className="text-center text-xl md:text-2xl font-black text-slate-900">
                تصنيفات {selectedMain} الشائعة
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subNodes.map((sub: any, idx: number) => {
                  const isSelected = selectedSub === sub.name;
                  const subCount = countBySub(sub.name);
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => {
                        setSelectedSub(isSelected ? "" : sub.name);
                        setSelectedSpecialty("");
                      }}
                      className={`bg-white rounded-md p-4 flex items-center gap-3.5 text-right border transition-all duration-200 ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                          : "border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        {getSubCategoryIcon(sub.name, idx)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-800 leading-snug">
                          {sub.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {subCount} خدمة
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSub && specialties.length > 0 && (
            <div className="panel p-3.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-600 ml-2">
                التخصص الدقيق:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSpecialty("")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  !selectedSpecialty
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                الكل
              </button>
              {specialties.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSelectedSpecialty(sp)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    selectedSpecialty === sp
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">
            {selectedSpecialty
              ? `خدمات ${selectedSpecialty}`
              : selectedSub
              ? `خدمات ${selectedSub}`
              : selectedMain
              ? `جميع خدمات ${selectedMain}`
              : "أحدث الخدمات والمنتجات المتاحة"}
            <span className="text-xs font-bold text-slate-400 mr-2">
              ({filtered.length})
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <Empty
            text={
              canAddService
                ? "لا توجد خدمات أو منتجات مضافة في هذا القسم حالياً. اضغط على (أضف خدمة جديدة) لتكون أول مقدم خدمة هنا!"
                : "لا توجد خدمات أو منتجات مضافة في هذا القسم حالياً."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((x) => (
              <div
                key={x.id}
                className="panel overflow-hidden flex flex-col group hover:border-amber-400 hover:shadow-md transition"
              >
                <Link
                  to={`/directory/${x.id}`}
                  className="relative h-44 bg-slate-100 overflow-hidden border-b block"
                >
                  {x.coverImage ? (
                    <img
                      src={x.coverImage}
                      alt={x.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                      <ImageIcon size={32} className="mb-1 opacity-60" />
                      <span className="text-xs font-semibold">{x.category}</span>
                    </div>
                  )}

                  {x.images?.length > 1 && (
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded-md">
                      +{x.images.length} صور
                    </span>
                  )}
                </Link>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 truncate">
                    <span>{x.sub || x.category}</span>
                    {x.specialty && (
                      <>
                        <ChevronLeft size={12} />
                        <span className="truncate">{x.specialty}</span>
                      </>
                    )}
                  </div>

                  <Link
                    to={`/directory/${x.id}`}
                    className="font-extrabold text-sm text-slate-900 leading-6 mt-1.5 line-clamp-2 hover:text-amber-700 transition"
                  >
                    {x.title}
                  </Link>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {x.providerLogoUrl ? (
                      <img
                        src={x.providerLogoUrl}
                        alt={x.provider}
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {x.provider?.[0] || "م"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-700 truncate">
                        {x.provider}
                      </div>
                    </div>
                    {x.verified && <Verified />}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-black text-emerald-700 text-sm">
                      {x.shortPrice}
                    </span>
                    {x.deliveryDays ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock size={12} /> {x.deliveryDays} أيام
                      </span>
                    ) : (
                      <Location>{x.area}</Location>
                    )}
                  </div>

                  <div className="border-t mt-auto pt-3 flex items-center justify-between gap-2">
                    <Link
                      to={`/directory/${x.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-amber-700"
                    >
                      التفاصيل
                    </Link>
                    <Link
                      to="/messages"
                      state={{
                        providerId: x.providerId,
                        providerName: x.provider,
                        serviceTitle: x.title,
                        contextId: x.id,
                      }}
                      className="btn btn-dark text-xs py-1.5 px-3"
                    >
                      <MessageCircle size={14} /> مراسلة
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}