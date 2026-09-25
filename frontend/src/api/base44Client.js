const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FALLBACK_ROOMS = [
  {
    id: '6aad186f1f34d48876cf6301',
    _id: '6aad186f1f34d48876cf6301',
    title: 'Phòng trọ cao cấp gần ĐH FPT Cần Thơ (Gác lửng, full nội thất)',
    address: 'Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
    location: 'An Bình, Ninh Kiều',
    campus: 'FPT Can Tho',
    price: 2500000,
    area_sqm: 25,
    room_type: 'Phòng khép kín',
    description: 'Phòng trọ mới xây 100%, có gác lửng đúc kiên cố, giờ giấc tự do không chung chủ, khoá vân tay an ninh. Đi xe máy tới cổng ĐH FPT chỉ 5 phút.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    contactPhone: '0901234567',
    amenities: ['Máy lạnh', 'Gác lửng', 'Tủ lạnh', 'Máy giặt', 'Tủ quần áo', 'Cách âm'],
    electricityCostType: 'nha_nuoc',
    waterCost: 'Theo giá nhà nước',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 50000, trash: 30000, parking: 0 },
    listingType: 'safe',
    isSafeBadge: true,
    safe_badge: true,
    seeking_roommate: true,
    rating: 4.8
  },
  {
    id: '6aad186f1f34d48876cf6302',
    _id: '6aad186f1f34d48876cf6302',
    title: 'Phòng trọ sinh viên giá rẻ gần ĐH Cần Thơ - Khu 2',
    address: 'Hẻm 51 đường 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ',
    location: 'Xuân Khánh, Ninh Kiều',
    campus: 'ĐH Cần Thơ (Khu 2)',
    price: 1600000,
    area_sqm: 18,
    room_type: 'Phòng trọ khép kín',
    description: 'Phòng sạch sẽ thoáng mát, đồng hồ điện nước riêng từng phòng, wifi cáp quang tốc độ cao, có camera 24/7.',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    contactPhone: '0912345678',
    amenities: ['Máy lạnh', 'Gác lửng', 'Tủ quần áo'],
    electricityCostType: 'kinh_doanh',
    waterCost: '15.000 VNĐ/khối',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 30000, trash: 20000, parking: 0 },
    listingType: 'standard',
    isSafeBadge: false,
    safe_badge: false,
    seeking_roommate: false,
    rating: 4.5
  },
  {
    id: '6aad186f1f34d48876cf6303',
    _id: '6aad186f1f34d48876cf6303',
    title: 'SmartStay Pass: Sang nhượng phòng ban công view thoáng (còn cọc 2 tháng)',
    address: 'Đường Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ',
    location: 'An Bình, Ninh Kiều',
    campus: 'FPT Can Tho',
    price: 2800000,
    area_sqm: 28,
    room_type: 'Căn hộ mini / Studio',
    description: 'Mình cần chuyển sang làm việc ở TP.HCM nên pass lại phòng hợp đồng còn 5 tháng. Đã đóng cọc 2 tháng, để lại toàn bộ tủ lạnh và bàn học.',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
    contactPhone: '0987654321',
    amenities: ['Máy lạnh', 'Tủ lạnh', 'Máy nước nóng', 'Tủ quần áo', 'Cách âm'],
    electricityCostType: 'gia_co_dinh',
    waterCost: '100.000 VNĐ/người',
    hasSeparateMeter: true,
    depositMonths: 2,
    extraFees: { wifi: 0, trash: 0, parking: 0 },
    listingType: 'pass',
    isSafeBadge: true,
    safe_badge: true,
    has_pass: true,
    remaining_duration: 5,
    pass_months_left: 5,
    remaining_deposit: 5600000,
    is_boosted: true,
    seeking_roommate: false,
    rating: 4.7
  },
  {
    id: '6aad186f1f34d48876cf6304',
    _id: '6aad186f1f34d48876cf6304',
    title: 'Homestay sinh viên full tiện ích gần ĐH Y Dược Cần Thơ',
    address: 'Đường Nguyễn Văn Linh, An Khánh, Ninh Kiều, Cần Thơ',
    location: 'An Khánh, Ninh Kiều',
    campus: 'ĐH Y Dược Cần Thơ',
    price: 2200000,
    area_sqm: 22,
    room_type: 'Homestay sinh viên',
    description: 'Môi trường sống văn minh, yên tĩnh cho sinh viên ôn thi. Có bếp chung rộng rãi, máy giặt dùng chung miễn phí.',
    images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
    contactPhone: '0933445566',
    amenities: ['Máy lạnh', 'Máy giặt', 'Máy nước nóng', 'Tủ lạnh', 'Cách âm'],
    electricityCostType: 'nha_nuoc',
    waterCost: 'Theo giá nhà nước',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 0, trash: 20000, parking: 0 },
    listingType: 'safe',
    isSafeBadge: true,
    safe_badge: true,
    seeking_roommate: true,
    rating: 4.9
  }
];

export const base44 = {
  entities: {
    Room: {
      list: async (sort = '', limit = 50) => {
        try {
          const res = await fetch(`${API_BASE}/rooms`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
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
          return FALLBACK_ROOMS;
        } catch (error) {
          console.warn('Lỗi kết nối Backend API, tự động kích hoạt Fallback Mock Data:', error);
          return FALLBACK_ROOMS;
        }
      },

      get: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/${id}`);
          const json = await res.json();
          if (json.data) return json.data;
          return FALLBACK_ROOMS.find(r => r.id === id || r._id === id) || FALLBACK_ROOMS[0];
        } catch (error) {
          console.warn('Lỗi fetch room details, sử dụng fallback:', error);
          return FALLBACK_ROOMS.find(r => r.id === id || r._id === id) || FALLBACK_ROOMS[0];
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
          console.warn('Lỗi khi fetch reviews từ API, sử dụng fallback:', error);
          return [
            {
              id: 'rev_fb_1',
              anonymous_name: 'Đinh Trịnh Nhật Minh (FPT Can Tho)',
              content: 'Phòng sạch sẽ, đồng hồ điện nước riêng biệt, giá niêm yết rõ ràng. Chủ nhà hỗ trợ sinh viên rất nhiệt tình.',
              trust_score: 98,
              has_stayed: true,
              stayed_period: 'Đã ở 1 năm (2025 - 2026)'
            },
            {
              id: 'rev_fb_2',
              anonymous_name: 'Nguyễn Văn An (ĐH Cần Thơ)',
              content: 'Khu vực an ninh tốt, camera 24/7, wifi ổn định cho việc học online.',
              trust_score: 95,
              has_stayed: true,
              stayed_period: 'Đang ở'
            }
          ];
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
        try {
          const res = await fetch(`${API_BASE}/surveys/matches/${surveyId}`);
          const json = await res.json();
          if (json.success && json.data) return json;
          throw new Error('Fallback');
        } catch {
          return {
            success: true,
            data: [
              {
                id: 'm1',
                name: 'Nguyễn Thanh Phong',
                campus: 'ĐH FPT Cần Thơ',
                major: 'Kỹ thuật phần mềm',
                compatibilityScore: 94,
                sleepSchedule: 'Ngủ sau 23h',
                cleanliness: 'Rất sạch sẽ',
                phone: '0901 223 445'
              },
              {
                id: 'm2',
                name: 'Lê Hoàng Nam',
                campus: 'ĐH Cần Thơ (Khu 2)',
                major: 'Công nghệ thông tin',
                compatibilityScore: 88,
                sleepSchedule: 'Ngủ trước 23h',
                cleanliness: 'Gọn gàng',
                phone: '0918 334 556'
              }
            ]
          };
        }
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
