import React, { useState, useEffect } from "react";
import {
  FileText, Receipt, Calendar, CheckCircle, Clock, AlertCircle,
  Zap, Droplets, Camera, ExternalLink, X, ShieldCheck, MapPin,
  ChevronRight, Upload, Phone, Check, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentPortalModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("contracts");
  const [contracts, setContracts] = useState([]);
  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Modal thanh toán hóa đơn
  const [payingBill, setPayingBill] = useState(null);
  const [proofUrl, setProofUrl] = useState("https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, aRes] = await Promise.all([
        base44.contracts.myContracts(),
        base44.bills.myBills(),
        base44.entities.Appointment.myList()
      ]);
      setContracts(cRes || []);
      setBills(bRes || []);
      setAppointments(aRes || []);
    } catch (err) {
      console.error("Lỗi tải thông tin người thuê:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Người thuê xác nhận tài sản bàn giao
  const handleVerifyInventory = async (contractId, itemId) => {
    try {
      const res = await base44.contracts.verifyInventory(contractId, itemId);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Xác nhận thất bại.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Người thuê gửi xác nhận chuyển khoản
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payingBill) return;
    setSubmittingPayment(true);
    try {
      const res = await base44.bills.pay(payingBill._id, proofUrl);
      if (res.success) {
        alert("Đã gửi biên lai chuyển khoản! Chủ trọ sẽ đối soát và xác nhận cho bạn.");
        setPayingBill(null);
        loadData();
      } else {
        alert(res.message || "Thao tác thất bại.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-[28px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-900">
                Cổng Thuê Trọ Trực Tuyến
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Hợp đồng điện tử · Hóa đơn có ảnh công tơ · Lịch hẹn xem phòng
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-white px-6 gap-2">
          {[
            { id: "contracts", label: "Hợp đồng của tôi", icon: FileText, count: contracts.length },
            { id: "bills", label: "Hóa đơn & Tiền phòng", icon: Receipt, count: bills.length },
            { id: "appointments", label: "Lịch hẹn xem phòng", icon: Calendar, count: appointments.length }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 py-3 px-3 text-sm font-bold border-b-2 transition-all",
                  active
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fdfbf7] space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span>Đang đồng bộ dữ liệu của bạn...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: HỢP ĐỒNG CỦA TÔI */}
              {activeTab === "contracts" && (
                contracts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-[#f4ebd9] p-6">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">Chưa có hợp đồng nào</h4>
                    <p className="text-xs text-slate-500 mt-1">Khi bạn ký hợp đồng với chủ trọ trên SmartStay, hợp đồng điện tử và danh mục bàn giao sẽ xuất hiện tại đây.</p>
                  </div>
                ) : (
                  contracts.map(contract => (
                    <div key={contract._id || contract.id} className="bg-white rounded-2xl p-5 border border-[#f4ebd9] shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-black text-base text-slate-900">
                              {contract.room?.title || "Phòng trọ SmartStay"}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              Đang hiệu lực
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {contract.room?.address || "Cần Thơ"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-medium">Tiền thuê</div>
                          <div className="font-black text-emerald-600 text-lg">
                            {Number(contract.monthlyRent).toLocaleString()}đ/tháng
                          </div>
                        </div>
                      </div>

                      {/* Thông số giá và cọc */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl">
                          <div className="text-slate-400 font-medium">Thời hạn</div>
                          <div className="font-bold text-slate-800">{contract.durationMonths || 6} tháng</div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl">
                          <div className="text-slate-400 font-medium">Tiền cọc</div>
                          <div className="font-bold text-slate-800">{Number(contract.deposit?.amount || 0).toLocaleString()}đ</div>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900">
                          <div className="text-amber-600 font-medium">Giá điện cam kết</div>
                          <div className="font-bold">{Number(contract.electricPrice || 3500).toLocaleString()}đ/kWh</div>
                        </div>
                        <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-900">
                          <div className="text-cyan-600 font-medium">Giá nước cam kết</div>
                          <div className="font-bold">{Number(contract.waterPrice || 20000).toLocaleString()}đ/m³</div>
                        </div>
                      </div>

                      {/* Biên bản bàn giao tài sản khi nhận phòng */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                            Biên bản bàn giao tài sản & Hiện trạng khi vào trọ
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {(contract.handoverInventory || []).length} thiết bị
                          </span>
                        </div>

                        {(contract.handoverInventory || []).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Chủ trọ chưa liệt kê danh mục tài sản bàn giao.</p>
                        ) : (
                          <div className="space-y-2">
                            {contract.handoverInventory.map(item => (
                              <div key={item._id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                <div>
                                  <div className="font-bold text-slate-800">{item.item} (x{item.quantity || 1})</div>
                                  <div className="text-[11px] text-slate-500">{item.condition}</div>
                                </div>
                                <div>
                                  {item.verifiedByTenant ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      <Check className="w-3 h-3" /> Đã xác nhận
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerifyInventory(contract._id, item._id)}
                                      className="rounded-full h-7 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                      Xác nhận nhận
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* TAB 2: HÓA ĐƠN & TIỀN PHÒNG */}
              {activeTab === "bills" && (
                bills.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-[#f4ebd9] p-6">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">Chưa có hóa đơn nào</h4>
                    <p className="text-xs text-slate-500 mt-1">Hóa đơn tiền phòng hàng tháng kèm ảnh chụp đồng hồ điện nước sẽ hiển thị tại đây.</p>
                  </div>
                ) : (
                  bills.map(bill => {
                    const isUnpaid = bill.status === "unpaid";
                    const isPaid = bill.status === "paid";
                    const isConfirmed = bill.status === "confirmed";

                    return (
                      <div key={bill._id} className="bg-white rounded-2xl p-5 border border-[#f4ebd9] shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-base">Hóa đơn Tháng {bill.month}/{bill.year}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                isConfirmed ? "bg-emerald-100 text-emerald-800" :
                                isPaid ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                              )}>
                                {isConfirmed ? "Đã xác nhận thu" : isPaid ? "Chờ chủ trọ đối soát" : "Chưa thanh toán"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{bill.room?.title || "Phòng trọ"}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-medium">Tổng tiền</div>
                            <div className="font-black text-lg text-[#f97316]">
                              {Number(bill.totalAmount).toLocaleString()}đ
                            </div>
                          </div>
                        </div>

                        {/* Chứng từ công tơ điện nước */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Điện */}
                          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                            <div className="flex justify-between font-bold text-amber-950">
                              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-600" /> Tiền điện</span>
                              <span>{Number(bill.electric?.total || 0).toLocaleString()}đ</span>
                            </div>
                            <div className="text-[11px] text-amber-800/80 mt-1">
                              Số cũ: {bill.electric?.previousNumber} ➔ Số mới: {bill.electric?.currentNumber} ({bill.electric?.usage} kWh)
                            </div>
                            {bill.electric?.meterPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto({ title: "Ảnh chụp đồng hồ điện của phòng", url: bill.electric.meterPhotoUrl })}
                                className="mt-2 text-[11px] font-bold text-amber-900 underline flex items-center gap-1"
                              >
                                <Camera className="w-3.5 h-3.5" /> Xem ảnh chụp công tơ
                              </button>
                            )}
                          </div>

                          {/* Nước */}
                          <div className="p-3 bg-cyan-50/70 border border-cyan-200/60 rounded-xl">
                            <div className="flex justify-between font-bold text-cyan-950">
                              <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-cyan-600" /> Tiền nước</span>
                              <span>{Number(bill.water?.total || 0).toLocaleString()}đ</span>
                            </div>
                            <div className="text-[11px] text-cyan-800/80 mt-1">
                              Số cũ: {bill.water?.previousNumber} ➔ Số mới: {bill.water?.currentNumber} ({bill.water?.usage} m³)
                            </div>
                            {bill.water?.meterPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto({ title: "Ảnh chụp đồng hồ nước của phòng", url: bill.water.meterPhotoUrl })}
                                className="mt-2 text-[11px] font-bold text-cyan-900 underline flex items-center gap-1"
                              >
                                <Camera className="w-3.5 h-3.5" /> Xem ảnh chụp đồng hồ nước
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thanh toán action */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            Chủ trọ: {bill.landlord?.fullName || "Chủ trọ"} ({bill.landlord?.phone || "N/A"})
                          </span>

                          {isUnpaid && (
                            <Button
                              onClick={() => setPayingBill(bill)}
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
                            >
                              Thanh toán & Gửi biên lai
                            </Button>
                          )}

                          {isPaid && (
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Đã gửi biên lai, chờ chủ trọ duyệt
                            </span>
                          )}

                          {isConfirmed && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã hoàn tất thanh toán
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* TAB 3: LỊCH HẸN XEM PHÒNG */}
              {activeTab === "appointments" && (
                appointments.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-[#f4ebd9] p-6">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">Chưa có lịch hẹn xem phòng</h4>
                    <p className="text-xs text-slate-500 mt-1">Khi bạn bấm "Đặt lịch xem phòng" ở trang chi tiết phòng trọ, lịch hẹn sẽ được lưu và cập nhật tại đây.</p>
                  </div>
                ) : (
                  appointments.map(appt => (
                    <div key={appt._id || appt.appointmentCode} className="bg-white rounded-2xl p-4 border border-[#f4ebd9] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">Mã hẹn: #{appt.appointmentCode}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                            appt.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                            appt.status === "rejected" ? "bg-rose-100 text-rose-800" :
                            appt.status === "completed" ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {appt.status === "confirmed" ? "Chủ trọ đã đồng ý" :
                             appt.status === "rejected" ? "Đã từ chối" :
                             appt.status === "completed" ? "Đã xem xong" : "Chờ chủ trọ duyệt"}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-xs mt-1">
                          {appt.roomId?.title || "Phòng trọ Cần Thơ"}
                        </h5>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" /> Ngày hẹn: <span className="font-bold text-slate-700">{appt.appointmentDate} ({appt.appointmentTime})</span>
                        </p>
                        {appt.landlordResponseNote && (
                          <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1.5 font-medium">
                            Lời nhắn chủ trọ: "{appt.landlordResponseNote}"
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Liên hệ chủ trọ</div>
                        <a href={`tel:${appt.roomId?.contactPhone || "0939112233"}`} className="font-bold text-xs text-emerald-700 flex items-center gap-1 hover:underline">
                          <Phone className="w-3 h-3" /> {appt.roomId?.contactPhone || "0939 112 233"}
                        </a>
                      </div>
                    </div>
                  ))
                )
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 text-right">
          <Button variant="outline" onClick={onClose} className="rounded-full font-bold">
            Đóng
          </Button>
        </div>
      </div>

      {/* MODAL GỬI BIÊN LAI THANH TOÁN */}
      {payingBill && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h4 className="font-heading font-black text-lg text-slate-900 mb-1">
              Thanh Toán Hóa Đơn Tháng {payingBill.month}/{payingBill.year}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Số tiền: <b className="text-[#f97316] text-sm">{Number(payingBill.totalAmount).toLocaleString()}đ</b>
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đính kèm URL Ảnh chụp biên lai chuyển khoản (hoặc demo)
                </label>
                <input
                  type="text"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs space-y-1">
                <div className="font-bold">Tài khoản nhận tiền của Chủ trọ:</div>
                <div>Ngân hàng: <b>MB Bank / Vietcombank</b></div>
                <div>Số tài khoản: <b>0939112233</b></div>
                <div>Chủ tài khoản: <b>Chủ Trọ SmartStay</b></div>
                <div>Nội dung: <b>Thanh toan thang {payingBill.month} {payingBill.tenant?.phone || ""}</b></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setPayingBill(null)} className="rounded-full">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingPayment}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {submittingPayment ? "Đang gửi..." : "Xác nhận đã chuyển khoản"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH CÔNG TƠ */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">{selectedPhoto.title}</h4>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img src={selectedPhoto.url} alt="Meter" className="max-h-full object-contain rounded-xl" />
            </div>
            <div className="p-3 bg-white text-right">
              <Button size="sm" onClick={() => setSelectedPhoto(null)} className="rounded-full font-bold">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
