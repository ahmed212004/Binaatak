import { MainCategoryDto } from "../types/taxonomy";

interface TaxonomySelection {
  mainCategoryId: number;
  subCategoryId: number;
  specialtyId: number;
}

interface Props {
  tree: MainCategoryDto[];
  value: TaxonomySelection;
  onChange: (next: TaxonomySelection) => void;
}

export default function ProgressiveTaxonomyPicker({ tree, value, onChange }: Props) {
  const selectedMain = tree.find((m) => m.id === value.mainCategoryId);
  const subCategories = selectedMain?.subCategories ?? [];

  const selectedSub = subCategories.find((s) => s.id === value.subCategoryId);
  const specialties = selectedSub?.specialties ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-bold mb-1">1. القسم الرئيسي (من 12 قطاع)</label>
        <select
          className="field"
          value={value.mainCategoryId || ""}
          onChange={(e) =>
            onChange({
              mainCategoryId: Number(e.target.value),
              subCategoryId: 0,
              specialtyId: 0,
            })
          }
        >
          <option value="">-- اختر القسم الرئيسي --</option>
          {tree.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nameAr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">2. القسم الفرعي</label>
        <select
          className="field"
          disabled={!selectedMain}
          value={value.subCategoryId || ""}
          onChange={(e) =>
            onChange({
              mainCategoryId: value.mainCategoryId,
              subCategoryId: Number(e.target.value),
              specialtyId: 0,
            })
          }
        >
          <option value="">
            {selectedMain ? "-- اختر القسم الفرعي --" : "اختر القسم الرئيسي أولاً"}
          </option>
          {subCategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameAr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">3. التخصص الدقيق</label>
        <select
          className="field"
          disabled={!selectedSub}
          value={value.specialtyId || ""}
          onChange={(e) =>
            onChange({
              mainCategoryId: value.mainCategoryId,
              subCategoryId: value.subCategoryId,
              specialtyId: Number(e.target.value),
            })
          }
        >
          <option value="">
            {selectedSub ? "-- اختر التخصص الدقيق --" : "اختر القسم الفرعي أولاً"}
          </option>
          {specialties.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.nameAr}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}