import { apiRequest, resolveMediaUrl } from "./api";

const accountTypeLabels: Record<number, string> = {
  1: "طالب خدمة",
  2: "شركة",
  3: "مصنع",
  4: "مهندس",
  5: "مقاول",
  6: "فني",
  7: "مورد",
};

const postTypeLabels: Record<number, string> = {
  1: "منشور عام / أخبار",
  2: "سابقة أعمال",
  3: "عرض توريد",
};

const postTypeToEnum: Record<string, number> = {
  "منشور عام / أخبار": 1,
  "سابقة أعمال": 2,
  "عرض توريد": 3,
};

function parseUtcDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim().replace(" ", "T");
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeAgo(dateStr: string): string {
  const d = parseUtcDate(dateStr);
  if (!d) return "الآن";
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "أمس" : `منذ ${days} أيام`;
}

export const feedService = {
  getPosts: async () => {
    const res = await apiRequest<{ items: any[] }>("/Feed?pageSize=30");
    return (res?.items ?? []).map((p) => {
      const liked = Boolean(p.isLikedByMe ?? p.isLikedByCurrentUser ?? p.isLiked);
      let attachments: { url: string; type: "image" | "video"; name?: string }[] = [];
      if (p.attachmentsJson) {
        try {
          attachments = JSON.parse(p.attachmentsJson).map((att: any) => ({
            ...att,
            url: resolveMediaUrl(att.url),
          }));
        } catch {
          attachments = [];
        }
      }
      return {
        id: p.id,
        authorId: p.authorId || p.userId || p.author?.id || "",
        author: p.authorName,
        authorLogoUrl: resolveMediaUrl(p.authorLogoUrl),
        role: `${accountTypeLabels[p.authorAccountType] ?? "عضو"}${p.isAuthorVerified ? " موثق" : ""}`,
        type: postTypeLabels[p.postType] ?? "منشور عام / أخبار",
        time: timeAgo(p.createdAt),
        category: p.mainCategoryName,
        subCategory: p.subCategoryName || "",
        specialty: p.specialtyName || "",
        body: p.content,
        attachments,
        likes: Number(p.likesCount ?? 0),
        liked,
        isLiked: liked,
      };
    });
  },

  createPost: (payload: {
    content: string;
    typeLabel: string;
    mainCategoryId: number;
    subCategoryId?: number;
    specialtyId?: number;
    attachments?: any[];
  }) =>
    apiRequest<{ id: string }>("/Feed", {
      method: "POST",
      body: JSON.stringify({
        content: payload.content,
        postType: postTypeToEnum[payload.typeLabel] ?? 1,
        mainCategoryId: payload.mainCategoryId,
        subCategoryId: payload.subCategoryId || null,
        specialtyId: payload.specialtyId || null,
        attachmentsJson:
          payload.attachments && payload.attachments.length > 0
            ? JSON.stringify(payload.attachments)
            : null,
      }),
    }),

  toggleLike: (postId: string | number) =>
    apiRequest<{ isLiked: boolean }>(`/Feed/${postId}/like`, { method: "POST" }),
};