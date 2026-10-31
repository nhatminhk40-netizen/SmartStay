import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, FileText, AlertCircle, Loader2, Home, User, Phone, Calendar } from 'lucide-react';

export default function StayConfirmPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchTokenInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/stay-confirmation/${token}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 72 giờ).');
        }
      } catch (err) {
        setError('Không thể kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchTokenInfo();
  }, [token]);

  const handleAction = async (action) => {
    if (action === 'reject' && !note.trim()) {
      const promptNote = window.prompt('Vui lòng nhập lý do từ chối:');
      if (promptNote === null) return;
      setNote(promptNote);
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/stay-confirmation/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const json = await res.json();
      if (json.success) {
        setResult({
          type: action === 'confirm' ? 'success' : 'rejected',
          message: action === 'confirm'
            ? 'Đã xác nhận nhận phòng thành công! Người thuê hiện đã được kích hoạt lưu trú chính thức.'
            : 'Đã từ chối xác nhận hợp đồng này.'
        });
      } else {
        alert(json.message || 'Thao tác không thành công.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          Đang tải thông tin xác nhận lưu trú...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900">Liên kết không khả dụng</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Về trang chủ SmartStay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tenant = data.tenant || {};
  const room = data.room || {};

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-amber-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">
            <ShieldCheck className="w-4 h-4" />
            Xác thực Hợp đồng Lưu trú
          </div>
          <h1 className="text-xl md:text-2xl font-black font-heading">
            Duyệt Người thuê Phòng trọ
          </h1>
          <p className="text-xs text-amber-100 mt-1">
            Người thuê đã tải lên hợp đồng thuê phòng. Hãy kiểm tra đối chiếu trước khi duyệt.
          </p>
        </div>

        {result ? (
          <div className="p-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              result.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {result.type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>
            <h3 className="font-heading font-black text-xl text-slate-900">
              {result.type === 'success' ? 'Đã duyệt nhận phòng!' : 'Đã từ chối'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              {result.message}
            </p>
            <div className="pt-4">
              <Link
                to="/chu-tro"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Vào Bảng Quản trị Chủ trọ
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            {/* Tenant Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thông tin người thuê:
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center shrink-0">
                  {tenant.fullName ? tenant.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {tenant.fullName || 'Người thuê'}
                  </div>
                  <div className="text-slate-500 flex items-center gap-3">
                    {tenant.phone && <span>📞 {tenant.phone}</span>}
                    {tenant.email && <span>✉️ {tenant.email}</span>}
                  </div>
                  {tenant.campus && (
                    <div className="text-slate-600 font-medium">📍 {tenant.campus}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Room Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Phòng trọ lưu trú:
              </div>
              <div className="font-bold text-slate-900 text-sm">{room.title || 'Phòng trọ SmartStay'}</div>
              <div className="text-slate-600">📍 {room.address || 'Cần Thơ'}</div>
              <div className="text-orange-600 font-bold">
                {room.price ? `${Number(room.price).toLocaleString('vi-VN')} đ/tháng` : ''}
              </div>
            </div>

            {/* Contract File Access */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <div className="font-bold text-amber-900">Tệp hợp đồng đã tải lên</div>
                  <div className="text-[11px] text-amber-700">Được mã hóa và lưu trữ riêng tư</div>
                </div>
              </div>
              <a
                href={data.contractFileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs shadow-xs"
              >
                Mở xem tệp
              </a>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ghi chú của chủ trọ (Tùy chọn):
              </label>
              <textarea
                rows={2}
                placeholder="Nhập ghi chú phản hồi cho người thuê nếu cần..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction('confirm')}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Xác nhận nhận phòng</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction('reject')}
                className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Từ chối</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

