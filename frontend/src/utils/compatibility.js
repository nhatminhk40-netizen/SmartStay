/**
 * Thuật toán tính điểm tương thích giữa 2 người ở ghép (0 - 100%)
 * 
 * Quy tắc trọng số chuẩn:
 * - Giới tính chiếm 50% tổng điểm (GENDER_WEIGHT = 0.5)
 * - Các yếu tố thói quen, ngân sách, campus chia nhau 50% còn lại (OTHER_FACTORS_WEIGHT = 0.5)
 * 
 * Tỷ lệ giữa các yếu tố khác:
 * - Hút thuốc: 25
 * - Giờ giấc: 25
 * - Ngân sách: 20
 * - Khu vực / Campus: 15
 * - Thú cưng: 10
 * - Sạch sẽ / Sở thích chung: 5
 */

export const GENDER_WEIGHT = 0.5;
export const OTHER_FACTORS_WEIGHT = 0.5;

export function removeDiacritics(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Chuẩn hóa chuỗi giới tính về 'Nam', 'Nữ', 'Khác' hoặc null nếu thiếu/không rõ
 */
export function normalizeGender(gender) {
  if (!gender || typeof gender !== 'string') return null;
  const clean = removeDiacritics(gender);
  if (clean === 'nam') return 'Nam';
  if (clean === 'nu') return 'Nữ';
  if (clean.includes('khac')) return 'Khác';
  return null;
}

/**
 * Tính điểm giới tính (0 - 100)
 * @returns {{ genderScore: number, isOppositeGender: boolean, reason: string | null }}
 */
export function calcGenderScore(meGender, otherGender) {
  const g1 = normalizeGender(meGender);
  const g2 = normalizeGender(otherGender);

  // Nếu thiếu dữ liệu giới tính: coi là điểm trung tính 50, không crash
  if (!g1 || !g2) {
    return {
      genderScore: 50,
      isOppositeGender: false,
      reason: null
    };
  }

  // Cùng giới tính (Nam-Nam, Nữ-Nữ, Khác-Khác)
  if (g1 === g2) {
    return {
      genderScore: 100,
      isOppositeGender: false,
      reason: 'Cùng giới tính'
    };
  }

  // Khác giới tính (Nam-Nữ, Khác-Nam, Khác-Nữ)
  return {
    genderScore: 0,
    isOppositeGender: true,
    reason: 'Khác giới tính'
  };
}

/**
 * Trích xuất ngân sách dưới dạng số (triệu/tháng)
 */
function extractBudget(profile = {}) {
  if (profile.budget !== undefined && profile.budget !== null && !isNaN(Number(profile.budget))) {
    return Number(profile.budget);
  }
  if (profile.budgetRange) {
    if (profile.budgetRange === 'low' || profile.budgetRange === 'under_1m') return 1.5;
    if (profile.budgetRange === 'high') return 3.2;
    return 2.2;
  }
  return null;
}

/**
 * Trích xuất thói quen hút thuốc
 */
function extractSmoking(profile = {}) {
  const normHabits = removeDiacritics(profile.habits || '');
  if (
    profile.smokingDrinking === 'none' ||
    normHabits.includes('khong hut') ||
    normHabits.includes('khong thuoc la')
  ) {
    return 'none';
  }
  if (
    profile.smokingDrinking === 'smoker_friendly' ||
    profile.smokingDrinking === 'yes' ||
    normHabits.includes('co hut thuoc')
  ) {
    return 'yes';
  }
  if (
    profile.smokingDrinking === 'sometimes' ||
    profile.smokingDrinking === 'rarely' ||
    normHabits.includes('thinh thoang')
  ) {
    return 'sometimes';
  }
  return null;
}

/**
 * Trích xuất giờ giấc
 */
function extractSleep(profile = {}) {
  const raw = (profile.sleepSchedule || '').toLowerCase();
  const normHabits = removeDiacritics(profile.habits || '');

  if (
    raw === 'early_bird' ||
    raw === 'early' ||
    normHabits.includes('ngu som') ||
    normHabits.includes('day som')
  ) {
    return 'early';
  }
  if (
    raw === 'night_owl' ||
    normHabits.includes('cu dem') ||
    normHabits.includes('thuc khuya') ||
    normHabits.includes('hoc khuya')
  ) {
    return 'night';
  }
  if (raw === 'flexible' || normHabits.includes('linh hoat')) {
    return 'flexible';
  }
  return null;
}

/**
 * Trích xuất thú cưng
 */
function extractPet(profile = {}) {
  const policy = profile.petPolicy || '';
  const normHabits = removeDiacritics(profile.habits || '');

  if (
    profile.hasPet === true ||
    policy === 'has_cat' ||
    policy === 'has_dog' ||
    policy === 'pet_friendly' ||
    normHabits.includes('nuoi meo') ||
    normHabits.includes('nuoi cho') ||
    normHabits.includes('co thu cung') ||
    normHabits.includes('co nuoi pet')
  ) {
    return 'has';
  }

  if (
    (profile.hasPet === false && policy === 'no_pet') ||
    normHabits.includes('khong nuoi pet') ||
    normHabits.includes('khong thu cung')
  ) {
    return 'no';
  }

  if (policy === 'friendly' || normHabits.includes('yeu pet') || normHabits.includes('thich thu cung')) {
    return 'friendly';
  }

  return null;
}

/**
 * Tính điểm tương thích giữa 2 hồ sơ
 * @param {object} me - Hồ sơ người xem
 * @param {object} other - Hồ sơ ứng viên
 * @returns {{ score: number | null, matched: string[], different: string[], isOppositeGender: boolean, genderScore: number, otherScore: number }}
 */
export function calcCompatibility(me, other) {
  // Nếu backend đã trả sẵn kết quả compatibility
  if (other && other.compatibility && typeof other.compatibility.score === 'number') {
    return other.compatibility;
  }

  // Nếu người dùng chưa có hồ sơ của mình
  if (!me || (!me.name && !me.budget && !me.campus && !me.sleepSchedule && !me.habits && !me.gender)) {
    return {
      score: null,
      matched: [],
      different: [],
      isOppositeGender: false,
      genderScore: null,
      otherScore: null
    };
  }

  if (!other) {
    return {
      score: null,
      matched: [],
      different: [],
      isOppositeGender: false,
      genderScore: null,
      otherScore: null
    };
  }

  const matched = [];
  const different = [];

  // ==================== 1. TÍNH ĐIỂM GIỚI TÍNH (50%) ====================
  const genderResult = calcGenderScore(me.gender, other.gender);
  const genderScore = genderResult.genderScore;
  const isOppositeGender = genderResult.isOppositeGender;

  if (genderResult.reason) {
    if (genderScore === 100) {
      matched.push('Cùng giới tính');
    } else if (genderScore === 0) {
      different.push('Khác giới tính');
    }
  }

  // ==================== 2. TÍNH ĐIỂM CÁC YẾU TỐ KHÁC (50%) ====================
  let totalAvailableOtherWeight = 0;
  let earnedOtherWeight = 0;

  // A. Tiêu chí Hút thuốc (Trọng số 25)
  const meSmoking = extractSmoking(me);
  const otherSmoking = extractSmoking(other);

  if (meSmoking && otherSmoking) {
    totalAvailableOtherWeight += 25;
    if (meSmoking === otherSmoking) {
      earnedOtherWeight += 25;
      if (meSmoking === 'none') {
        matched.push('Cùng không hút thuốc');
      } else {
        matched.push('Cùng thoải mái về khói thuốc');
      }
    } else if (
      (meSmoking === 'none' && otherSmoking === 'yes') ||
      (meSmoking === 'yes' && otherSmoking === 'none')
    ) {
      earnedOtherWeight += 0;
      different.push('Khác nhau về khói thuốc');
    } else {
      earnedOtherWeight += 10;
      different.push('Một bên không hút, một bên thỉnh thoảng');
    }
  }

  // B. Tiêu chí Giờ giấc (Trọng số 25)
  const meSleep = extractSleep(me);
  const otherSleep = extractSleep(other);

  if (meSleep && otherSleep) {
    totalAvailableOtherWeight += 25;
    if (meSleep === otherSleep) {
      earnedOtherWeight += 25;
      if (meSleep === 'early') matched.push('Cùng ngủ sớm dậy sớm');
      else if (meSleep === 'night') matched.push('Cùng thức khuya học tập');
      else matched.push('Cùng có giờ giấc linh hoạt');
    } else if (meSleep === 'flexible' || otherSleep === 'flexible') {
      earnedOtherWeight += 18;
      matched.push('Giờ giấc linh hoạt dễ hòa nhập');
    } else {
      earnedOtherWeight += 0;
      different.push('Giờ ngủ khác nhau (ngủ sớm vs cú đêm)');
    }
  }

  // C. Tiêu chí Ngân sách (Trọng số 20)
  const meBudget = extractBudget(me);
  const otherBudget = extractBudget(other);

  if (meBudget !== null && otherBudget !== null) {
    totalAvailableOtherWeight += 20;
    const diff = Math.abs(meBudget - otherBudget);

    if (diff === 0) {
      earnedOtherWeight += 20;
      matched.push('Ngân sách hoàn toàn tương đồng');
    } else if (diff < 1.5) {
      const budgetPoints = Math.round(20 * (1 - diff / 1.5));
      earnedOtherWeight += budgetPoints;
      if (diff <= 0.4) {
        matched.push('Ngân sách rất gần nhau');
      } else {
        matched.push('Ngân sách trong tầm phù hợp');
      }
    } else {
      earnedOtherWeight += 0;
      different.push(`Chênh lệch ngân sách (~${diff.toFixed(1)}tr/tháng)`);
    }
  }

  // D. Tiêu chí Campus / Trường học (Trọng số 15)
  const meCampus = (me.campus || '').trim();
  const otherCampus = (other.campus || '').trim();

  if (meCampus && otherCampus) {
    totalAvailableOtherWeight += 15;
    const normMeCampus = removeDiacritics(meCampus);
    const normOtherCampus = removeDiacritics(otherCampus);

    const isSameCampus =
      normMeCampus === normOtherCampus ||
      (normMeCampus.includes('fpt') && normOtherCampus.includes('fpt')) ||
      (normMeCampus.includes('y duoc') && normOtherCampus.includes('y duoc')) ||
      (normMeCampus.includes('can tho') && !normMeCampus.includes('nam') && normOtherCampus.includes('can tho') && !normOtherCampus.includes('nam')) ||
      (normMeCampus.includes('nam can tho') && normOtherCampus.includes('nam can tho'));

    if (isSameCampus) {
      earnedOtherWeight += 15;
      matched.push(`Cùng trường/campus (${otherCampus})`);
    } else {
      earnedOtherWeight += 5;
      different.push('Khác trường/campus');
    }
  }

  // E. Tiêu chí Thú cưng (Trọng số 10)
  const mePet = extractPet(me);
  const otherPet = extractPet(other);

  if (mePet && otherPet) {
    totalAvailableOtherWeight += 10;
    if (mePet === otherPet) {
      earnedOtherWeight += 10;
      if (mePet === 'has') matched.push('Cùng yêu thích / nuôi thú cưng');
      else matched.push('Cùng không nuôi thú cưng');
    } else if (
      (mePet === 'has' && otherPet === 'friendly') ||
      (mePet === 'friendly' && otherPet === 'has') ||
      (mePet === 'no' && otherPet === 'friendly') ||
      (mePet === 'friendly' && otherPet === 'no')
    ) {
      earnedOtherWeight += 8;
      matched.push('Thoải mái về thú cưng');
    } else {
      earnedOtherWeight += 0;
      different.push('Khác quan điểm về nuôi thú cưng');
    }
  }

  // F. Tiêu chí Thói quen / Sở thích chung (Trọng số 5)
  const meHabitsNorm = removeDiacritics(me.habits || '');
  const otherHabitsNorm = removeDiacritics(other.habits || '');

  let commonHabitFound = false;
  if (
    (me.cleanliness === 'daily' || meHabitsNorm.includes('sach se')) &&
    (other.cleanliness === 'daily' || otherHabitsNorm.includes('sach se'))
  ) {
    commonHabitFound = true;
    matched.push('Cùng giữ gìn phòng sạch sẽ');
  } else if (meHabitsNorm.includes('nau an') && otherHabitsNorm.includes('nau an')) {
    commonHabitFound = true;
    matched.push('Cùng thích tự nấu ăn');
  } else if (
    (meHabitsNorm.includes('yen tinh') || me.guestPolicy === 'strict') &&
    (otherHabitsNorm.includes('yen tinh') || other.guestPolicy === 'strict')
  ) {
    commonHabitFound = true;
    matched.push('Cùng thích không gian yên tĩnh');
  }

  if (meHabitsNorm && otherHabitsNorm) {
    totalAvailableOtherWeight += 5;
    if (commonHabitFound) {
      earnedOtherWeight += 5;
    }
  }

  // Chuẩn hóa điểm các yếu tố khác (0 - 100)
  const otherScore = totalAvailableOtherWeight > 0
    ? Math.min(100, Math.max(0, Math.round((earnedOtherWeight / totalAvailableOtherWeight) * 100)))
    : 70;

  // ==================== 3. CÔNG THỨC TỔNG KẾT ====================
  // Tổng điểm = điểm_giới_tính * 0.5 + điểm_các_yếu_tố_khác * 0.5
  const score = Math.min(
    100,
    Math.max(0, Math.round(genderScore * GENDER_WEIGHT + otherScore * OTHER_FACTORS_WEIGHT))
  );

  return {
    score,
    matched,
    different,
    isOppositeGender,
    genderScore,
    otherScore
  };
}
