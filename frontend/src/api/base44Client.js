const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FALLBACK_ROOMS = [
  {
    id: 'room_1792911200000',
    _id: 'room_1792911200000',
    title: 'Phòng Trọ Thanh Sơn',
    campus: 'ĐH FPT Cần Thơ',
    address: '256c đường Vườn Mận phường Long Tuyền CT',
    location: 'Ninh Kiều, Cần Thơ',
    price: 2200000,
    area_sqm: 25,
    room_type: 'Phòng trọ khép kín',
    contactPhone: '0907297338',
    description: 'Dãy trọ Thanh Sơn thoáng mát, an ninh, giờ giấc tự do.',
    images: [
      'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
      'https://lh3.googleusercontent.com/d/16e67ubyEHyRX12-_SDcYFs7jLth3fpFA',
      'https://lh3.googleusercontent.com/d/17_Y20bngboPHi57eMkUcDm7xtkKlLKwv',
      'https://lh3.googleusercontent.com/d/1XHvuCrepg6y90WixkwEYIXiGm0_k26NY'
    ],
    image_url: 'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
    amenities: ['Máy lạnh', 'Gác lửng'],
    electricityCostType: 'kinh_doanh',
    waterCost: '10.000 khối',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 0, trash: 0, parking: 0 },
    listingType: 'standard',
    isSafeBadge: false,
    safe_badge: false,
    verificationStatus: 'unverified',
    approvalStatus: 'approved',
    fireSafetyCertified: true,
    isDemo: false,
    isSurveyed: false,
    is_surveyed: false,
    seeking_roommate: false,
    rating: 4.8
  },
  {
    id: 'room_1792910996318',
    _id: 'room_1792910996318',
    title: 'Phòng Trọ Lê khải',
    property_name: 'Nhà trọ Lê Khải',
    room_number: 'P.101',
    campus: 'ĐH FPT Cần Thơ',
    address: 'Khu vực gần ĐH FPT Cần Thơ, Cần Thơ',
    location: 'Ninh Kiều, Cần Thơ',
    price: 1800000,
    price_min: 1800000,
    price_max: 2400000,
    total_rooms: 8,
    available_rooms: 3,
    area_sqm: 25,
    room_type: 'Phòng trọ khép kín',
    contactPhone: '0907297338',
    description: 'Dãy trọ Lê Khải an ninh, giờ giấc tự do, có camera 24/7. Các phòng đều có gác lửng đúc kiên cố, ban công thoáng mát.',
    images: [
      'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
      'https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6',
      'https://lh3.googleusercontent.com/d/1lZdIaZ0_em938DJ4hTinFEcMWO_Hl-Kb',
      'https://lh3.googleusercontent.com/d/1NfaJ421eRJuQYPRKjpp_VK2DdTTGWcmO'
    ],
    rooms_list: [
      { room_number: 'P.101', price: 1800000, area_sqm: 25, status: 'available', amenities: ['Gác lửng'] },
      { room_number: 'P.102', price: 1800000, area_sqm: 25, status: 'available', amenities: ['Gác lửng'] },
      { room_number: 'P.103', price: 2000000, area_sqm: 28, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh'], tenant: { name: 'Trần Văn Nam', phone: '0939 123 456' } },
      { room_number: 'P.104', price: 2000000, area_sqm: 28, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh'], tenant: { name: 'Lê Thị Thu', phone: '0948 222 333' } },
      { room_number: 'P.201', price: 2400000, area_sqm: 30, status: 'available', amenities: ['Gác lửng', 'Máy lạnh', 'Ban công'] },
      { room_number: 'P.202', price: 2400000, area_sqm: 30, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh', 'Ban công'], tenant: { name: 'Nguyễn Hoàng', phone: '0918 777 888' } }
    ],
    image_url: 'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
    amenities: ['Gác lửng', 'Máy lạnh', 'Camera 24/7'],
    electricityCostType: 'kinh_doanh',
    waterCost: '15.000 khối',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 0, trash: 0, parking: 0 },
    listingType: 'standard',
    isSafeBadge: false,
    safe_badge: false,
    verificationStatus: 'unverified',
    approvalStatus: 'approved',
    fireSafetyCertified: true,
    isDemo: false,
    isSurveyed: false,
    is_surveyed: false,
    seeking_roommate: false,
    rating: 4.8
  },
  {
    id: 'room_1792909860402',
    _id: 'room_1792909860402',
    title: 'Phòng Trọ Thanh Sơn',
    campus: 'ĐH FPT Cần Thơ',
    address: '256c đường Vườn Mận phường Long Tuyền CT',
    location: 'Ninh Kiều, Cần Thơ',
    price: 2400000,
    area_sqm: 30,
    room_type: 'Phòng trọ khép kín',
    contactPhone: '0907297338',
    description: 'Có ban công thuận tiện cho việc phơi đồ',
    images: [
      'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
      'https://lh3.googleusercontent.com/d/1IEQ9ITgnXtrZ2jcrJm39k--NLqpReCNs',
      'https://lh3.googleusercontent.com/d/1xt1PXWYvhhjLN3oFLEmMYgaTXVl-geHq',
      'https://lh3.googleusercontent.com/d/1wINldbqxIIdVPfRMkv4NeYM6lNnZN93t'
    ],
    image_url: 'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
    amenities: ['Máy lạnh', 'Gác lửng'],
    electricityCostType: 'kinh_doanh',
    waterCost: '10.000 khối',
    hasSeparateMeter: true,
    depositMonths: 1,
    extraFees: { wifi: 0, trash: 0, parking: 0 },
    listingType: 'standard',
    isSafeBadge: false,
    safe_badge: false,
    verificationStatus: 'unverified',
    approvalStatus: 'approved',
    fireSafetyCertified: true,
    isDemo: false,
    isSurveyed: false,
    is_surveyed: false,
    seeking_roommate: false,
    rating: 4.8
  },
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
    title: 'Phòng trọ tiện nghi giá tốt gần ĐH Cần Thơ - Khu 2',
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
    title: 'Căn hộ mini / Studio full tiện ích gần ĐH Y Dược Cần Thơ',
    address: 'Đường Nguyễn Văn Linh, An Khánh, Ninh Kiều, Cần Thơ',
    location: 'An Khánh, Ninh Kiều',
    campus: 'ĐH Y Dược Cần Thơ',
    price: 2200000,
    area_sqm: 22,
    room_type: 'Căn hộ mini / Studio',
    description: 'Môi trường sống văn minh, an ninh và yên tĩnh cho người thuê. Có bếp chung rộng rãi, máy giặt dùng chung miễn phí.',
    images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
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

const loadClientRooms = () => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smartstay_client_rooms') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return FALLBACK_ROOMS;
};

const saveClientRooms = (rooms) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartstay_client_rooms', JSON.stringify(rooms));
    }
  } catch (e) {}
};

// BẢO VỆ DỮ LIỆU CÁ NHÂN (OWASP ZAP - Information Disclosure in localStorage):
// Loại bỏ triệt để các trường nhạy cảm cao: CCCD/CMND (citizenId, idCard), giấy tờ sở hữu nhà đất (landlordDocuments), hồ sơ bằng lái xe (transporterProfile), passwordHash...
const sanitizeUserForStorage = (user) => {
  if (!user || typeof user !== 'object') return null;
  return {
    id: user.id || user._id,
    _id: user._id || user.id,
    fullName: user.fullName || user.name || '',
    email: user.email || '',
    role: user.role || 'student',
    avatar: user.avatar || '',
    phone: user.phone || '',
    campus: user.campus || '',
    isEmailVerified: Boolean(user.isEmailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    verificationStatus: user.verificationStatus || 'APPROVED'
  };
};

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
                safe_badge: Boolean(room.safe_badge || room.isSafeBadge),
                isSafeBadge: Boolean(room.safe_badge || room.isSafeBadge),
                has_pass: room.has_pass || room.listingType === 'pass' || false,
                pass_months_left: room.pass_months_left || room.remaining_duration || 0,
                area_sqm: room.area_sqm || 20,
                room_type: room.room_type || 'Phòng trọ',
                amenities: room.amenities || [],
                electricityCostType: room.electricityCostType || 'nha_nuoc',
                waterCost: room.waterCost || 'Theo giá nhà nước',
                hasSeparateMeter: room.hasSeparateMeter !== undefined ? Boolean(room.hasSeparateMeter) : true,
                depositMonths: room.depositMonths !== undefined ? Number(room.depositMonths) : 1,
                extraFees: room.extraFees || { wifi: 0, trash: 0, parking: 0 },
                isDemo: room.isDemo === false || room.isSurveyed === true ? false : Boolean(room.isDemo)
              }));
            }
            window.__SMARTSTAY_IS_FALLBACK = true;
            return loadClientRooms();
          } catch (error) {
            console.warn('⚠️ Lỗi kết nối Backend API SmartStay, chuyển sang chế độ dữ liệu minh họa:', error.message);
            window.__SMARTSTAY_IS_FALLBACK = true;
            window.__SMARTSTAY_API_ONLINE = false;
            return loadClientRooms();
          }
        },

        get: async (id) => {
          try {
            const res = await fetch(`${API_BASE}/rooms/${id}`);
            const json = await res.json();
            if (json.data) return json.data;
            const currentList = loadClientRooms();
            return currentList.find(r => r.id === id || r._id === id) || currentList[0];
          } catch (error) {
            console.warn('Lỗi fetch room details, sử dụng fallback:', error);
            const currentList = loadClientRooms();
            return currentList.find(r => r.id === id || r._id === id) || currentList[0];
          }
        },

        create: async (data) => {
          try {
            const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/rooms`, {
              method: 'POST',
              headers,
              body: JSON.stringify(data)
            });
            const json = await res.json();
            if (res.ok && json.data) {
              const saved = { ...json.data, id: json.data._id || json.data.id };
              FALLBACK_ROOMS.unshift(saved);
              const cur = loadClientRooms();
              cur.unshift(saved);
              saveClientRooms(cur);
              return saved;
            }
            if (!res.ok) {
              console.error('Server error creating room:', json);
              throw new Error(json.message || json.error || `Lỗi máy chủ (${res.status})`);
            }
          } catch (e) {
            console.warn('Create room API error / fallback:', e);
            const isNetworkError = e.name === 'TypeError' || (typeof navigator !== 'undefined' && !navigator.onLine);
            if (!isNetworkError) {
              throw e;
            }
          }
          const newR = {
            _id: `room_${Date.now()}`,
            id: `room_${Date.now()}`,
            ...data,
            createdAt: new Date()
          };
          const currentRooms = loadClientRooms();
          currentRooms.unshift(newR);
          saveClientRooms(currentRooms);
          FALLBACK_ROOMS.unshift(newR);
          return newR;
        },

      update: async (id, data) => {
        try {
          const token = localStorage.getItem('smartstay_token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/rooms/${id}`, {
            method: 'PUT',
            headers,
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
          const token = localStorage.getItem('smartstay_token');
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/rooms/${id}`, {
            method: 'DELETE',
            headers
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
        const token = localStorage.getItem('smartstay_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/rooms/pass`, {
          method: 'POST',
          headers,
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
      },

      myRooms: async () => {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        if (!token) return { count: 0, stats: {}, data: [] };
        try {
          const res = await fetch(`${API_BASE}/rooms/my-rooms`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          return json;
        } catch {
          return { count: 0, stats: {}, data: [] };
        }
      },

      landlordStats: async () => {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        if (!token) return { stats: {} };
        try {
          const res = await fetch(`${API_BASE}/rooms/landlord/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return await res.json();
        } catch {
          return { stats: {} };
        }
      },

      updateAvailability: async (id, status) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/rooms/${id}/availability`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        return res.json();
      },

      adminList: async (params = {}) => {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.q) query.set('q', params.q);
        try {
          const res = await fetch(`${API_BASE}/admin/rooms?${query.toString()}`, { headers });
          const json = await res.json();
          return json.data || [];
        } catch {
          return [];
        }
      },

      updateApproval: async (id, status, rejectionReason = '') => {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/admin/rooms/${id}/approval`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status, rejectionReason })
        });
        return await res.json();
      }
    },

    PassRoom: {
      list: async (params = {}) => {
        try {
          const query = new URLSearchParams();
          if (params.q) query.set('q', params.q);
          if (params.campus && params.campus !== 'Tất cả') query.set('campus', params.campus);
          if (params.minPrice) query.set('minPrice', params.minPrice);
          if (params.maxPrice) query.set('maxPrice', params.maxPrice);
          if (params.minMonths) query.set('minMonths', params.minMonths);
          if (params.maxMonths) query.set('maxMonths', params.maxMonths);
          if (params.verifiedOnly) query.set('verifiedOnly', 'true');
          if (params.flexibleMoveIn) query.set('flexibleMoveIn', 'true');
          if (params.sort) query.set('sort', params.sort);
          if (params.page) query.set('page', params.page);
          if (params.limit) query.set('limit', params.limit);

          const res = await fetch(`${API_BASE}/pass-rooms?${query.toString()}`);
          const json = await res.json();
          if (json.success && json.data) return json;
          return { success: false, data: [] };
        } catch (e) {
          console.warn('PassRoom.list error:', e);
          return { success: false, data: [] };
        }
      },

      get: async (id) => {
        try {
          const token = localStorage.getItem('smartstay_token');
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`${API_BASE}/pass-rooms/${id}`, { headers });
          const json = await res.json();
          if (json.success && json.data) return json.data;
          throw new Error(json.message || 'Không tìm thấy phòng pass');
        } catch (e) {
          console.warn('PassRoom.get fallback:', e);
          const localList = JSON.parse(localStorage.getItem('pass_rooms') || '[]');
          return localList.find(r => r.id === id || r._id === id) || null;
        }
      },

      create: async (payload) => {
        const token = localStorage.getItem('smartstay_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let body = payload;
        // Nếu payload là FormData thì không set Content-Type để browser tự định nghĩa boundary
        if (!(payload instanceof FormData)) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(payload);
        }

        const res = await fetch(`${API_BASE}/pass-rooms`, {
          method: 'POST',
          headers,
          body
        });
        return await res.json();
      },
      adminList: async () => {
        try {
          const token = localStorage.getItem('smartstay_token');
          const res = await fetch(`${API_BASE}/pass-rooms/admin/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success && json.data) return json.data;
          return [];
        } catch (e) {
          console.warn('PassRoom.adminList error:', e);
          return [];
        }
      },

      adminReview: async (id, action, note = '') => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/admin-review`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action, note })
        });
        return await res.json();
      },


      update: async (id, payload) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        return await res.json();
      },

      delete: async (id) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return await res.json();
      },

      myListings: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, data: [] };
        try {
          const res = await fetch(`${API_BASE}/pass-rooms/my/listings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return await res.json();
        } catch (e) {
          console.warn('PassRoom.myListings error:', e);
          return { success: false, data: [] };
        }
      },

      generateLandlordLink: async (id) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/landlord-link`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return await res.json();
      },

      reserve: async (id, message, phone) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/reserve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message, phone })
        });
        return await res.json();
      },

      respondReservation: async (id, action, note) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/reserve/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action, note })
        });
        return await res.json();
      },

      save: async (id) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return await res.json();
      },

      unsave: async (id) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/save`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return await res.json();
      },

      report: async (id, reason, description) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/pass-rooms/${id}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason, description })
        });
        return await res.json();
      }
    },

    LandlordConfirm: {
      getInfo: async (token) => {
        try {
          const res = await fetch(`${API_BASE}/landlord-confirmation/${token}`);
          return await res.json();
        } catch (e) {
          console.warn('LandlordConfirm.getInfo error:', e);
          return { success: false, message: 'Lỗi kết nối máy chủ' };
        }
      },

      respond: async (token, action, note) => {
        try {
          const res = await fetch(`${API_BASE}/landlord-confirmation/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, note })
          });
          return await res.json();
        } catch (e) {
          console.warn('LandlordConfirm.respond error:', e);
          return { success: false, message: 'Lỗi gửi xác nhận' };
        }
      }
    },

    Appointment: {
      create: async (data) => {
        const res = await fetch(`${API_BASE}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      getByCode: async (code) => {
        const res = await fetch(`${API_BASE}/appointments/${code}`);
        return res.json();
      },
      updateStatus: async (code, status, landlordResponseNote) => {
        const res = await fetch(`${API_BASE}/appointments/${code}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, landlordResponseNote })
        });
        return res.json();
      },
      landlordList: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return [];
        try {
          const res = await fetch(`${API_BASE}/appointments/landlord`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          return data.data || [];
        } catch {
          return [];
        }
      },
      myList: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return [];
        try {
          const res = await fetch(`${API_BASE}/appointments/my-appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          return data.data || [];
        } catch {
          return [];
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
              anonymous_name: rev.anonymous_name || rev.studentName || 'Người thuê ẩn danh',
              content: rev.content || rev.comment || '',
              rating: rev.rating || 5,
              trust_score: rev.trust_score || (rev.verified ? 98 : 60),
              verified: Boolean(rev.verified),
              has_stayed: Boolean(rev.verified || rev.has_stayed),
              stayDurationSnapshot: rev.stayDurationSnapshot || 0,
              stayed_period: rev.stayed_period || (rev.verified ? `Đã ở ${rev.stayDurationSnapshot || 1} tháng` : 'Đã ở tại đây'),
              isCostAccurate: rev.isCostAccurate !== undefined ? rev.isCostAccurate : rev.matchesListedPrice,
              matchesListedPrice: rev.matchesListedPrice !== undefined ? rev.matchesListedPrice : rev.isCostAccurate,
              actualMonthlyCost: rev.actualMonthlyCost
            }));
          }
          return [];
        } catch (error) {
          console.warn('Lỗi khi fetch reviews từ API:', error);
          return [];
        }
      },

      create: async (data) => {
        const token = localStorage.getItem('smartstay_token');
        const roomId = data.room || data.roomId;
        const url = roomId ? `${API_BASE}/rooms/${roomId}/reviews` : `${API_BASE}/reviews`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(data)
        });
        return res.json();
      }
    },

    ReviewEligibility: {
      check: async (roomId) => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) {
          return {
            success: false,
            data: {
              eligible: false,
              code: 'NOT_LOGGED_IN',
              message: 'Vui lòng đăng nhập để gửi đánh giá trải nghiệm thực tế.'
            }
          };
        }
        try {
          const res = await fetch(`${API_BASE}/rooms/${roomId}/review-eligibility`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          return json;
        } catch (e) {
          return {
            success: false,
            data: {
              eligible: false,
              code: 'NETWORK_ERROR',
              message: 'Không thể kết nối đến máy chủ.'
            }
          };
        }
      }
    },

    Stay: {
      requestCheckin: async (roomId, tenantNote, checkInDate) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/stays/request-checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ roomId, tenantNote, checkInDate })
        });
        return res.json();
      },

      redeemCode: async (code, roomId) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/stays/redeem-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ code, roomId })
        });
        return res.json();
      },

      uploadContract: async (stayId, file) => {
        const token = localStorage.getItem('smartstay_token');
        const formData = new FormData();
        formData.append('contractFile', file);
        const res = await fetch(`${API_BASE}/stays/${stayId}/contract`, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        });
        return res.json();
      },

      myStays: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, data: [] };
        const res = await fetch(`${API_BASE}/stays/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
      },

      myStatus: async (roomId) => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, hasStay: false, eligibility: { eligible: false, code: 'NOT_LOGGED_IN' } };
        const res = await fetch(`${API_BASE}/stays/room/${roomId}/my-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
      },

      reportDispute: async (stayId, reason) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/stays/${stayId}/dispute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ reason })
        });
        return res.json();
      },

      // Landlord APIs
      getPending: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, data: [] };
        const res = await fetch(`${API_BASE}/landlord/stays/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
      },

      getActive: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, data: [] };
        const res = await fetch(`${API_BASE}/landlord/stays/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
      },

      getAll: async () => {
        const token = localStorage.getItem('smartstay_token');
        if (!token) return { success: false, data: [] };
        const res = await fetch(`${API_BASE}/landlord/stays/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
      },

      confirmCheckin: async (stayId, checkInDate, note) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/${stayId}/confirm-checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ checkInDate, note })
        });
        return res.json();
      },

      rejectCheckin: async (stayId, reason) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/${stayId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ reason })
        });
        return res.json();
      },

      confirmCheckout: async (stayId, checkOutDate, note) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/${stayId}/confirm-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ checkOutDate, note })
        });
        return res.json();
      },

      createCheckinCode: async (roomId, note) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/rooms/${roomId}/checkin-codes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ note })
        });
        return res.json();
      },

      getCheckinCodes: async (roomId) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/rooms/${roomId}/checkin-codes`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        return res.json();
      },

      revokeCheckinCode: async (codeId) => {
        const token = localStorage.getItem('smartstay_token');
        const res = await fetch(`${API_BASE}/landlord/stays/checkin-codes/${codeId}`, {
          method: 'DELETE',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
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
          const params = new URLSearchParams();
          if (query.viewerId) params.set('viewerId', query.viewerId);
          if (query.viewerGender) params.set('viewerGender', query.viewerGender);
          if (query.allowCrossGender !== undefined) params.set('allowCrossGender', String(query.allowCrossGender));

          const url = params.toString() ? `${API_BASE}/surveys?${params.toString()}` : `${API_BASE}/surveys`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map(s => ({
              ...s,
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
              cleanliness: s.cleanliness || 'daily',
              guestPolicy: s.guestPolicy || 'ask_first',
              habits: s.habits || `${s.sleepSchedule === 'night_owl' ? 'Thức khuya' : (s.sleepSchedule === 'early_bird' ? 'Ngủ sớm' : 'Linh hoạt')}, ${s.smokingDrinking === 'none' ? 'Không hút thuốc' : ''}, ${s.hasPet ? 'Có thú cưng' : 'Không nuôi pet'}`.replace(/^, |, $/g, ''),
              description: s.description || `Tìm bạn ở ghép cùng trường ${s.campus || 'Cần Thơ'}, văn minh, tôn trọng sinh hoạt chung.`,
              contact: s.contactZalo || '0901***567',
              rawContact: s.rawContact || s.contactZalo || '',
              avatarUrl: s.avatarUrl || s.avatar || null,
              allowCrossGender: Boolean(s.allowCrossGender),
              compatibility: s.compatibility || null,
              verified: Boolean(s.verified)
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
              allowCrossGender: Boolean(data.allowCrossGender),
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

  contracts: {
    list: async (params = {}) => {
      const token = localStorage.getItem('smartstay_token');
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const query = new URLSearchParams(cleanParams).toString();
      
      const getFallbackContractsResponse = (p = {}) => {
        const defaultContracts = [
          {
            _id: "ctr_sample_001",
            contractNumber: "HD-2026-P101",
            room: {
              _id: "room_1",
              title: "Phòng trọ ban công thoáng mát",
              room_number: "P.101",
              address: "Hẻm 51, 3 Tháng 2, Ninh Kiều",
              price: 2500000,
              status: "Đang thuê"
            },
            tenant: {
              _id: "usr_tenant_001",
              fullName: "Nguyễn Văn A",
              email: "nguyenvana@gmail.com",
              phone: "0912 345 678",
              studentId: "B2100123",
              campus: "ĐH Cần Thơ",
              idCard: "092098004567"
            },
            landlord: {
              fullName: "Bác Ba Cần Thơ",
              email: "chutro@smartstay.vn",
              phone: "0939 112 233"
            },
            startDate: "2026-08-01T00:00:00.000Z",
            endDate: "2027-08-01T00:00:00.000Z",
            monthlyRent: 2500000,
            deposit: {
              amount: 2500000,
              status: "paid",
              paidDate: "2026-08-01T00:00:00.000Z",
              bankName: "MB Bank"
            },
            status: "active",
            billingCycle: "monthly",
            paymentDueDay: 10
          },
          {
            _id: "ctr_sample_002",
            contractNumber: "HD-2026-P102",
            room: {
              _id: "room_2",
              title: "Phòng khép kín tầng trệt",
              room_number: "P.102",
              address: "Hẻm 51, 3 Tháng 2, Ninh Kiều",
              price: 2200000,
              status: "Đang thuê"
            },
            tenant: {
              _id: "usr_tenant_002",
              fullName: "Lê Thị Hoa",
              email: "lethihoa@gmail.com",
              phone: "0938 888 999",
              studentId: "B2100456",
              campus: "ĐH Cần Thơ"
            },
            landlord: {
              fullName: "Bác Ba Cần Thơ",
              email: "chutro@smartstay.vn",
              phone: "0939 112 233"
            },
            startDate: "2026-09-15T00:00:00.000Z",
            endDate: "2027-09-15T00:00:00.000Z",
            monthlyRent: 2200000,
            deposit: {
              amount: 2200000,
              status: "paid",
              paidDate: "2026-09-15T00:00:00.000Z"
            },
            status: "active",
            billingCycle: "monthly",
            paymentDueDay: 10
          },
          {
            _id: "ctr_sample_003",
            contractNumber: "HD-2025-P103",
            room: {
              _id: "room_3",
              title: "Phòng gác lửng đúc kiên cố",
              room_number: "P.103",
              address: "Hẻm 51, 3 Tháng 2, Ninh Kiều",
              price: 2400000,
              status: "Đang thuê"
            },
            tenant: {
              _id: "usr_tenant_003",
              fullName: "Trần Minh Quân",
              email: "minhquan@gmail.com",
              phone: "0909 112 233",
              studentId: "B2000789",
              campus: "FPT Cần Thơ"
            },
            landlord: {
              fullName: "Bác Ba Cần Thơ",
              email: "chutro@smartstay.vn",
              phone: "0939 112 233"
            },
            startDate: "2025-11-15T00:00:00.000Z",
            endDate: "2026-11-15T00:00:00.000Z",
            monthlyRent: 2400000,
            deposit: {
              amount: 2400000,
              status: "paid",
              paidDate: "2025-11-15T00:00:00.000Z"
            },
            status: "active",
            billingCycle: "monthly",
            paymentDueDay: 10
          }
        ];

        let filtered = defaultContracts;
        if (p.status && p.status !== "all") {
          if (p.status === "expiring_soon") {
            filtered = [defaultContracts[2]];
          } else if (p.status === "unpaid_deposit") {
            filtered = [];
          } else {
            filtered = defaultContracts.filter(c => c.status === p.status);
          }
        }
        if (p.q && p.q.trim()) {
          const kw = p.q.toLowerCase().trim();
          filtered = filtered.filter(c => 
            c.room?.title?.toLowerCase().includes(kw) ||
            c.room?.room_number?.toLowerCase().includes(kw) ||
            c.tenant?.fullName?.toLowerCase().includes(kw) ||
            c.tenant?.phone?.includes(kw)
          );
        }

        return {
          success: true,
          data: filtered,
          total: filtered.length,
          page: 1,
          totalPages: 1,
          stats: {
            totalContracts: 3,
            activeCount: 3,
            expiringSoonCount: 1,
            totalHoldingDeposit: 7100000,
            unpaidDepositCount: 0
          }
        };
      };

      try {
        const res = await fetch(`${API_BASE}/contracts${query ? `?${query}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        const savedUser = localStorage.getItem('smartstay_user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        const isDemoLandlord = currentUser?.email === 'chutro@smartstay.vn';

        if (res.ok && data.success) {
          if (Array.isArray(data.data) && data.data.length > 0) {
            return data;
          }
          if (isDemoLandlord) {
            return getFallbackContractsResponse(params);
          }
          // Chủ trọ thật chưa có hợp đồng: trả về mảng rỗng [] và stats = 0, tuyệt đối không gán hợp đồng Bác Ba
          return {
            success: true,
            data: [],
            total: 0,
            page: 1,
            totalPages: 1,
            stats: {
              totalContracts: 0,
              activeCount: 0,
              expiringSoonCount: 0,
              totalHoldingDeposit: 0,
              unpaidDepositCount: 0
            }
          };
        }
        if (isDemoLandlord) {
          return getFallbackContractsResponse(params);
        }
        return {
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 1,
          stats: {
            totalContracts: 0,
            activeCount: 0,
            expiringSoonCount: 0,
            totalHoldingDeposit: 0,
            unpaidDepositCount: 0
          }
        };
      } catch (err) {
        console.warn('Lỗi gọi API /contracts, chuyển sang dữ liệu an toàn:', err);
        const savedUser = localStorage.getItem('smartstay_user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        if (currentUser?.email === 'chutro@smartstay.vn') {
          return getFallbackContractsResponse(params);
        }
        return {
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 1,
          stats: {
            totalContracts: 0,
            activeCount: 0,
            expiringSoonCount: 0,
            totalHoldingDeposit: 0,
            unpaidDepositCount: 0
          }
        };
      }
    },
    myContracts: async () => {
      const token = localStorage.getItem('smartstay_token');
      if (!token) return [];
      try {
        const res = await fetch(`${API_BASE}/contracts/my-contracts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        return data.data || [];
      } catch {
        return [];
      }
    },
    get: async (id) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải chi tiết hợp đồng.');
      }
      return data.data;
    },
    create: async (payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo hợp đồng mới.');
      }
      return data;
    },
    update: async (id, payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật hợp đồng.');
      }
      return data;
    },
    updateDeposit: async (id, payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${id}/deposit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật tiền cọc.');
      }
      return data;
    },
    end: async (id, payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể kết thúc hợp đồng.');
      }
      return data;
    },
    renew: async (id, payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể gia hạn hợp đồng.');
      }
      return data;
    },
    lookupRooms: async () => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/lookup/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      return data.data || [];
    },
    lookupTenants: async () => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/lookup/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      return data.data || [];
    },
    addInventory: async (contractId, payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${contractId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    },
    verifyInventory: async (contractId, itemId) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${contractId}/inventory/${itemId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await res.json();
    },
    saveHandoverPhotos: async (contractId, type, photos) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/contracts/${contractId}/handover-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, photos })
      });
      return await res.json();
    }
  },

  bills: {
    create: async (billData) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billData)
      });
      return await res.json();
    },
    landlordList: async () => {
      const token = localStorage.getItem('smartstay_token');
      if (!token) return [];
      try {
        const res = await fetch(`${API_BASE}/bills/landlord`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    },
    myBills: async () => {
      const token = localStorage.getItem('smartstay_token');
      if (!token) return [];
      try {
        const res = await fetch(`${API_BASE}/bills/my-bills`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    },
    getByContract: async (contractId) => {
      const token = localStorage.getItem('smartstay_token');
      try {
        const res = await fetch(`${API_BASE}/bills/contract/${contractId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    },
    pay: async (id, paymentProofUrl) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/bills/${id}/pay`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentProofUrl })
      });
      return await res.json();
    },
    confirm: async (id) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/bills/${id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await res.json();
    },
    getGrid: async (month, year) => {
      const token = localStorage.getItem('smartstay_token');
      try {
        const res = await fetch(`${API_BASE}/bills/grid?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      } catch (err) {
        console.warn('Lỗi gọi API /bills/grid:', err);
        return { success: false, data: [] };
      }
    },
    batchSaveGrid: async (payload) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/bills/batch-save-grid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
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
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const srvErr = new Error(data.message || 'Email hoặc mật khẩu không chính xác.');
          srvErr.fromServer = true;
          srvErr.status = res.status;
          throw srvErr;
        }
        if (data.access_token) {
          localStorage.setItem('smartstay_token', data.access_token);
          localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(data.user)));
        }
        return data;
      } catch (err) {
        // Nếu server backend trả về lỗi bảo mật (sai pass, bị khóa brute-force, IP bị chặn...), trả về đúng thông báo đó
        if (err.fromServer || (err.message && !err.message.includes('Failed to fetch') && err.name !== 'TypeError')) {
          throw err;
        }
        const clean = (email || '').toLowerCase().trim();
        const demoAccounts = [
          {
            id: 'admin_demo',
            _id: 'admin_demo',
            fullName: 'Admin Quản Trị',
            email: 'admin@smartstay.vn',
            role: 'admin',
            verificationStatus: 'APPROVED'
          },
          {
            id: 'landlord_demo',
            _id: 'landlord_demo',
            fullName: 'Chủ Trọ Nguyễn Văn A',
            email: 'nhatminhk40@gmail.com',
            phone: '0901234567',
            role: 'landlord',
            verificationStatus: 'APPROVED',
            phoneVerified: true
          },
          {
            id: 'student_demo',
            _id: 'student_demo',
            fullName: 'Nguyễn Văn An (Người thuê)',
            email: 'nguoithue@smartstay.vn',
            role: 'student',
            campus: 'FPT Can Tho',
            verificationStatus: 'APPROVED',
            phoneVerified: true
          }
        ];
        const found = demoAccounts.find(u => u.email === clean || u.phone === clean);
        if (found) {
          // Khi backend không phản hồi, tự động đăng nhập fallback vào tài khoản mẫu với payload định danh an toàn
          const userPayload = {
            id: found.id || found._id,
            _id: found._id || found.id,
            email: found.email,
            role: found.role,
            fullName: found.fullName
          };
          const fallbackToken = 'jwt_offline_' + btoa(unescape(encodeURIComponent(JSON.stringify(userPayload))));
          localStorage.setItem('smartstay_token', fallbackToken);
          localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(found)));
          return { success: true, access_token: fallbackToken, user: found };
        }
        
        // Nếu là lỗi mất kết nối máy chủ
        if (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('failed to fetch'))) {
          throw new Error('Máy chủ Backend (Port 5000) chưa được bật. Vui lòng chạy lệnh npm run dev hoặc chọn tài khoản mẫu bên dưới để đăng nhập nhanh.');
        }
        throw err;
      }
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
        localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(data.user)));
      }
      return data;
    },
    loginWithProvider: (provider, returnTo) => {
    },
    sendOtp: async ({ email, phone, purpose = 'VERIFY_EMAIL' }) => {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, purpose })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gửi mã OTP thất bại.');
      }
      return data;
    },
    verifyOtp: async ({ email, code, otpCode, phone, purpose = 'VERIFY_EMAIL' }) => {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code || otpCode,
          phone,
          purpose
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
      }
      return data;
    },
    resetPasswordRequest: async (email) => {
      return await base44.auth.sendOtp({ email, purpose: 'RESET_PASSWORD' });
    },
    resetPassword: async ({ email, resetToken, newPassword }) => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
      }
      return data;
    },

    // ── BẢO MẬT ADMIN: XÁC THỰC 2 BƯỚC GOOGLE AUTHENTICATOR (TOTP) ──
    verifyAdmin2FA: async ({ tempToken, code }) => {
      const res = await fetch(`${API_BASE}/auth/verify-admin-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Mã xác thực Google Authenticator không chính xác.');
      }
      if (data.access_token) {
        localStorage.setItem('smartstay_token', data.access_token);
        localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(data.user)));
      }
      return data;
    },

    getAdmin2FAStatus: async () => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/auth/admin-2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    },

    getAdmin2FASetup: async () => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/auth/admin-2fa/setup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    },

    enableAdmin2FA: async ({ secret, code, backupCodes }) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/auth/admin-2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ secret, code, backupCodes })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kích hoạt 2FA thất bại.');
      }
      return data;
    },

    disableAdmin2FA: async ({ code, adminPin }) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/auth/admin-2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code, adminPin })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Hủy kích hoạt 2FA thất bại.');
      }
      return data;
    },

    // ── BẢO MẬT ADMIN: XÁC MINH MÃ PIN QUẢN TRỊ CẤP 2 (ADMIN MASTER PIN) ──
    verifyAdminPin: async (pin) => {
      const token = localStorage.getItem('smartstay_token');
      const res = await fetch(`${API_BASE}/auth/admin-pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Mã PIN Quản trị cấp 2 không đúng.');
      }
      return data;
    },
    sendPhoneOtp: async (phone) => {
      return await base44.auth.sendOtp({ phone });
    },
    verifyPhoneOtp: async ({ phone, otpCode }) => {
      return await base44.auth.verifyOtp({ phone, code: otpCode });
    },
    register: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: payload.fullName || payload.name || payload.email.split('@')[0],
          email: payload.email,
          password: payload.password,
          phone: payload.phone || '',
          phoneVerified: payload.phoneVerified !== false,
          role: payload.role || 'student',
          campus: payload.campus || 'FPT Can Tho',
          studentId: payload.studentId || '',
          landlordDocuments: payload.landlordDocuments || {},
          isEmailVerified: payload.isEmailVerified !== false
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng ký không thành công.');
      }
      if (data.access_token) {
        localStorage.setItem('smartstay_token', data.access_token);
        localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(data.user)));
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
          localStorage.setItem('smartstay_user', JSON.stringify(sanitizeUserForStorage(data.user)));
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

