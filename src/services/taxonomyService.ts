import { apiRequest } from "./api";
import { TaxonomyNode } from "../data/mockData";

export interface NormalizedSpecialty {
  id: number;
  name: string;
}

export interface NormalizedSubCategory {
  id: number;
  name: string;
  specialties: NormalizedSpecialty[];
}

export interface NormalizedMainCategory {
  id: number;
  name: string;
  subCategories: NormalizedSubCategory[];
}

export const taxonomyService = {
  getTree: async (): Promise<NormalizedMainCategory[]> => {
    const data = await apiRequest<any[]>("/Taxonomy/tree");
    return (data ?? []).map((main) => ({
      id: main.id,
      name: main.nameAr || main.name || "",
      subCategories: (main.subCategories ?? []).map((sub: any) => ({
        id: sub.id,
        name: sub.nameAr || sub.name || "",
        specialties: (sub.specialties ?? []).map((sp: any) => ({
          id: sp.id,
          name: sp.nameAr || sp.name || "",
        })),
      })),
    }));
  },

  toTaxonomyNodes: (raw: NormalizedMainCategory[]): TaxonomyNode[] =>
    raw.map((main) => ({
      name: main.name,
      children: main.subCategories.map((sub) => ({
        name: sub.name,
        children: sub.specialties.map((sp) => ({ name: sp.name })),
      })),
    })),

  resolveIds: (raw: NormalizedMainCategory[], mainName: string, subName?: string, specName?: string) => {
    const main = raw.find((m) => m.name.trim() === mainName.trim());
    const sub = main?.subCategories.find((s) => s.name.trim() === (subName ?? "").trim());
    const spec = sub?.specialties.find((sp) => sp.name.trim() === (specName ?? "").trim());
    return {
      mainCategoryId: main?.id ?? 0,
      subCategoryId: sub?.id ?? 0,
      specialtyId: spec?.id ?? 0,
    };
  },
};