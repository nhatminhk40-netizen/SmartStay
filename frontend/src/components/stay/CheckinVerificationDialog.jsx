import React, { useState } from 'react';
import { Key, Send, Upload, CheckCircle2, AlertCircle, X, ShieldCheck, Calendar, FileText, Loader2 } from 'lucide-react';
import { base44 } from '../../api/base44Client';

export default function CheckinVerificationDialog({ isOpen, onClose, room, onVerificationSuccess }) {
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'request' | 'contract'
  
  // State for Checkin Code
  const [checkinCode, setCheckinCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  
  // State for Landlord Request
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tenantNote, setTenantNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  // State for Contract Upload
  const [contractFile, setContractFile] = useState(null);
  const [contractNote, setContractNote] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Success Message
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  // 1. Submit Check-in Code
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!checkinCode.trim()) {
      setCodeError('Vui lòng nhập mã nhận phòng do chủ trọ cung cấp.');
      return;
    }
    setCodeLoading(true);
    setCodeError('');

    try {
      const res = await base44.entities.Stay.redeemCode(checkinCode.trim(), room?.id || room?._id);
      if (res.success) {
        setSuccessInfo({
          title: 'Kích hoạt nhận phòng thành công!',
          message: 'Bạn đã được hệ thống công nhận là người thuê thật của phòng này. Sau khi ở đủ 14 ngày, bạn sẽ có thể gửi đánh giá.',
          stay: res.data
        });
        if (onVerificationSuccess) onVerificationSuccess(res.data);
      } else {
        setCodeError(res.message || 'Mã nhận phòng không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setCodeError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setCodeLoading(false);
    }
  };

  // 2. Submit Landlord Confirm Request
  const handleRequestCheckin = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError('');

    try {
      const roomId = room?.id || room?._id;
      const res = await base44.entities.Stay.requestCheckin(roomId, tenantNote, checkInDate);
      if (res.success) {
        setSuccessInfo({
          title: 'Đã gửi yêu cầu tới Chủ trọ!',
          message: 'Chủ nhà trọ đã nhận được thông báo xác nhận nhận phòng của bạn. Sau khi chủ trọ phê duyệt, đợt lưu trú sẽ được kích hoạt.',
          stay: res.data
        });
        if (onVerificationSuccess) onVerificationSuccess(res.data);
      } else {
        setRequestError(res.message || 'Không thể gửi yêu cầu nhận phòng.');
      }
    } catch (err) {
      setRequestError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.');
    } finally {
      setRequestLoading(false);
    }
  };

  // 3. Submit Contract Upload
  const handleUploadContract = async (e) => {
    e.preventDefault();
    if (!contractFile) {
      setUploadError('Vui lòng chọn tệp hợp đồng thuê (PDF, JPG, PNG).');
      return;
    }
    setUploadLoading(true);
    setUploadError('');

    try {
      const roomId = room?.id || room?._id;
      // Tạo Stay requested trước nếu chưa có
      const stayRes = await base44.entities.Stay.requestCheckin(roomId, contractNote || 'Tải hợp đồng xác minh');
      const stayId = stayRes.data?._id || stayRes.stay?._id;

      if (!stayId) {
        setUploadError(stayRes.message || 'Không thể khởi tạo đợt lưu trú.');
        setUploadLoading(false);
        return;
      }

      // Upload file hợp đồng vào Stay
      const uploadRes = await base44.entities.Stay.uploadContract(stayId, contractFile);
      if (uploadRes.success) {
        setSuccessInfo({
          title: 'Đã tải lên hợp đồng thuê an toàn!',
          message: 'Hợp đồng được mã hóa và gửi thông báo kèm liên kết xác thực 72h cho chủ trọ để đối soát.',
          stay: uploadRes.data
        });
        if (onVerificationSuccess) onVerificationSuccess(uploadRes.data);
      } else {
        setUploadError(uploadRes.message || 'Lỗi khi tải tệp hợp đồng.');
      }
    } catch (err) {
      setUploadError('Lỗi xử lý tải tệp hợp đồng. Vui lòng thử lại.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Xác minh Người thuê thật</h3>
              <p className="text-xs text-amber-100 line-clamp-1">{room?.title || 'Phòng trọ SmartStay'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {successInfo ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{successInfo.title}</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {successInfo.message}
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow-md shadow-orange-500/20"
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-4 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60 leading-relaxed">
                🛡️ <strong>Chính sách Minh bạch SmartStay:</strong> Chỉ người dùng đã thực sự sinh sống tại phòng này và được chủ trọ xác nhận mới được gửi đánh giá trải nghiệm thực tế. Chọn 1 trong 3 cách sau:
              </p>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                    activeTab === 'code'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  Mã nhận phòng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                    activeTab === 'request'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi yêu cầu chủ trọ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contract')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                    activeTab === 'contract'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Tải hợp đồng
                </button>
              </div>

              {/* TAB 1: Check-in Code */}
              {activeTab === 'code' && (
                <form onSubmit={handleRedeemCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mã nhận phòng (Do chủ trọ cấp):
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: SS-K82MN9"
                      value={checkinCode}
                      onChange={(e) => setCheckinCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 text-center text-lg tracking-widest font-mono font-bold uppercase rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
                      maxLength={12}
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      💡 Chủ nhà trọ có thể tạo mã nhận phòng 6 ký tự dùng 1 lần trong Bảng quản lý chủ trọ.
                    </p>
                  </div>

                  {codeError && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{codeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={codeLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-2xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>Xác thực & Kích hoạt nhận phòng</span>
                  </button>
                </form>
              )}

              {/* TAB 2: Request Checkin */}
              {activeTab === 'request' && (
                <form onSubmit={handleRequestCheckin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      Ngày bạn đã chuyển vào sinh sống:
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ghi chú gửi chủ trọ (Tùy chọn):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Em là Minh sinh viên thuê phòng 102 từ đầu tháng..."
                      value={tenantNote}
                      onChange={(e) => setTenantNote(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs resize-none"
                    />
                  </div>

                  {requestError && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-2xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Gửi yêu cầu tới Chủ nhà trọ</span>
                  </button>
                </form>
              )}

              {/* TAB 3: Contract Upload */}
              {activeTab === 'contract' && (
                <form onSubmit={handleUploadContract} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      Tải ảnh chụp hoặc PDF Hợp đồng thuê trọ:
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setContractFile(e.target.files[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-2xl p-1.5"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      🔒 File hợp đồng được lưu trữ riêng tư, chỉ bạn, chủ trọ và Admin mới có thể xem để đối soát.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ghi chú thêm:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Hợp đồng ký ngày 01/09/2026 thời hạn 12 tháng"
                      value={contractNote}
                      onChange={(e) => setContractNote(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs"
                    />
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-2xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Tải lên hợp đồng xác minh</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
