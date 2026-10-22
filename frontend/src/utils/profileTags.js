/**
 * Tiện ích xử lý và phân nhóm các tag hồ sơ ở ghép.
 * Khử trùng lặp theo khóa ngữ nghĩa (semantic key) và phân nhóm màu sắc.
 */

// Hàm loại bỏ dấu tiếng Việt để so sánh ngữ nghĩa
function removeDiacritics(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Danh sách định nghĩa nhóm tag và kiểu hiển thị
 */
export const TAG_GROUPS = {
  sleep: {
    id: 'sleep',
    label: 'Giờ giấc',
    bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    iconName: 'Moon'
  },
  habit: {
    id: 'habit',
    label: 'Thói quen',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    iconName: 'Sparkles'
  },
  pet: {
    id: 'pet',
    label: 'Thú cưng',
    bgClass: 'bg-orange-50 text-orange-700 border-orange-200/60',
    iconName: 'Dog'
  },
  other: {
    id: 'other',
    label: 'Khác',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200/60',
    iconName: 'Sparkles'
  }
};

/**
 * Xây dựng danh sách tag từ profile đã loại trùng và phân nhóm
 * @param {object} profile - Dữ liệu người ở ghép
 * @returns {Array<{ key: string, label: string, group: string, bgClass: string, iconName: string }>}
 */
export function buildTags(profile = {}) {
  if (!profile) return [];

  const tagMap = new Map();

  const addTag = (key, label, group, iconName) => {
    if (!key || tagMap.has(key)) return;
    const groupDef = TAG_GROUPS[group] || TAG_GROUPS.other;
    tagMap.set(key, {
      key,
      label,
      group,
      bgClass: groupDef.bgClass,
      iconName: iconName || groupDef.iconName
    });
  };

  // 1. Phân tích nhóm Hút thuốc (ưu tiên thuộc tính cấu trúc)
  const rawHabits = profile.habits || '';
  const normHabits = removeDiacritics(rawHabits);

  const isNoSmoking =
    profile.smokingDrinking === 'none' ||
    normHabits.includes('khong hut') ||
    normHabits.includes('khong thuoc la');

  const isSometimesSmoking =
    profile.smokingDrinking === 'sometimes' ||
    profile.smokingDrinking === 'smoker_friendly' ||
    normHabits.includes('co hut thuoc') ||
    normHabits.includes('thinh thoang hut');

  if (isNoSmoking) {
    addTag('smoking', 'Không hút thuốc', 'habit', 'Ban');
  } else if (isSometimesSmoking) {
    addTag('smoking', 'Thỉnh thoảng hút thuốc', 'habit', 'Ban');
  }

  // 2. Phân tích nhóm Giờ giấc (ưu tiên thuộc tính cấu trúc)
  const sleepRaw = (profile.sleepSchedule || '').toLowerCase();
  const isEarly =
    sleepRaw === 'early_bird' ||
    sleepRaw === 'early' ||
    normHabits.includes('ngu som') ||
    normHabits.includes('day som') ||
    normHabits.includes('truoc 23h');

  const isNight =
    sleepRaw === 'night_owl' ||
    normHabits.includes('cu dem') ||
    normHabits.includes('thuc khuya') ||
    normHabits.includes('hoc khuya') ||
    normHabits.includes('sau 23h') ||
    normHabits.includes('sau 0h');

  const isFlexibleSleep =
    sleepRaw === 'flexible' ||
    normHabits.includes('gio giac linh hoat');

  if (isEarly) {
    addTag('sleep', 'Ngủ sớm dậy sớm', 'sleep', 'Sun');
  } else if (isNight) {
    addTag('sleep', 'Cú đêm / Học khuya', 'sleep', 'Moon');
  } else if (isFlexibleSleep) {
    addTag('sleep', 'Giờ giấc linh hoạt', 'sleep', 'Clock');
  }
  // Lưu ý: Tuyệt đối không hiển thị tag "Linh hoạt" đơn độc nếu không rõ là giờ giấc

  // 3. Phân tích nhóm Thú cưng
  const petPolicy = profile.petPolicy || '';
  const hasPet =
    profile.hasPet === true ||
    petPolicy === 'has_cat' ||
    petPolicy === 'has_dog' ||
    petPolicy === 'pet_friendly' ||
    normHabits.includes('nuoi meo') ||
    normHabits.includes('nuoi cho') ||
    normHabits.includes('co thu cung') ||
    normHabits.includes('yeu pet') ||
    normHabits.includes('co nuoi pet');

  const noPet =
    (profile.hasPet === false && petPolicy === 'no_pet') ||
    normHabits.includes('khong nuoi pet') ||
    normHabits.includes('khong nuoi thu cung') ||
    normHabits.includes('khong thu cung');

  if (hasPet) {
    addTag('pet', 'Có thú cưng / Yêu pet', 'pet', 'Dog');
  } else if (noPet) {
    addTag('pet', 'Không nuôi pet', 'pet', 'Dog');
  }

  // 4. Phân tích các thói quen từ thuộc tính sạch sẽ / khách
  if (profile.cleanliness === 'daily' || normHabits.includes('sach se') || normHabits.includes('gon gang')) {
    addTag('cleanliness', 'Gọn gàng sạch sẽ', 'habit', 'Sparkles');
  }

  if (normHabits.includes('nau an')) {
    addTag('cooking', 'Nấu ăn tại phòng', 'habit', 'Sparkles');
  }

  if (normHabits.includes('yen tinh') || normHabits.includes('khong tu tap') || profile.guestPolicy === 'strict') {
    addTag('quiet', 'Giữ không gian yên tĩnh', 'habit', 'Sparkles');
  }

  // 5. Phân tích các tag tự do từ chuỗi habits
  if (rawHabits) {
    const rawList = rawHabits
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const raw of rawList) {
      const norm = removeDiacritics(raw);

      // Bỏ qua các tag đã được chuẩn hóa qua các nhóm trên
      if (
        norm.includes('khong hut') ||
        norm.includes('co hut') ||
        norm.includes('ngu som') ||
        norm.includes('thuc khuya') ||
        norm.includes('cu dem') ||
        norm.includes('thu cung') ||
        norm.includes('nuoi pet') ||
        norm.includes('sach se') ||
        norm.includes('gon gang') ||
        norm.includes('nau an') ||
        norm.includes('yen tinh') ||
        norm.includes('khong tu tap')
      ) {
        continue;
      }

      // Bỏ qua tag "linh hoạt" mơ hồ không rõ nguồn
      if (norm === 'linh hoat' || norm === 'linh hoat.' || norm === 'flexible') {
        continue;
      }

      // Chuẩn hóa một số thói quen hay gặp
      if (norm.includes('hoc code') || norm.includes('lap trinh') || norm.includes('ktpm') || norm.includes('se')) {
        addTag('coding', 'Học lập trình / Code', 'other', 'Sparkles');
      } else if (norm.includes('may lanh')) {
        addTag('ac', 'Phòng máy lạnh', 'other', 'Sparkles');
      } else if (norm.includes('hoa dong') || norm.includes('than thien')) {
        addTag('friendly', 'Thân thiện, hòa đồng', 'other', 'Sparkles');
      } else if (raw.length >= 2 && raw.length <= 35) {
        // Tag tự do thông thường
        const freeKey = `free_${norm.replace(/\s+/g, '_')}`;
        addTag(freeKey, raw, 'other', 'Sparkles');
      }
    }
  }

  return Array.from(tagMap.values());
}
