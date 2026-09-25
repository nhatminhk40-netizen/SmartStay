export const LOGISTICS_VEHICLES = [
  { id: 1, name: "Xe ba gác chuyển trọ", icon: "🛺", capacity: "Phù hợp sinh viên ít đồ, ngõ hẻm nhỏ", basePrice: 120000, perKm: 12000 },
  { id: 2, name: "Xe tải nhỏ 500kg", icon: "🛻", capacity: "Phòng trọ vừa, chở được nệm, bàn ghế", basePrice: 180000, perKm: 15000 },
  { id: 3, name: "Xe tải 1.25 tấn (Trọn gói)", icon: "🚚", capacity: "Full phòng trọ lớn, hỗ trợ bốc xếp trọn gói", basePrice: 350000, perKm: 22000 },
];

export const CAMPUSES = [
  "Tất cả khu vực",
  "ĐH Cần Thơ",
  "ĐH Y Dược Cần Thơ",
  "ĐH Nam Cần Thơ",
  "ĐH FPT Cần Thơ",
];

export const AMENITIES = [
  { id: "Máy lạnh", label: "Máy lạnh" },
  { id: "Gác lửng", label: "Gác lửng" },
  { id: "Tủ lạnh", label: "Tủ lạnh" },
  { id: "Máy giặt", label: "Máy giặt" },
  { id: "Máy nước nóng", label: "Máy nước nóng" },
  { id: "Tủ quần áo", label: "Tủ quần áo" },
  { id: "Cách âm", label: "Cách âm" }
];

export const QUIZ_QUESTIONS = [
  {
    id: "sleepSchedule",
    text: "1. Thói quen giờ giấc ngủ của bạn?",
    options: [
      { id: "early_bird", label: "Ngủ sớm, dậy sớm (Trước 23h)", desc: "Ưu tiên không gian yên tĩnh ban đêm" },
      { id: "night_owl", label: "Cú đêm (Thức sau 0h)", desc: "Học tập hoặc làm việc muộn" },
      { id: "flexible", label: "Linh hoạt tuỳ lịch học/lịch thi", desc: "Không cố định" }
    ]
  },
  {
    id: "cleanliness",
    text: "2. Mức độ dọn dẹp vệ sinh phòng?",
    options: [
      { id: "daily", label: "Gọn gàng mỗi ngày", desc: "Đồ đạc ngăn nắp, quét dọn hàng ngày" },
      { id: "weekly", label: "Tổng vệ sinh cuối tuần", desc: "Trong tuần gọn gàng cơ bản" },
      { id: "flexible", label: "Thoải mái, khi nào rảnh dọn", desc: "Không quá câu nệ" }
    ]
  },
  {
    id: "smokingDrinking",
    text: "3. Hút thuốc & Đồ uống có cồn?",
    options: [
      { id: "none", label: "Không hút thuốc / Không nhậu trong phòng", desc: "Môi trường hoàn toàn trong lành" },
      { id: "rarely", label: "Thỉnh thoảng uống vui vẻ, không hút thuốc", desc: "Uống giao lưu dịp đặc biệt" },
      { id: "smoker_friendly", label: "Thoải mái (Có hút thuốc/uống bia)", desc: "Tìm bạn cùng sở thích" }
    ]
  },
  {
    id: "guestPolicy",
    text: "4. Quy định dẫn bạn bè / người yêu về phòng?",
    options: [
      { id: "ask_first", label: "Phải báo trước & được sự đồng ý", desc: "Tôn trọng không gian riêng tư" },
      { id: "daytime_only", label: "Chỉ chơi ban ngày, không ngủ qua đêm", desc: "Giữ yên tĩnh buổi tối" },
      { id: "free", label: "Thoải mái, tự nhiên như ở nhà", desc: "Không cần câu nệ" }
    ]
  },
  {
    id: "budgetRange",
    text: "5. Ngân sách chia tiền phòng hàng tháng?",
    options: [
      { id: "under_1m", label: "Tiết kiệm: Dưới 1.200.000đ/người", desc: "Chia sẻ phòng giá rẻ" },
      { id: "medium", label: "Vừa phải: 1.200.000đ - 2.000.000đ/người", desc: "Đầy đủ tiện nghi cơ bản" },
      { id: "high", label: "Cao cấp: Trên 2.000.000đ/người", desc: "Homestay / Căn hộ dịch vụ tiện nghi cao" }
    ]
  }
];

export const MOCK_CANDIDATES = [
  {
    id: "cand_1",
    name: "Trần Minh Quân",
    gender: "Nam",
    campus: "FPT Can Tho",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    bio: "Sinh viên K18 FPT Cần Thơ, học ngành SE. Tính tình vui vẻ, thích lập trình, ngủ đêm.",
    contactZalo: "0912345678",
    answers: {
      sleepSchedule: "night_owl",
      cleanliness: "daily",
      smokingDrinking: "none",
      guestPolicy: "ask_first",
      budgetRange: "medium"
    }
  },
  {
    id: "cand_2",
    name: "Lê Hoàng Nam",
    gender: "Nam",
    campus: "FPT Can Tho",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    bio: "Sinh viên ngành Thiết kế đồ hoạ, sống ngăn nắp, thích yên tĩnh.",
    contactZalo: "0988776655",
    answers: {
      sleepSchedule: "night_owl",
      cleanliness: "daily",
      smokingDrinking: "none",
      guestPolicy: "daytime_only",
      budgetRange: "medium"
    }
  },
  {
    id: "cand_3",
    name: "Nguyễn Thảo My",
    gender: "Nữ",
    campus: "ĐH Cần Thơ (Khu 2)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    bio: "Sinh viên năm 3 ĐHCT, ngăn nắp sạch sẽ, thích nấu ăn cuối tuần.",
    contactZalo: "0933112233",
    answers: {
      sleepSchedule: "early_bird",
      cleanliness: "daily",
      smokingDrinking: "none",
      guestPolicy: "ask_first",
      budgetRange: "under_1m"
    }
  }
];

export const calcCompatibility = (userAnswers = {}, candidateAnswers = {}) => {
  const criteria = ["sleepSchedule", "cleanliness", "smokingDrinking", "guestPolicy", "budgetRange"];
  let score = 0;
  criteria.forEach((key) => {
    if (userAnswers[key] && candidateAnswers[key] && userAnswers[key] === candidateAnswers[key]) {
      score += 20;
    }
  });
  return score;
};
