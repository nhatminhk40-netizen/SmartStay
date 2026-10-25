/**
 * Lớp dịch vụ quản lý các tương tác người ở ghép (Lưu, Ẩn, Báo cáo, Hồ sơ của tôi).
 * Hiện tại lưu trữ qua localStorage + State; sau này chỉ cần đổi endpoint sang API thật tại đây.
 */

const STORAGE_KEYS = {
  SAVED: 'smartstay_saved_roommates',
  HIDDEN: 'smartstay_hidden_roommates',
  REPORTS: 'smartstay_reported_roommates',
  MY_PROFILE: 'smartstay_my_roommate_profile'
};

function getJson(key, defaultVal = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    console.warn(`Lỗi đọc ${key} từ localStorage:`, e);
    return defaultVal;
  }
}

function setJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Lỗi ghi ${key} vào localStorage:`, e);
  }
}

export const roommateApi = {
  /**
   * Lấy danh sách ID các hồ sơ đã lưu
   */
  getSavedIds: () => {
    return getJson(STORAGE_KEYS.SAVED, []);
  },

  /**
   * Kiểm tra xem hồ sơ đã được lưu hay chưa
   */
  isSaved: (profileId) => {
    if (!profileId) return false;
    const list = getJson(STORAGE_KEYS.SAVED, []);
    return list.includes(String(profileId));
  },

  /**
   * Bật/Tắt lưu hồ sơ
   * @param {string|number} profileId 
   * @returns {boolean} trạng thái đã lưu mới (true: đã lưu, false: đã bỏ lưu)
   */
  toggleSave: (profileId) => {
    if (!profileId) return false;
    const strId = String(profileId);
    const list = getJson(STORAGE_KEYS.SAVED, []);
    let isNowSaved = false;
    let nextList = [];

    if (list.includes(strId)) {
      nextList = list.filter((id) => id !== strId);
      isNowSaved = false;
    } else {
      nextList = [...list, strId];
      isNowSaved = true;
    }

    setJson(STORAGE_KEYS.SAVED, nextList);
    window.dispatchEvent(new CustomEvent('smartstay:saved_roommates_updated', { detail: nextList }));
    return isNowSaved;
  },

  /**
   * Lấy danh sách ID các hồ sơ đã ẩn
   */
  getHiddenIds: () => {
    return getJson(STORAGE_KEYS.HIDDEN, []);
  },

  /**
   * Ẩn hồ sơ
   */
  hideProfile: (profileId) => {
    if (!profileId) return [];
    const strId = String(profileId);
    const list = getJson(STORAGE_KEYS.HIDDEN, []);
    if (!list.includes(strId)) {
      const nextList = [...list, strId];
      setJson(STORAGE_KEYS.HIDDEN, nextList);
      window.dispatchEvent(new CustomEvent('smartstay:hidden_roommates_updated', { detail: nextList }));
      return nextList;
    }
    return list;
  },

  /**
   * Bỏ ẩn (Hoàn tác ẩn hồ sơ)
   */
  unhideProfile: (profileId) => {
    if (!profileId) return [];
    const strId = String(profileId);
    const list = getJson(STORAGE_KEYS.HIDDEN, []);
    const nextList = list.filter((id) => id !== strId);
    setJson(STORAGE_KEYS.HIDDEN, nextList);
    window.dispatchEvent(new CustomEvent('smartstay:hidden_roommates_updated', { detail: nextList }));
    return nextList;
  },

  /**
   * Gửi báo cáo hồ sơ
   */
  reportProfile: async ({ reporterId = 'me', profileId, reason, detail = '' }) => {
    const reports = getJson(STORAGE_KEYS.REPORTS, []);
    const newReport = {
      id: `rep_${Date.now()}`,
      reporterId,
      profileId: String(profileId),
      reason,
      detail,
      createdAt: new Date().toISOString()
    };
    reports.push(newReport);
    setJson(STORAGE_KEYS.REPORTS, reports);
    return { success: true, data: newReport };
  },

  /**
   * Lấy hồ sơ người ở ghép của tôi (Chỉ trả về khi người dùng đã thực sự tạo/lưu hồ sơ)
   */
  getMyProfile: () => {
    const saved = getJson(STORAGE_KEYS.MY_PROFILE, null);
    if (saved && (saved.budget || saved.sleepSchedule || saved.habits || saved.lifestyle)) {
      return saved;
    }
    return null;
  },

  /**
   * Lưu hồ sơ người ở ghép của tôi
   */
  saveMyProfile: (profile) => {
    setJson(STORAGE_KEYS.MY_PROFILE, profile);
    window.dispatchEvent(new CustomEvent('smartstay:my_profile_updated', { detail: profile }));
    return profile;
  }
};
