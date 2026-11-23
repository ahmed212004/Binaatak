import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, FileText } from "lucide-react";
import { Button, Tag, Empty } from "../components/Shared";

export default function RfqDetailPage({
  rfqs,
  quotes,
  onQuote,
  onAccept,
}: {
  rfqs: any[];
  quotes: any[];
  onQuote: () => void;
  onAccept: () => void;
}) {
  const { id } = useParams();
  const r = rfqs.find((x) => String(x.id) === String(id));
  const [owner, setOwner] = useState(false);

  if (!r) return <Empty text="الطلب غير موجود" />;

  return (
    <>
      <div className="page-heading">
        <div>
          <Link to="/rfqs" className="text-amber-700 text-sm">
            ← العودة للطلبات
          </Link>
          <h1 className="mt-2">تفاصيل طلب التوريد والخدمة</h1>
        </div>
        <label className="toggle-label">
          <input type="checkbox" checked={owner} onChange={(e) => setOwner(e.target.checked)} /> معاينة وضع صاحب الطلب
        </label>
      </div>

      <div className="detail-layout">
        <section className="panel p-5">
          <div className="flex gap-2 flex-wrap">
            <Tag>{r.category}</Tag>
            <Tag color="slate">{r.specialty}</Tag>
            <Tag color="green">{r.status}</Tag>
          </div>
          <h2 className="text-xl font-extrabold mt-4 leading-8">{r.title}</h2>
          <p className="text-slate-600 leading-8 mt-3">{r.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="soft-box">
              <small>الكمية / نطاق العمل</small>
              <b>{r.quantity}</b>
            </div>
            <div className="soft-box">
              <small>موقع التسليم</small>
              <b>{r.location}</b>
            </div>
          </div>
          <div className="mt-5 text-sm text-slate-500">
            مقدم الطلب: <b className="text-slate-800">{r.requester}</b> · {r.time}
          </div>
          {!owner && (
            <div className="mt-6">
              <Button variant="green" onClick={onQuote}>
                تقديم عرض سعر
              </Button>
            </div>
          )}
        </section>

        <section className="panel p-5">
          <h3 className="font-extrabold text-lg">{owner ? "مقارنة عروض الأسعار" : "معلومات الطلب"}</h3>
          {owner ? (
            <>
              <div className="overflow-x-auto mt-4">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>المورد</th>
                      <th>التقييم</th>
                      <th>السعر الإجمالي</th>
                      <th>مدة التوريد</th>
                      <th>ملف BOQ</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...quotes,
                      { id: 0, supplier: "مصنع النيل للحديد", rating: "4.8", price: "2,450,000", days: "4", note: "", seed: true },
                    ].map((q) => (
                      <tr key={q.id}>
                        <td>{q.supplier}</td>
                        <td>
                          <Star size={13} className="inline text-amber-500" /> {q.rating}
                        </td>
                        <td>{q.price} ج.م</td>
                        <td>{q.days} أيام</td>
                        <td>
                          <button className="text-amber-700">
                            <FileText size={15} />
                          </button>
                        </td>
                        <td>
                          <button className="text-emerald-600 font-bold" onClick={onAccept}>
                            قبول العرض
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!quotes.length && <p className="text-xs text-slate-400 mt-3">العروض المعروضة بيانات تجريبية للمعاينة.</p>}
            </>
          ) : (
            <div className="space-y-3 mt-4 text-sm text-slate-600 leading-7">
              <p>أرسل عرضك متضمناً السعر النهائي ومدة التوريد وأي شروط فنية أو تجارية.</p>
              <div className="soft-box">
                <b>نصائح لتقديم عرض قوي</b>
                <p>حدد صلاحية العرض، وتكلفة النقل، وشهادات المطابقة، وشروط الدفع.</p>
              </div>
              <Button variant="green" onClick={onQuote}>
                تقديم عرض سعر
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}