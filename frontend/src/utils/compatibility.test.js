import { calcCompatibility } from './compatibility.js';

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

console.log('--- BẮT ĐẦU KIỂM THỬ THUẬT TOÁN TƯƠNG THÍCH calcCompatibility ---');

// Case 1: Giống hệt nhau
const me1 = {
  name: 'Sinh viên A',
  campus: 'ĐH FPT Cần Thơ',
  budget: 2.2,
  smokingDrinking: 'none',
  sleepSchedule: 'early_bird',
  hasPet: false,
  petPolicy: 'no_pet',
  habits: 'Không hút thuốc, Ngủ sớm, Sạch sẽ'
};
const other1 = { ...me1, name: 'Sinh viên B' };
const res1 = calcCompatibility(me1, other1);
assert(res1.score === 100, `Trường hợp 1 (Giống hệt nhau): Điểm phải đạt 100%, thực tế: ${res1.score}%`);
assert(res1.matched.length >= 4, `Trường hợp 1: Có nhiều điểm giống nhau (${res1.matched.join(', ')})`);
assert(res1.different.length === 0, 'Trường hợp 1: Không có điểm khác biệt');

// Case 2: Khác nhau về hút thuốc (một bên không hút, một bên có hút)
const me2 = {
  name: 'Sinh viên Không Hút',
  campus: 'ĐH Cần Thơ',
  budget: 2.0,
  smokingDrinking: 'none',
  sleepSchedule: 'early_bird',
  hasPet: false
};
const other2 = {
  name: 'Sinh viên Có Hút',
  campus: 'ĐH Cần Thơ',
  budget: 2.0,
  smokingDrinking: 'yes',
  sleepSchedule: 'early_bird',
  hasPet: false
};
const res2 = calcCompatibility(me2, other2);
assert(res2.score < 80, `Trường hợp 2 (Khác hút thuốc): Điểm bị trừ nặng (${res2.score}%)`);
assert(
  res2.different.some(d => d.includes('khói thuốc')),
  `Trường hợp 2: Có ghi nhận khác biệt về khói thuốc: ${res2.different.join('; ')}`
);

// Case 3: Chênh lệch ngân sách lớn (>= 1.5 triệu)
const me3 = {
  name: 'Sinh viên Ngân sách thấp',
  campus: 'ĐH FPT',
  budget: 1.5,
  smokingDrinking: 'none',
  sleepSchedule: 'night_owl'
};
const other3 = {
  name: 'Sinh viên Ngân sách cao',
  campus: 'ĐH FPT',
  budget: 3.5, // chênh 2.0tr
  smokingDrinking: 'none',
  sleepSchedule: 'night_owl'
};
const res3 = calcCompatibility(me3, other3);
assert(
  res3.different.some(d => d.includes('ngân sách')),
  `Trường hợp 3: Ghi nhận chênh lệch ngân sách lớn: ${res3.different.join('; ')}`
);
assert(res3.score < 80, `Trường hợp 3: Điểm bị trừ vì ngân sách quá chênh lệch (${res3.score}%)`);

// Case 4: Thiếu dữ liệu (chuẩn hóa trọng số, không tính 0)
const me4 = {
  name: 'Sinh viên Thiếu Info',
  smokingDrinking: 'none',
  sleepSchedule: 'early_bird'
  // Thiếu campus, budget, pet
};
const other4 = {
  name: 'Sinh viên Đầy Đủ',
  campus: 'ĐH Y Dược',
  budget: 2.5,
  smokingDrinking: 'none',
  sleepSchedule: 'early_bird',
  hasPet: true
};
const res4 = calcCompatibility(me4, other4);
// Hai người này chỉ có hút thuốc (25/25) và giờ ngủ (25/25). Chuẩn hóa 50/50 = 100%
assert(res4.score === 100, `Trường hợp 4 (Thiếu dữ liệu): Chuẩn hóa trọng số đạt 100%, thực tế: ${res4.score}%`);

// Case 5: Không có hồ sơ của tôi (me = null hoặc rỗng)
const res5 = calcCompatibility(null, other1);
assert(res5.score === null, 'Trường hợp 5 (Không có hồ sơ của tôi): Trả về score === null');
assert(res5.matched.length === 0, 'Trường hợp 5: matched rỗng');

console.log(`\n=== KẾT QUẢ: ${passed}/${total} TESTS PASSED ===\n`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
