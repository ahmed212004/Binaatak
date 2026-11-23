import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MessageCircle } from "lucide-react";
import { Button, Tag, Location, Time, SearchBox, Empty, Verified } from "../components/Shared";
import { taxonomy, type TaxonomyNode } from "../data/mockData";

export default function RfqsPage({
  rfqs = [],
  taxNodes = taxonomy,
  onAdd,
}: {
  rfqs?: any[];
  taxNodes?: TaxonomyNode[];
  onAdd: () => void;
}) {
  const safeTaxNodes = Array.isArray(taxNodes) && taxNodes.length > 0 ? taxNodes : taxonomy;
  const safeRfqs = Array.isArray(rfqs) ? rfqs : [];

  const [cat, setCat] = useState("الكل");
  const [q, setQ] = useState("");

  const data = safeRfqs.filter((x) => {
    const matchCat = cat === "الكل" || x.category?.trim() === cat.trim();
    const term = q.trim().toLowerCase();
    const matchQuery =
      !term ||
      `${x.title} ${x.description} ${x.requester} ${x.specialty}`
        .toLowerCase()
        .includes(term);
    return matchCat && matchQuery;
  });

  return (
    <>
      <section className="rfq-banner">
        <div>
          <span className="text-amber-400 text-sm font-bold">سوق الطلبات والأعمال المطلوبة</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
            اطلب تنفيذ خدمة أو توريد خامات
          </h1>
          <p className="text-slate-300 mt-2">
            انشر تفاصيل الشغل أو الخامات التي تحتاجها ليتواصل معك المهندسون والمقاولون والموردون مباشرة.
          </p>
        </div>
        <Button variant="amber" onClick={onAdd}>
          <Plus size={17} /> انشر طلبك الآن
        </Button>
      </section>

      <div className="panel p-3 my-5 flex flex-col md:flex-row gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="ابحث في الطلبات..." />
        <select className="field md:max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="الكل">الكل</option>
          {safeTaxNodes.map((x) => (
            <option key={x.name} value={x.name}>
              {x.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rfq-grid">
        {data.map((r) => (
          <article className="panel p-4 flex flex-col" key={r.id}>
            <div className="flex justify-between gap-2">
              <Tag>{r.category}</Tag>
              <Time>{r.time}</Time>
            </div>

            <h3 className="font-extrabold leading-7 mt-3 text-slate-900">{r.title}</h3>
            <p className="text-sm text-slate-500 leading-7 mt-2 whitespace-pre-line">
              {r.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {r.subCategory && <Tag color="blue">{r.subCategory}</Tag>}
              {r.specialty && <Tag color="slate">{r.specialty}</Tag>}
              {r.quantity && <Tag color="green">{r.quantity}</Tag>}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3">
              <Location>{r.location}</Location>
              <span className="text-xs font-bold text-slate-600 inline-flex items-center gap-1">
                {r.requester} {r.verified && <Verified />}
              </span>
            </div>

            <div className="border-t mt-auto pt-3 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-bold">مفتوح للتواصل</span>
              <Link
                to="/messages"
                state={{
                  recipientId: r.requesterId,
                  recipientName: r.requester,
                  contextTitle: r.title,
                  contextId: r.id,
                }}
                className="btn btn-dark"
              >
                <MessageCircle size={16} /> مراسلة
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!data.length && (
        <Empty text="لا توجد طلبات منشورة في هذا القسم حالياً. اضغط على (انشر طلبك الآن) لإضافة أول طلب!" />
      )}
    </>
  );
}