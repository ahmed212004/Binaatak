import { apiRequest, resolveMediaUrl } from "./api";

function parseImages(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => resolveMediaUrl(typeof x === "string" ? x : x?.url))
      .filter(Boolean);
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => resolveMediaUrl(typeof x === "string" ? x : x?.url))
        .filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
}

export function mapListingItem(item: any) {
  const images = parseImages(item.imagesJson ?? item.images);
  const numericPrice = item.indicativePrice ?? item.price;
  const unit = item.priceUnit || "للخدمة";

  return {
    id: item.id,
    title: item.title,
    description: item.description || "لا يوجد وصف تفصيلي مضاف لهذه الخدمة حالياً.",
    category: item.mainCategoryName || "",
    sub: item.subCategoryName || "",
    specialty: item.specialtyName || "",
    indicativePrice: numericPrice,
    priceUnit: unit,
    price: numericPrice ? `${Number(numericPrice).toLocaleString()} ج.م / ${unit}` : unit,
    shortPrice: numericPrice ? `تبدأ من ${Number(numericPrice).toLocaleString()} ج.م` : "السعر حسب الاتفاق",
    area: item.coverageArea || "جميع المحافظات",
    deliveryDays: item.deliveryDays ? Number(item.deliveryDays) : null,
    images,
    coverImage: images[0] || "",
    providerId: item.providerId || item.userId || item.provider?.id || "",
    provider: item.providerName || "مقدم خدمة",
    providerLogoUrl: resolveMediaUrl(item.providerLogoUrl),
    verified: Boolean(item.isProviderVerified),
  };
}

export const directoryService = {
  getListings: async () => {
    const res = await apiRequest<{ items: any[] }>("/Directory?pageSize=100");
    return (res?.items ?? []).map(mapListingItem);
  },

  getListingById: async (id: string) => {
    const res = await apiRequest<any>(`/Directory/${id}`);
    return res ? mapListingItem(res) : null;
  },

  createListing: (data: {
    title: string;
    description?: string;
    indicativePrice?: number;
    priceUnit: string;
    coverageArea: string;
    deliveryDays?: number;
    imagesJson?: string;
    mainCategoryId: number;
    subCategoryId: number;
    specialtyId: number;
  }) =>
    apiRequest<{ id: string }>("/Directory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};