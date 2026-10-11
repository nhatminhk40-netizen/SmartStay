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
    isSafeBadge: false, // Dữ liệu minh họa: Không tự nhận Verified
    safe_badge: false,
    verificationStatus: 'unverified',
    fireSafetyCertified: true,
    fireSafetyDetails: 'Có bình chữa cháy và lối thoát hiểm hành lang',
    isDemo: true,
    demoNote: 'Dữ liệu minh họa SmartStay',
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
    verificationStatus: 'unverified',
    fireSafetyCertified: false,
    isDemo: true,
    demoNote: 'Dữ liệu minh họa SmartStay',
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
    isSafeBadge: false,
    safe_badge: false,
    verificationStatus: 'unverified',
    fireSafetyCertified: true,
    fireSafetyDetails: 'Cầu thang thoát hiểm ngoài trời và hệ thống báo cháy',
    has_pass: true,
    remaining_duration: 5,
    pass_months_left: 5,
    remaining_deposit: 5600000,
    is_boosted: false,
    isDemo: true,
    demoNote: 'Dữ liệu minh họa SmartStay Pass',
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
    listingType: 'standard',
    isSafeBadge: false,
    safe_badge: false,
    verificationStatus: 'unverified',
    fireSafetyCertified: false,
    isDemo: true,
    demoNote: 'Dữ liệu minh họa SmartStay',
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
            window.__SMARTSTAY_IS_FALLBACK = Boolean(json.isFallbackMode);
            window.__SMARTSTAY_API_ONLINE = true;
            return json.data.map(room => ({
              ...room,
              id: room._id || room.id,
              location: room.location || room.address || 'Cần Thơ',
              image_url: room.image_url || (room.images && room.images[0]) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
              safe_badge: Boolean(room.safe_badge || room.isSafeBadge) && !room.isDemo,
              has_pass: room.has_pass || room.listingType === 'pass' || false,
              pass_months_left: room.pass_months_left || room.remaining_duration || 0,
              area_sqm: room.area_sqm || 20,
              room_type: room.room_type || 'Phòng trọ',
              amenities: room.amenities || [],
              isDemo: Boolean(room.isDemo || json.isFallbackMode)
            }));
          }
          window.__SMARTSTAY_IS_FALLBACK = true;
          return FALLBACK_ROOMS;
        } catch (error) {
          console.warn('⚠️ Lỗi kết nối Backend API SmartStay, chuyển sang chế độ dữ liệu minh họa:', error.message);
          window.__SMARTSTAY_IS_FALLBACK = true;
          window.__SMARTSTAY_API_ONLINE = false;
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
        try {
          const res = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const json = await res.json();
          if (json.data) {
            FALLBACK_ROOMS.unshift({ ...json.data, id: json.data._id || json.data.id });
            return json.data;
          }
        } catch (e) {
          console.warn('Create room API fallback:', e);
        }
        const newR = {
          _id: `room_${Date.now()}`,
          id: `room_${Date.now()}`,
          ...data,
          createdAt: new Date()
        };
        FALLBACK_ROOMS.unshift(newR);
        return newR;
      },

      update: async (id, data) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const json = await res.json();
          if (json.data) {
            const idx = FALLBACK_ROOMS.findIndex(r => r.id === id || r._id === id);
            if (idx !== -1) FALLBACK_ROOMS[idx] = { ...FALLBACK_ROOMS[idx], ...json.data };
            return json.data;
          }
        } catch (e) {
          console.warn('Update room API fallback:', e);
        }
        const idx = FALLBACK_ROOMS.findIndex(r => r.id === id || r._id === id);
        if (idx !== -1) {
          FALLBACK_ROOMS[idx] = { ...FALLBACK_ROOMS[idx], ...data, id };
          return FALLBACK_ROOMS[idx];
        }
        return { id, ...data };
      },

      delete: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/${id}`, {
            method: 'DELETE'
          });
          const json = await res.json();
          const idx = FALLBACK_ROOMS.findIndex(r => r.id === id || r._id === id);
          if (idx !== -1) FALLBACK_ROOMS.splice(idx, 1);
          return json;
        } catch (e) {
          console.warn('Delete room API fallback:', e);
          const idx = FALLBACK_ROOMS.findIndex(r => r.id === id || r._id === id);
          if (idx !== -1) FALLBACK_ROOMS.splice(idx, 1);
          return { success: true };
        }
      },

      pass: async (data) => {
        const res = await fetch(`${API_BASE}/rooms/pass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },

      passList: async () => {
        try {
          const res = await fetch(`${API_BASE}/rooms/pass`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) return json.data;
          return FALLBACK_ROOMS.filter(r => r.listingType === 'pass' || r.has_pass);
        } catch {
          return FALLBACK_ROOMS.filter(r => r.listingType === 'pass' || r.has_pass);
        }
      },

      getPass: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/pass/${id}`);
          const json = await res.json();
          if (json.data) return json.data;
        } catch (e) {
          console.warn('getPass fallback:', e);
        }
        return FALLBACK_ROOMS.find(r => r.id === id || r._id === id);
      },

      confirmPass: async (id, status, note) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/pass/${id}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, note })
          });
          return await res.json();
        } catch (e) {
          return { success: true, message: 'Đã xác nhận (Fallback)' };
        }
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

    Roommate: {
      filter: async (query = {}, options = {}) => {
        try {
          const res = await fetch(`${API_BASE}/surveys`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map(s => ({
              id: s._id || s.id,
              name: s.name,
              gender: s.gender || 'Nam',
              age: s.age || 20,
              campus: s.campus || 'ĐH Cần Thơ',
              budget: s.budget !== undefined ? s.budget : (s.budgetRange === 'high' ? 3.2 : (s.budgetRange === 'low' ? 1.5 : 2.2)),
              hasPet: Boolean(s.hasPet),
              petPolicy: s.petPolicy || (s.hasPet ? 'pet_friendly' : 'no_pet'),
              smokingDrinking: s.smokingDrinking || 'none',
              sleepSchedule: s.sleepSchedule || 'flexible',
              habits: s.habits || `${s.sleepSchedule === 'night_owl' ? 'Thức khuya' : (s.sleepSchedule === 'early_bird' ? 'Ngủ sớm' : 'Linh hoạt')}, ${s.smokingDrinking === 'none' ? 'Không hút thuốc' : ''}, ${s.hasPet ? 'Có thú cưng' : 'Không nuôi pet'}`.replace(/^, |, $/g, ''),
              description: s.description || `Tìm bạn ở ghép cùng trường ${s.campus || 'Cần Thơ'}, văn minh, tôn trọng sinh hoạt chung.`,
              contact: s.contactZalo || '0901***567',
              rawContact: s.rawContact || s.contactZalo || ''
            }));
            return { items: mapped, count: mapped.length };
          }
        } catch (e) {
          console.warn('Roommate filter fallback:', e);
        }
        return { items: [], count: 0 };
      },
      create: async (data) => {
        try {
          const res = await fetch(`${API_BASE}/surveys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              contactZalo: data.contact || '0901234567',
              campus: data.campus || 'ĐH Cần Thơ',
              gender: data.gender || 'Nam',
              budgetRange: data.budget > 2.5 ? 'high' : (data.budget < 1.8 ? 'low' : 'medium'),
              sleepSchedule: 'flexible',
              cleanliness: 'daily',
              smokingDrinking: 'none',
              guestPolicy: 'ask_first'
            })
          });
          return await res.json();
        } catch (e) {
          return { success: true, data };
        }
      }
    },

    Transfer: {
      filter: async () => {
        try {
          const res = await fetch(`${API_BASE}/rooms/pass`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map(p => ({
              id: p._id || p.id,
              title: p.title,
              location: p.address || p.location || 'Ninh Kiều, Cần Thơ',
              price: p.price,
              deposit: p.remaining_deposit || 2000000,
              reason: p.pass_reason || 'Chuyển chỗ ở',
              contact: p.contactPhone || '0901234567',
              image: p.image_url || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'
            }));
            return { items: mapped, count: mapped.length };
          }
        } catch (e) {
          console.warn('Transfer filter fallback:', e);
        }
        return { items: [], count: 0 };
      },
      create: async (data) => {
        try {
          const res = await fetch(`${API_BASE}/rooms/pass`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.title,
              address: data.location || 'Ninh Kiều, Cần Thơ',
              campus: 'ĐH Cần Thơ',
              price: data.price,
              remaining_deposit: data.deposit,
              pass_reason: data.reason,
              contactPhone: data.contact,
              images: [data.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267']
            })
          });
          return await res.json();
        } catch (e) {
          return { success: true, data };
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
      },
      list: async () => {
        try {
          const res = await fetch(`${API_BASE}/logistics-request`);
          const data = await res.json();
          return data.data || [];
        } catch (e) {
          return [];
        }
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

  app: {
    getPublicSettings: async () => {
      return { id: 'smartstay', public_settings: { app_name: 'SmartStay Cần Thơ' } };
    }
  },

  auth: {
    getToken: () => localStorage.getItem('smartstay_token'),
    setToken: (token) => {
      if (token) localStorage.setItem('smartstay_token', token);
      else localStorage.removeItem('smartstay_token');
    },
    loginViaEmailPassword: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Email hoặc mật khẩu không chính xác.');
      }
      if (data.access_token) {
        localStorage.setItem('smartstay_token', data.access_token);
        localStorage.setItem('smartstay_user', JSON.stringify(data.user));
      }
      return data;
    },
    loginWithGoogle: async (googlePayload) => {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googlePayload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập với Google thất bại.');
      }
      if (data.access_token) {
        localStorage.setItem('smartstay_token', data.access_token);
        localStorage.setItem('smartstay_user', JSON.stringify(data.user));
      }
      return data;
    },
    loginWithProvider: (provider, returnTo) => {
      console.log(`Login via ${provider}, return to: ${returnTo}`);
    },
    resetPasswordRequest: async (email) => {
      return { success: true, message: 'Đã gửi liên kết khôi phục mật khẩu.' };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      return { success: true };
    },
    register: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: payload.fullName || payload.name || payload.email.split('@')[0],
          email: payload.email,
          password: payload.password,
          phone: payload.phone || '0901234567',
          role: payload.role || 'student'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng ký không thành công.');
      }
      if (data.access_token) {
        localStorage.setItem('smartstay_token', data.access_token);
        localStorage.setItem('smartstay_user', JSON.stringify(data.user));
      }
      return data;
    },
    me: async () => {
      const token = localStorage.getItem('smartstay_token');
      if (!token) return null;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('smartstay_user', JSON.stringify(data.user));
          return data.user;
        }
      } catch (e) {
        console.warn('Fetch me error:', e);
      }
      const saved = localStorage.getItem('smartstay_user');
      return saved ? JSON.parse(saved) : null;
    },
    logout: (redirectUrl) => {
      localStorage.removeItem('smartstay_token');
      localStorage.removeItem('smartstay_user');
      if (redirectUrl) window.location.href = redirectUrl;
      else window.location.href = '/login';
    },
    redirectToLogin: (returnTo) => {
      const target = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
      window.location.href = target;
    }
  }
};

