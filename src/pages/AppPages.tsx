import { Component, useEffect, useState, type ReactNode } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { AccountModal, ProductModal, RfqModal, QuoteModal, PostModal } from "../components/Modals";
import { Toast } from "../components/Shared";
import { taxonomy, type TaxonomyNode } from "../data/mockData";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { feedService } from "../services/feedService";
import { directoryService } from "../services/directoryService";
import { rfqService } from "../services/rfqService";
import { taxonomyService, type NormalizedMainCategory } from "../services/taxonomyService";
import {
  accountTypeFromId,
  accountTypeToId,
  guestProfile,
  isServiceProvider,
  type ProfileState,
} from "../types/app";

import HomePage from "./HomePage";
import DirectoryPage from "./DirectoryPage";
import ServiceDetailPage from "./ServiceDetailPage";
import RfqsPage from "./RfqsPage";
import RfqDetailPage from "./RfqDetailPage";
import JobsPage from "./JobsPage";
import MessagesPage from "./MessagesPage";
import ProfilePage from "./ProfilePage";
import AuthPage from "./AuthPage";

class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMsg: error?.message || "حدث خطأ غير متوقع أثناء فتح الصفحة",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel p-8 text-center space-y-4 my-6 border-red-200 bg-red-50/40">
          <h2 className="text-lg font-black text-red-700">تعذر عرض هذه الصفحة</h2>
          <p
            dir="ltr"
            className="text-xs font-mono text-red-600 bg-white p-3 rounded-lg border border-red-200 inline-block max-w-full overflow-x-auto"
          >
            {this.state.errorMsg}
          </p>
          <div>
            <a
              href="/"
              onClick={() => this.setState({ hasError: false, errorMsg: "" })}
              className="btn btn-amber inline-flex"
            >
              العودة للرئيسية
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [profile, setProfile] = useState<ProfileState>(guestProfile);
  const [rawTaxonomy, setRawTaxonomy] = useState<NormalizedMainCategory[]>([]);
  const [taxNodes, setTaxNodes] = useState<TaxonomyNode[]>(taxonomy);

  const [setup, setSetup] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [rfqModal, setRfqModal] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [quoteModal, setQuoteModal] = useState(false);
  const [toast, setToast] = useState("");

  const [posts, setPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 2800);
  };

  const loadMyProfile = async () => {
    if (!authService.isAuthenticated()) {
      setProfile(guestProfile);
      return;
    }
    try {
      const me = await profileService.getMe();
      if (me) {
        setProfile({
          name: me.displayName || "عضو بناءتك",
          type: accountTypeFromId[me.accountType] || "طالب خدمة",
          bio: me.bio,
          location: me.location,
          logoUrl: me.logoUrl || "",
          tax: {
            category: me.mainCategoryName || "",
            sub: me.subCategoryName || "",
            specialty: me.specialtyName || "",
          },
        });
      }
    } catch {
      authService.logout();
      setProfile(guestProfile);
    }
  };

  const loadInitialData = async () => {
    try {
      const tree = await taxonomyService.getTree();
      if (tree && tree.length > 0) {
        setRawTaxonomy(tree);
        setTaxNodes(taxonomyService.toTaxonomyNodes(tree));
      } else {
        notify("تنبيه: جدول الأقسام في قاعدة البيانات فارغ (0 أقسام)");
      }
    } catch (e: any) {
      console.error("Failed to load taxonomy:", e);
      notify(`تعذر الاتصال بالسيرفر لتحميل الأقسام: ${e.message || "تأكد من تشغيل .NET API"}`);
    }

    try {
      const dbPosts = await feedService.getPosts();
      setPosts(dbPosts);
    } catch (e) {
      console.error("Failed to load feed:", e);
    }

    try {
      const dbListings = await directoryService.getListings();
      setListings(dbListings);
    } catch (e) {
      console.error("Failed to load directory:", e);
    }

    try {
      const dbRfqs = await rfqService.getRfqs();
      setRfqs(dbRfqs);
    } catch (e) {
      console.error("Failed to load rfqs:", e);
      setRfqs([]);
    }

    await loadMyProfile();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSaveProfile = async (next: ProfileState) => {
    if (authService.isAuthenticated()) {
      const ids = taxonomyService.resolveIds(
        rawTaxonomy,
        next.tax.category,
        next.tax.sub,
        next.tax.specialty
      );
      await profileService.updateProfile({
        displayName: next.name.trim(),
        accountType: accountTypeToId[next.type] || 1,
        bio: next.bio,
        location: next.location,
        mainCategoryId: ids.mainCategoryId || 0,
        subCategoryId: ids.subCategoryId || 0,
        specialtyId: ids.specialtyId || 0,
      });
    }
    setProfile(next);
    notify("تم تحديث بيانات الحساب والتخصص في قاعدة البيانات");
  };

  const addProduct = async (x: {
    title: string;
    category: string;
    sub: string;
    specialty: string;
    description: string;
    indicativePrice?: number;
    priceUnit: string;
    deliveryDays?: number;
    area: string;
    images: string[];
  }) => {
    if (!authService.isAuthenticated() || !isServiceProvider(profile.type)) {
      throw new Error("إضافة الخدمات متاحة لحسابات مقدمي الخدمات فقط.");
    }

    const ids = taxonomyService.resolveIds(rawTaxonomy, x.category, x.sub, x.specialty);

    await directoryService.createListing({
      title: x.title,
      description: x.description,
      indicativePrice: x.indicativePrice,
      priceUnit: x.priceUnit,
      deliveryDays: x.deliveryDays,
      coverageArea: x.area,
      imagesJson: x.images.length > 0 ? JSON.stringify(x.images) : undefined,
      mainCategoryId: ids.mainCategoryId,
      subCategoryId: ids.subCategoryId,
      specialtyId: ids.specialtyId,
    });

    const updated = await directoryService.getListings();
    setListings(updated);
    notify("تمت إضافة الخدمة إلى السوق بنجاح");
  };

  const addPost = async (x: {
    type: string;
    mainCategoryId: number;
    subCategoryId?: number;
    specialtyId?: number;
    body: string;
    attachments?: any[];
  }) => {
    await feedService.createPost({
      content: x.body,
      typeLabel: x.type,
      mainCategoryId: x.mainCategoryId,
      subCategoryId: x.subCategoryId,
      specialtyId: x.specialtyId,
      attachments: x.attachments,
    });
    const updated = await feedService.getPosts();
    setPosts(updated);
    notify("تم نشر المنشور وحفظه بنجاح");
  };

  const handleLikePost = async (id: string | number) => {
    if (!authService.isAuthenticated()) {
      notify("يرجى تسجيل الدخول أولاً للتفاعل مع المنشورات");
      return;
    }
    try {
      const res = await feedService.toggleLike(id);
      const nextLiked = Boolean(res?.isLiked);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const wasLiked = Boolean(p.isLiked);
          const diff = nextLiked === wasLiked ? 0 : nextLiked ? 1 : -1;
          return {
            ...p,
            isLiked: nextLiked,
            liked: nextLiked,
            likes: Math.max(0, (p.likes ?? 0) + diff),
          };
        })
      );
    } catch {
      const updated = await feedService.getPosts();
      setPosts(updated);
    }
  };

  const addRfq = async (x: {
    title: string;
    category: string;
    sub: string;
    specialty: string;
    description: string;
    quantity: string;
    location: string;
  }) => {
    const ids = taxonomyService.resolveIds(rawTaxonomy, x.category, x.sub, x.specialty);
    if (!ids.mainCategoryId || !ids.subCategoryId || !ids.specialtyId) {
      throw new Error("تعذر تحديد مسار التصنيف من قاعدة البيانات، تأكد من اتصال السيرفر.");
    }

    await rfqService.createRfq({
      title: x.title,
      description: x.description,
      quantityOrScope: x.quantity,
      location: x.location,
      mainCategoryId: ids.mainCategoryId,
      subCategoryId: ids.subCategoryId,
      specialtyId: ids.specialtyId,
    });

    const updated = await rfqService.getRfqs();
    setRfqs(updated);
    notify("تم نشر طلبك وحفظه ليظهر لجميع المستخدمين");
  };

  const openProductModal = () => {
    if (!authService.isAuthenticated() || !isServiceProvider(profile.type)) {
      notify("إضافة الخدمات متاحة لحسابات مقدمي الخدمات فقط");
      return;
    }
    setProductModal(true);
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <Navigation onSetup={() => setSetup(true)} />
      <PageErrorBoundary>
        <main className="page-shell">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  profile={profile}
                  posts={posts}
                  rfqs={rfqs}
                  taxNodes={taxNodes}
                  onSetup={() => setSetup(true)}
                  onPost={() => setPostModal(true)}
                  onLike={handleLikePost}
                />
              }
            />
            <Route
              path="/directory"
              element={
                <DirectoryPage
                  listings={listings}
                  taxNodes={taxNodes}
                  profile={profile}
                  onAdd={openProductModal}
                />
              }
            />
            <Route path="/directory/:id" element={<ServiceDetailPage listings={listings} />} />
            <Route
              path="/rfqs"
              element={<RfqsPage rfqs={rfqs} taxNodes={taxNodes} onAdd={() => setRfqModal(true)} />}
            />
            <Route
              path="/rfqs/:id"
              element={
                <RfqDetailPage
                  rfqs={rfqs}
                  quotes={quotes}
                  onQuote={() => setQuoteModal(true)}
                  onAccept={() => notify("تم قبول العرض وترسية الطلب")}
                />
              }
            />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  profile={profile}
                  listings={listings}
                  posts={posts}
                  onEdit={() => setSetup(true)}
                  onAdd={openProductModal}
                />
              }
            />
            <Route path="/login" element={<AuthPage register={false} onSuccess={loadInitialData} />} />
            <Route path="/register" element={<AuthPage register onSuccess={loadInitialData} />} />
            <Route
              path="*"
              element={
                <div className="panel p-10 text-center">
                  الصفحة غير موجودة{" "}
                  <Link className="text-amber-600" to="/">
                    العودة للرئيسية
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>

        {setup && (
          <AccountModal
            close={() => setSetup(false)}
            profile={profile}
            nodes={taxNodes}
            onSave={handleSaveProfile}
          />
        )}
        {productModal && (
          <ProductModal close={() => setProductModal(false)} nodes={taxNodes} onSave={addProduct} />
        )}
        {rfqModal && (
          <RfqModal close={() => setRfqModal(false)} nodes={taxNodes} onSave={addRfq} />
        )}
        {postModal && (
          <PostModal
            close={() => setPostModal(false)}
            nodes={taxNodes}
            rawTaxonomy={rawTaxonomy}
            onSave={addPost}
          />
        )}
        {quoteModal && (
          <QuoteModal
            close={() => setQuoteModal(false)}
            onSave={(q) => {
              setQuotes((p) => [q, ...p]);
              notify("تم إرسال عرض السعر بنجاح");
            }}
          />
        )}
      </PageErrorBoundary>
      <Toast message={toast} />
    </div>
  );
}