import React, { useState } from "react";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Trash2,
  Plus,
  Home,
  DollarSign,
  UserCheck,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CAMPUSES = [
  "ĐH Cần Thơ",
  "ĐH Y Dược",
  "ĐH Nam Cần Thơ",
  "ĐH FPT",
  "ĐH Kỹ thuật Công nghệ Cần Thơ",
  "Khu vực Ninh Kiều",
  "Khu vực Cái Răng",
  "Khác"
];

const COMMON_AMENITIES = [
  "Máy lạnh",
  "Tủ lạnh",
  "Máy giặt riêng",
  "Gác lửng",
  "Ban công",
  "Wifi miễn phí",
  "Camera 24/7",
  "Cửa khóa vân tay",
  "Giờ giấc tự do",
  "Máy nước nóng"
];

export default function CreatePassModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    campus: "ĐH Cần Thơ",
    area_sqm: 22,
    room_type: "Phòng trọ khép kín",
    description: "",
    monthlyRent: "",
    passPrice: "",
    depositAmount: "",
    remainingMonths: 3,
    moveInDate: "",
    isFlexibleMoveIn: false,
    amenities: ["Máy lạnh", "Gác lửng"],
    rules: ["Không nuôi chó mèo lớn", "Giữ yên tĩnh sau 23h"],
    images: [],
    contractImages: [],
    landlordName: "",
    landlordPhone: "",
    landlordEmail: "",
    agreedTerms: false
  });

  // Upload previews
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  if (!open) return null;

  // Tính số tiền tiết kiệm
  const savings = Math.max(0, (Number(formData.depositAmount) || 0) - (Number(formData.passPrice) || 0));

  // Toggle tiện ích
  const toggleAmenity = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item]
    }));
  };

  // Xử lý chọn ảnh từ máy
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imagePreviews.length + files.length > 8) {
      toast.error("Tối đa 8 ảnh cho mỗi phòng pass!");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Tạo preview URL
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Sao chép link xác nhận
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("Đã sao chép link xác nhận vào bộ nhớ tạm!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Submit tạo tin
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreedTerms) {
      toast.error("Vui lòng đồng ý cam kết đã trao đổi và có sự đồng ý của chủ trọ.");
      return;
    }

    setLoading(true);
    try {
      // Dùng FormData để hỗ trợ upload nhiều ảnh qua multer
      const data = new FormData();
      data.append("title", formData.title);
      data.append("address", formData.address);
      data.append("campus", formData.campus);
      data.append("area_sqm", formData.area_sqm);
      data.append("room_type", formData.room_type);
      data.append("description", formData.description);
      data.append("monthlyRent", formData.monthlyRent);
      data.append("passPrice", formData.passPrice);
      data.append("depositAmount", formData.depositAmount);
      data.append("remainingMonths", formData.remainingMonths);
      data.append("moveInDate", formData.moveInDate);
      data.append("isFlexibleMoveIn", formData.isFlexibleMoveIn);
      data.append("landlordName", formData.landlordName);
      data.append("landlordPhone", formData.landlordPhone);
      data.append("landlordEmail", formData.landlordEmail);

      formData.amenities.forEach((a) => data.append("amenities", a));
      formData.rules.forEach((r) => data.append("rules", r));

      imageFiles.forEach((f) => {
        data.append("imageFiles", f);
      });

      // Nếu không có ảnh upload, thêm ảnh mẫu mặc định
      if (imageFiles.length === 0) {
        data.append("images", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80");
      }

      const res = await base44.entities.PassRoom.create(data);

      if (res.success) {
        setCreatedResult(res);
        toast.success("Tạo tin pass phòng thành công!");
        if (onSuccess) onSuccess(res.data);
      } else {
        toast.error(res.message || "Đăng tin thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi gửi dữ liệu lên máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8 border border-[#f4ebd9] relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Thành công (Hiện link xác nhận) */}
        {createdResult ? (
          <div className="p-8 md:p-12 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">
              Đăng tin Pass phòng thành công!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              Tin của bạn đang ở trạng thái <strong>"Chờ chủ trọ duyệt"</strong>. Để bảo vệ an toàn và phòng tránh lừa đảo, tin sẽ chỉ hiển thị công khai sau khi chủ trọ xác nhận.
            </p>

            {/* Khối sao chép link xác nhận */}
            <div className="bg-[#fff9f2] border border-[#fdecdb] rounded-2xl p-5 max-w-lg mx-auto text-left mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" /> Link duyệt bảo mật cho chủ trọ:
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Link này được mã hóa bảo mật, có hạn dùng trong <strong>72 giờ</strong> và chỉ sử dụng 1 lần. Hãy gửi ngay cho chủ trọ của bạn:
              </p>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2">
                <input
                  type="text"
                  readOnly
                  value={createdResult.confirmationLink || ""}
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none font-mono truncate px-1"
                />
                <Button
                  onClick={() => copyToClipboard(createdResult.confirmationLink)}
                  className="rounded-lg h-9 px-3 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={onClose}
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 text-sm"
              >
                Hoàn tất & Về danh sách
              </Button>
            </div>
          </div>
        ) : (
          /* Form 4 Bước Đăng Tin */
          <div>
            {/* Header Form */}
            <div className="px-8 py-6 border-b border-[#f4ebd9] bg-[#fdfbf7]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#f97316]/10 text-[#f97316] flex items-center justify-center font-black text-sm">
                  {step}/4
                </span>
                <div>
                  <h2 className="font-heading font-black text-xl text-slate-900">Đăng pass phòng trọ</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {step === 1 && "Bước 1: Thông tin phòng & Khu vực trường"}
                    {step === 2 && "Bước 2: Chi tiết chi phí & Khoản tiền tiết kiệm"}
                    {step === 3 && "Bước 3: Tiện ích, Nội quy & Hình ảnh thực tế"}
                    {step === 4 && "Bước 4: Thông tin Chủ trọ & Cam kết"}
                  </p>
                </div>
              </div>

              {/* Thanh tiến trình (Step progress) */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s <= step ? "bg-[#f97316]" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Nội dung form theo bước */}
            <form onSubmit={handleSubmit} className="p-8">
              {/* BƯỚC 1: THÔNG TIN PHÒNG */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      Tiêu đề bài đăng *
                    </label>
                    <Input
                      required
                      placeholder="Ví dụ: Pass phòng studio ban công hẻm 51 ĐH Cần Thơ, tặng kèm bàn học..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Khu vực gần trường *
                      </label>
                      <select
                        required
                        value={formData.campus}
                        onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#fdfbf7] text-sm font-medium outline-none focus:border-[#f97316]"
                      >
                        {CAMPUSES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Loại phòng
                      </label>
                      <select
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#fdfbf7] text-sm font-medium outline-none focus:border-[#f97316]"
                      >
                        <option value="Phòng trọ khép kín">Phòng trọ khép kín</option>
                        <option value="Căn hộ mini / Studio">Căn hộ mini / Studio</option>
                        <option value="Homestay sinh viên">Homestay sinh viên</option>
                        <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Địa chỉ cụ thể *
                      </label>
                      <Input
                        required
                        placeholder="Số nhà, hẻm, tên đường, phường..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Diện tích (m²)
                      </label>
                      <Input
                        type="number"
                        min="10"
                        value={formData.area_sqm}
                        onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      Mô tả lý do pass & tình trạng phòng
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nêu rõ lý do cần nhượng (chuyển chỗ làm, về quê, đồ đạc để lại tặng kèm...)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-4 rounded-xl border border-slate-200 bg-[#fdfbf7] text-sm outline-none focus:border-[#f97316]"
                    />
                  </div>
                </div>
              )}

              {/* BƯỚC 2: TÀI CHÍNH & TIẾT KIỆM */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-[#fff9f2] border border-[#fdecdb] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#ea580c]">
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong>Công thức:</strong> Nếu bạn nhượng lại giá pass thấp hơn tiền cọc gốc đã đóng, hệ thống sẽ tự động gắn huy hiệu <em>"Tiết kiệm Xđ"</em> giúp phòng của bạn thu hút người nhận nhanh gấp 3 lần!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Giá thuê hàng tháng (VNĐ) *
                      </label>
                      <Input
                        required
                        type="number"
                        placeholder="2500000"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Tiền thuê người mới sẽ đóng cho chủ mỗi tháng</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Tiền cọc hợp đồng gốc đã đóng (VNĐ) *
                      </label>
                      <Input
                        required
                        type="number"
                        placeholder="2500000"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Số tiền cọc chủ trọ đang giữ theo hợp đồng</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#ea580c] uppercase mb-2 flex items-center justify-between">
                        <span>Giá pass người nhận trả bạn (VNĐ) *</span>
                      </label>
                      <Input
                        required
                        type="number"
                        placeholder="1800000"
                        value={formData.passPrice}
                        onChange={(e) => setFormData({ ...formData, passPrice: e.target.value })}
                        className="h-12 rounded-xl border-[#f97316] bg-[#fff9f2] font-black text-lg text-[#f97316] focus:border-[#ea580c]"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Số tiền thực tế bạn muốn thu lại từ người nhận</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Thời hạn HĐ còn lại (tháng) *
                      </label>
                      <Input
                        required
                        type="number"
                        min="1"
                        max="36"
                        placeholder="4"
                        value={formData.remainingMonths}
                        onChange={(e) => setFormData({ ...formData, remainingMonths: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>
                  </div>

                  {/* Preview Banner Tiết Kiệm */}
                  {savings > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800">
                      <div>
                        <p className="text-xs font-medium">Người nhận phòng sẽ tiết kiệm được:</p>
                        <p className="text-xl font-black text-emerald-600 mt-0.5">{savings.toLocaleString()} VNĐ</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                        Rất dễ sang nhượng!
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Ngày có thể chuyển vào
                      </label>
                      <Input
                        type="date"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFlexibleMoveIn}
                          onChange={(e) => setFormData({ ...formData, isFlexibleMoveIn: e.target.checked })}
                          className="w-4 h-4 rounded text-[#f97316]"
                          style={{ accentColor: "#f97316" }}
                        />
                        <span className="text-sm font-semibold text-slate-700">Ngày dọn vào linh hoạt theo thỏa thuận</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: TIỆN ÍCH, NỘI QUY & ẢNH */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3">
                      Tiện ích phòng có sẵn
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_AMENITIES.map((am) => {
                        const active = formData.amenities.includes(am);
                        return (
                          <button
                            type="button"
                            key={am}
                            onClick={() => toggleAmenity(am)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                              active
                                ? "bg-[#f97316] text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {am}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload nhiều ảnh */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      Tải lên hình ảnh phòng thực tế (Tối đa 8 ảnh)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="h-28 rounded-xl border border-slate-200 overflow-hidden relative group">
                          <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {imagePreviews.length < 8 && (
                        <label className="h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#f97316] flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-orange-50/50 transition-colors">
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#f97316]" />
                          <span className="text-[11px] font-bold text-slate-500 mt-1">+ Thêm ảnh</span>
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chấp nhận định dạng JPG, PNG, WEBP. Dung lượng tối đa 5MB/ảnh.
                    </p>
                  </div>
                </div>
              )}

              {/* BƯỚC 4: THÔNG TIN CHỦ TRỌ & CAM KẾT */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" /> Bắt buộc xác minh từ Chủ trọ
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Hệ thống SmartStay sẽ tự động tạo một đường link bảo mật 72 giờ và gửi email đến chủ trọ để chủ trọ bấm xác nhận đồng ý sang nhượng. Tin của bạn sẽ được gắn huy hiệu an toàn ngay sau khi chủ trọ bấm duyệt.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Họ tên chủ trọ *
                      </label>
                      <Input
                        required
                        placeholder="Ví dụ: Chú Ba Thanh Sơn"
                        value={formData.landlordName}
                        onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Số điện thoại chủ trọ *
                      </label>
                      <Input
                        required
                        placeholder="0901234567"
                        value={formData.landlordPhone}
                        onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                        Email chủ trọ (Khuyên dùng để gửi link duyệt tự động)
                      </label>
                      <Input
                        type="email"
                        placeholder="chutro@gmail.com"
                        value={formData.landlordEmail}
                        onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 bg-[#fdfbf7] focus:border-[#f97316]"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Nếu không có email, bạn có thể sao chép link sau khi tạo để gửi qua Zalo cho chủ trọ.
                      </span>
                    </div>
                  </div>

                  {/* Cam kết trung thực */}
                  <div className="bg-[#fff9f2] border border-[#fdecdb] rounded-2xl p-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      required
                      checked={formData.agreedTerms}
                      onChange={(e) => setFormData({ ...formData, agreedTerms: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded text-[#f97316] shrink-0"
                      style={{ accentColor: "#f97316" }}
                    />
                    <label htmlFor="termsCheckbox" className="text-xs text-slate-700 leading-relaxed cursor-pointer font-medium">
                      <strong>Cam kết trách nhiệm:</strong> Tôi cam đoan đã trao đổi trực tiếp và được sự đồng ý của chủ trọ về việc sang nhượng tiền cọc phòng. Nếu có hành vi gian lận thông tin hoặc làm giả liên hệ chủ trọ, tài khoản của tôi sẽ bị khóa vĩnh viễn và chịu trách nhiệm theo quy định pháp luật.
                    </label>
                  </div>
                </div>
              )}

              {/* Điều hướng các bước */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="rounded-full px-6 font-bold text-slate-600 border-slate-200 h-11"
                  >
                    Quay lại
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-full px-6 font-bold text-slate-500 h-11"
                  >
                    Hủy bỏ
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (step === 1 && (!formData.title || !formData.address)) {
                        toast.error("Vui lòng điền tiêu đề và địa chỉ phòng.");
                        return;
                      }
                      if (step === 2 && (!formData.monthlyRent || !formData.passPrice || !formData.depositAmount)) {
                        toast.error("Vui lòng điền đầy đủ các thông tin tài chính.");
                        return;
                      }
                      setStep(step + 1);
                    }}
                    className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-8 h-11 shadow-sm"
                  >
                    Tiếp theo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !formData.agreedTerms}
                    className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-8 h-11 shadow-md shadow-[#f97316]/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo tin & sinh link...
                      </>
                    ) : (
                      "Đăng tin & Tạo link duyệt"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
