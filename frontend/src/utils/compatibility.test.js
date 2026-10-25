import { calcCompatibility, calcGenderScore, GENDER_WEIGHT, OTHER_FACTORS_WEIGHT, normalizeGender } from './compatibility.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ THUẬT TOÁN TƯƠNG THÍCH (GENDER_WEIGHT = 0.5)');
console.log('================================================================');

// Baseline profile mẫu
const baseProfile = {
  campus: 'ĐH FPT Cần Thơ',
  budget: 2.2,
  smokingDrinking: 'none',
  sleepSchedule: 'early_bird',
  hasPet: false,
  petPolicy: 'no_pet',
  cleanliness: 'daily',
  habits: 'Không hút thuốc, Ngủ sớm, Sạch sẽ, Không nuôi pet'
};

// 1. Kiểm thử Nữ – Nữ (Cùng giới tính)
console.log('\n--- Test 1: Nữ – Nữ (Cùng giới tính) ---');
const female1 = { ...baseProfile, name: 'Vy Vo', gender: 'Nữ' };
const female2 = { ...baseProfile, name: 'Lan Anh', gender: 'Nữ' };
const resFemale = calcCompatibility(female1, female2);
assert(resFemale.genderScore === 100, 'Nữ – Nữ: Điểm giới tính phải đạt 100');
assert(resFemale.isOppositeGender === false, 'Nữ – Nữ: isOppositeGender phải là false');
assert(resFemale.score === 100, `Nữ – Nữ cùng thói quen: Tổng điểm đạt 100% (thực tế: ${resFemale.score}%)`);
assert(resFemale.matched.includes('Cùng giới tính'), 'Nữ – Nữ: Có lý do "Cùng giới tính" trong matched');

// 2. Kiểm thử Nam – Nam (Cùng giới tính)
console.log('\n--- Test 2: Nam – Nam (Cùng giới tính) ---');
const male1 = { ...baseProfile, name: 'Trần Minh Quân', gender: 'Nam' };
const male2 = { ...baseProfile, name: 'Lê Quốc Bảo', gender: 'Nam' };
const resMale = calcCompatibility(male1, male2);
assert(resMale.genderScore === 100, 'Nam – Nam: Điểm giới tính phải đạt 100');
assert(resMale.isOppositeGender === false, 'Nam – Nam: isOppositeGender phải là false');
assert(resMale.score === 100, `Nam – Nam cùng thói quen: Tổng điểm đạt 100% (thực tế: ${resMale.score}%)`);
assert(resMale.matched.includes('Cùng giới tính'), 'Nam – Nam: Có lý do "Cùng giới tính" trong matched');

// 3. Kiểm thử Nam – Nữ (Khác giới tính)
console.log('\n--- Test 3: Nam – Nữ (Khác giới tính) ---');
const resMaleFemale = calcCompatibility(female1, male1);
assert(resMaleFemale.genderScore === 0, 'Nam – Nữ: Điểm giới tính phải là 0');
assert(resMaleFemale.isOppositeGender === true, 'Nam – Nữ: isOppositeGender phải là true');
assert(resMaleFemale.score <= 50, `Nam – Nữ dù trùng khớp mọi thói quen: Điểm tối đa chỉ 50% (thực tế: ${resMaleFemale.score}%)`);
assert(resMaleFemale.different.includes('Khác giới tính'), 'Nam – Nữ: Có lý do "Khác giới tính" trong different');

// 4. Kiểm thử Khác – Khác (Cùng giới tính Khác)
console.log('\n--- Test 4: Khác – Khác (Cùng giới tính đặc thù) ---');
const otherGender1 = { ...baseProfile, name: 'Bạn A', gender: 'Khác' };
const otherGender2 = { ...baseProfile, name: 'Bạn B', gender: 'Khác' };
const resOtherBoth = calcCompatibility(otherGender1, otherGender2);
assert(resOtherBoth.genderScore === 100, 'Khác – Khác: Điểm giới tính phải đạt 100');
assert(resOtherBoth.isOppositeGender === false, 'Khác – Khác: isOppositeGender phải là false');
assert(resOtherBoth.score === 100, `Khác – Khác: Tổng điểm đạt 100% (thực tế: ${resOtherBoth.score}%)`);

// 5. Kiểm thử Khác – Nam / Khác – Nữ
console.log('\n--- Test 5: Khác – Nam (Khác giới tính) ---');
const resOtherMale = calcCompatibility(otherGender1, male1);
assert(resOtherMale.genderScore === 0, 'Khác – Nam: Điểm giới tính phải là 0');
assert(resOtherMale.isOppositeGender === true, 'Khác – Nam: isOppositeGender phải là true');
assert(resOtherMale.score <= 50, `Khác – Nam: Tổng điểm tối đa chỉ 50% (thực tế: ${resOtherMale.score}%)`);

// 6. Kiểm thử dữ liệu thiếu/undefined giới tính
console.log('\n--- Test 6: Giới tính thiếu/undefined (Xử lý an toàn, không crash) ---');
const noGenderProfile1 = { ...baseProfile, name: 'Ẩn danh', gender: undefined };
const noGenderProfile2 = { ...baseProfile, name: 'Khách', gender: null };
const resMissingGender = calcCompatibility(noGenderProfile1, male1);
assert(resMissingGender.genderScore === 50, 'Thiếu giới tính: Gán điểm trung tính 50, không crash');
assert(resMissingGender.score >= 50, `Thiếu giới tính: Điểm tính toán an toàn (thực tế: ${resMissingGender.score}%)`);

const resBothMissing = calcCompatibility(noGenderProfile1, noGenderProfile2);
assert(resBothMissing.genderScore === 50, 'Cả hai thiếu giới tính: Tính toán an toàn không crash');

// 7. Kiểm thử logic điều kiện ghép khác giới (allowCrossGender)
console.log('\n--- Test 7: Điều kiện ghép khác giới allowCrossGender ---');
function canMatchCrossGender(me, other) {
  const g1 = normalizeGender(me.gender);
  const g2 = normalizeGender(other.gender);
  if (g1 && g2 && g1 === g2) return true; // Cùng giới luôn được ghép
  return Boolean(me.allowCrossGender) && Boolean(other.allowCrossGender); // Khác giới chỉ khi cả 2 cùng bật
}

const meFemaleDefault = { gender: 'Nữ', allowCrossGender: false };
const otherMaleDefault = { gender: 'Nam', allowCrossGender: false };
const otherMaleOptIn = { gender: 'Nam', allowCrossGender: true };
const meFemaleOptIn = { gender: 'Nữ', allowCrossGender: true };

assert(canMatchCrossGender(meFemaleDefault, otherMaleDefault) === false, 'Tắt cả 2 bên: KHÔNG hiển thị nhau');
assert(canMatchCrossGender(meFemaleDefault, otherMaleOptIn) === false, 'Chỉ nam bật, nữ tắt: KHÔNG hiển thị nhau');
assert(canMatchCrossGender(meFemaleOptIn, otherMaleDefault) === false, 'Chỉ nữ bật, nam tắt: KHÔNG hiển thị nhau');
assert(canMatchCrossGender(meFemaleOptIn, otherMaleOptIn) === true, 'Cả hai bên cùng bật: ĐƯỢC PHÉP hiển thị nhau');
assert(canMatchCrossGender(meFemaleDefault, { gender: 'Nữ', allowCrossGender: false }) === true, 'Cùng Nữ - Nữ dù tắt tùy chọn: VẪN luôn hiển thị');

console.log('\n================================================================');
console.log(`🎉 KẾT QUẢ: Đã vượt qua ${passed}/${total} bài kiểm thử.`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
