
export interface Specialty {
  id: number;
  nameAr: string;
}

export interface SubCategory {
  id: number;
  nameAr: string;
  specialties: Specialty[];
}

export interface MainCategory {
  id: number;
  nameAr: string;
  iconName: string;
  displayOrder: number;
  subCategories: SubCategory[];
}

export interface TaxonomySelection {
  mainCategoryId: number | null;
  subCategoryId: number | null;
  specialtyId: number | null;
}
