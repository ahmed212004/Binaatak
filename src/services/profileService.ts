import { apiRequest, resolveMediaUrl } from "./api";

function mapProfile(data: any) {
  if (!data) return data;
  return {
    ...data,
    logoUrl: resolveMediaUrl(data.logoUrl),
    coverUrl: resolveMediaUrl(data.coverUrl),
  };
}

export const profileService = {
  getMe: async () => {
    const res = await apiRequest<any>("/Profiles/me");
    return mapProfile(res);
  },

  getById: async (id: string) => {
    const res = await apiRequest<any>(`/Profiles/${id}`);
    return mapProfile(res);
  },

  updateTaxonomy: (
    mainCategoryId: number,
    subCategoryId: number,
    specialtyId: number,
    displayName = ""
  ) =>
    apiRequest<void>("/Profiles/taxonomy", {
      method: "PUT",
      body: JSON.stringify({
        displayName,
        mainCategoryId,
        subCategoryId,
        specialtyId,
      }),
    }),

  updateProfile: (data: {
    displayName: string;
    accountType?: number;
    bio?: string;
    location?: string;
    mainCategoryId?: number;
    subCategoryId?: number;
    specialtyId?: number;
  }) =>
    apiRequest<void>("/Profiles/taxonomy", {
      method: "PUT",
      body: JSON.stringify({
        displayName: data.displayName,
        accountType: data.accountType,
        bio: data.bio,
        location: data.location,
        mainCategoryId: data.mainCategoryId ?? 0,
        subCategoryId: data.subCategoryId ?? 0,
        specialtyId: data.specialtyId ?? 0,
      }),
    }),

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiRequest<{ logoUrl: string }>("/Profiles/logo", {
      method: "POST",
      body: formData,
    });
    return {
      logoUrl: resolveMediaUrl(res?.logoUrl),
    };
  },
};