/**
 * Chuẩn hóa nhãn giới tính sang tiếng Việt có dấu.
 * Dùng chung toàn trang và trong các bộ lọc.
 * 
 * @param {string} val 
 * @returns {'Nam' | 'Nữ' | 'Khác' | null}
 */
export function formatGender(val) {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();

  if (['nam', 'male', 'trai', 'boy'].includes(clean)) {
    return 'Nam';
  }

  if (['nu', 'nữ', 'female', 'gai', 'gái', 'girl'].includes(clean)) {
    return 'Nữ';
  }

  if (['khac', 'khác', 'other', 'linh hoat', 'linh hoạt', 'flexible', 'lgbt'].includes(clean)) {
    return 'Khác';
  }

  return null;
}

/**
 * Trả về class màu sắc theo giới tính
 * @param {string} val 
 * @returns {string}
 */
export function getGenderBadgeClass(val) {
  const g = formatGender(val);
  if (g === 'Nữ') {
    return 'bg-rose-50 text-rose-600 border-rose-200';
  }
  if (g === 'Nam') {
    return 'bg-blue-50 text-blue-600 border-blue-200';
  }
  if (g === 'Khác') {
    return 'bg-purple-50 text-purple-600 border-purple-200';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200';
}
