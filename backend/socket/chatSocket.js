/**
 * Module quản lý kết nối Socket.IO thời gian thực cho tính năng Chat
 */

function setupChatSocket(io) {
    if (!io) return;

    io.on('connection', (socket) => {
        // 1. Người dùng đăng ký nhận thông báo cá nhân
        socket.on('join_user', (userId) => {
            if (userId) {
                const room = `user_${userId}`;
                socket.join(room);
            }
        });

        // 2. Tham gia phòng chat của cuộc trò chuyện cụ thể
        socket.on('join_conversation', (conversationId) => {
            if (conversationId) {
                const room = `conv_${conversationId}`;
                socket.join(room);
            }
        });

        // 3. Rời khỏi phòng chat
        socket.on('leave_conversation', (conversationId) => {
            if (conversationId) {
                const room = `conv_${conversationId}`;
                socket.leave(room);
            }
        });

        // 4. Trạng thái đang gõ phím (Typing Indicator)
        socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
            if (conversationId) {
                socket.to(`conv_${conversationId}`).emit('typing', {
                    userId,
                    userName,
                    isTyping
                });
            }
        });

        socket.on('disconnect', () => {
            // Socket ngắt kết nối tự nhiên
        });
    });
}

module.exports = { setupChatSocket };

