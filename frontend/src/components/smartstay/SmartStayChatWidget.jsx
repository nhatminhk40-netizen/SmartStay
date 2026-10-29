import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  User,
  Sparkles,
  ExternalLink,
  CheckCheck,
  ShieldCheck,
  Smile,
  ChevronDown
} from "lucide-react";

export default function SmartStayChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Khởi tạo và lắng nghe sự kiện mở chat từ toàn ứng dụng
  useEffect(() => {
    // Tải lịch sử chat từ localStorage nếu có
    try {
      const savedChat = localStorage.getItem("smartstay_active_chat");
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (parsed.contact && parsed.messages?.length > 0) {
          setActiveContact(parsed.contact);
          setMessages(parsed.messages);
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc lịch sử chat:", e);
    }

    const handleOpenChatEvent = (e) => {
      const { recipient, initialMessage } = e.detail || {};
      if (!recipient) return;

      const contactData = {
        id: recipient.id || recipient._id || `user_${Date.now()}`,
        name: recipient.name || "Người thuê phòng",
        campus: recipient.campus || "Cần Thơ",
        budget: recipient.budget || 2.2,
        habits: recipient.habits || "Sạch sẽ, văn minh",
        contact: recipient.rawContact || recipient.contact || ""
      };

      setActiveContact(contactData);
      setIsOpen(true);
      setIsMinimized(false);

      // Thêm tin nhắn ban đầu nếu có
      if (initialMessage) {
        const userMsg = {
          id: `msg_${Date.now()}`,
          sender: "me",
          text: initialMessage,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };

        // Tin nhắn trả lời tự động thân thiện sau 1.2s
        const autoReplyMsg = {
          id: `reply_${Date.now() + 1}`,
          sender: "them",
          text: `Chào bạn! Mình là ${contactData.name}. Mình đã nhận được tin nhắn trên SmartStay rồi nhé. Rất vui được kết nối để trao đổi thêm về việc ở ghép cùng bạn! 😊`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => {
          const next = [...prev, userMsg];
          setTimeout(() => {
            setMessages((curr) => {
              const updated = [...curr, autoReplyMsg];
              localStorage.setItem(
                "smartstay_active_chat",
                JSON.stringify({ contact: contactData, messages: updated })
              );
              return updated;
            });
            setUnreadCount((c) => c + 1);
          }, 1200);

          localStorage.setItem(
            "smartstay_active_chat",
            JSON.stringify({ contact: contactData, messages: next })
          );
          return next;
        });
      }
    };

    window.addEventListener("smartstay:open_chat", handleOpenChatEvent);
    return () => {
      window.removeEventListener("smartstay:open_chat", handleOpenChatEvent);
    };
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen, isMinimized]);

  // Gửi tin nhắn
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeContact) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: "me",
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText("");

    localStorage.setItem(
      "smartstay_active_chat",
      JSON.stringify({ contact: activeContact, messages: updated })
    );

    // Mô phỏng phản hồi tự động nếu là câu hỏi
    if (text.includes("?") || text.includes("ở đâu") || text.includes("khi nào") || text.includes("thú cưng")) {
      setTimeout(() => {
        const reply = {
          id: `reply_${Date.now()}`,
          sender: "them",
          text: `Cảm ơn bạn! Phòng mình đang xem ở khu vực gần trường, giờ giấc tự do và an ninh tốt. Chúng mình có thể hẹn gặp xem phòng trực tiếp hoặc trao đổi thêm nhé!`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((curr) => {
          const withReply = [...curr, reply];
          localStorage.setItem(
            "smartstay_active_chat",
            JSON.stringify({ contact: activeContact, messages: withReply })
          );
          return withReply;
        });
        if (isMinimized) setUnreadCount((c) => c + 1);
      }, 1500);
    }
  };

  // Mở Zalo nếu cần
  const handleOpenZaloFromChat = () => {
    if (!activeContact?.contact) return;
    const cleanPhone = activeContact.contact.replace(/[^0-9]/g, "");
    if (cleanPhone.length >= 9) {
      window.open(`https://zalo.me/${cleanPhone}`, "_blank");
    }
  };

  // Nếu chưa có liên hệ nào, chỉ hiển thị bubble mở chat mẫu
  if (!activeContact && !isOpen) {
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
            setUnreadCount(0);
          }}
          className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white/80"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">
            {activeContact ? `Chat với ${activeContact.name.split(" ").slice(-1)[0]}` : "Tin nhắn SmartStay"}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* 2. CỬA SỔ CHATBOX (FLOATING MESSENGER WINDOW) */}
      {isOpen && !isMinimized && activeContact && (
        <div className="w-[340px] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header Cửa sổ chat */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-between shadow-xs">
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
                  {activeContact.campus} • ~{activeContact.budget}tr/tháng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

          {/* Banner bảo mật an toàn */}
          <div className="px-3.5 py-1.5 bg-orange-50/90 border-b border-orange-100/80 flex items-center justify-between text-[11px] text-orange-800">
            <span className="flex items-center gap-1 font-medium truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Trò chuyện an toàn trên SmartStay
            </span>
            {activeContact.contact && (
              <button
                onClick={handleOpenZaloFromChat}
                className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 shrink-0 ml-1"
                title="Mở Zalo trực tiếp nếu muốn gọi điện hoặc gửi ảnh"
              >
                <ExternalLink className="w-3 h-3" /> Zalo
              </button>
            )}
          </div>

          {/* Khung nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
            {/* Tin nhắn thông báo kết nối ban đầu */}
            <div className="text-center my-2">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500 font-medium">
                Bạn và {activeContact.name} đã kết nối trên SmartStay
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1 text-slate-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] p-3 rounded-2xl shadow-xs leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isMe ? "text-orange-100" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Quick Chips) */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              "Phòng bạn ở khu vực nào?",
              "Khi nào bạn cần dọn vào?",
              "Bạn có nuôi thú cưng không?"
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-[11px] font-medium transition shrink-0"
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
              onChange={(e) => setInputText(e.target.value)}
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
        </div>
      )}
    </div>
  );
}
