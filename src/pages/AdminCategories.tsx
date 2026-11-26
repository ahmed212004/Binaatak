import { useEffect, useState } from "react";
import { Trash2, Plus, FolderTree } from "lucide-react";
import { apiRequest } from "../services/api";

interface Specialty {
  id: number;
  nameAr: string;
  subCategoryId: number;
}

interface SubCategory {
  id: number;
  nameAr: string;
  mainCategoryId: number;
  specialties?: Specialty[];
}

interface MainCategory {
  id: number;
  nameAr: string;
  subCategories?: SubCategory[];
}

export default function AdminCategories() {
  const [tree, setTree] = useState<MainCategory[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [targetType, setTargetType] = useState<"main" | "sub" | "specialty">("main");
  const [selectedMainId, setSelectedMainId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTree = async () => {
    try {
      const data = await apiRequest<MainCategory[]>("/Taxonomy/tree");
      setTree(data ?? []);
    } catch {
      setError("تعذر تحميل التصنيفات من السيرفر");
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setError("");
    setLoading(true);

    let endpoint = "/Taxonomy/main";
    let payload: Record<string, any> = { nameAr: nameAr.trim() };

    if (targetType === "sub") {
      if (!selectedMainId) {
        setError("اختر التصنيف الرئيسي أولاً");
        setLoading(false);
        return;
      }
      endpoint = "/Taxonomy/sub";
      payload = { nameAr: nameAr.trim(), mainCategoryId: Number(selectedMainId) };
    } else if (targetType === "specialty") {
      if (!selectedSubId) {
        setError("اختر التصنيف الفرعي أولاً");
        setLoading(false);
        return;
      }
      endpoint = "/Taxonomy/specialty";
      payload = { nameAr: nameAr.trim(), subCategoryId: Number(selectedSubId) };
    }

    try {
      await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNameAr("");
      await fetchTree();
    } catch (err: any) {
      setError(err.message || "فشلت الإضافة، تأكد من صلاحية الأدمن");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: "main" | "sub" | "specialty", id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setError("");

    try {
      await apiRequest(`/Taxonomy/${type}/${id}`, {
        method: "DELETE",
      });

      await fetchTree();
    } catch (err: any) {
      setError(err.message || "تعذر الحذف");
    }
  };

  const currentMain = tree.find((m) => m.id === Number(selectedMainId));

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <FolderTree className="text-amber-600" size={28} />
        <h1 className="text-2xl font-extrabold text-slate-900">
          إدارة التصنيفات والتخصصات - Build Link
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* نموذج الإضافة */}
      <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTargetType("main")}
            className={`py-2 px-3 rounded-xl text-sm font-bold border transition ${
              targetType === "main" ? "bg-amber-50 border-amber-500 text-amber-800" : "border-slate-200 text-slate-600"
            }`}
          >
            + تصنيف رئيسي
          </button>
          <button
            type="button"
            onClick={() => setTargetType("sub")}
            className={`py-2 px-3 rounded-xl text-sm font-bold border transition ${
              targetType === "sub" ? "bg-amber-50 border-amber-500 text-amber-800" : "border-slate-200 text-slate-600"
            }`}
          >
            + تصنيف فرعي
          </button>
          <button
            type="button"
            onClick={() => setTargetType("specialty")}
            className={`py-2 px-3 rounded-xl text-sm font-bold border transition ${
              targetType === "specialty" ? "bg-amber-50 border-amber-500 text-amber-800" : "border-slate-200 text-slate-600"
            }`}
          >
            + تخصص دقيق
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {(targetType === "sub" || targetType === "specialty") && (
            <select
              value={selectedMainId}
              onChange={(e) => {
                setSelectedMainId(e.target.value);
                setSelectedSubId("");
              }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">-- اختر التصنيف الرئيسي --</option>
              {tree.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameAr}
                </option>
              ))}
            </select>
          )}

          {targetType === "specialty" && (
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              disabled={!selectedMainId}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">-- اختر التصنيف الفرعي --</option>
              {currentMain?.subCategories?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={
              targetType === "main"
                ? "اسم التصنيف الرئيسي الجديد..."
                : targetType === "sub"
                ? "اسم التصنيف الفرعي الجديد..."
                : "اسم التخصص الدقيق الجديد..."
            }
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} />
            {loading ? "جاري الحفظ..." : "إضافة"}
          </button>
        </div>
      </form>

      {/* عرض الشجرة كاملة مع أزرار الحذف */}
      <div className="space-y-4">
        {tree.map((main) => (
          <div key={main.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center font-extrabold text-lg text-slate-900">
              <span>{main.nameAr} <small className="text-xs text-amber-600 font-normal">(رئيسي)</small></span>
              <button
                onClick={() => handleDelete("main", main.id)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                title="حذف التصنيف الرئيسي"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="mr-6 mt-3 space-y-3">
              {main.subCategories?.map((sub) => (
                <div key={sub.id} className="border-r-2 border-amber-300 pr-3">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>{sub.nameAr} <small className="text-xs text-slate-400 font-normal">(فرعي)</small></span>
                    <button
                      onClick={() => handleDelete("sub", sub.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition"
                      title="حذف التصنيف الفرعي"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2 mr-3">
                    {sub.specialties?.map((spec) => (
                      <span
                        key={spec.id}
                        className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2"
                      >
                        {spec.nameAr}
                        <button
                          onClick={() => handleDelete("specialty", spec.id)}
                          className="text-red-500 hover:text-red-700 font-extrabold"
                          title="حذف التخصص"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}