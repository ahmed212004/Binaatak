import { apiRequest } from "./api";

function parseUtcDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim().replace(" ", "T");
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRelativeTime(iso?: string): string {
  const d = parseUtcDate(iso);
  if (!d) return "الآن";
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return "الآن";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "أمس" : `منذ ${days} يوم`;
}

export function mapRfqItem(item: any) {
  return {
    id: item.id,
    requesterId: item.requesterId || item.userId || item.requester?.id || "",
    requester: item.requesterName || "عضو بناءتك",
    verified: Boolean(item.isRequesterVerified),
    title: item.title,
    description: item.description,
    quantity: item.quantityOrScope || "حسب الاتفاق",
    location: item.location || "جميع المحافظات",
    category: item.mainCategoryName || "",
    subCategory: item.subCategoryName || "",
    specialty: item.specialtyName || "",
    quotes: item.quotationsCount ?? 0,
    status: "مفتوح",
    time: formatRelativeTime(item.createdAt),
  };
}

export const rfqService = {
  getRfqs: async () => {
    const res = await apiRequest<any>("/Rfqs?pageSize=100");
    const list = Array.isArray(res) ? res : (res?.items ?? []);
    return list.map(mapRfqItem);
  },

  createRfq: (data: {
    title: string;
    description: string;
    quantityOrScope: string;
    location: string;
    mainCategoryId: number;
    subCategoryId: number;
    specialtyId: number;
  }) =>
    apiRequest<{ id: string }>("/Rfqs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};