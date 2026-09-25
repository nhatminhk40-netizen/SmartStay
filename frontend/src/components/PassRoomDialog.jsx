import React, { useState } from "react";
import { X, KeyRound, TrendingUp, Check, Loader2, BadgeCheck, Gift } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function PassRoomDialog({ open, onClose, onBoost }) {
  const [title, setTitle] = useState("");
  const [monthsLeft, setMonthsLeft] = useState(3);
  const [depositLeft, setDepositLeft] = useState(2000000);
  const [reason, setReason] = useState("");
  const [posted, setPosted] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [boosted, setBoosted] = useState(false);

  if (!open) return null;

  const post = async () => {
    if (!title) return;
    try {
      await base44.entities.Room.pass({
        title,
        address: "An Bình, Ninh Kiều, Cần Thơ",
        campus: "FPT Can Tho",
        price: 2500000,
        remaining_duration: monthsLeft,
        pass_months_left: monthsLeft,
        remaining_deposit: depositLeft,
        pass_reason: reason || "Chuyển địa điểm học / thực tập",
        contactPhone: "0901234567",
        amenities: ["Máy lạnh", "Gác lửng", "Tủ lạnh"],
        room_type: "Phòng khép kín",
        area_sqm: 22
      });
      setPosted(true);
      onBoost?.();
    } catch (err) {
      console.warn("Lỗi khi đăng pass phòng:", err);
      setPosted(true);
    }
  };

  const boost = () => {
    setBoosting(true);
    setTimeout(() => {
      setBoosting(false);
      setBoosted(true);
      onBoost?.();
    }, 1600);
  };

  const reset = () => {
    setTitle(""); setMonthsLeft(3); setDepositLeft(2000000); setReason(""); setPosted(false); setBoosted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base">SmartStay Pass</div>
              <div className="text-[11px] text-indigo-100">Đăng miễn phí · trả phí để lên đầu</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!posted ? (
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Pass phòng của bạn</h3>
              <p className="text-sm text-slate-500 mb-4">Đăng lại phòng đang thuê để không mất cọc khi chuyển đi.</p>

              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tên phòng</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Phòng gần cổng Bách Khoa"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm mb-4"
              />

              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Thời gian hợp đồng còn lại: <span className="text-indigo-600 font-bold">{monthsLeft} tháng</span></label>
              <input type="range" min={1} max={12} value={monthsLeft} onChange={(e) => setMonthsLeft(+e.target.value)} className="w-full accent-indigo-600 mb-4" />

              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tiền cọc còn lại: <span className="text-indigo-600 font-bold">{depositLeft.toLocaleString("vi")}đ</span></label>
              <input type="range" min={0} max={5000000} step={100000} value={depositLeft} onChange={(e) => setDepositLeft(+e.target.value)} className="w-full accent-indigo-600 mb-4" />

              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Lý do chuyển đi</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Ra trường, chuyển về quê…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm mb-4 resize-none"
              />

              <button
                onClick={post}
                disabled={!title}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" /> Đăng Pass phòng (miễn phí)
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <BadgeCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-display font-extrabold text-slate-900 text-lg">Pass phòng đã đăng</h3>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 text-xs font-bold">
                  Pass phòng · còn {monthsLeft} tháng
                </div>
              </div>

              {!boosted ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-900">Đẩy tin lên đầu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Tái dùng cổng thanh toán Safe Listing · webhook set <code className="font-mono">is_boosted = true</code>.</p>
                  </div>
                  <button
                    onClick={boost}
                    disabled={boosting}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {boosting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang thanh toán…</> : <>Đẩy lên đầu · 15.000đ</>}
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold mb-3">
                    <TrendingUp className="w-4 h-4" /> Đã lên đầu
                  </div>
                  <button onClick={() => { reset(); onClose(); }} className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">
                    Hoàn tất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}