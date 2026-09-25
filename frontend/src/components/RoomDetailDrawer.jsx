import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Star, MapPin, Maximize, Users, BadgeCheck, Lock, Zap, Droplets, Gauge, ShieldAlert, Phone, Send, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function trustColor(score) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50";
  if (score >= 50) return "text-amber-600 bg-amber-50";
  return "text-slate-500 bg-slate-100";
}

function getElecLabel(type) {
  if (type === 'nha_nuoc') return 'Điện giá nhà nước (minh bạch)';
  if (type === 'kinh_doanh') return 'Điện giá kinh doanh (~3.500 - 4.000đ/kWh)';
  if (type === 'gia_co_dinh') return 'Điện khoán cố định';
  return 'Theo thỏa thuận chủ trọ';
}

function formatPrice(p) {
  if (!p) return '0đ';
  return Number(p).toLocaleString('vi-VN') + ' VNĐ';
}

export default function RoomDetailDrawer({ room, open, onClose, onSeekingRoommate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Review Form state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newStudentName, setNewStudentName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newIsAccurate, setNewIsAccurate] = useState(true);
  const [newActualCost, setNewActualCost] = useState(room?.price || 2500000);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const roomId = room?.id || room?._id;

  const loadReviews = () => {
    if (!roomId) return;
    setLoading(true);
    base44.entities.Review.filter({ room_id: roomId })
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || !room) return;
    loadReviews();
    setShowAddReview(false);
    setReviewSuccess(false);
    if (room.price) setNewActualCost(room.price);
  }, [open, room]);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !roomId) return;
    setSubmittingReview(true);
    try {
      await base44.entities.Review.create({
        room: roomId,
        studentName: newStudentName.trim() || 'Sinh viên ẩn danh',
        rating: newRating,
        isCostAccurate: newIsAccurate,
        actualMonthlyCost: Number(newActualCost) || room.price,
        comment: newComment.trim(),
        has_stayed: true,
        stayed_period: 'Kỳ học gần nhất'
      });
      setReviewSuccess(true);
      setShowAddReview(false);
      setNewComment("");
      setNewStudentName("");
      loadReviews();
    } catch (err) {
      console.error('Lỗi khi gửi review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!open || !room) return null;

  const extraFees = room.extraFees || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Banner Image */}
        <div className="relative h-56 bg-slate-100 shrink-0">
          <img src={room.image_url} alt={room.title} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow">
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {room.safe_badge && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow">
                <ShieldCheck className="w-3.5 h-3.5" /> Safe Listing
              </span>
            )}
            {room.seeking_roommate && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow">
                <Users className="w-3.5 h-3.5" /> Đang tìm ghép
              </span>
            )}
            {room.has_pass && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-900 text-xs font-bold shadow">
                Pass · còn {room.pass_months_left} tháng
              </span>
            )}
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {/* Header Info */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xl font-display font-extrabold text-indigo-600">
              {formatPrice(room.price)}
              <span className="text-xs font-normal text-slate-500">/tháng</span>
            </span>
            <span className="text-xs text-slate-400">Cọc {room.depositMonths || 1} tháng</span>
          </div>

          <h2 className="font-display font-extrabold text-slate-900 text-lg mb-1 leading-snug">{room.title}</h2>
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {room.location} · {room.campus}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {room.area_sqm}m²</span>
            <span>·</span>
            <span>{room.room_type}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Phone className="w-3 h-3" /> {room.contactPhone || '0901234567'}</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">{room.description}</p>

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-700 mb-2">Tiện nghi sẵn có:</div>
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((a) => (
                  <span key={a} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* BẢNG KIỂM KÊ CHI PHÍ MINH BẠCH (TRỌNG TÂM SMARTSTAY) */}
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display font-bold text-slate-900 text-sm">Bảng chi phí minh bạch</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Tiền điện
                </span>
                <span className="font-semibold text-slate-800">{getElecLabel(room.electricityCostType)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Tiền nước
                </span>
                <span className="font-semibold text-slate-800">{room.waterCost || 'Theo giá nhà nước'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" /> Đồng hồ riêng
                </span>
                <span className="font-semibold text-slate-800">{room.hasSeparateMeter ? 'Có (riêng từng phòng)' : 'Dùng chung'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                <span className="text-slate-600">Phụ phí Wifi / Rác / Gửi xe</span>
                <span className="font-semibold text-slate-800">
                  {((extraFees.wifi || 0) + (extraFees.trash || 0) + (extraFees.parking || 0)).toLocaleString('vi-VN')}đ/tháng
                </span>
              </div>
            </div>
          </div>

          {/* Smart Matcher Button */}
          {room.seeking_roommate && (
            <button
              onClick={onSeekingRoommate}
              className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-100"
            >
              <Users className="w-4 h-4" /> Bật Roommate Matcher cho phòng này
            </button>
          )}

          {/* REVIEWS SECTION */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Đánh giá từ sinh viên ({reviews.length})</h3>
                <p className="text-[11px] text-slate-400">Công khai minh bạch · Có xác thực đã ở</p>
              </div>
              <button
                onClick={() => setShowAddReview(!showAddReview)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                {showAddReview ? 'Đóng form' : '+ Đăng đánh giá'}
              </button>
            </div>

            {reviewSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đánh giá của bạn đã được đăng công khai minh bạch!</span>
              </div>
            )}

            {/* Form viết đánh giá công khai */}
            {showAddReview && (
              <form onSubmit={handlePostReview} className="mb-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">Đăng đánh giá phòng trọ</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Đánh giá công khai giúp cộng đồng sinh viên nắm rõ thông tin giá và điều kiện phòng thực tế.</p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Họ tên & Trường / Khóa (Công khai)</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A - K18 ĐH FPT Cần Thơ"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Số sao hài lòng</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={cn("w-5 h-5", s <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Chi phí thực tế có đúng như đăng tin?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewIsAccurate(true)}
                      className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors", newIsAccurate ? "bg-emerald-600 text-white" : "bg-white border text-slate-600")}
                    >
                      Đúng giá cam kết
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIsAccurate(false)}
                      className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors", !newIsAccurate ? "bg-rose-600 text-white" : "bg-white border text-slate-600")}
                    >
                      Có phụ phí ẩn
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Nhận xét thực tế (an ninh, vệ sinh, chủ trọ...)</label>
                  <textarea
                    rows={2}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm thực tế để hỗ trợ các bạn sinh viên khác..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> {submittingReview ? 'Đang gửi...' : 'Đăng đánh giá công khai'}
                </button>
              </form>
            )}

            {/* List Reviews */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Lock className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
                Chưa có đánh giá nào. Hãy là người đầu tiên review phòng này!
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((r) => (
                  <div key={r.id || r._id} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {(r.studentName || r.anonymous_name || "S")[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            {r.studentName || r.anonymous_name || "Sinh viên"}
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500" title="Sinh viên đã xác thực" />
                          </div>
                          {r.has_stayed && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                              Đã ở thực tế · {r.stayed_period || "Kỳ gần nhất"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cn("w-3 h-3", n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2.5">{r.content || r.comment}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                      <span className={cn("font-semibold", r.isCostAccurate ? "text-emerald-600" : "text-amber-600")}>
                        {r.isCostAccurate ? "✓ Chi phí đúng cam kết" : "⚠ Có phát sinh phụ phí"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-md font-bold", trustColor(r.trust_score))}>
                        Độ uy tín {r.trust_score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}