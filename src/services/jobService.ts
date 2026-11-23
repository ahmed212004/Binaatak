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

export type JobListing = {
  id: string;
  companyId: string;
  company: string;
  companyLogoUrl?: string;
  companyRole: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary: string;
  mainCategoryId: number;
  applicationsCount: number;
  time: string;
};

export type TalentListing = {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;
  roleType: string;
  jobTitle: string;
  yearsOfExperience: number;
  experienceLabel: string;
  skills: string;
  location: string;
  mainCategoryId: number;
  time: string;
};

export const jobService = {
  getJobs: async (mainCategoryId?: number, search?: string): Promise<JobListing[]> => {
    const params = new URLSearchParams();
    if (mainCategoryId && mainCategoryId > 0) params.set("mainCategoryId", String(mainCategoryId));
    if (search && search.trim()) params.set("search", search.trim());
    const qs = params.toString() ? `?${params.toString()}` : "";

    const list = await apiRequest<any[]>(`/Jobs${qs}`);
    return (list ?? []).map((j) => ({
      id: j.id,
      companyId: j.companyId,
      company: j.companyName || "شركة هندسية",
      companyLogoUrl: resolveMediaUrl(j.companyLogoUrl),
      companyRole: accountTypeLabels[j.companyAccountType] || "شركة",
      title: j.title,
      description: j.description || "",
      location: j.location || "غير محدد",
      type: j.employmentType || "دوام كامل",
      salary: j.salaryInfo || "الراتب حسب المقابلة",
      mainCategoryId: Number(j.mainCategoryId || 0),
      applicationsCount: Number(j.applicationsCount || 0),
      time: formatRelativeTime(j.createdAt),
    }));
  },

  createJob: (payload: {
    title: string;
    description: string;
    location: string;
    employmentType: string;
    salaryInfo?: string;
    mainCategoryId: number;
  }) =>
    apiRequest<{ id: string }>("/Jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  applyToJob: (jobId: string, payload: { coverNote?: string; cvUrl?: string }) =>
    apiRequest<{ id: string }>(`/Jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({
        jobPostId: jobId,
        coverNote: payload.coverNote || null,
        cvUrl: payload.cvUrl || null,
      }),
    }),

  getTalents: async (mainCategoryId?: number, search?: string): Promise<TalentListing[]> => {
    const params = new URLSearchParams();
    if (mainCategoryId && mainCategoryId > 0) params.set("mainCategoryId", String(mainCategoryId));
    if (search && search.trim()) params.set("search", search.trim());
    const qs = params.toString() ? `?${params.toString()}` : "";

    const list = await apiRequest<any[]>(`/Jobs/talents${qs}`);
    return (list ?? []).map((t) => {
      const yrs = Number(t.yearsOfExperience || 0);
      return {
        id: t.id,
        userId: t.userId,
        name: t.userName || "عضو بناءتك",
        logoUrl: resolveMediaUrl(t.userLogoUrl),
        roleType: accountTypeLabels[t.userAccountType] || "مهندس / فني",
        jobTitle: t.jobTitle,
        yearsOfExperience: yrs,
        experienceLabel: yrs === 0 ? "حديث التخرج" : `${yrs} ${yrs === 1 ? "سنة" : "سنوات"} خبرة`,
        skills: t.skillsSummary || "",
        location: t.preferredLocation || "جميع المحافظات",
        mainCategoryId: Number(t.mainCategoryId || 0),
        time: formatRelativeTime(t.createdAt),
      };
    });
  },

  createOrUpdateTalent: (payload: {
    jobTitle: string;
    yearsOfExperience: number;
    skillsSummary: string;
    preferredLocation: string;
    mainCategoryId: number;
  }) =>
    apiRequest<{ id: string }>("/Jobs/talents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};