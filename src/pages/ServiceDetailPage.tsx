import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
} from "lucide-react";
import { Tag, Verified, Empty } from "../components/Shared";
import { directoryService } from "../services/directoryService";

export default function ServiceDetailPage({ listings }: { listings: any[] }) {
  const { id } = useParams();
  const [item, setItem] = useState<any>(() =>
    listings.find((x) => String(x.id) === String(id)) || null
  );
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(!item);

  useEffect(() => {
    const found = listings.find((x) => String(x.id) === String(id));
    if (found) {
      setItem(found);
      setLoading(false);
      return;
    }
    if (!id) return;
    setLoading(true);
    directoryService
      .getListingById(id)
      .then((res) => setItem(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, listings]);

  if (loading) {
    return <div className="panel p-10 text-center text-slate-500">جاري تحميل تفاصيل الخدمة...</div>;
  }

  if (!item) {
    return <Empty text="الخدمة المطلوبة غير موجودة أو تم حذفها." />;
  }

  const images: string[] = item.images ?? [];
  const chatState = {
    providerId: item.providerId,
    providerName: item.provider,
    serviceTitle: item.title,
    contextId: item.id,
  };

  return (
    <div className="space-y-4">
      {/* شريط المسار */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link to="/directory" className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline">
          <ArrowRight size={14} /> سوق الخدمات
        </Link>
        {item.category && (
          <>
            <ChevronLeft size={13} />
            <span>{item.category}</span>
          </>
        )}
        {item.sub && (
          <>
            <ChevronLeft size={13} />
            <span>{item.sub}</span>
          </>
        )}
        {item.specialty && (
          <>
            <ChevronLeft size={13} />
            <span className="font-bold text-slate-700">{item.specialty}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* العمود الرئيسي: العنوان + معرض الصور + الوصف */}
        <div className="lg:col-span-2 space-y-5">
          <section className="panel p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <Tag color="amber">{item.category}</Tag>
              {item.sub && <Tag color="blue">{item.sub}</Tag>}
              {item.specialty && <Tag color="green">{item.specialty}</Tag>}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-9">
              {item.title}
            </h1>

            {/* معرض الصور */}
            <div className="mt-5">
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border bg-slate-950 h-80 md:h-[420px] flex items-center justify-center">
                    <img
                      src={images[activeImg] || images[0]}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImg(idx)}
                          className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                            activeImg === idx ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border bg-slate-50 h-60 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={40} className="mb-2 opacity-50" />
                  <span className="text-sm">لم يضف مقدم الخدمة صوراً إضافية بعد</span>
                </div>
              )}
            </div>

            {/* تفاصيل ووصف الخدمة */}
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-base font-extrabold text-slate-900 mb-3">
                تفاصيل الخدمة ومواصفات التنفيذ
              </h2>
              <p className="text-sm text-slate-700 leading-8 whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </section>
        </div>

        {/* العمود الجانبي: السعر والطلب + بطاقة مقدم الخدمة */}
        <aside className="space-y-4">
          <section className="panel p-5 space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="text-xs text-emerald-700 font-bold">سعر الخدمة / المنتج</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {item.price}
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={16} className="text-amber-600" /> مدة التنفيذ / التوريد
                </span>
                <b className="text-slate-900">
                  {item.deliveryDays ? `${item.deliveryDays} أيام` : "حسب الاتفاق"}
                </b>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} className="text-amber-600" /> نطاق التغطية
                </span>
                <b className="text-slate-900">{item.area}</b>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" /> حالة الخدمة
                </span>
                <b className="text-emerald-700">متاح لاستقبال الطلبات</b>
              </div>
            </div>

            <Link
              to="/messages"
              state={chatState}
              className="btn btn-amber w-full justify-center py-3 text-sm font-extrabold"
            >
              <MessageCircle size={18} /> اطلب الخدمة / تواصل الآن
            </Link>
          </section>

          {/* بطاقة مقدم الخدمة */}
          <section className="panel p-5">
            <div className="text-xs font-bold text-slate-400 mb-3">مقدم الخدمة</div>
            <div className="flex items-center gap-3">
              {item.providerLogoUrl ? (
                <img
                  src={item.providerLogoUrl}
                  alt={item.provider}
                  className="w-12 h-12 rounded-full object-cover border"
                />
              ) : (
                <div className="avatar large">{item.provider?.[0] || "م"}</div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.provider}</h3>
                <div className="mt-1">{item.verified && <Verified />}</div>
              </div>
              <Link
                to="/messages"
                state={chatState}
                className="btn btn-dark text-xs py-1.5 px-3 shrink-0"
              >
                <MessageCircle size={14} /> مراسلة
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}