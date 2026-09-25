// Quản lý cấu hình động hệ thống SmartStay Admin (Banner Hero, Campus, Tiện nghi, Toggle, Quick Actions)
import { CAMPUSES as DEFAULT_CAMPUSES, AMENITIES as DEFAULT_AMENITIES } from "./smartstayData";

const HERO_KEY = "smartstay_hero_config";
const CAMPUSES_KEY = "smartstay_campuses_config";
const AMENITIES_KEY = "smartstay_amenities_config";
const TOGGLES_KEY = "smartstay_toggles_config";
const QUICK_ACTIONS_KEY = "smartstay_quick_actions_config";

export const DEFAULT_HERO = {
  title: "Thuê trọ",
  highlight: "minh bạch",
  titleSuffix: "cho sinh viên Cần Thơ",
  description: "Tìm phòng đúng khu vực, đúng túi tiền — đánh giá thực tế từ sinh viên đã ở, ghép bạn hợp tính, chuyển trọ niêm yết.",
  badge1: "100% kiểm duyệt Safe Badge",
  badge2: "Sang nhượng cọc an toàn",
  badge3: "Giá chuyển trọ sinh viên niêm yết",
  ctaSafeText: "Đăng tin Safe",
  ctaQuizText: "Tìm bạn ở ghép",
  showBadges: true,
  showCtaButtons: false
};

export const DEFAULT_SPECIAL_TOGGLES = {
  soundproof: {
    enabled: true,
    title: "Phòng cách âm",
    desc: "Lọc phòng có cách âm"
  },
  roommate: {
    enabled: true,
    title: "Tìm bạn ở ghép",
    desc: "Bật để ghép thói quen sinh hoạt"
  }
};

export const DEFAULT_QUICK_ACTIONS = [
  { id: "explore", label: "Khám phá", icon: "Compass", action: "explore", enabled: true, desc: "Xem danh sách trọ sinh viên" },
  { id: "quiz", label: "Ghép bạn", icon: "Users", action: "quiz", enabled: true, desc: "Trắc nghiệm ghép bạn cùng phòng" },
  { id: "logistics", label: "Chuyển trọ", icon: "Truck", action: "logistics", enabled: true, desc: "Tính giá xe ba gác / tải nhỏ" },
  { id: "pass", label: "Pass phòng", icon: "KeyRound", action: "pass", enabled: true, desc: "Sang nhượng phòng trọ còn cọc" },
  { id: "safe", label: "Đăng tin Safe", icon: "ShieldCheck", action: "safe", enabled: true, desc: "Đăng tin trọ có kiểm duyệt" }
];

function notifyConfigUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("smartstay_config_updated"));
  }
}

// 1. Quản lý Hero
export function getHeroConfig() {
  try {
    const raw = localStorage.getItem(HERO_KEY);
    return raw ? { ...DEFAULT_HERO, ...JSON.parse(raw) } : DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export function saveHeroConfig(config) {
  localStorage.setItem(HERO_KEY, JSON.stringify(config));
  notifyConfigUpdate();
  return config;
}

// 2. Quản lý Campus
export function getCampusesConfig() {
  try {
    const raw = localStorage.getItem(CAMPUSES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CAMPUSES;
  } catch {
    return DEFAULT_CAMPUSES;
  }
}

export function saveCampusesConfig(campuses) {
  localStorage.setItem(CAMPUSES_KEY, JSON.stringify(campuses));
  notifyConfigUpdate();
  return campuses;
}

// 3. Quản lý Tiện nghi
export function getAmenitiesConfig() {
  try {
    const raw = localStorage.getItem(AMENITIES_KEY);
    if (raw) return JSON.parse(raw);
    return DEFAULT_AMENITIES.map(a => ({
      ...a,
      iconName: a.id === "Máy lạnh" ? "Snowflake"
        : a.id === "Tủ lạnh" ? "Box"
        : a.id === "Máy nước nóng" ? "Droplets"
        : a.id === "Gác lửng" ? "Layers"
        : a.id === "Máy giặt" ? "RotateCw"
        : a.id === "Tủ quần áo" ? "Shirt"
        : a.id === "Cách âm" ? "VolumeOff" : "Check"
    }));
  } catch {
    return DEFAULT_AMENITIES;
  }
}

export function saveAmenitiesConfig(amenities) {
  localStorage.setItem(AMENITIES_KEY, JSON.stringify(amenities));
  notifyConfigUpdate();
  return amenities;
}

// 4. Quản lý Toggles
export function getSpecialTogglesConfig() {
  try {
    const raw = localStorage.getItem(TOGGLES_KEY);
    return raw ? { ...DEFAULT_SPECIAL_TOGGLES, ...JSON.parse(raw) } : DEFAULT_SPECIAL_TOGGLES;
  } catch {
    return DEFAULT_SPECIAL_TOGGLES;
  }
}

export function saveSpecialTogglesConfig(toggles) {
  localStorage.setItem(TOGGLES_KEY, JSON.stringify(toggles));
  notifyConfigUpdate();
  return toggles;
}

// 5. Quản lý Quick Actions
export function getQuickActionsConfig() {
  try {
    const raw = localStorage.getItem(QUICK_ACTIONS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_QUICK_ACTIONS;
  } catch {
    return DEFAULT_QUICK_ACTIONS;
  }
}

export function saveQuickActionsConfig(actions) {
  localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(actions));
  notifyConfigUpdate();
  return actions;
}
