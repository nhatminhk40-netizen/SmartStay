import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  Building,
  User,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { base44 } from '../../api/base44Client';

export default function LandlordStayManager({ rooms = [], defaultSubTab = 'codes' }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab); // 'codes' | 'pending' | 'active'
  const [internalRooms, setInternalRooms] = useState(rooms);

  // State for Pending Stays
  const [pendingStays, setPendingStays] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // State for Active Stays
  const [activeStays, setActiveStays] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);

  // State for Check-in Codes
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkinCodes, setCheckinCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeNote, setCodeNote] = useState('');

  // Processing state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Load Pending Stays
  const loadPendingStays = async () => {
    setLoadingPending(true);
    try {
      const res = await base44.entities.Stay.getPending();
      if (res.success && Array.isArray(res.data)) {
        setPendingStays(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải pending stays:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Load Active Stays
  const loadActiveStays = async () => {
    setLoadingActive(true);
    try {
      const res = await base44.entities.Stay.getActive();
      if (res.success && Array.isArray(res.data)) {
        setActiveStays(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải active stays:', err);
    } finally {
      setLoadingActive(false);
    }
  };

  // Load Checkin Codes for selected room
  const loadCheckinCodes = async (roomId) => {
    if (!roomId) return;
    setLoadingCodes(true);
    try {
      const res = await base44.entities.Stay.getCheckinCodes(roomId);
      if (res.success && Array.isArray(res.data)) {
        setCheckinCodes(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải checkin codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadPendingStays();
    loadActiveStays();
  }, []);

    useEffect(() => {
    if (rooms && rooms.length > 0) {
      setInternalRooms(rooms);
    } else {
      base44.entities.Room.getAll().then(res => {
        if (res && res.data && Array.isArray(res.data)) {
          setInternalRooms(res.data);
        }
      }).catch(err => console.warn('Lỗi tải danh sách phòng fallback:', err));
    }
  }, [rooms]);

  useEffect(() => {
    if (internalRooms.length > 0 && !selectedRoomId) {
      const firstId = internalRooms[0]._id || internalRooms[0].id;
      setSelectedRoomId(firstId);
    }
  }, [internalRooms]);

  useEffect(() => {
    if (selectedRoomId) {
      loadCheckinCodes(selectedRoomId);
    }
  }, [selectedRoomId]);

  // Handle Confirm Check-in
  const handleConfirmCheckin = async (stayId) => {
    setActionLoadingId(stayId);
    setStatusMessage({ text: '', type: '' });
    try {
      const res = await base44.entities.Stay.confirmCheckin(stayId, new Date().toISOString(), 'Đã xác nhận nhận phòng');
      if (res.success) {
        setStatusMessage({ text: 'Đã xác nhận nhận phòng thành công! Người thuê đã được chuyển sang trạng thái đang ở.', type: 'success' });
        loadPendingStays();
        loadActiveStays();
      } else {
        setStatusMessage({ text: res.message || 'Lỗi khi xác nhận nhận phòng.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Check-in
  const handleRejectCheckin = async (stayId) => {
    const reason = window.prompt('Nhập lý do từ chối yêu cầu nhận phòng (ví dụ: Không khớp danh sách thuê):');
    if (reason === null) return;

    setActionLoadingId(stayId);
    setStatusMessage({ text: '', type: '' });
    try {
      const res = await base44.entities.Stay.rejectCheckin(stayId, reason || 'Chủ trọ từ chối');
      if (res.success) {
        setStatusMessage({ text: 'Đã từ chối yêu cầu nhận phòng.', type: 'success' });
        loadPendingStays();
      } else {
        setStatusMessage({ text: res.message || 'Lỗi khi từ chối yêu cầu.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Confirm Check-out (Trả phòng)
  const handleConfirmCheckout = async (stayId) => {
    if (!window.confirm('Xác nhận khách thuê này đã hoàn tất trả phòng và thanh toán các khoản phí?')) {
      return;
    }

    setActionLoadingId(stayId);
    setStatusMessage({ text: '', type: '' });
    try {
      const res = await base44.entities.Stay.confirmCheckout(stayId, new Date().toISOString(), 'Đã hoàn tất trả phòng');
      if (res.success) {
        setStatusMessage({ text: 'Đã xác nhận trả phòng! Đợt lưu trú đã hoàn tất (Completed).', type: 'success' });
        loadActiveStays();
      } else {
        setStatusMessage({ text: res.message || 'Lỗi khi xác nhận trả phòng.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Create Check-in Code
  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) {
      alert('Vui lòng chọn phòng trọ cần tạo mã.');
      return;
    }

    setCreatingCode(true);
    setNewlyCreatedCode(null);
    try {
      const res = await base44.entities.Stay.createCheckinCode(selectedRoomId, codeNote || 'Mã nhận phòng');
      if (res.success && res.data) {
        setNewlyCreatedCode(res.data);
        setCodeNote('');
        loadCheckinCodes(selectedRoomId);
      } else {
        alert(res.message || 'Lỗi khi tạo mã nhận phòng.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi tạo mã.');
    } finally {
      setCreatingCode(false);
    }
  };

  // Handle Revoke Code
  const handleRevokeCode = async (codeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi mã nhận phòng này?')) return;
    try {
      const res = await base44.entities.Stay.revokeCheckinCode(codeId);
      if (res.success) {
        loadCheckinCodes(selectedRoomId);
      } else {
        alert(res.message || 'Lỗi khi thu hồi mã.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            Cơ chế Xác minh Người thuê thật (Stay Verification)
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-heading">
            Quản lý Nhận phòng & Lưu trú
          </h2>
          <p className="text-xs md:text-sm text-amber-100 max-w-2xl mt-1">
            Xác thực người thuê thực tế giúp kích hoạt huy hiệu "✓ Đã ở thật" trên đánh giá, tăng điểm uy tín Trust Score cho cơ sở của bạn.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              loadPendingStays();
              loadActiveStays();
              if (selectedRoomId) loadCheckinCodes(selectedRoomId);
            }}
            className="px-4 py-2 bg-white text-orange-600 rounded-xl text-xs font-bold hover:bg-amber-50 transition shadow-sm"
          >
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
        <button
          onClick={() => setActiveSubTab('codes')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'codes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4 text-orange-500" />
          <span>Tạo mã nhận phòng (6 số)</span>
          <span className="text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase ml-1">Hot</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pending'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Yêu cầu nhận phòng</span>
          {pendingStays.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center ml-1">
              {pendingStays.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('active')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'active'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Khách đang thuê</span>
          <span className="text-[11px] opacity-70 ml-1">({activeStays.length})</span>
        </button>
      </div>

      {/* ── SUB-TAB 1: YÊU CẦU NHẬN PHÒNG CHỜ DUYỆT ── */}
      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Danh sách yêu cầu nhận phòng chờ xác nhận ({pendingStays.length})
            </h3>
          </div>

          {loadingPending ? (
            <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải yêu cầu...
            </div>
          ) : pendingStays.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Hiện không có yêu cầu nhận phòng nào đang chờ duyệt.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingStays.map((stay) => {
                const tenant = stay.tenantId || {};
                const room = stay.roomId || {};
                const isLoading = actionLoadingId === stay._id;

                return (
                  <div
                    key={stay._id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm">
                          {tenant.fullName ? tenant.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {tenant.fullName || 'Người thuê'}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            {tenant.phone && <span>📞 {tenant.phone}</span>}
                            {tenant.campus && <span>🎓 {tenant.campus}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        🏠 {room.title || 'Phòng trọ'}
                      </div>
                      <div className="text-slate-500">
                        📍 {room.address || 'Cần Thơ'}
                      </div>
                      {stay.checkInDate && (
                        <div className="text-orange-600 font-medium">
                          📅 Ngày chuyển vào: {new Date(stay.checkInDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      {stay.tenantNote && (
                        <div className="text-slate-600 italic bg-amber-50/50 p-2 rounded-lg mt-1">
                          "{stay.tenantNote}"
                        </div>
                      )}
                      {stay.contractFileUrl && (
                        <div className="pt-1">
                          <a
                            href={stay.contractFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" /> Xem tệp hợp đồng đính kèm
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleConfirmCheckin(stay._id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Xác nhận nhận phòng</span>
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleRejectCheckin(stay._id)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: DANH SÁCH KHÁCH ĐANG THUÊ (ACTIVE) ── */}
      {activeSubTab === 'active' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Danh sách người thuê đang sinh sống ({activeStays.length})
              </h3>
              <p className="text-xs text-slate-500">
                Những người thuê này đã được xác thực và có thể gửi đánh giá sau 14 ngày.
              </p>
            </div>
          </div>

          {loadingActive ? (
            <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải danh sách...
            </div>
          ) : activeStays.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chưa có khách thuê nào ở trạng thái đang lưu trú.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeStays.map((stay) => {
                const tenant = stay.tenantId || {};
                const room = stay.roomId || {};
                const isLoading = actionLoadingId === stay._id;

                const checkInDateStr = stay.checkInDate
                  ? new Date(stay.checkInDate).toLocaleDateString('vi-VN')
                  : 'Chưa rõ';
                const daysStayed = stay.stayDurationDays || 0;
                const monthsStayed = stay.stayDurationMonths || 1;

                return (
                  <div key={stay._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {tenant.fullName ? tenant.fullName.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{tenant.fullName || 'Người thuê'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Đang ở
                          </span>
                        </div>
                        <div className="text-slate-500">
                          🏠 <strong>{room.title || 'Phòng trọ'}</strong>
                        </div>
                        <div className="text-slate-600 flex items-center gap-3 pt-0.5">
                          <span>📅 Nhận phòng: <strong>{checkInDateStr}</strong></span>
                          <span>⏳ Đã ở: <strong>{daysStayed} ngày (~{monthsStayed} tháng)</strong></span>
                          {tenant.phone && <span>📞 {tenant.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleConfirmCheckout(stay._id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Xác nhận trả phòng</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 3: TẠO & QUẢN LÝ MÃ NHẬN PHÒNG (CHECK-IN CODES) ── */}
      {activeSubTab === 'codes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Form tạo mã */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-500" />
              Tạo mã nhận phòng mới
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mã nhận phòng gồm 6-8 ký tự ngẫu nhiên, chỉ dùng 1 lần và có hạn trong 7 ngày. Khi khách nhập mã, đợt lưu trú sẽ lập tức được kích hoạt.
            </p>

            <form onSubmit={handleCreateCode} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chọn phòng cấp mã:
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  required
                >
                  {(internalRooms.length > 0 ? internalRooms : rooms).map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.title} ({Number(r.price).toLocaleString('vi-VN')} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ghi chú cho khách (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mã cho bạn Minh vào ở phòng 201"
                  value={codeNote}
                  onChange={(e) => setCodeNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCode}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Tạo mã nhận phòng mới</span>
              </button>
            </form>

            {/* Hiển thị mã vừa tạo (Chỉ hiển thị 1 lần) */}
            {newlyCreatedCode && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>MÃ VỪA TẠO (CHỈ HIỆN 1 LẦN):</span>
                  <span className="text-[10px] text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    Hạn 7 ngày
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2 px-3 bg-white rounded-xl border border-amber-300 font-mono font-black text-center text-lg text-orange-600 tracking-widest">
                    {newlyCreatedCode.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newlyCreatedCode.code)}
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition shrink-0"
                    title="Sao chép mã"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  Hãy gửi mã này cho người thuê để họ kích hoạt xác minh phòng tại trang chi tiết phòng.
                </p>
              </div>
            )}
          </div>

          {/* Cột phải: Danh sách mã của phòng */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Mã nhận phòng đã cấp ({checkinCodes.length})
            </h3>

            {loadingCodes ? (
              <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải danh sách mã...
              </div>
            ) : checkinCodes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có mã nhận phòng nào được tạo cho phòng này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {checkinCodes.map((codeItem) => {
                  const isExpired = new Date(codeItem.expiresAt) < new Date();
                  const isRedeemed = codeItem.isRedeemed;

                  return (
                    <div key={codeItem._id} className="py-3 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            Mã #{String(codeItem._id).slice(-6).toUpperCase()}
                          </span>
                          {isRedeemed ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              ✓ Đã kích hoạt bởi {codeItem.redeemedBy?.fullName || 'Người thuê'}
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              Hết hạn
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                              Chưa sử dụng (Còn hạn)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Hết hạn: {new Date(codeItem.expiresAt).toLocaleDateString('vi-VN')}</span>
                          {codeItem.note && <span>Ghi chú: {codeItem.note}</span>}
                        </div>
                      </div>

                      {!isRedeemed && (
                        <button
                          type="button"
                          onClick={() => handleRevokeCode(codeItem._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Thu hồi mã"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

