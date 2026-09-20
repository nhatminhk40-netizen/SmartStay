import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Star, MapPin, Maximize, Users, BadgeCheck, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function trustColor(score) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50";
  if (score >= 50) return "text-amber-600 bg-amber-50";
  return "text-slate-500 bg-slate-100";
}

export default function RoomDetailDrawer({ room, open, onClose, onSeekingRoommate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !room) return;
    setLoading(true);
    base44.entities.Review.filter({ room_id: room.id })
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [open, room]);

  if (!open || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        <div className="relative h-52 bg-slate-100">
          <img src={room.image_url} alt={room.title} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white">
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {room.safe_badge && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Safe Listing
              </span>
            )}
            {room.seeking_roommate && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold">
                <Users className="w-3.5 h-3.5" /> Đang tìm ghép
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <h2 className="font-display font-extrabold text-slate-900 text-xl mb-1">{room.title}</h2>
          <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
            <MapPin className="w-4 h-4" /> {room.location} · {room.campus}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
            <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> {room.area_sqm}m²</span>
            <span>·</span>
            <span>{room.room_type}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{room.description}</p>

          {room.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {room.amenities.map((a) => (
                <span key={a} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">{a}</span>
              ))}
            </div>
          )}

          {room.seeking_roommate && (
            <button
              onClick={onSeekingRoommate}
              className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500"
            >
              <Users className="w-4 h-4" /> Bật Roommate Matcher cho phòng này
            </button>
          )}

          {/* Reviews */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-slate-900 text-base">Đánh giá ẩn danh</h3>
              <span className="text-xs text-slate-400">{reviews.length} review</span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                <Lock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                Chưa có đánh giá nào cho phòng này
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                          {r.anonymous_name?.[0] || "A"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{r.anonymous_name}</div>
                          {r.has_stayed && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                              <BadgeCheck className="w-3 h-3" /> Đã ở phòng này
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
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{r.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{r.stayed_period}</span>
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", trustColor(r.trust_score))}>
                        TrustScore {r.trust_score}
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