import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send, Paperclip, MessageSquareOff, FileText, Loader2 } from "lucide-react";
import { Tag, SearchBox, Button } from "../components/Shared";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { uploadService } from "../services/uploadService";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
} from "../services/chatService";

export default function MessagesPage() {
  const location = useLocation();
  const navState = (location.state || {}) as {
    recipientId?: string;
    providerId?: string;
    authorId?: string;
    recipientName?: string;
    providerName?: string;
    authorName?: string;
    contextTitle?: string;
    serviceTitle?: string;
    contextId?: string;
  };

  const isAuth = authService.isAuthenticated();
  const [myUserId, setMyUserId] = useState<string>("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const targetRecipientId = String(
    navState.recipientId ||
      navState.providerId ||
      navState.authorId ||
      ""
  ).trim();

  const targetRecipientName = String(
    navState.recipientName ||
      navState.providerName ||
      navState.authorName ||
      ""
  ).trim();

  const targetContext = String(
    navState.contextTitle ||
      navState.serviceTitle ||
      ""
  ).trim();

  useEffect(() => {
    if (!isAuth) {
      setLoadingList(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      setLoadingList(true);
      setError("");

      let currentId = "";
      try {
        const me = await profileService.getMe();
        currentId = String(me?.id || me?.userId || "").trim();
        if (!cancelled) setMyUserId(currentId);
      } catch {
        // تجاهل خطأ جلب البروفايل إن وجد
      }

      let dbConvs: ChatConversation[] = [];
      try {
        dbConvs = await chatService.getConversations();
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "تعذر تحميل المحادثات من السيرفر");
        }
      }

      if (cancelled) return;

      // إذا ضغط المستخدم على زر مراسلة من منشور أو خدمة أو طلب
      if (targetRecipientId || targetRecipientName) {
        if (
          targetRecipientId &&
          currentId &&
          targetRecipientId.toLowerCase() === currentId.toLowerCase()
        ) {
          setError(
            "هذا المنشور أو الخدمة خاص بحسابك الحالي، لا يمكنك مراسلة نفسك. سجّل الدخول بحساب آخر لاختبار المحادثة."
          );
          setConversations(dbConvs);
          if (dbConvs.length > 0) setActiveId(dbConvs[0].id);
          setLoadingList(false);
          return;
        }

        const existing = dbConvs.find((c) =>
          targetRecipientId
            ? c.otherParticipantId?.toLowerCase() === targetRecipientId.toLowerCase()
            : c.name?.trim() === targetRecipientName
        );

        if (existing) {
          const updated = targetContext
            ? dbConvs.map((c) =>
                c.id === existing.id ? { ...c, context: targetContext } : c
              )
            : dbConvs;
          setConversations(updated);
          setActiveId(existing.id);
          if (targetContext) {
            setText(`مرحباً ${existing.name}، أتواصل معك بخصوص: "${targetContext}"`);
          }
        } else {
          const displayName = targetRecipientName || "عضو بناءتك";
          const draftId = `draft-${targetRecipientId || Date.now()}`;
          const draftConv: ChatConversation = {
            id: draftId,
            otherParticipantId: targetRecipientId,
            name: displayName,
            role: "عضو بناءتك",
            context: targetContext || "محادثة جديدة",
            preview: "اكتب رسالتك الأولى لبدء المحادثة...",
            unreadCount: 0,
            lastMessageAt: new Date().toISOString(),
            isDraft: true,
          };
          setConversations([draftConv, ...dbConvs]);
          setActiveId(draftId);
          if (targetContext) {
            setText(`مرحباً ${displayName}، أتواصل معك بخصوص: "${targetContext}"`);
          }
        }
      } else {
        setConversations(dbConvs);
        if (dbConvs.length > 0) {
          setActiveId(dbConvs[0].id);
        }
      }

      setLoadingList(false);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [isAuth, targetRecipientId, targetRecipientName, targetContext]);

  // تحميل رسائل المحادثة المختارة
  useEffect(() => {
    if (!isAuth || !activeId || activeId.startsWith("draft-")) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMsgs(true);

    chatService
      .getMessages(activeId)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuth, activeId]);

  // تحديث دوري للرسائل والمحادثات كل 5 ثوانٍ
  useEffect(() => {
    if (!isAuth) return;
    const timer = window.setInterval(async () => {
      try {
        const latestConvs = await chatService.getConversations();
        setConversations((prev) => {
          const drafts = prev.filter((c) => c.isDraft);
          return [...drafts, ...latestConvs];
        });

        if (activeId && !activeId.startsWith("draft-")) {
          const latestMsgs = await chatService.getMessages(activeId);
          setMessages(latestMsgs);
        }
      } catch {
        // تجاهل أخطاء التحديث المؤقتة
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isAuth, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuth) {
    return (
      <div className="panel p-10 text-center space-y-4 my-6">
        <h2 className="text-xl font-black text-slate-900">مركز الرسائل المباشرة</h2>
        <p className="text-sm text-slate-500">
          يرجى تسجيل الدخول أولاً لعرض محادثاتك والتواصل مع المهندسين والمقاولين والموردين.
        </p>
        <Link to="/login" className="btn btn-amber inline-flex">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  const handleSend = async (e?: React.FormEvent, attachmentUrl?: string) => {
    if (e) e.preventDefault();
    if (!activeConv || sending) return;

    const cleanText = text.trim();
    if (!cleanText && !attachmentUrl) return;

    if (!activeConv.otherParticipantId) {
      setError("معرّف المستلم غير متوفر لهذه البطاقة، تأكد من تحديث الصفحة.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const savedMsg = await chatService.sendMessage({
        recipientId: activeConv.otherParticipantId,
        content: cleanText || (attachmentUrl ? "مرفق" : ""),
        attachmentUrl,
        contextType: activeConv.context,
        contextId: navState.contextId,
      });

      setText("");
      setMessages((prev) => [...prev, savedMsg]);

      const updatedConvs = await chatService.getConversations();
      setConversations(updatedConvs);
      setActiveId(savedMsg.conversationId);
    } catch (err: any) {
      setError(err?.message || "تعذر إرسال الرسالة، تأكد من تشغيل السيرفر");
    } finally {
      setSending(false);
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    e.target.value = "";
    setSending(true);
    setError("");
    try {
      const uploaded = await uploadService.uploadFile(file);
      if (uploaded?.url) {
        await handleSend(undefined, uploaded.url);
      }
    } catch (err: any) {
      setError(err?.message || "فشل رفع الملف المرفق");
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (x) =>
      !search.trim() ||
      `${x.name} ${x.context} ${x.preview}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="chat-layout">
        <aside className="chat-list">
          <div className="p-4 border-b">
            <h2 className="font-extrabold">الرسائل</h2>
            <div className="mt-3">
              <SearchBox value={search} onChange={setSearch} placeholder="بحث في المحادثات..." />
            </div>
          </div>

          {loadingList ? (
            <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> جاري تحميل المحادثات...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs leading-6">
              لا توجد محادثات بعد. اضغط على زر (مراسلة) في أي خدمة أو منشور أو طلب لبدء التواصل.
            </div>
          ) : (
            filteredConversations.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setActiveId(x.id)}
                className={`conversation ${activeId === x.id ? "active" : ""}`}
              >
                {x.logoUrl ? (
                  <img
                    src={x.logoUrl}
                    alt={x.name}
                    className="w-10 h-10 rounded-full object-cover border shrink-0"
                  />
                ) : (
                  <div className="avatar">{x.name?.[0] || "م"}</div>
                )}

                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-between gap-1">
                    <b className="text-sm truncate">{x.name}</b>
                    {x.unreadCount > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {x.unreadCount}
                      </span>
                    )}
                  </div>
                  <small className="block text-slate-400 mt-0.5">{x.role}</small>
                  <small className="block text-amber-700 mt-0.5 truncate">{x.context}</small>
                  <p className="text-xs text-slate-500 truncate mt-1">{x.preview}</p>
                </div>
              </button>
            ))
          )}
        </aside>

        {activeConv ? (
          <section className="chat-main">
            <header className="chat-head">
              {activeConv.logoUrl ? (
                <img
                  src={activeConv.logoUrl}
                  alt={activeConv.name}
                  className="w-10 h-10 rounded-full object-cover border"
                />
              ) : (
                <div className="avatar">{activeConv.name?.[0] || "م"}</div>
              )}
              <div>
                <b>{activeConv.name}</b>
                <small className="block text-slate-400">{activeConv.role}</small>
              </div>
              <span className="mr-auto">
                <Tag color="slate">{activeConv.context}</Tag>
              </span>
            </header>

            <div className="chat-messages">
              {loadingMsgs ? (
                <div className="text-center text-slate-400 text-xs py-10">
                  جاري تحميل الرسائل...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-10">
                  اكتب رسالتك في الأسفل واضغط (إرسال) لبدء المحادثة مع {activeConv.name}.
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = myUserId && m.senderId.toLowerCase() === myUserId.toLowerCase();
                  const isImage =
                    m.attachmentUrl &&
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(m.attachmentUrl);

                  return (
                    <div
                      className={isMine ? "bubble outgoing" : "bubble incoming"}
                      key={m.id}
                    >
                      {m.attachmentUrl && (
                        <div className="mb-1.5">
                          {isImage ? (
                            <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                              <img
                                src={m.attachmentUrl}
                                alt="مرفق"
                                className="max-h-48 rounded-lg border object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs underline font-bold"
                            >
                              <FileText size={14} /> عرض الملف المرفق
                            </a>
                          )}
                        </div>
                      )}
                      {m.content && <div className="whitespace-pre-line">{m.content}</div>}
                      <small>{m.time}</small>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="p-3 border-t flex items-center gap-2 bg-white" onSubmit={handleSend}>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileAttach}
              />
              <button
                type="button"
                disabled={sending}
                onClick={() => fileInputRef.current?.click()}
                title="إرفاق صورة أو ملف"
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <Paperclip size={18} />
              </button>
              <input
                className="field flex-1"
                placeholder="اكتب رسالتك هنا..."
                value={text}
                disabled={sending}
                onChange={(e) => setText(e.target.value)}
              />
              <Button type="submit" disabled={sending}>
                <Send size={16} /> {sending ? "جاري الإرسال..." : "إرسال"}
              </Button>
            </form>
          </section>
        ) : (
          <section className="chat-main items-center justify-center text-center p-10 text-slate-400">
            <MessageSquareOff size={36} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">اختر محادثة من القائمة الجانبية لعرض الرسائل</p>
          </section>
        )}
      </div>
    </div>
  );
}