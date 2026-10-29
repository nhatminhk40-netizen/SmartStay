import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  Lock,
  ArrowLeft,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function LandlordConfirmPage() {
  const { id: tokenParam } = useParams(); // Có thể là token hoặc id cũ

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null); // { isExpired, isAlreadyHandled, message }
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resultStatus, setResultStatus] = useState(null); // 'verified' | 'rejected'

  // Form từ chối
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadConfirmationInfo();
  }, [tokenParam]);

  const loadConfirmationInfo = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      // 1. Gọi API xác nhận bảo mật /api/landlord-confirmation/:token
      const res = await base44.entities.LandlordConfirm.getInfo(tokenParam);

      if (res && res.success && res.data) {
        setRoom(res.data);
      } else if (res && (res.isExpired || res.isAlreadyHandled)) {
        setErrorState({
          isExpired: res.isExpired,
          isAlreadyHandled: res.isAlreadyHandled,
          message: res.message,
          data: res.data
        });
        if (res.data) setRoom(res.data);
      } else {
        // Fallback kiểm tra API cũ hoặc local
        const oldRoom = await base44.entities.Room.getPass(tokenParam);
        if (oldRoom) {
          setRoom({
            id: oldRoom._id || oldRoom.id,
            title: oldRoom.title,
            address: oldRoom.address,
            posterName: oldRoom.posterName || "Người thuê",
            depositAmount: oldRoom.remaining_deposit || oldRoom.price || 2000000,
            monthlyRent: oldRoom.price || 2000000,
            remainingMonths: oldRoom.pass_months_left || oldRoom.remaining_duration || 3,
            moveInDate: oldRoom.moveOutDate || "Linh hoạt",
            images: oldRoom.images || [],
            contractImages: oldRoom.contractImage ? [oldRoom.contractImage] : []
          });
        } else {
          setErrorState({
            isInvalid: true,
            message: "Không tìm thấy yêu cầu xác nhận hoặc link đã bị hủy."
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin xác nhận:", err);
      setErrorState({
        isInvalid: true,
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
      });
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận hoặc Từ chối
  const handleAction = async (action) => {
    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối để người thuê nắm được thông tin!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await base44.entities.LandlordConfirm.respond(tokenParam, action, rejectReason);
      if (res && res.success) {
        setIsSuccess(true);
        setResultStatus(action === "confirm" ? "verified" : "rejected");
        toast.success(action === "confirm" ? "Đã duyệt yêu cầu thành công!" : "Đã gửi từ chối yêu cầu.");
      } else {
        // Fallback API cũ nếu cần
        await base44.entities.Room.confirmPass(tokenParam, action === "confirm" ? "landlord_confirmed" : "landlord_rejected", rejectReason);
        setIsSuccess(true);
        setResultStatus(action === "confirm" ? "verified" : "rejected");
      }
    } catch (err) {
      toast.error("Lỗi khi xử lý xác nhận.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#f97316] mb-3" />
        <p className="text-sm font-bold text-slate-600">Đang kiểm tra bảo mật link xác nhận...</p>
      </div>
    );
  }

  // 1. Link không hợp lệ hoặc lỗi
  if (errorState?.isInvalid) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">Liên kết không hợp lệ</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          {errorState.message || "Yêu cầu này có thể đã bị xóa hoặc đường link không chính xác."}
        </p>
        <Link to="/">
          <Button className="rounded-full bg-slate-900 text-white font-bold px-6">
            Về trang chủ SmartStay
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Link đã hết hạn 72 giờ
  if (errorState?.isExpired) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">Link xác nhận đã hết hạn</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          Đường dẫn này đã quá thời hạn <strong>72 giờ</strong> quy định bảo mật. Quý chủ trọ vui lòng liên hệ người thuê ({errorState.data?.posterName || "người thuê"}) để tạo link xác nhận mới.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full border-slate-300 text-slate-700 font-bold px-6">
            Về trang chủ SmartStay
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Link đã được xử lý trước đó hoặc vừa thao tác xong
  if (isSuccess || errorState?.isAlreadyHandled) {
    const isApproved = resultStatus === "verified" || errorState?.data?.confirmedAt;
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-lg border border-[#f4ebd9] animate-in zoom-in-95">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isApproved ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          }`}>
            {isApproved ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">
            {isApproved ? "Đã xác nhận thành công!" : "Đã từ chối chuyển nhượng"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 leading-relaxed">
            {isApproved
              ? "Cảm ơn Quý chủ trọ đã xác nhận! Tin pass phòng của người thuê đã được hệ thống SmartStay duyệt và hiển thị an toàn trên nền tảng."
              : "Hệ thống đã ghi nhận phản hồi từ chối của Quý chủ trọ và đã gửi thông báo đến người thuê."}
          </p>

          {errorState?.data?.note && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 mb-6 italic">
              "Lý do: {errorState.data.note}"
            </div>
          )}

          <Link to="/" className="inline-block text-xs font-bold text-[#f97316] hover:underline">
            Quay lại trang chủ SmartStay
          </Link>
        </div>
      </div>
    );
  }

  // 4. Giao diện xác nhận chính cho Chủ trọ (Tối ưu trên Mobile-First)
  return (
    <div className="min-h-screen bg-[#fdfbf7] py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Nền tảng thuê trọ SmartStay
        </Link>

        {/* Card xác nhận chính */}
        <div className="bg-white rounded-[32px] shadow-md border border-[#f4ebd9] overflow-hidden">
          {/* Header cam nổi bật */}
          <div className="bg-gradient-to-r from-[#f97316] to-[#ea580c] px-6 py-6 text-white text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <ShieldCheck className="w-6 h-6" />
              <h1 className="font-heading font-black text-xl">Xác nhận chuyển nhượng cọc</h1>
            </div>
            <p className="text-white/90 text-xs font-medium">
              Kính gửi Quý chủ trọ, người thuê phòng của bạn vừa tạo yêu cầu nhượng lại phòng trên SmartStay.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Tóm tắt thông tin */}
            <div className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-2xl p-5 space-y-3.5 text-sm">
              <div className="flex justify-between items-start border-b border-slate-200/70 pb-3">
                <span className="text-slate-500 text-xs font-bold uppercase">Người thuê hiện tại:</span>
                <span className="font-black text-slate-900 text-right">{room?.posterName || "Người thuê"}</span>
              </div>
              <div className="flex justify-between items-start border-b border-slate-200/70 pb-3">
                <span className="text-slate-500 text-xs font-bold uppercase">Phòng / Địa chỉ:</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px]">{room?.title || room?.address}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                <span className="text-slate-500 text-xs font-bold uppercase">Tiền cọc đang giữ:</span>
                <span className="font-black text-emerald-600 text-base">{Number(room?.depositAmount || 0).toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                <span className="text-slate-500 text-xs font-bold uppercase">Giá thuê mỗi tháng:</span>
                <span className="font-bold text-slate-900">{Number(room?.monthlyRent || 0).toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs font-bold uppercase">Ngày muốn chuyển:</span>
                <span className="font-bold text-slate-900">{room?.moveInDate || "Linh hoạt"}</span>
              </div>
            </div>

            {/* Lưu ý bảo mật */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Quyền lợi của Quý chủ trọ:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-blue-800">
                <li>Khoản tiền cọc gốc vẫn được bảo lưu trọn vẹn trong hợp đồng.</li>
                <li>Bạn có quyền từ chối nếu không đồng ý cho chuyển giao phòng.</li>
                <li>Link này chỉ sử dụng được <strong>một lần duy nhất</strong>.</li>
              </ul>
            </div>

            {/* Form Nhập Lý Do Từ Chối (Nếu bấm từ chối) */}
            {showRejectForm ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <label className="block text-xs font-bold text-rose-800 uppercase">
                  Lý do từ chối (Bắt buộc) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Phòng đã có người khác đặt, hoặc hợp đồng quy định không cho sang cọc..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-300 text-xs outline-none bg-white focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRejectForm(false)}
                    className="rounded-full text-xs font-bold text-slate-600 h-9"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleAction("reject")}
                    className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 px-4"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Xác nhận Từ chối"}
                  </Button>
                </div>
              </div>
            ) : (
              /* 2 Nút Hành Động Lớn Dành Cho Điện Thoại */
              <div className="space-y-3 pt-2">
                <Button
                  disabled={submitting}
                  onClick={() => handleAction("confirm")}
                  className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-14 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Đồng ý xác nhận chuyển nhượng
                    </>
                  )}
                </Button>

                <Button
                  disabled={submitting}
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="w-full rounded-full border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 font-bold text-xs h-12"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Không đồng ý / Từ chối
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
