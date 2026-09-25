const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const base44 = {
  entities: {
    Room: {
      list: async (sort = '', limit = 50) => {
        try {
          const res = await fetch(`${API_BASE}/rooms`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data.map(room => ({
              ...room,
              id: room._id || room.id,
              location: room.location || room.address || 'Cần Thơ',
              image_url: room.image_url || (room.images && room.images[0]) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
              safe_badge: room.safe_badge || room.isSafeBadge || false,
              has_pass: room.has_pass || room.listingType === 'pass' || false,
              pass_months_left: room.pass_months_left || room.remaining_duration || 0,
              area_sqm: room.area_sqm || 20,
              room_type: room.room_type || 'Phòng trọ',
              amenities: room.amenities || []
            }));
          }
          return [];
        } catch (error) {
          console.warn('Lỗi khi fetch rooms từ API backend:', error);
          return [];
        }
      },

      get: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/${id}`);
          const json = await res.json();
          return json.data || null;
        } catch (error) {
          console.warn('Lỗi khi fetch room details:', error);
          return null;
        }
      },

      create: async (data) => {
        const res = await fetch(`${API_BASE}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },

      update: async (id, data) => {
        // Tùy chọn cập nhật badge hoặc boosted
        if (data.safe_badge) {
          await fetch(`${API_BASE}/safe-listing/payment-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: id, status: 'SUCCESS' })
          }).catch(() => {});
        }
        return { id, ...data };
      },

      pass: async (data) => {
        const res = await fetch(`${API_BASE}/rooms/pass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      }
    },

    Review: {
      filter: async ({ room_id }) => {
        try {
          const res = await fetch(`${API_BASE}/reviews/room/${room_id}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data.map(rev => ({
              ...rev,
              id: rev._id || rev.id,
              anonymous_name: rev.anonymous_name || rev.studentName || 'Sinh viên ẩn danh',
              content: rev.content || rev.comment || '',
              trust_score: rev.trust_score || (rev.isCostAccurate ? 95 : 60),
              has_stayed: rev.has_stayed !== undefined ? rev.has_stayed : true,
              stayed_period: rev.stayed_period || 'Đã ở tại đây'
            }));
          }
          return [];
        } catch (error) {
          console.warn('Lỗi khi fetch reviews từ API:', error);
          return [];
        }
      },

      create: async (data) => {
        const res = await fetch(`${API_BASE}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      }
    },

    Survey: {
      create: async (data) => {
        const res = await fetch(`${API_BASE}/surveys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },

      matches: async (surveyId) => {
        const res = await fetch(`${API_BASE}/surveys/matches/${surveyId}`);
        return res.json();
      }
    },

    Logistics: {
      create: async (data) => {
        const res = await fetch(`${API_BASE}/logistics-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      }
    }
  },

  safeListing: {
    sendOtp: async (phone) => {
      const res = await fetch(`${API_BASE}/safe-listing/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return res.json();
    },

    verifyOtp: async (phone, otp) => {
      const res = await fetch(`${API_BASE}/safe-listing/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      return res.json();
    },

    createPayment: async ({ roomId, amount, provider }) => {
      const res = await fetch(`${API_BASE}/safe-listing/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, amount, provider })
      });
      return res.json();
    },

    confirmPayment: async ({ roomId, transactionId }) => {
      const res = await fetch(`${API_BASE}/safe-listing/payment-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, transactionId, status: 'SUCCESS' })
      });
      return res.json();
    }
  },

  auth: {
    loginViaEmailPassword: async (email, password) => {
      console.log('Login via email/password:', email);
      return { access_token: 'mock-token', user: { email, name: email.split('@')[0] } };
    },
    loginWithProvider: (provider, returnTo) => {
      console.log(`Login via ${provider}, return to: ${returnTo}`);
    },
    resetPasswordRequest: async (email) => {
      console.log('Reset password request for:', email);
      return { success: true };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      console.log('Resetting password');
      return { success: true };
    },
    register: async ({ email, password }) => {
      console.log('Registering user:', email);
      return { success: true };
    },
    verifyOtp: async ({ email, otpCode }) => {
      console.log('Verifying OTP:', otpCode);
      return { access_token: 'mock-token' };
    },
    resendOtp: async (email) => {
      console.log('Resending OTP to:', email);
      return { success: true };
    },
    setToken: (token) => {
      console.log('Token set:', token);
    }
  }
};
