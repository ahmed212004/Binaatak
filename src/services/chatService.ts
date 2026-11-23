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

export type ChatConversation = {
  id: string;
  otherParticipantId: string;
  name: string;
  logoUrl?: string;
  role: string;
  context: string;
  preview: string;
  unreadCount: number;
  lastMessageAt: string;
  isDraft?: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  time: string;
};

function formatTime(dateStr?: string): string {
  if (!dateStr) return "الآن";
  const trimmed = dateStr.trim().replace(" ", "T");
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "الآن";
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export const chatService = {
  getConversations: async (): Promise<ChatConversation[]> => {
    const list = await apiRequest<any[]>("/Chat/conversations");
    return (list ?? []).map((c) => ({
      id: c.id,
      otherParticipantId: c.otherParticipantId,
      name: c.otherParticipantName || "عضو بناءتك",
      logoUrl: resolveMediaUrl(c.otherParticipantLogoUrl),
      role: accountTypeLabels[c.otherParticipantAccountType] || "عضو بناءتك",
      context: c.contextType || "محادثة مباشرة",
      preview: c.lastMessagePreview || "مرفق",
      unreadCount: Number(c.unreadCount ?? 0),
      lastMessageAt: c.lastMessageAt,
    }));
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const list = await apiRequest<any[]>(`/Chat/conversations/${conversationId}/messages`);
    return (list ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      attachmentUrl: m.attachmentUrl ? resolveMediaUrl(m.attachmentUrl) : undefined,
      isRead: Boolean(m.isRead),
      time: formatTime(m.createdAt),
    }));
  },

  sendMessage: async (payload: {
    recipientId: string;
    content: string;
    attachmentUrl?: string;
    contextType?: string;
    contextId?: string;
  }): Promise<ChatMessage> => {
    const m = await apiRequest<any>("/Chat/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: payload.recipientId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl || null,
        contextType: payload.contextType || null,
        contextId: payload.contextId || null,
      }),
    });

    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      attachmentUrl: m.attachmentUrl ? resolveMediaUrl(m.attachmentUrl) : undefined,
      isRead: Boolean(m.isRead),
      time: formatTime(m.createdAt),
    };
  },
};