export const LOGISTICS_VEHICLES = [
  { id: 1, name: "Xe máy", icon: "🏍️", capacity: "Hàng nhỏ, balo", basePrice: 20000, perKm: 5000 },
  { id: 2, name: "Xe tải nhỏ 500kg", icon: "🛻", capacity: "Phòng trọ nhỏ, ít đồ", basePrice: 150000, perKm: 15000 },
  { id: 3, name: "Xe tải 1 tấn", icon: "🚚", capacity: "Phòng trọ lớn, nhiều đồ", basePrice: 300000, perKm: 20000 },
];

export const CAMPUSES = [
  "ĐH Bách Khoa TP.HCM",
  "ĐH Công nghệ Thông tin",
  "ĐH KHTN",
];

export const AMENITIES = [
  { id: "Máy lạnh", label: "Máy lạnh" },
  { id: "Tủ lạnh", label: "Tủ lạnh" },
  { id: "Máy nước nóng", label: "Máy nước nóng" },
  { id: "Gác lửng", label: "Gác lửng" },
  { id: "Máy giặt", label: "Máy giặt" },
  { id: "Tủ quần áo", label: "Tủ quần áo" },
];

export const QUIZ_QUESTIONS = [
  { id: 1, text: "Bạn ngủ lúc mấy giờ?" },
  { id: 2, text: "Bạn có thường xuyên dọn dẹp không?" }
];

export const MOCK_CANDIDATES = [
  { id: 1, name: "Nguyễn Văn A", match: 85 }
];

export const calcCompatibility = (a, b) => 85;
