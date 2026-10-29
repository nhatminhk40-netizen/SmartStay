import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

let socket = null;

// Lấy hoặc tạo kết nối socket
export const getSocket = () => {
  if (!socket) {
    try {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on("connect", () => {
        // Socket kết nối thành công
      });

      socket.on("connect_error", (err) => {
        console.warn("Socket connection warning:", err.message);
      });
    } catch (e) {
      console.warn("Lỗi khởi tạo socket:", e);
    }
  }
  return socket;
};

// Chuẩn hóa số điện thoại cho đường dẫn Zalo
export const cleanPhoneNumber = (phone = "") => {
  if (!phone) return "";
  let clean = String(phone).replace(/[^0-9]/g, "");
  if (clean.startsWith("84")) {
    clean = "0" + clean.slice(2);
  }
  return clean;
};

// Mở Zalo
export const openZaloChat = (phone) => {
  const clean = cleanPhoneNumber(phone);
  if (clean && clean.length >= 9) {
    window.open(`https://zalo.me/${clean}`, "_blank");
    return true;
  }
  return false;
};

// Kiểm tra nhanh tin nhắn có chứa SĐT hay không
export const detectPhoneNumberInText = (text = "") => {
  if (!text) return null;
  const regex = /(?:(?:\+84|0)[3|5|7|8|9](?:[\s.-]?[0-9]){8})|(?:\b\d{9,11}\b)/g;
  const matches = text.match(regex);
  if (matches && matches.length > 0) {
    return cleanPhoneNumber(matches[0]);
  }
  return null;
};

// Lấy danh tính người dùng hiện tại (Hỗ trợ tài khoản đăng nhập, hồ sơ ghép phòng, hoặc khách dùng thử)
export const getCurrentChatIdentity = (authUser = null) => {
  if (authUser) {
    return {
      id: String(authUser._id || authUser.id),
      name: authUser.fullName || authUser.name || "Tôi",
      avatar: authUser.avatar || "",
      phone: authUser.phone || "",
      campus: authUser.campus || "Cần Thơ",
      role: authUser.role || "student"
    };
  }

  // Nếu đã lưu hồ sơ ghép bạn trong roommateApi
  try {
    const savedProfile = localStorage.getItem("smartstay_my_roommate_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (parsed.id || parsed._id || parsed.name) {
        return {
          id: String(parsed.id || parsed._id || `user_profile_${parsed.name}`),
          name: parsed.name || "Hồ sơ của tôi",
          avatar: parsed.avatarUrl || parsed.avatar || "",
          phone: parsed.rawContact || parsed.contact || "",
          campus: parsed.campus || "Cần Thơ",
          role: "student"
        };
      }
    }
  } catch (e) {}

  // Người dùng ẩn danh / Khách
  let guestId = localStorage.getItem("smartstay_chat_guest_id");
  let guestName = localStorage.getItem("smartstay_chat_guest_name");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    guestName = "Bạn (Khách)";
    localStorage.setItem("smartstay_chat_guest_id", guestId);
    localStorage.setItem("smartstay_chat_guest_name", guestName);
  }

  return {
    id: guestId,
    name: guestName || "Bạn",
    avatar: "",
    phone: "",
    campus: "Cần Thơ",
    role: "student"
  };
};

export const chatService = {
  /**
   * Lấy danh sách cuộc trò chuyện của một user (theo userId, name, phone)
   */
  getConversations: async (userId, name, phone) => {
    try {
      // Bảo mật chống lộ PII trên URL (OWASP ZAP CWE-598):
      // Ưu tiên dùng POST /chat/conversations/search để gửi thông tin trong Request Body
      try {
        const res = await fetch(`${API_BASE}/chat/conversations/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name, phone })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) return data.data;
        }
      } catch (_) {}

      // Fallback an toàn: Chỉ truyền userId trên query string, TUYỆT ĐỐI không đặt SĐT/tên lên URL
      const cleanParams = new URLSearchParams();
      if (userId) cleanParams.set("userId", userId);
      const res = await fetch(`${API_BASE}/chat/conversations?${cleanParams.toString()}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) {
      console.warn("Lỗi tải cuộc trò chuyện:", e);
      return [];
    }
  },

  /**
   * Tạo hoặc lấy cuộc trò chuyện giữa 2 người
   */
  getOrCreateConversation: async (participantA, participantB) => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantA, participantB })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch (e) {
      console.warn("Lỗi tạo cuộc trò chuyện:", e);
      return null;
    }
  },

  /**
   * Lấy lịch sử tin nhắn
   */
  getMessages: async (conversationId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${conversationId}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) {
      console.warn("Lỗi tải tin nhắn:", e);
      return [];
    }
  },

  /**
   * Gửi tin nhắn đến MongoDB & phát qua Socket
   */
  sendMessage: async ({ conversationId, senderId, senderName, recipientId, recipientName, text, recipientPhone, clientMsgId }) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderId,
          senderName,
          recipientId,
          recipientName,
          text,
          recipientPhone,
          clientMsgId
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("Lỗi gửi tin nhắn:", e);
      return { success: false, message: e.message };
    }
  },

  /**
   * Đánh dấu đã đọc
   */
  markAsRead: async (conversationId, userId) => {
    try {
      await fetch(`${API_BASE}/chat/messages/read/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (e) {
      console.warn("Lỗi đánh dấu đã đọc:", e);
    }
  }
};
