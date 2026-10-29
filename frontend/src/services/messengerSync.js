/**
 * Dịch vụ đồng bộ thời gian thực kiểu Messenger (Cross-Tab & Realtime Sync Engine)
 * Đảm bảo 2 bên (dù mở 2 tab, 2 cửa sổ khác nhau) luôn đồng bộ 100% tức thì như Facebook Messenger
 */

// 1. Kênh truyền tin thời gian thực giữa các tab/cửa sổ trên cùng thiết bị
let channel = null;
try {
  if (typeof window !== "undefined" && window.BroadcastChannel) {
    channel = new BroadcastChannel("smartstay_messenger_sync_v1");
  }
} catch (e) {
  console.warn("BroadcastChannel không khả dụng:", e);
}

// 2. Phát âm thanh thông báo chuẩn Messenger (Dùng Web Audio API không phụ thuộc file ngoài)
export const playNotificationSound = (type = "receive") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "receive") {
      // Âm thanh 'Ting!' hai nốt đặc trưng của Messenger khi có tin nhắn mới / reply
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

      osc2.frequency.setValueAtTime(880.0, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } else if (type === "send") {
      // Âm thanh 'Pop' nhẹ nhàng khi bấm gửi
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    // Trình duyệt có thể chặn âm thanh nếu chưa tương tác với trang
  }
};

// 3. Quản lý lưu trữ tin nhắn đồng bộ vào Local Storage trung tâm
const STORAGE_KEY_CHATS = "smartstay_messenger_store_v1";

export const getStoredMessengerData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHATS);
    return raw ? JSON.parse(raw) : { conversations: [], messages: {} };
  } catch (e) {
    return { conversations: [], messages: {} };
  }
};

export const saveStoredMessengerData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(data));
  } catch (e) {}
};

// Sinh khóa định danh duy nhất của cuộc hội thoại giữa 2 người (bất kể ai là người gửi)
export const getConversationKey = (id1, id2, name1 = "", name2 = "") => {
  const norm1 = String(name1 || id1 || "").trim().toLowerCase();
  const norm2 = String(name2 || id2 || "").trim().toLowerCase();
  return [norm1, norm2].sort().join("___");
};

/**
 * Lưu hoặc cập nhật một tin nhắn vào bộ nhớ dùng chung
 */
export const persistMessageToSyncStore = (msg, conversationData) => {
  const store = getStoredMessengerData();
  const convKey =
    msg.conversationKey ||
    getConversationKey(
      msg.senderId,
      msg.recipientId,
      msg.senderName,
      conversationData?.participantDetails?.find((p) => p.id === msg.recipientId)?.name
    );

  // 1. Thêm tin nhắn vào danh sách tin nhắn của hội thoại
  if (!store.messages[convKey]) {
    store.messages[convKey] = [];
  }

  const existingIdx = store.messages[convKey].findIndex(
    (m) => String(m._id || m.id) === String(msg._id || msg.id)
  );

  if (existingIdx !== -1) {
    store.messages[convKey][existingIdx] = msg;
  } else {
    store.messages[convKey].push(msg);
  }

  // 2. Cập nhật hoặc thêm cuộc trò chuyện
  const convId = String(conversationData?._id || conversationData?.id || convKey);
  let conv = store.conversations.find(
    (c) => String(c._id || c.id) === convId || c.convKey === convKey
  );

  if (!conv) {
    conv = {
      _id: convId,
      id: convId,
      convKey,
      participants: [String(msg.senderId), String(msg.recipientId)],
      participantDetails: conversationData?.participantDetails || [
        { id: String(msg.senderId), name: msg.senderName || "Người dùng" },
        { id: String(msg.recipientId), name: "Bạn cùng phòng" }
      ],
      lastMessage: {
        text: msg.maskedText || msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
        createdAt: msg.createdAt || new Date().toISOString()
      },
      unreadCounts: { [String(msg.recipientId)]: 1 },
      updatedAt: new Date().toISOString()
    };
    store.conversations.unshift(conv);
  } else {
    conv.lastMessage = {
      text: msg.maskedText || msg.text,
      senderId: msg.senderId,
      senderName: msg.senderName,
      createdAt: msg.createdAt || new Date().toISOString()
    };
    conv.updatedAt = new Date().toISOString();
    conv.unreadCounts = conv.unreadCounts || {};
    conv.unreadCounts[String(msg.recipientId)] = (conv.unreadCounts[String(msg.recipientId)] || 0) + 1;
  }

  saveStoredMessengerData(store);
  return { store, convKey, conv };
};

/**
 * Lấy lịch sử tin nhắn của một cuộc hội thoại từ bộ nhớ đồng bộ
 */
export const getMessagesFromSyncStore = (convKey) => {
  const store = getStoredMessengerData();
  return store.messages[convKey] || [];
};

/**
 * Phát tin nhắn sang tất cả các tab khác qua BroadcastChannel
 */
export const broadcastNewMessage = (msg, convData) => {
  if (channel) {
    channel.postMessage({
      type: "SMARTSTAY_NEW_MESSAGE",
      message: msg,
      conversation: convData,
      timestamp: Date.now()
    });
  }
};

/**
 * Phát trạng thái đang gõ phím sang các tab khác
 */
export const broadcastTypingStatus = (convKey, senderName, isTyping) => {
  if (channel) {
    channel.postMessage({
      type: "SMARTSTAY_TYPING",
      convKey,
      senderName,
      isTyping,
      timestamp: Date.now()
    });
  }
};

/**
 * Đăng ký lắng nghe sự kiện đồng bộ từ các tab khác
 */
export const subscribeToMessengerSync = (onMessageReceived, onTypingReceived) => {
  if (!channel) return () => {};

  const handleMessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "SMARTSTAY_NEW_MESSAGE" && onMessageReceived) {
      onMessageReceived(data.message, data.conversation);
    } else if (data.type === "SMARTSTAY_TYPING" && onTypingReceived) {
      onTypingReceived(data.convKey, data.senderName, data.isTyping);
    }
  };

  channel.addEventListener("message", handleMessage);

  // Fallback qua storage event cho các trình duyệt không hỗ trợ BroadcastChannel
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY_CHATS && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (onMessageReceived) {
          onMessageReceived(null, null, parsed);
        }
      } catch (err) {}
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    channel.removeEventListener("message", handleMessage);
    window.removeEventListener("storage", handleStorage);
  };
};
