import { useEffect, useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { Modal, Field, TaxonomyPicker, AccountFields, Button } from "./Shared";
import type { AccountType, TaxonomyNode } from "../data/mockData";
import { taxonomyService, type NormalizedMainCategory } from "../services/taxonomyService";
import { uploadService, type UploadedAttachment } from "../services/uploadService";

export type Tax = { category: string; sub: string; specialty: string };

export function AccountModal({
  close,
  profile,
  nodes,
  onSave,
}: {
  close: () => void;
  profile: { name: string; type: AccountType; tax: Tax };
  nodes?: TaxonomyNode[];
  onSave: (p: { name: string; type: AccountType; tax: Tax }) => Promise<void> | void;
}) {
  const [name, setName] = useState(profile?.name || "");
  const [type, setType] = useState<AccountType>(profile?.type || "شركة");
  const [tax, setTax] = useState<Tax>({
    category: profile?.tax?.category || "",
    sub: profile?.tax?.sub || "",
    specialty: profile?.tax?.specialty || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      await onSave({ name, type, tax });
      close();
    } catch (err: any) {
      setError(err?.message || "تعذر حفظ التغييرات، تأكد من تسجيل الدخول واتصال السيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="إعداد الحساب والتخصص التدريجي" onClose={close}>
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <AccountFields name={name} setName={setName} type={type} setType={setType} />
        <Field label="حدد مجال نشاطك (من قاعدة البيانات)">
          <TaxonomyPicker value={tax} onChange={setTax} nodes={nodes} />
        </Field>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </Modal>
  );
}

export function ProductModal({
  close,
  nodes,
  onSave,
}: {
  close: () => void;
  nodes?: TaxonomyNode[];
  onSave: (x: {
    title: string;
    category: string;
    sub: string;
    specialty: string;
    description: string;
    indicativePrice?: number;
    priceUnit: string;
    deliveryDays?: number;
    area: string;
    images: string[];
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [tax, setTax] = useState<Tax>({ category: "", sub: "", specialty: "" });
  const [description, setDescription] = useState("");
  const [indicativePrice, setIndicativePrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("للمشروع");
  const [deliveryDays, setDeliveryDays] = useState("3");
  const [area, setArea] = useState("جميع المحافظات");
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!tax.category || !tax.sub || !tax.specialty) {
      setError("يرجى اختيار التصنيف الرئيسي والفرعي والتخصص الدقيق");
      return;
    }
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const item of imageFiles) {
        const res = await uploadService.uploadFile(item.file);
        if (res?.url) uploadedUrls.push(res.url);
      }

      await onSave({
        title,
        ...tax,
        description,
        indicativePrice: indicativePrice ? Number(indicativePrice) : undefined,
        priceUnit: priceUnit || "للخدمة",
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
        area,
        images: uploadedUrls,
      });
      close();
    } catch (err: any) {
      setError(err.message || "تأكد من تسجيل الدخول أولاً لإضافة خدمة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="إضافة خدمة / منتج جديد" onClose={close}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <Field label="عنوان الخدمة أو المنتج">
          <input
            required
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تصميم مخططات معمارية 3D كاملة لفيلا سكنية"
          />
        </Field>

        <Field label="التصنيف التدريجي (رئيسي / فرعي / تخصص دقيق)">
          <TaxonomyPicker value={tax} onChange={setTax} nodes={nodes} />
        </Field>

        <Field label="وصف الخدمة وتفاصيل ما يحصل عليه العميل">
          <textarea
            required
            className="field min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح تفاصيل الخدمة، المواصفات الفنية، وشروط التنفيذ أو التوريد..."
          />
        </Field>

        <div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:border-amber-400 hover:text-amber-700 cursor-pointer">
            <ImagePlus size={16} />
            <span>إضافة صور الخدمة (أول صورة هي الغلاف الرئيسي)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagesChange}
            />
          </label>

          {imageFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {imageFiles.map((img, idx) => (
                <div key={idx} className="relative h-20 rounded-lg overflow-hidden border">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-950 text-[10px] font-bold text-center">
                      صورة الغلاف
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 left-1 bg-black/70 text-white rounded-full p-0.5"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Field label="السعر يبدأ من (ج.م)">
            <input
              type="number"
              className="field"
              value={indicativePrice}
              onChange={(e) => setIndicativePrice(e.target.value)}
              placeholder="1500"
            />
          </Field>
          <Field label="لكل / الوحدة">
            <input
              className="field"
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              placeholder="للمشروع / للطن"
            />
          </Field>
          <Field label="مدة التنفيذ (أيام)">
            <input
              type="number"
              min="1"
              className="field"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
            />
          </Field>
        </div>

        <Field label="نطاق التغطية الجغرافي">
          <input
            className="field"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="جميع المحافظات / أونلاين"
          />
        </Field>

        <Button type="submit" disabled={loading}>
          {loading ? "جاري رفع الصور ونشر الخدمة..." : "نشر الخدمة الآن"}
        </Button>
      </form>
    </Modal>
  );
}

export function RfqModal({
  close,
  nodes,
  onSave,
}: {
  close: () => void;
  nodes?: TaxonomyNode[];
  onSave: (x: {
    title: string;
    category: string;
    sub: string;
    specialty: string;
    description: string;
    quantity: string;
    location: string;
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [tax, setTax] = useState<Tax>({ category: "", sub: "", specialty: "" });
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("جميع المحافظات");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!tax.category || !tax.sub || !tax.specialty) {
      setError("يرجى اختيار التصنيف الرئيسي والفرعي والتخصص الدقيق");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        title,
        ...tax,
        description,
        quantity: quantity || "حسب الاتفاق",
        location: location || "جميع المحافظات",
      });
      close();
    } catch (err: any) {
      setError(err?.message || "يرجى تسجيل الدخول أولاً لنشر طلبك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="انشر طلبك (محتاج حد ينفذلك شغل أو يورّدلك خامات)" onClose={close}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <Field label="عنوان الطلب">
          <input
            required
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: محتاج مهندس معماري لتصميم فيلا / مطلوب توريد 50 طن أسمنت"
          />
        </Field>

        <Field label="التصنيف التدريجي (رئيسي / فرعي / تخصص دقيق)">
          <TaxonomyPicker value={tax} onChange={setTax} nodes={nodes} />
        </Field>

        <Field label="تفاصيل الشغل أو المواصفات المطلوبة">
          <textarea
            required
            className="field min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب كل التفاصيل المطلوبة، المساحة أو الكمية، ومدة التنفيذ المتوقعة..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="الكمية / الميزانية التقديرية">
            <input
              className="field"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="مثال: مشروع كامل / 5000 ج.م"
            />
          </Field>
          <Field label="الموقع / المحافظة">
            <input
              className="field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="القاهرة / أونلاين"
            />
          </Field>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "جاري نشر الطلب..." : "نشر الطلب للجميع"}
        </Button>
      </form>
    </Modal>
  );
}

export function QuoteModal({
  close,
  onSave,
}: {
  close: () => void;
  onSave: (x: any) => void;
}) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");

  return (
    <Modal title="تقديم عرض سعر" onClose={close}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: Date.now(),
            supplier: "شركة البنيان للمقاولات والتوريدات",
            rating: "4.9",
            price,
            days,
            note,
          });
          close();
        }}
      >
        <Field label="إجمالي السعر (جنيه)">
          <input required type="number" className="field" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="مدة التوريد بالأيام">
          <input required type="number" className="field" value={days} onChange={(e) => setDays(e.target.value)} />
        </Field>
        <Field label="ملاحظات وشروط العرض">
          <textarea className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button variant="green" type="submit">
          إرسال عرض السعر
        </Button>
      </form>
    </Modal>
  );
}

export function PostModal({
  close,
  onSave,
  nodes = [],
  rawTaxonomy = [],
}: {
  close: () => void;
  onSave: (x: {
    type: string;
    mainCategoryId: number;
    subCategoryId?: number;
    specialtyId?: number;
    body: string;
    attachments: UploadedAttachment[];
  }) => Promise<void> | void;
  nodes?: TaxonomyNode[];
  rawTaxonomy?: NormalizedMainCategory[];
}) {
  const [tree, setTree] = useState<NormalizedMainCategory[]>(rawTaxonomy);
  const [taxNodes, setTaxNodes] = useState<TaxonomyNode[]>(nodes);
  const [type, setType] = useState("منشور عام / أخبار");
  const [tax, setTax] = useState<Tax>({ category: "", sub: "", specialty: "" });
  const [body, setBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; isVideo: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rawTaxonomy.length > 0) {
      setTree(rawTaxonomy);
      setTaxNodes(nodes.length > 0 ? nodes : taxonomyService.toTaxonomyNodes(rawTaxonomy));
      return;
    }
    taxonomyService.getTree().then((res) => {
      if (res?.length) {
        setTree(res);
        setTaxNodes(taxonomyService.toTaxonomyNodes(res));
      }
    }).catch(() => {});
  }, [rawTaxonomy, nodes]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const mapped = selected.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));
    setMediaFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tax.category) {
      setError("يرجى اختيار التصنيف الرئيسي للمنشور على الأقل");
      return;
    }

    const ids = taxonomyService.resolveIds(tree, tax.category, tax.sub, tax.specialty);
    if (!ids.mainCategoryId) {
      setError("تعذر تحديد معرف التصنيف، تأكد من تحميل الأقسام");
      return;
    }

    setLoading(true);
    try {
      const uploadedAttachments: UploadedAttachment[] = [];
      for (const item of mediaFiles) {
        const uploaded = await uploadService.uploadFile(item.file);
        uploadedAttachments.push(uploaded);
      }

      await onSave({
        type,
        mainCategoryId: ids.mainCategoryId,
        subCategoryId: ids.subCategoryId || undefined,
        specialtyId: ids.specialtyId || undefined,
        body,
        attachments: uploadedAttachments,
      });
      close();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء نشر المنشور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="إنشاء منشور جديد" onClose={close}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <Field label="نوع المنشور">
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {["منشور عام / أخبار", "سابقة أعمال", "عرض توريد"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>

        <Field label="التصنيف (رئيسي / فرعي / تخصص دقيق)">
          <TaxonomyPicker value={tax} onChange={setTax} nodes={taxNodes} />
        </Field>

        <Field label="محتوى المنشور">
          <textarea
            required
            className="field min-h-28"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="شارك تحديثاتك أو خدماتك مع مجتمع البناء..."
          />
        </Field>

        <div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-700 cursor-pointer">
            <ImagePlus size={18} />
            <span>إضافة صور أو فيديوهات</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
          </label>

          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {mediaFiles.map((m, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border bg-slate-100 h-24">
                  {m.isVideo ? (
                    <video src={m.preview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.preview} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 left-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "جاري رفع الملفات والنشر..." : "نشر الآن"}
        </Button>
      </form>
    </Modal>
  );
}