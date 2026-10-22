/**
 * Thuật toán tính điểm tương thích giữa 2 người ở ghép (0 - 100%)
 * Trọng số:
 * - Hút thuốc: 25
 * - Giờ giấc: 25
 * - Ngân sách: 20
 * - Khu vực / Trường học: 15
 * - Thú cưng: 10
 * - Sở thích / Thói quen chung: 5
 * 
 * Thiếu dữ liệu ở tiêu chí nào thì chuẩn hóa lại tổng trọng số, KHÔNG tính là 0.
 */

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
 * Tính điểm tương thích
 * @param {object} me - Hồ sơ của tôi
 * @param {object} other - Hồ sơ của người đang xem
 * @returns {{ score: number | null, matched: string[], different: string[] }}
 */
export function calcCompatibility(me, other) {
  // Nếu backend đã trả sẵn kết quả compatibility
  if (other && other.compatibility && typeof other.compatibility.score === 'number') {
    return other.compatibility;
  }

  // Nếu người dùng chưa có hồ sơ của mình
  if (!me || (!me.name && !me.budget && !me.campus && !me.sleepSchedule && !me.habits)) {
    return {
      score: null,
      matched: [],
      different: []
    };
  }

  if (!other) {
    return { score: null, matched: [], different: [] };
  }

  let totalAvailableWeight = 0;
  let earnedWeight = 0;
  const matched = [];
  const different = [];

  // 1. Tiêu chí Hút thuốc (Trọng số 25)
  const meSmoking = extractSmoking(me);
  const otherSmoking = extractSmoking(other);

  if (meSmoking && otherSmoking) {
    totalAvailableWeight += 25;
    if (meSmoking === otherSmoking) {
      earnedWeight += 25;
      if (meSmoking === 'none') {
        matched.push('Cùng không hút thuốc');
      } else {
        matched.push('Cùng thoải mái về khói thuốc');
      }
    } else if (
      (meSmoking === 'none' && otherSmoking === 'yes') ||
      (meSmoking === 'yes' && otherSmoking === 'none')
    ) {
      // Bất đồng nghiêm trọng về khói thuốc: 0 điểm
      earnedWeight += 0;
      different.push('Khác nhau về khói thuốc');
    } else {
      // Một bên thỉnh thoảng/linh hoạt
      earnedWeight += 10;
      different.push('Một bên không hút, một bên thỉnh thoảng');
    }
  }

  // 2. Tiêu chí Giờ giấc (Trọng số 25)
  const meSleep = extractSleep(me);
  const otherSleep = extractSleep(other);

  if (meSleep && otherSleep) {
    totalAvailableWeight += 25;
    if (meSleep === otherSleep) {
      earnedWeight += 25;
      if (meSleep === 'early') matched.push('Cùng ngủ sớm dậy sớm');
      else if (meSleep === 'night') matched.push('Cùng thức khuya học tập');
      else matched.push('Cùng có giờ giấc linh hoạt');
    } else if (meSleep === 'flexible' || otherSleep === 'flexible') {
      earnedWeight += 18;
      matched.push('Giờ giấc linh hoạt dễ hòa nhập');
    } else {
      // Đối lập sớm vs khuya
      earnedWeight += 0;
      different.push('Giờ ngủ khác nhau (ngủ sớm vs cú đêm)');
    }
  }

  // 3. Tiêu chí Ngân sách (Trọng số 20)
  const meBudget = extractBudget(me);
  const otherBudget = extractBudget(other);

  if (meBudget !== null && otherBudget !== null) {
    totalAvailableWeight += 20;
    const diff = Math.abs(meBudget - otherBudget);

    if (diff === 0) {
      earnedWeight += 20;
      matched.push('Ngân sách hoàn toàn tương đồng');
    } else if (diff < 1.5) {
      const budgetPoints = Math.round(20 * (1 - diff / 1.5));
      earnedWeight += budgetPoints;
      if (diff <= 0.4) {
        matched.push('Ngân sách rất gần nhau');
      } else {
        matched.push('Ngân sách trong tầm phù hợp');
      }
    } else {
      earnedWeight += 0;
      different.push(`Chênh lệch ngân sách (~${diff.toFixed(1)}tr/tháng)`);
    }
  }

  // 4. Tiêu chí Campus / Trường học (Trọng số 15)
  const meCampus = (me.campus || '').trim();
  const otherCampus = (other.campus || '').trim();

  if (meCampus && otherCampus) {
    totalAvailableWeight += 15;
    const normMeCampus = removeDiacritics(meCampus);
    const normOtherCampus = removeDiacritics(otherCampus);

    // Kiểm tra trùng trường hoặc cùng chuỗi viết tắt
    const isSameCampus =
      normMeCampus === normOtherCampus ||
      (normMeCampus.includes('fpt') && normOtherCampus.includes('fpt')) ||
      (normMeCampus.includes('y duoc') && normOtherCampus.includes('y duoc')) ||
      (normMeCampus.includes('can tho') && !normMeCampus.includes('nam') && normOtherCampus.includes('can tho') && !normOtherCampus.includes('nam')) ||
      (normMeCampus.includes('nam can tho') && normOtherCampus.includes('nam can tho'));

    if (isSameCampus) {
      earnedWeight += 15;
      matched.push(`Cùng trường/campus (${otherCampus})`);
    } else {
      earnedWeight += 5; // Cùng ở Cần Thơ nhưng khác trường
      different.push('Khác trường/campus');
    }
  }

  // 5. Tiêu chí Thú cưng (Trọng số 10)
  const mePet = extractPet(me);
  const otherPet = extractPet(other);

  if (mePet && otherPet) {
    totalAvailableWeight += 10;
    if (mePet === otherPet) {
      earnedWeight += 10;
      if (mePet === 'has') matched.push('Cùng yêu thích / nuôi thú cưng');
      else matched.push('Cùng không nuôi thú cưng');
    } else if (
      (mePet === 'has' && otherPet === 'friendly') ||
      (mePet === 'friendly' && otherPet === 'has') ||
      (mePet === 'no' && otherPet === 'friendly') ||
      (mePet === 'friendly' && otherPet === 'no')
    ) {
      earnedWeight += 8;
      matched.push('Thoải mái về thú cưng');
    } else {
      // Một bên nuôi, một bên không nuôi
      earnedWeight += 0;
      different.push('Khác quan điểm về nuôi thú cưng');
    }
  }

  // 6. Tiêu chí Thói quen / Sở thích chung (Trọng số 5)
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
    totalAvailableWeight += 5;
    if (commonHabitFound) {
      earnedWeight += 5;
    }
  }

  // Chuẩn hóa điểm số theo tổng trọng số các tiêu chí có dữ liệu
  if (totalAvailableWeight === 0) {
    return {
      score: 70,
      matched: ['Thông tin cơ bản hòa hợp'],
      different: []
    };
  }

  const score = Math.min(100, Math.max(0, Math.round((earnedWeight / totalAvailableWeight) * 100)));

  return {
    score,
    matched,
    different
  };
}
