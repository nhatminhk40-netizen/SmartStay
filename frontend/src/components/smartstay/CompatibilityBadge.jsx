import React from 'react';
import { Sparkles, Check, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

/**
 * Huy hiệu hiển thị % độ tương thích ở góc thẻ
 */
export function CompatibilityBadge({ compat, onPromptCreateProfile }) {
  if (!compat || compat.score === null) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPromptCreateProfile?.();
        }}
        className="inline-flex items-center gap-1 text-[10px] md:text-[11px] px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 border border-orange-200/90 hover:border-orange-300 font-semibold shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer"
        title="Tạo hồ sơ của bạn để tính điểm hòa hợp"
      >
        <Sparkles className="w-3 h-3 text-orange-500" />
        <span>Tạo hồ sơ xem độ hợp</span>
      </button>
    );
  }

  const score = compat.score;
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-300/80';
  let dotColor = 'bg-slate-400';

  if (score >= 80) {
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs';
    dotColor = 'bg-emerald-500';
  } else if (score >= 60) {
    colorClass = 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs';
    dotColor = 'bg-amber-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {score}% hợp
    </span>
  );
}

/**
 * Dòng tóm tắt Giống / Khác kèm Popover chi tiết bên dưới phần tag
 */
export function CompatibilitySummaryRow({ compat, candidateName = 'Bạn này', onPromptCreateProfile }) {
  if (!compat || compat.score === null) {
    return (
      <button
        type="button"
        onClick={onPromptCreateProfile}
        className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-orange-50/50 hover:bg-orange-50 border border-dashed border-orange-200/80 text-left text-[11px] text-orange-800 flex items-center justify-between group transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>Tạo hồ sơ của bạn để xem các điểm tương đồng lối sống</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>
    );
  }

  const hasMatched = compat.matched && compat.matched.length > 0;
  const hasDiff = compat.different && compat.different.length > 0;

  if (!hasMatched && !hasDiff) return null;

  const matchedPreview = (compat.matched || []).slice(0, 2).join(', ');
  const diffPreview = (compat.different || []).slice(0, 2).join(', ');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full mt-2.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-left text-[11px] text-slate-700 flex items-center justify-between gap-1.5 transition cursor-pointer group"
          title="Bấm để xem chi tiết so sánh lối sống"
        >
          <div className="truncate flex-1">
            {hasMatched && (
              <span className="text-emerald-700 font-medium">
                <strong>Giống:</strong> {matchedPreview}
              </span>
            )}
            {hasMatched && hasDiff && <span className="mx-1 text-slate-400">·</span>}
            {hasDiff && (
              <span className="text-amber-700 font-medium">
                <strong>Khác:</strong> {diffPreview}
              </span>
            )}
          </div>
          <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-80 p-4 rounded-2xl shadow-xl border border-border bg-white text-xs">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
          <div className="flex items-center gap-1.5 font-heading font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Độ hòa hợp: {compat.score}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground">So với hồ sơ của bạn</span>
        </div>

        {/* Danh sách điểm giống nhau */}
        {hasMatched && (
          <div className="mb-3">
            <p className="font-bold text-emerald-800 text-[11px] mb-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Điểm tương đồng ({compat.matched.length}):
            </p>
            <ul className="space-y-1 pl-4 text-slate-600 list-disc list-outside marker:text-emerald-500">
              {compat.matched.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Danh sách điểm khác nhau */}
        {hasDiff && (
          <div>
            <p className="font-bold text-amber-800 text-[11px] mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Điểm cần lưu ý / khác biệt ({compat.different.length}):
            </p>
            <ul className="space-y-1 pl-4 text-slate-600 list-disc list-outside marker:text-amber-500">
              {compat.different.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-muted-foreground italic text-center">
          * Đánh giá dựa trên 6 tiêu chí: khói thuốc, giờ ngủ, ngân sách, trường học, thú cưng & thói quen sinh hoạt.
        </div>
      </PopoverContent>
    </Popover>
  );
}
