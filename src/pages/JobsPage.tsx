import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  UserCheck,
  MessageCircle,
  Send,
  FileUp,
  Loader2,
  X,
} from "lucide-react";
import {
  Button,
  Tag,
  Location,
  Time,
  Toast,
  Field,
  SearchBox,
  Empty,
} from "../components/Shared";
import { authService } from "../services/authService";
import { uploadService } from "../services/uploadService";
import { chatService } from "../services/chatService";
import {
  taxonomyService,
  type NormalizedMainCategory,
} from "../services/taxonomyService";
import {
  jobService,
  type JobListing,
  type TalentListing,
} from "../services/jobService";

export default function JobsPage() {
  const nav = useNavigate();
  const isAuth = authService.isAuthenticated();

  const [tab, setTab] = useState<"jobs" | "talent">("jobs");
  const [categories, setCategories] = useState<NormalizedMainCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [search, setSearch] = useState("");

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [talents, setTalents] = useState<TalentListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<"postJob" | "postTalent" | "applyJob" | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  // حقول نشر وظيفة شاغرة (للشركات)
  const [jobTitle, setJobTitle] = useState("");
  const [jobCatId, setJobCatId] = useState<number>(0);
  const [jobType, setJobType] = useState("دوام كامل");
  const [jobSalary, setJobSalary] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobDesc, setJobDesc] = useState("");

  // حقول باحث عن عمل (مهندس / فني / عامل)
  const [talentJobTitle, setTalentJobTitle] = useState("");
  const [talentCatId, setTalentCatId] = useState<number>(0);
  const [talentExp, setTalentExp] = useState<number>(2);
  const [talentSkills, setTalentSkills] = useState("");
  const [talentLocation, setTalentLocation] = useState("");

  // حقول التقديم على وظيفة
  const [coverNote, setCoverNote] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    taxonomyService
      .getTree()
      .then((tree) => {
        setCategories(tree);
        if (tree.length > 0) {
          setJobCatId(tree[0].id);
          setTalentCatId(tree[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbJobs, dbTalents] = await Promise.all([
        jobService.getJobs(selectedCatId || undefined, search),
        jobService.getTalents(selectedCatId || undefined, search),
      ]);
      setJobs(dbJobs);
      setTalents(dbTalents);
    } catch {
      notify("تعذر تحميل بيانات الوظائف من السيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCatId, search]);

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name || "";

  const requireLoginThen = (action: () => void) => {
    if (!isAuth) {
      notify("يرجى تسجيل الدخول أولاً");
      nav("/login");
      return;
    }
    setFormError("");
    action();
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await jobService.createJob({
        title: jobTitle,
        description: jobDesc,
        location: jobLocation,
        employmentType: jobType,
        salaryInfo: jobSalary,
        mainCategoryId: jobCatId,
      });
      setModalMode(null);
      setJobTitle("");
      setJobSalary("");
      setJobLocation("");
      setJobDesc("");
      setTab("jobs");
      await loadData();
      notify("تم نشر الوظيفة الشاغرة بنجاح");
    } catch (err: any) {
      setFormError(err?.message || "حدث خطأ أثناء نشر الوظيفة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTalent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await jobService.createOrUpdateTalent({
        jobTitle: talentJobTitle,
        yearsOfExperience: Number(talentExp) || 0,
        skillsSummary: talentSkills,
        preferredLocation: talentLocation,
        mainCategoryId: talentCatId,
      });
      setModalMode(null);
      setTab("talent");
      await loadData();
      notify("تم نشر ملفك كباحث عن عمل بنجاح");
    } catch (err: any) {
      setFormError(err?.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setFormError("");
    setSubmitting(true);
    try {
      let cvUrl: string | undefined;
      if (cvFile) {
        const uploaded = await uploadService.uploadFile(cvFile);
        cvUrl = uploaded.url;
      }

      await jobService.applyToJob(selectedJob.id, {
        coverNote,
        cvUrl,
      });

      // إرسال رسالة تلقائية للشركة في الشات مع رابط السيرة الذاتية إن وجد
      const introText =
        `تقديم على وظيفة: "${selectedJob.title}"\n` +
        (coverNote.trim() ? coverNote.trim() : "أرغب في التقدم لهذه الوظيفة.");

      await chatService.sendMessage({
        recipientId: selectedJob.companyId,
        content: introText,
        attachmentUrl: cvUrl,
        contextType: `وظيفة: ${selectedJob.title}`,
        contextId: selectedJob.id,
      });

      setModalMode(null);
      setCoverNote("");
      setCvFile(null);
      await loadData();
      notify("تم إرسال طلب التقديم وفتح المحادثة مع الشركة");
      nav("/messages", {
        state: {
          recipientId: selectedJob.companyId,
          recipientName: selectedJob.company,
          contextTitle: `وظيفة: ${selectedJob.title}`,
          contextId: selectedJob.id,
        },
      });
    } catch (err: any) {
      setFormError(err?.message || "تعذر إرسال طلب التقديم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>الوظائف والعمل</h1>
          <p>فرص مهنية ومواهب متخصصة في قطاع التشييد والبناء</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="dark"
            onClick={() => requireLoginThen(() => setModalMode("postJob"))}
          >
            نشر وظيفة شاغرة (للشركات)
          </Button>
          <Button
            variant="amber"
            onClick={() => requireLoginThen(() => setModalMode("postTalent"))}
          >
            أبحث عن عمل
          </Button>
        </div>
      </div>

      {/* التبويبات وشريط البحث والفلتر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="filter-pills">
          <button
            type="button"
            className={tab === "jobs" ? "pill active" : "pill"}
            onClick={() => setTab("jobs")}
          >
            وظائف الشركات والمكاتب الهندسية ({jobs.length})
          </button>
          <button
            type="button"
            className={tab === "talent" ? "pill active" : "pill"}
            onClick={() => setTab("talent")}
          >
            مهندسون وفنيون وعمال يبحثون عن عمل ({talents.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="sm:w-56">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={tab === "jobs" ? "ابحث بالمسمى أو الشركة..." : "ابحث بتخصص أو مهارة..."}
            />
          </div>
          <select
            className="field sm:w-48"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(Number(e.target.value))}
          >
            <option value={0}>كل القطاعات الهندسية</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> جاري تحميل البيانات...
        </div>
      ) : tab === "jobs" ? (
        jobs.length === 0 ? (
          <Empty text="لا توجد وظائف منشورة حالياً. إذا كنت شركة أو مكتباً هندسياً اضغط على (نشر وظيفة شاغرة)." />
        ) : (
          <div className="listing-grid">
            {jobs.map((x) => (
              <article className="panel p-5 flex flex-col" key={x.id}>
                <div className="flex gap-3 items-start">
                  {x.companyLogoUrl ? (
                    <img
                      src={x.companyLogoUrl}
                      alt={x.company}
                      className="w-11 h-11 rounded-xl object-cover border shrink-0"
                    />
                  ) : (
                    <div className="avatar shrink-0">
                      <BriefcaseBusiness size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900">{x.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{x.company}</p>
                  </div>
                  <Time>{x.time}</Time>
                </div>

                {x.description && (
                  <p className="text-xs text-slate-600 leading-6 mt-3 line-clamp-3 whitespace-pre-line">
                    {x.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Tag color="green">{x.salary}</Tag>
                  <Tag color="slate">{x.type}</Tag>
                  {getCategoryName(x.mainCategoryId) && (
                    <Tag color="amber">{getCategoryName(x.mainCategoryId)}</Tag>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Location>{x.location}</Location>
                  {x.applicationsCount > 0 && (
                    <span className="text-[11px] text-slate-400">
                      {x.applicationsCount} متقدم
                    </span>
                  )}
                </div>

                <div className="border-t mt-auto pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-amber flex-1 justify-center text-xs"
                    onClick={() =>
                      requireLoginThen(() => {
                        setSelectedJob(x);
                        setCoverNote("");
                        setCvFile(null);
                        setModalMode("applyJob");
                      })
                    }
                  >
                    <Send size={14} /> تقديم الآن
                  </button>
                  <Link
                    to="/messages"
                    state={{
                      recipientId: x.companyId,
                      recipientName: x.company,
                      contextTitle: `وظيفة: ${x.title}`,
                      contextId: x.id,
                    }}
                    className="btn btn-dark text-xs px-3"
                  >
                    <MessageCircle size={15} /> مراسلة
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      ) : talents.length === 0 ? (
        <Empty text="لا يوجد باحثون عن عمل مسجلون حالياً. اضغط على (أبحث عن عمل) لإضافة ملفك المهني." />
      ) : (
        <div className="listing-grid">
          {talents.map((x) => (
            <article className="panel p-5 flex flex-col" key={x.id}>
              <div className="flex gap-3 items-start">
                {x.logoUrl ? (
                  <img
                    src={x.logoUrl}
                    alt={x.name}
                    className="w-11 h-11 rounded-full object-cover border shrink-0"
                  />
                ) : (
                  <div className="avatar shrink-0">
                    <UserCheck size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-900">{x.name}</h3>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">{x.jobTitle}</p>
                </div>
                <Time>{x.time}</Time>
              </div>

              {x.skills && (
                <p className="text-xs text-slate-600 leading-6 mt-3 line-clamp-3 whitespace-pre-line">
                  {x.skills}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <Tag color="green">{x.experienceLabel}</Tag>
                <Tag color="blue">{x.roleType}</Tag>
                {getCategoryName(x.mainCategoryId) && (
                  <Tag color="slate">{getCategoryName(x.mainCategoryId)}</Tag>
                )}
              </div>

              <div className="mt-3">
                <Location>{x.location}</Location>
              </div>

              <div className="border-t mt-auto pt-3">
                <Link
                  to="/messages"
                  state={{
                    recipientId: x.userId,
                    recipientName: x.name,
                    contextTitle: `توظيف: ${x.jobTitle}`,
                    contextId: x.id,
                  }}
                  className="btn btn-dark w-full justify-center text-xs"
                >
                  <MessageCircle size={15} /> تواصل مباشر مع المرشح
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* نافذة نشر وظيفة شاغرة (للشركات) */}
      {modalMode === "postJob" && (
        <div className="overlay" onMouseDown={() => setModalMode(null)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-extrabold text-lg">نشر وظيفة شاغرة (للشركات والمكاتب)</h2>
              <button type="button" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg mb-3">
                {formError}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleCreateJob}>
              <Field label="المسمى الوظيفي المطلوب">
                <input
                  required
                  className="field"
                  placeholder="مثال: مهندس موقع مدني / فني كهرباء"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="القطاع الهندسي">
                  <select
                    required
                    className="field"
                    value={jobCatId}
                    onChange={(e) => setJobCatId(Number(e.target.value))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="نوع الدوام">
                  <select
                    className="field"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="دوام كامل">دوام كامل</option>
                    <option value="دوام جزئي">دوام جزئي</option>
                    <option value="عمل عن بُعد">عمل عن بُعد</option>
                    <option value="بالعقد / المشروع">بالعقد / المشروع</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="موقع العمل (المحافظة / المدينة)">
                  <input
                    required
                    className="field"
                    placeholder="مثال: القاهرة الجديدة / الفيوم"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                  />
                </Field>

                <Field label="نطاق الراتب (اختياري)">
                  <input
                    className="field"
                    placeholder="مثال: 15,000 - 20,000 ج.م"
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="وصف الوظيفة والمتطلبات">
                <textarea
                  required
                  className="field min-h-28"
                  placeholder="اكتب سنوات الخبرة المطلوبة، المهام اليومية، والمؤهلات..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </Field>

              <Button type="submit" disabled={submitting}>
                {submitting ? "جاري النشر..." : "نشر إعلان الوظيفة"}
              </Button>
            </form>
          </section>
        </div>
      )}

      {/* نافذة أبحث عن عمل (للمهندسين والفنيين والعمال) */}
      {modalMode === "postTalent" && (
        <div className="overlay" onMouseDown={() => setModalMode(null)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h2 className="font-extrabold text-lg">أبحث عن عمل — أضف ملفك المهني</h2>
              <button type="button" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg mb-3">
                {formError}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleCreateTalent}>
              <Field label="المسمى الوظيفي / المهنة">
                <input
                  required
                  className="field"
                  placeholder="مثال: مهندس مكتب فني / مراقب معماري / فني سباكة"
                  value={talentJobTitle}
                  onChange={(e) => setTalentJobTitle(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="القطاع الهندسي">
                  <select
                    required
                    className="field"
                    value={talentCatId}
                    onChange={(e) => setTalentCatId(Number(e.target.value))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="سنوات الخبرة">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    className="field"
                    value={talentExp}
                    onChange={(e) => setTalentExp(Number(e.target.value))}
                  />
                </Field>
              </div>

              <Field label="المحافظات المتاح العمل بها">
                <input
                  required
                  className="field"
                  placeholder="مثال: القاهرة والجيزة / جميع المحافظات"
                  value={talentLocation}
                  onChange={(e) => setTalentLocation(e.target.value)}
                />
              </Field>

              <Field label="ملخص الخبرات والمهارات والبرامج">
                <textarea
                  required
                  className="field min-h-28"
                  placeholder="اذكر أبرز المشاريع التي عملت بها، البرامج الهندسية (AutoCAD, Revit...) أو المهارات الفنية..."
                  value={talentSkills}
                  onChange={(e) => setTalentSkills(e.target.value)}
                />
              </Field>

              <Button type="submit" disabled={submitting}>
                {submitting ? "جاري الحفظ..." : "نشر ملفي للشركات"}
              </Button>
            </form>
          </section>
        </div>
      )}

      {/* نافذة التقديم على وظيفة */}
      {modalMode === "applyJob" && selectedJob && (
        <div className="overlay" onMouseDown={() => setModalMode(null)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div>
                <h2 className="font-extrabold text-lg">التقديم على: {selectedJob.title}</h2>
                <small className="text-slate-500">{selectedJob.company}</small>
              </div>
              <button type="button" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg mb-3">
                {formError}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleApplyJob}>
              <Field label="رسالة تعريفية للشركة">
                <textarea
                  required
                  className="field min-h-28"
                  placeholder="اكتب نبذة عن خبرتك ولماذا أنت مناسب لهذه الوظيفة..."
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                />
              </Field>

              <Field label="إرفاق السيرة الذاتية CV (اختياري — PDF أو صورة)">
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-amber-400 text-xs font-bold text-slate-600">
                  <FileUp size={18} className="text-amber-600" />
                  <span>{cvFile ? cvFile.name : "اختر ملف السيرة الذاتية من جهازك"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  />
                </label>
              </Field>

              <Button type="submit" disabled={submitting}>
                {submitting ? "جاري إرسال الطلب..." : "إرسال التقديم ومراسلة الشركة"}
              </Button>
            </form>
          </section>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </>
  );
}