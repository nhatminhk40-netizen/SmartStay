import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  User,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  AlertTriangle,
  Inbox,
  Clock,
  PhoneCall,
  Lock,
  Smile,
  Repeat,
  Volume2,
  VolumeX,
  Check,
  CheckCheck
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  chatService,
  getSocket,
  cleanPhoneNumber,
  openZaloChat,
  detectPhoneNumberInText,
  getCurrentChatIdentity
} from "@/services/chatService";
import {
  playNotificationSound,
  persistMessageToSyncStore,
  getMessagesFromSyncStore,
  broadcastNewMessage,
  broadcastTypingStatus,
  subscribeToMessengerSync,
  getConversationKey
} from "@/services/messengerSync";

export default function SmartStayChatWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState("chat"); // 'chat' | 'conversations'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Thông tin danh tính cơ sở của người dùng hiện tại
  const baseIdentity = getCurrentChatIdentity(user);

  // Hỗ trợ chế độ thử nghiệm đóng vai (Role Override giữa 2 bạn)
  const [swappedRole, setSwappedRole] = useState(false);

  // Cuộc trò chuyện & Tin nhắn
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Trạng thái đối phương đang gõ phím
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Cảnh báo SĐT thời gian thực
  const [detectedPhoneInInput, setDetectedPhoneInInput] = useState(null);

  const messagesEndRef = useRef(null);

  // Danh tính thực thi (khi đổi vai test giữa hai bên)
  const currentActor = swappedRole && activeContact ? activeContact : baseIdentity;
  const currentTarget = swappedRole && activeContact ? baseIdentity : activeContact;

  // Khóa hội thoại duy nhất
  const currentConvKey = currentTarget
    ? getConversationKey(currentActor.id, currentTarget.id, currentActor.name, currentTarget.name)
    : "";

  // 1. Tải danh sách cuộc trò chuyện
  const loadConversations = async () => {
    if (!currentActor?.id && !currentActor?.name) return;

    // Đọc từ bộ nhớ đồng bộ trước để hiển thị tức thì không độ trễ
    const localStore = JSON.parse(localStorage.getItem("smartstay_messenger_store_v1") || "{}");
    const localConvs = localStore.conversations || [];

    // Tải thêm từ backend MongoDB nếu có mạng
    try {
      const serverConvs = await chatService.getConversations(
        currentActor.id,
        currentActor.name,
        currentActor.phone
      );
      if (Array.isArray(serverConvs) && serverConvs.length > 0) {
        // Gộp hai nguồn
        const map = new Map();
        localConvs.forEach((c) => map.set(c._id || c.id || c.convKey, c));
        serverConvs.forEach((c) => map.set(c._id || c.id, { ...map.get(c._id || c.id), ...c }));
        const merged = Array.from(map.values());
        setConversations(merged);
        return merged;
      }
    } catch (e) {}

    setConversations(localConvs);
    return localConvs;
  };

  useEffect(() => {
    loadConversations();
  }, [currentActor?.id, currentActor?.name, swappedRole]);

  // 2. Lắng nghe Đồng bộ Thời gian thực kiểu Messenger (Cross-Tab BroadcastChannel + LocalStorage)
  useEffect(() => {
    const unsubscribe = subscribeToMessengerSync(
      (incomingMsg, convData) => {
        if (!incomingMsg) return;

        // Kiểm tra xem tin nhắn có thuộc cuộc hội thoại đang mở hay không
        const isCurrentConv =
          incomingMsg.conversationKey === currentConvKey ||
          (currentTarget &&
            (incomingMsg.senderName?.toLowerCase() === currentTarget.name?.toLowerCase() ||
              incomingMsg.recipientName?.toLowerCase() === currentTarget.name?.toLowerCase()));

        if (isCurrentConv) {
          setMessages((prev) => {
            if (prev.some((m) => String(m._id || m.id) === String(incomingMsg._id || incomingMsg.id))) {
              return prev;
            }
            return [...prev, incomingMsg];
          });
        }

        // Nếu tin nhắn được gửi từ đối phương đến mình
        const isFromOther =
          incomingMsg.senderName?.toLowerCase() !== currentActor.name?.toLowerCase();

        if (isFromOther) {
          // 1. Phát âm thanh 'Ting!' đặc trưng của Messenger
          if (soundEnabled) {
            playNotificationSound("receive");
          }

          // 2. Tăng số lượng tin chưa đọc nếu đang đóng chat hoặc ở tab khác
          if (!isOpen || isMinimized || !isCurrentConv) {
            setUnreadTotal((count) => count + 1);

            // 3. Hiển thị Toast thông báo nổi như Messenger
            toast({
              title: `💬 ${incomingMsg.senderName || "Bạn cùng phòng"} vừa nhắn:`,
              description: incomingMsg.text?.slice(0, 80) || "Tin nhắn mới",
              duration: 4000
            });
          }
        }

        loadConversations();
      },
      (convKey, typingSenderName, isTyping) => {
        // Xử lý Typing Indicator
        if (
          convKey === currentConvKey &&
          typingSenderName?.toLowerCase() !== currentActor.name?.toLowerCase()
        ) {
          setIsOtherTyping(isTyping);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentConvKey, currentActor.name, currentTarget?.name, isOpen, isMinimized, soundEnabled]);

  // 3. Lắng nghe Socket.IO từ máy chủ MongoDB Backend
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentActor?.id) return;

    socket.emit("join_user", currentActor.id);
    if (currentActor.name) {
      socket.emit("join_user", `user_name_${currentActor.name.trim().toLowerCase()}`);
    }

    const handleServerMessage = (msg) => {
      if (
        activeConversation &&
        (String(msg.conversationId) === String(activeConversation._id) ||
          String(msg.conversationId) === String(activeConversation.id))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id || m.id) === String(msg._id || msg.id))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
      loadConversations();
    };

    socket.on("chat:message", handleServerMessage);
    socket.on("chat:notification", loadConversations);

    return () => {
      socket.off("chat:message", handleServerMessage);
      socket.off("chat:notification", loadConversations);
    };
  }, [activeConversation, currentActor?.id, currentActor?.name, swappedRole]);

  // 4. Tải tin nhắn khi mở cuộc trò chuyện
  useEffect(() => {
    if (!currentConvKey) return;

    // 1. Tải tức thì từ bộ nhớ đồng bộ
    const localMsgs = getMessagesFromSyncStore(currentConvKey);
    setMessages(localMsgs);

    // 2. Tải thêm từ MongoDB Backend
    if (activeConversation?._id || activeConversation?.id) {
      const convId = activeConversation._id || activeConversation.id;
      setIsLoadingMessages(true);
      chatService
        .getMessages(convId)
        .then((serverMsgs) => {
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            setMessages((prev) => {
              const map = new Map();
              prev.forEach((m) => map.set(String(m._id || m.id), m));
              serverMsgs.forEach((m) => map.set(String(m._id || m.id), m));
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );
            });
          }
        })
        .finally(() => setIsLoadingMessages(false));
    }
  }, [currentConvKey, activeConversation?._id, activeConversation?.id, swappedRole]);

  // 5. Lắng nghe sự kiện mở chat từ toàn website
  useEffect(() => {
    const handleOpenChatEvent = async (e) => {
      const { recipient, initialMessage } = e.detail || {};
      if (!recipient) return;

      const recipientId = String(recipient.id || recipient._id || `user_${Date.now()}`);
      const recipientPhone = recipient.rawContact || recipient.contact || recipient.contactZalo || "";

      const contactData = {
        id: recipientId,
        name: recipient.name || "Người tìm ở ghép",
        campus: recipient.campus || "Cần Thơ",
        budget: recipient.budget || 2.2,
        habits: recipient.habits || "Sạch sẽ, văn minh",
        phone: recipientPhone,
        avatar: recipient.avatarUrl || recipient.avatar || ""
      };

      setSwappedRole(false);
      setActiveContact(contactData);
      setIsOpen(true);
      setIsMinimized(false);
      setViewMode("chat");
      setUnreadTotal(0);

      // Tạo cuộc trò chuyện
      const convKey = getConversationKey(
        baseIdentity.id,
        contactData.id,
        baseIdentity.name,
        contactData.name
      );

      const conv = await chatService.getOrCreateConversation(
        {
          id: baseIdentity.id,
          name: baseIdentity.name,
          avatar: baseIdentity.avatar,
          phone: baseIdentity.phone,
          campus: baseIdentity.campus,
          role: baseIdentity.role
        },
        {
          id: contactData.id,
          name: contactData.name,
          avatar: contactData.avatar,
          phone: contactData.phone,
          campus: contactData.campus,
          role: "student"
        }
      );

      const resolvedConv = conv || {
        _id: `conv_${convKey}`,
        id: `conv_${convKey}`,
        participants: [baseIdentity.id, contactData.id],
        participantDetails: [baseIdentity, contactData]
      };

      setActiveConversation(resolvedConv);

      // Gửi tin nhắn đầu tiên nếu có
      if (initialMessage && initialMessage.trim()) {
        await executeSendMessage(initialMessage.trim(), resolvedConv, baseIdentity, contactData);
      }
    };

    window.addEventListener("smartstay:open_chat", handleOpenChatEvent);
    return () => {
      window.removeEventListener("smartstay:open_chat", handleOpenChatEvent);
    };
  }, [baseIdentity]);

  // 6. Nhấp nháy tiêu đề tab trình duyệt khi có tin nhắn mới
  useEffect(() => {
    if (unreadTotal > 0) {
      const originalTitle = document.title;
      let toggle = false;
      const interval = setInterval(() => {
        document.title = toggle ? `(${unreadTotal} tin nhắn mới) SmartStay` : originalTitle;
        toggle = !toggle;
      }, 1000);

      return () => {
        clearInterval(interval);
        document.title = originalTitle;
      };
    }
  }, [unreadTotal]);

  // 7. Tự động cuộn xuống đáy tin nhắn
  useEffect(() => {
    if (isOpen && !isMinimized && viewMode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, viewMode, swappedRole, isOtherTyping]);

  // 8. Báo trạng thái gõ phím (Typing)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const phone = detectPhoneNumberInText(val);
    setDetectedPhoneInInput(phone);

    // Phát sự kiện đang gõ
    if (currentConvKey) {
      broadcastTypingStatus(currentConvKey, currentActor.name, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTypingStatus(currentConvKey, currentActor.name, false);
      }, 1500);
    }
  };

  // 9. Thực thi gửi tin nhắn chuẩn Messenger
  const executeSendMessage = async (rawText, targetConv, sender, recipient) => {
    const text = rawText.trim();
    if (!text || !recipient) return;

    // Phát âm thanh 'Pop' gửi tin nhắn
    if (soundEnabled) {
      playNotificationSound("send");
    }

    // Tắt trạng thái gõ phím
    broadcastTypingStatus(currentConvKey, sender.name, false);

    // Kiểm duyệt SĐT cá nhân
    const phone = detectPhoneNumberInText(text);
    const hasSensitive = Boolean(phone);
    const masked = hasSensitive
      ? text.replace(/(?:(?:\+84|0)[3|5|7|8|9](?:[\s.-]?[0-9]){8})|(?:\b\d{9,11}\b)/g, "[Đã ẩn SĐT - Vui lòng mở qua Zalo]")
      : text;

    const convKey = getConversationKey(sender.id, recipient.id, sender.name, recipient.name);
    const newMsg = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      id: `msg_${Date.now()}`,
      conversationId: targetConv?._id || targetConv?.id || `conv_${convKey}`,
      conversationKey: convKey,
      senderId: String(sender.id),
      senderName: sender.name,
      recipientId: String(recipient.id),
      recipientName: recipient.name,
      text,
      maskedText: masked,
      containsSensitiveInfo: hasSensitive,
      detectedPhone: phone || recipient.phone || "",
      redirectZalo: hasSensitive,
      read: false,
      createdAt: new Date().toISOString()
    };

    // 1. Lưu ngay vào bộ nhớ đồng bộ cục bộ (Instant Sync)
    persistMessageToSyncStore(newMsg, targetConv);
    setMessages((prev) => [...prev, newMsg]);

    // 2. Phát ngay sang tất cả các tab khác (Zero latency < 1ms)
    broadcastNewMessage(newMsg, targetConv);

    // 3. Gửi lên máy chủ MongoDB trong nền (Background Cloud Sync)
    chatService.sendMessage({
      conversationId: targetConv?._id || targetConv?.id || `conv_${convKey}`,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      text,
      recipientPhone: recipient.phone
    });

    loadConversations();
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    executeSendMessage(inputText, activeConversation, currentActor, currentTarget);
    setInputText("");
    setDetectedPhoneInInput(null);
  };

  // Mở Zalo trực tiếp
  const handleOpenZalo = (phone) => {
    const targetPhone = phone || currentTarget?.phone || detectedPhoneInInput;
    if (targetPhone) {
      openZaloChat(targetPhone);
    } else {
      window.open("https://zalo.me", "_blank");
    }
  };

  // Chọn cuộc trò chuyện từ danh sách hộp thư
  const handleSelectConversation = (conv) => {
    const otherParticipant = conv.participantDetails?.find((p) => String(p.id) !== String(currentActor.id)) || {
      id: conv.participants?.find((id) => String(id) !== String(currentActor.id)) || "user_other",
      name: "Người dùng SmartStay",
      phone: "",
      campus: "Cần Thơ"
    };

    setActiveContact(otherParticipant);
    setActiveConversation(conv);
    setViewMode("chat");
    setUnreadTotal(0);
  };

  // Nếu chưa có liên hệ và chưa mở, hiển thị bubble
  if (!activeContact && !isOpen && conversations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {/* 1. NÚT TRÒN THU NHỎ / FLOATING CHAT BUBBLE NHƯ MESSENGER */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadTotal(0);
            if (!activeContact && conversations.length > 0) {
              setViewMode("conversations");
            } else {
              setViewMode("chat");
            }
          }}
          className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white/80"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 animate-pulse" />
            {unreadTotal > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center animate-bounce shadow-md border-2 border-white">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">
            {currentTarget
              ? `Chat với ${currentTarget.name.split(" ").slice(-1)[0]}`
              : `Tin nhắn SmartStay ${conversations.length > 0 ? `(${conversations.length})` : ""}`}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* 2. CỬA SỔ CHATBOX P2P ĐỒNG BỘ 100% NHƯ MESSENGER */}
      {isOpen && !isMinimized && (
        <div className="w-[340px] sm:w-[380px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header Cửa sổ chat */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              {viewMode === "chat" && conversations.length > 1 && (
                <button
                  onClick={() => setViewMode("conversations")}
                  className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer mr-0.5"
                  title="Danh sách cuộc trò chuyện"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}

              {viewMode === "chat" && currentTarget ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-sm border border-white/30">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    {/* Chấm xanh đang hoạt động như Messenger */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm truncate leading-tight">
                        {currentTarget.name}
                      </h4>
                      <span className="text-[10px] text-emerald-200 font-semibold shrink-0">
                        • Online
                      </span>
                    </div>
                    <p className="text-[11px] text-orange-100 truncate">
                      {currentTarget.campus} {currentTarget.budget ? `• ~${currentTarget.budget}tr` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-white" />
                  <h4 className="font-bold text-sm">Hộp thư kết nối ({conversations.length})</h4>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Bật/Tắt âm thanh thông báo */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                title={soundEnabled ? "Tắt âm thanh chuông báo" : "Bật âm thanh chuông báo"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-orange-200" />}
              </button>

              {/* Nút mở Zalo trực tiếp trong header */}
              {viewMode === "chat" && (currentTarget?.phone || currentTarget?.contact) && (
                <button
                  onClick={() => handleOpenZalo(currentTarget.phone || currentTarget.contact)}
                  className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  title="Mở Zalo trực tiếp để tiếp tục trao đổi SĐT & gọi điện"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Zalo
                </button>
              )}

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                title="Thu nhỏ cửa sổ"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* THANH ĐIỀU KHIỂN ĐÓNG VAI TEST NHANH TRÊN 1 MÁY */}
          {viewMode === "chat" && activeContact && (
            <div className="px-3 py-1 bg-amber-500/15 border-b border-orange-200/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 truncate">
                <span className="text-slate-400 font-medium">Bạn đang là:</span>
                <strong className="text-orange-700 font-bold truncate">{currentActor.name}</strong>
              </div>
              <button
                onClick={() => setSwappedRole(!swappedRole)}
                className="px-2 py-0.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shrink-0 ml-1 shadow-2xs"
                title="Chuyển đổi vai trò người gửi và người nhận để thử nghiệm 2 chiều trên 1 máy"
              >
                <Repeat className="w-3 h-3" />
                {swappedRole ? "Đổi lại Tôi" : `Đóng vai ${activeContact.name.split(" ").slice(-1)[0]}`}
              </button>
            </div>
          )}

          {/* VIEW 1: DANH SÁCH CUỘC TRÒ CHUYỆN (INBOX NHƯ MESSENGER) */}
          {viewMode === "conversations" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              <div className="px-2 py-1 text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>Cuộc trò chuyện giữa bạn và người dùng</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Đồng bộ P2P & MongoDB
                </span>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Chưa có cuộc trò chuyện nào. Bấm "Nhắn tin" ở mục Tìm bạn ở ghép để kết nối!
                </div>
              ) : (
                conversations.map((c) => {
                  const other = c.participantDetails?.find((p) => String(p.id) !== String(currentActor.id)) || {
                    name: "Người dùng SmartStay",
                    campus: "Cần Thơ"
                  };
                  const unread = c.unreadCounts?.[currentActor.id] || 0;

                  return (
                    <div
                      key={c._id || c.id || c.convKey}
                      onClick={() => handleSelectConversation(c)}
                      className="p-3 bg-white hover:bg-orange-50/50 rounded-2xl border border-slate-200/80 shadow-2xs cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-800 truncate">{other.name}</h5>
                          <p className="text-[11px] text-slate-500 truncate">
                            {c.lastMessage?.text || "Bắt đầu cuộc trò chuyện..."}
                          </p>
                        </div>
                      </div>

                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                          {unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: KHUNG CHAT TRỰC TIẾP GIỮA HAI NGƯỜI */}
          {viewMode === "chat" && currentTarget && (
            <>
              {/* Banner Bảo mật & Chuyển tiếp Zalo */}
              <div className="px-3.5 py-1.5 bg-orange-50/90 border-b border-orange-100 flex items-center justify-between text-[11px] text-orange-800">
                <span className="flex items-center gap-1 font-medium truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Đồng bộ tức thì như Messenger • Lưu MongoDB
                </span>
                <button
                  onClick={() => handleOpenZalo(currentTarget.phone || currentTarget.contact)}
                  className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer"
                  title="Nhắn tin riêng tư hoặc trao đổi SĐT qua Zalo"
                >
                  <ExternalLink className="w-3 h-3" /> Mở Zalo
                </button>
              </div>

              {/* Khung nội dung tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
                {/* Thông báo kết nối ban đầu */}
                <div className="text-center my-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500 font-medium border border-slate-200/60">
                    🔒 Hai bạn đang trò chuyện trực tiếp (Đồng bộ tức thì)
                  </span>
                </div>

                {isLoadingMessages && messages.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">Đang tải tin nhắn...</div>
                )}

                {messages.map((msg) => {
                  // So khớp xem tin nhắn này do "Tôi" hay do "Đối phương" gửi
                  const isMe =
                    String(msg.senderId) === String(currentActor.id) ||
                    (msg.senderName &&
                      currentActor.name &&
                      msg.senderName.trim().toLowerCase() === currentActor.name.trim().toLowerCase());

                  const hasSensitive = Boolean(msg.containsSensitiveInfo);
                  const displayTime = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "";

                  return (
                    <div
                      key={msg._id || msg.id}
                      className={`flex items-end gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1 text-slate-600">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] p-3 rounded-2xl shadow-xs leading-relaxed ${
                          isMe
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                        }`}
                      >
                        {/* Nội dung tin nhắn (nếu có SĐT thì hiển thị nội dung đã che) */}
                        <p className="whitespace-pre-line text-xs font-normal">
                          {hasSensitive && msg.maskedText ? msg.maskedText : msg.text}
                        </p>

                        {/* THẺ BẮT BUỘC MỞ QUA ZALO KHI CÓ SĐT / THÔNG TIN CÁ NHÂN */}
                        {hasSensitive && (
                          <div
                            className={`mt-2 p-2.5 rounded-xl border text-xs ${
                              isMe
                                ? "bg-white/15 border-white/30 text-white"
                                : "bg-blue-50/90 border-blue-200 text-blue-900"
                            }`}
                          >
                            <div className="flex items-center gap-1 font-bold text-[11px] mb-1">
                              <Lock className="w-3 h-3 text-amber-300" />
                              <span>Bảo mật SĐT cá nhân</span>
                            </div>
                            <p
                              className={`text-[10px] leading-tight mb-2 ${
                                isMe ? "text-orange-100" : "text-blue-800"
                              }`}
                            >
                              Để bảo vệ riêng tư, vui lòng mở qua Zalo để tiếp tục nhắn tin & liên hệ:
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenZalo(
                                  msg.detectedPhone || currentTarget?.phone || currentTarget?.contact
                                )
                              }
                              className={`w-full py-1.5 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                                isMe
                                  ? "bg-white text-orange-600 hover:bg-orange-50"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" /> Mở qua Zalo tiếp tục nhắn
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span
                            className={`text-[9px] ${
                              isMe ? "text-orange-100" : "text-slate-400"
                            }`}
                          >
                            {displayTime}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-orange-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Hiệu ứng đang gõ tin nhắn (Typing Indicator) */}
                {isOtherTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] py-1 italic animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Banner cảnh báo ngay khi người dùng gõ SĐT vào ô chat */}
              {detectedPhoneInInput && (
                <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-900 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Phát hiện SĐT (<strong>{detectedPhoneInInput}</strong>): SmartStay yêu cầu mở Zalo!
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenZalo(detectedPhoneInInput)}
                    className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 shrink-0 cursor-pointer ml-1"
                  >
                    Mở Zalo
                  </button>
                </div>
              )}

              {/* Gợi ý tin nhắn mẫu nhanh */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  "Chào bạn, mình muốn trao đổi về ở ghép!",
                  "Khi nào bạn dự định dọn vào?",
                  "Mở Zalo nói chuyện cho tiện nhé?"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      executeSendMessage(chip, activeConversation, currentActor, currentTarget);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-[11px] font-medium transition shrink-0 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Ô nhập tin nhắn */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Nhập tin nhắn với vai trò ${currentActor.name}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/30 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
