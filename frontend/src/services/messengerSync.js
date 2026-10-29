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
const STORAGE_KEY_PING = "smartstay_messenger_ping";

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
 * Kiểm tra xem người nhận (recipient) đã gửi tin nhắn phản hồi trong cuộc trò chuyện hay chưa
 * Giúp khóa nút Zalo cho đến khi đối phương thực sự phản hồi trong SmartStay
 */
export const checkHasRecipientReplied = (myId, myName, recipientId, recipientName) => {
  if (!recipientId && !recipientName) return false;
  const convKey = getConversationKey(myId, recipientId, myName, recipientName);
  const messages = getMessagesFromSyncStore(convKey);
  if (!Array.isArray(messages) || messages.length === 0) return false;

  const myIdStr = String(myId || "");
  const myNameStr = String(myName || "").trim().toLowerCase();
  const recipIdStr = String(recipientId || "");
  const recipNameStr = String(recipientName || "").trim().toLowerCase();

  return messages.some((m) => {
    const sId = String(m.senderId || "");
    const sName = String(m.senderName || "").trim().toLowerCase();

    const isFromRecipient =
      (recipIdStr && sId === recipIdStr) ||
      (recipNameStr && sName === recipNameStr);

    const isNotMine =
      (!myIdStr || sId !== myIdStr) &&
      (!myNameStr || sName !== myNameStr);

    return isFromRecipient || isNotMine;
  });
};

/**
 * Kiểm tra xem 2 tin nhắn có phải là cùng một tin hay không
 * Nhận diện chính xác trường hợp:
 * - Cùng ID
 * - Cùng clientMsgId
 * - Hoặc một bên là mã tạm Optimistic UI (msg_...) và một bên là bản tin chính thức từ MongoDB
 */
export const isSameMessage = (msgA, msgB) => {
  if (!msgA || !msgB) return false;

  const idA = String(msgA._id || msgA.id || "");
  const idB = String(msgB._id || msgB.id || "");
  if (idA && idB && idA === idB) return true;

  // So khớp clientMsgId
  const clientA = msgA.clientMsgId || (idA.startsWith("msg_") ? idA : "");
  const clientB = msgB.clientMsgId || (idB.startsWith("msg_") ? idB : "");
  if (clientA && clientB && clientA === clientB) return true;
  if (clientA && (clientA === idB || clientA === msgB.clientMsgId)) return true;
  if (clientB && (clientB === idA || clientB === msgA.clientMsgId)) return true;

  // So khớp nội dung và người gửi
  const textA = (msgA.text || "").trim();
  const textB = (msgB.text || "").trim();
  if (!textA || textA !== textB) return false;

  const senderA = (msgA.senderName || msgA.senderId || "").trim().toLowerCase();
  const senderB = (msgB.senderName || msgB.senderId || "").trim().toLowerCase();
  if (senderA && senderB && senderA !== senderB) return false;

  // Kiểm tra thời gian gửi
  const tA = msgA.createdAt ? new Date(msgA.createdAt).getTime() : 0;
  const tB = msgB.createdAt ? new Date(msgB.createdAt).getTime() : 0;
  if (!tA || !tB) return true;

  const diff = Math.abs(tA - tB);

  // Nếu một trong hai là mã tạm client và bên kia là server: trong vòng 30s coi là cùng 1 tin
  const oneIsTemp = idA.startsWith("msg_") || idB.startsWith("msg_") || Boolean(clientA) || Boolean(clientB);
  if (oneIsTemp && diff < 30000) return true;

  // Nếu cả hai cùng nội dung, cùng người gửi trong vòng 4s: loại bỏ trùng lặp (tránh double-click / sync đúp)
  if (diff < 4000) return true;

  return false;
};

/**
 * Thuật toán loại bỏ tin nhắn trùng lặp tuyệt đối (Deduplication)
 * Ngăn chặn hiện tượng lặp tin do độ lệch ID giữa bộ nhớ đệm Optimistic và Máy chủ
 */
export const deduplicateMessages = (msgList = []) => {
  if (!Array.isArray(msgList) || msgList.length === 0) return [];

  const result = [];
  for (const msg of msgList) {
    if (!msg) continue;
    const existingIdx = result.findIndex((existing) => isSameMessage(existing, msg));
    if (existingIdx === -1) {
      result.push(msg);
    } else {
      // Đã có tin nhắn này: Ưu tiên giữ lại bản tin từ Server (có _id chính thức từ MongoDB)
      const existing = result[existingIdx];
      const existingIsTemp = String(existing._id || "").startsWith("msg_");
      const currentIsServer = !String(msg._id || "").startsWith("msg_");

      if (existingIsTemp && currentIsServer) {
        result[existingIdx] = { ...existing, ...msg };
      } else {
        result[existingIdx] = { ...msg, ...existing };
      }
    }
  }

  return result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

/**
 * Lưu hoặc cập nhật một tin nhắn vào bộ nhớ dùng chung (có chống trùng lặp)
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

  if (!store.messages[convKey]) {
    store.messages[convKey] = [];
  }

  // Khử trùng lặp thông minh: So khớp bằng isSameMessage
  const existingIdx = store.messages[convKey].findIndex((m) => isSameMessage(m, msg));

  if (existingIdx !== -1) {
    const existing = store.messages[convKey][existingIdx];
    const existingIsTemp = String(existing._id || "").startsWith("msg_");
    const incomingIsServer = !String(msg._id || "").startsWith("msg_");
    if (existingIsTemp && incomingIsServer) {
      store.messages[convKey][existingIdx] = { ...existing, ...msg };
    } else {
      store.messages[convKey][existingIdx] = { ...msg, ...existing };
    }
  } else {
    store.messages[convKey].push(msg);
  }

  // Đảm bảo toàn bộ danh sách được loại bỏ trùng lặp triệt để
  store.messages[convKey] = deduplicateMessages(store.messages[convKey]);

  // Cập nhật hoặc thêm cuộc trò chuyện
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

  // Kích hoạt sự kiện storage liên tục giữa các tab
  try {
    localStorage.setItem(
      STORAGE_KEY_PING,
      JSON.stringify({
        convKey,
        msgId: msg._id || msg.id,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: Date.now()
      })
    );
  } catch (e) {}

  return { store, convKey, conv };
};

/**
 * Lấy lịch sử tin nhắn của một cuộc hội thoại từ bộ nhớ đồng bộ (đã lọc trùng)
 */
export const getMessagesFromSyncStore = (convKey) => {
  const store = getStoredMessengerData();
  const list = store.messages[convKey] || [];
  return deduplicateMessages(list);
};

/**
 * Phát tin nhắn sang tất cả các tab khác qua BroadcastChannel
 */
export const broadcastNewMessage = (msg, convData) => {
  if (channel) {
    try {
      channel.postMessage({
        type: "SMARTSTAY_NEW_MESSAGE",
        message: msg,
        conversation: convData,
        timestamp: Date.now()
      });
    } catch (e) {}
  }
};

/**
 * Phát trạng thái đang gõ phím sang các tab khác
 */
export const broadcastTypingStatus = (convKey, senderName, isTyping) => {
  if (channel) {
    try {
      channel.postMessage({
        type: "SMARTSTAY_TYPING",
        convKey,
        senderName,
        isTyping,
        timestamp: Date.now()
      });
    } catch (e) {}
  }
};

/**
 * Đăng ký lắng nghe sự kiện đồng bộ từ các tab khác
 */
export const subscribeToMessengerSync = (onMessageReceived, onTypingReceived) => {
  const processedKeys = new Set();
  const safeNotify = (msg, conv) => {
    if (!msg || !onMessageReceived) return;
    const key = `${msg._id || msg.id || ''}_${msg.senderName}_${msg.text}`;
    if (processedKeys.has(key)) return;
    processedKeys.add(key);
    if (processedKeys.size > 200) {
      const first = processedKeys.values().next().value;
      processedKeys.delete(first);
    }
    onMessageReceived(msg, conv);
  };

  const handleMessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "SMARTSTAY_NEW_MESSAGE" && onMessageReceived) {
      safeNotify(data.message, data.conversation);
    } else if (data.type === "SMARTSTAY_TYPING" && onTypingReceived) {
      onTypingReceived(data.convKey, data.senderName, data.isTyping);
    }
  };

  if (channel) {
    channel.addEventListener("message", handleMessage);
    channel.onmessage = handleMessage;
  }

  // Lắng nghe sự kiện storage để đồng bộ tức thì xuyên suốt mọi cửa sổ
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY_PING && e.newValue) {
      try {
        const ping = JSON.parse(e.newValue);
        if (onMessageReceived && ping.convKey) {
          const msgs = getMessagesFromSyncStore(ping.convKey);
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg) {
            safeNotify(lastMsg, null);
          }
        }
      } catch (err) {}
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener("message", handleMessage);
    }
    window.removeEventListener("storage", handleStorage);
  };
};
