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
  Smile
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  chatService,
  getSocket,
  cleanPhoneNumber,
  openZaloChat,
  detectPhoneNumberInText,
  getCurrentChatIdentity
} from "@/services/chatService";

export default function SmartStayChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState("chat"); // 'chat' | 'conversations'

  // Thông tin người dùng hiện tại
  const myIdentity = getCurrentChatIdentity(user);

  // Cuộc trò chuyện & Tin nhắn
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Cảnh báo SĐT thời gian thực
  const [detectedPhoneInInput, setDetectedPhoneInInput] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Tải danh sách cuộc trò chuyện từ MongoDB
  const loadConversations = async () => {
    if (!myIdentity?.id) return;
    const list = await chatService.getConversations(myIdentity.id);
    setConversations(list);

    // Tính tổng số tin chưa đọc
    let unread = 0;
    list.forEach((c) => {
      const count = c.unreadCounts?.[myIdentity.id] || (c.unreadCounts?.get ? c.unreadCounts.get(myIdentity.id) : 0) || 0;
      unread += count;
    });
    setUnreadTotal(unread);
    return list;
  };

  useEffect(() => {
    loadConversations();
  }, [myIdentity.id]);

  // 2. Lắng nghe Socket.IO sự kiện kết nối & tin nhắn mới
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !myIdentity?.id) return;

    socket.emit("join_user", myIdentity.id);

    const handleNewMessage = (msg) => {
      // Nếu đang mở đúng cuộc trò chuyện
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
        chatService.markAsRead(activeConversation._id || activeConversation.id, myIdentity.id);
      } else {
        setUnreadTotal((count) => count + 1);
      }
      loadConversations();
    };

    const handleNotification = () => {
      loadConversations();
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:notification", handleNotification);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:notification", handleNotification);
    };
  }, [activeConversation, myIdentity.id]);

  // 3. Chuyển đổi phòng socket khi đổi cuộc trò chuyện
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConversation) return;

    const convId = activeConversation._id || activeConversation.id;
    socket.emit("join_conversation", convId);

    // Tải tin nhắn từ MongoDB
    setIsLoadingMessages(true);
    chatService
      .getMessages(convId)
      .then((data) => {
        setMessages(data);
        chatService.markAsRead(convId, myIdentity.id);
      })
      .finally(() => setIsLoadingMessages(false));

    return () => {
      socket.emit("leave_conversation", convId);
    };
  }, [activeConversation?._id, activeConversation?.id]);

  // 4. Lắng nghe sự kiện mở chat từ nút "Nhắn tin" trên toàn website (Roommates, RoomDetail, v.v.)
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

      setActiveContact(contactData);
      setIsOpen(true);
      setIsMinimized(false);
      setViewMode("chat");

      // Tạo hoặc lấy cuộc trò chuyện trên MongoDB
      const conv = await chatService.getOrCreateConversation(
        {
          id: myIdentity.id,
          name: myIdentity.name,
          avatar: myIdentity.avatar,
          phone: myIdentity.phone,
          campus: myIdentity.campus,
          role: myIdentity.role
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

      if (conv) {
        setActiveConversation(conv);

        // Gửi tin nhắn khởi tạo nếu có (không có bot tự trả lời)
        if (initialMessage && initialMessage.trim()) {
          await chatService.sendMessage({
            conversationId: conv._id || conv.id,
            senderId: myIdentity.id,
            senderName: myIdentity.name,
            recipientId: contactData.id,
            text: initialMessage.trim(),
            recipientPhone: contactData.phone
          });

          // Tải lại tin nhắn từ MongoDB
          const updated = await chatService.getMessages(conv._id || conv.id);
          setMessages(updated);
          loadConversations();
        }
      }
    };

    window.addEventListener("smartstay:open_chat", handleOpenChatEvent);
    return () => {
      window.removeEventListener("smartstay:open_chat", handleOpenChatEvent);
    };
  }, [myIdentity]);

  // 5. Tự động cuộn xuống đáy tin nhắn
  useEffect(() => {
    if (isOpen && !isMinimized && viewMode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, viewMode]);

  // 6. Kiểm tra phát hiện SĐT khi đang nhập tin nhắn
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    const phone = detectPhoneNumberInText(val);
    setDetectedPhoneInInput(phone);
  };

  // 7. Gửi tin nhắn (Persist vào MongoDB, Kiểm duyệt SĐT & Chuyển tiếp Zalo)
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConversation || !activeContact) return;

    setInputText("");
    setDetectedPhoneInInput(null);

    const convId = activeConversation._id || activeConversation.id;

    // Gửi tin nhắn lên MongoDB qua Backend
    const res = await chatService.sendMessage({
      conversationId: convId,
      senderId: myIdentity.id,
      senderName: myIdentity.name,
      recipientId: activeContact.id,
      text,
      recipientPhone: activeContact.phone
    });

    if (res?.success && res.data) {
      setMessages((prev) => [...prev, res.data]);
      loadConversations();
    }
  };

  // Mở Zalo trực tiếp
  const handleOpenZalo = (phone) => {
    const targetPhone = phone || activeContact?.phone || detectedPhoneInInput;
    if (targetPhone) {
      openZaloChat(targetPhone);
    } else {
      window.open("https://zalo.me", "_blank");
    }
  };

  // Chọn cuộc trò chuyện từ danh sách hộp thư
  const handleSelectConversation = (conv) => {
    const otherParticipant = conv.participantDetails?.find((p) => String(p.id) !== String(myIdentity.id)) || {
      id: conv.participants.find((id) => String(id) !== String(myIdentity.id)) || "user_other",
      name: "Người dùng SmartStay",
      phone: "",
      campus: "Cần Thơ"
    };

    setActiveContact(otherParticipant);
    setActiveConversation(conv);
    setViewMode("chat");
  };

  // Nếu chưa có liên hệ và chưa mở, không cần hiển thị gì ngoài bubble
  if (!activeContact && !isOpen && conversations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {/* 1. NÚT TRÒN THU NHỎ / FLOATING CHAT BUBBLE */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
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
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center animate-bounce shadow-sm">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">
            {activeContact
              ? `Chat với ${activeContact.name.split(" ").slice(-1)[0]}`
              : `Tin nhắn SmartStay ${conversations.length > 0 ? `(${conversations.length})` : ""}`}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* 2. CỬA SỔ CHATBOX P2P GIỮA HAI NGƯỜI */}
      {isOpen && !isMinimized && (
        <div className="w-[340px] sm:w-[380px] h-[530px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
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

              {viewMode === "chat" && activeContact ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-sm border border-white/30">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate leading-tight">
                      {activeContact.name}
                    </h4>
                    <p className="text-[11px] text-orange-100 truncate">
                      {activeContact.campus} {activeContact.budget ? `• ~${activeContact.budget}tr` : ""}
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
              {/* Nút mở Zalo trực tiếp trong header */}
              {viewMode === "chat" && (activeContact?.phone || activeContact?.contact) && (
                <button
                  onClick={() => handleOpenZalo(activeContact.phone || activeContact.contact)}
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

          {/* VIEW 1: DANH SÁCH CUỘC TRÒ CHUYỆN (INBOX) */}
          {viewMode === "conversations" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              <div className="px-2 py-1 text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>Cuộc trò chuyện giữa bạn và người dùng</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  MongoDB Cloud
                </span>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Chưa có cuộc trò chuyện nào. Bấm "Nhắn tin" ở mục Tìm bạn ở ghép để kết nối!
                </div>
              ) : (
                conversations.map((c) => {
                  const other = c.participantDetails?.find((p) => String(p.id) !== String(myIdentity.id)) || {
                    name: "Người dùng SmartStay",
                    campus: "Cần Thơ"
                  };
                  const unread = c.unreadCounts?.[myIdentity.id] || 0;

                  return (
                    <div
                      key={c._id || c.id}
                      onClick={() => handleSelectConversation(c)}
                      className="p-3 bg-white hover:bg-orange-50/50 rounded-2xl border border-slate-200/80 shadow-2xs cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <User className="w-5 h-5" />
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
          {viewMode === "chat" && activeContact && (
            <>
              {/* Banner Bảo mật & Chuyển tiếp Zalo */}
              <div className="px-3.5 py-1.5 bg-orange-50/90 border-b border-orange-100 flex items-center justify-between text-[11px] text-orange-800">
                <span className="flex items-center gap-1 font-medium truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Trò chuyện P2P an toàn giữa 2 bạn
                </span>
                <button
                  onClick={() => handleOpenZalo(activeContact.phone || activeContact.contact)}
                  className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer"
                  title="Nhắn tin riêng tư hoặc trao đổi SĐT qua Zalo"
                >
                  <ExternalLink className="w-3 h-3" /> Mở Zalo
                </button>
              </div>

              {/* Khung nội dung tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
                {/* Thông báo kết nối ban đầu */}
                <div className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500 font-medium border border-slate-200/60">
                    🔒 Hai bạn đang trò chuyện trực tiếp (Dữ liệu lưu MongoDB)
                  </span>
                </div>

                {isLoadingMessages && messages.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">Đang tải tin nhắn...</div>
                )}

                {messages.map((msg) => {
                  const isMe = String(msg.senderId) === String(myIdentity.id);
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
                                  msg.detectedPhone || activeContact?.phone || activeContact?.contact
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

                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isMe ? "text-orange-100" : "text-slate-400"
                          }`}
                        >
                          {displayTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                    onClick={() => handleSendMessage(chip)}
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
                  placeholder="Nhập tin nhắn..."
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
