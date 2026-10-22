import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_REASONS = [
  { id: 'fake_info', label: 'Thông tin giả / Mạo danh' },
  { id: 'harassment', label: 'Quấy rối / Thái độ thiếu văn minh' },
  { id: 'spam', label: 'Spam / Chèo kéo dịch vụ' },
  { id: 'other', label: 'Lý do khác' }
];

export default function ReportModal({ open, onClose, profile, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].label);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open || !profile) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          profileId: profile.id || profile._id,
          reason: selectedReason,
          detail: description
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative border border-border">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề modal */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 id="report-modal-title" className="font-heading font-bold text-base text-foreground">
              Báo cáo hồ sơ ở ghép
            </h3>
            <p className="text-xs text-muted-foreground">
              Báo cáo vi phạm về người dùng <strong className="text-slate-800">{profile.name}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Lý do bạn báo cáo hồ sơ này (*):
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason.label
                      ? 'bg-rose-50/60 border-rose-300 text-rose-950 font-semibold'
                      : 'border-border/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.label}
                    checked={selectedReason === reason.label}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-rose-600 w-3.5 h-3.5"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="report-detail" className="text-xs font-bold text-slate-700 block mb-1">
              Mô tả chi tiết (tùy chọn):
            </label>
            <textarea
              id="report-detail"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm thông tin vi phạm để Ban quản trị xử lý nhanh nhất..."
              className="w-full px-3 py-2 rounded-xl border border-input text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold px-4 h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 h-9"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Đang gửi...
                </>
              ) : (
                'Gửi báo cáo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
