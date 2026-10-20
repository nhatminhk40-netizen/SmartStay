import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  Camera, 
  FileText, 
  CheckCircle2, 
  X, 
  Eye, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  FileCheck,
  Building,
  ScrollText,
  FileBadge,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Danh mục loại giấy tờ chứng minh địa điểm theo yêu cầu
export const PROOF_DOCUMENT_TYPES = [
  {
    id: "UTILITY_BILL",
    name: "Hóa đơn tiền điện / nước tháng gần nhất",
    badge: "Khuyên dùng - Chính xác nhất",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: Zap,
    description: "Tên trên hóa đơn trùng với tên CCCD và địa chỉ trọ. Kẻ lừa đảo ở ngoài không thể có hóa đơn điện lực tại địa chỉ này.",
    exampleHint: "Hóa đơn EVN / Công ty Cấp nước Cần Thơ có mã khách hàng, tên chủ hộ và địa chỉ trùng khớp."
  },
  {
    id: "BUSINESS_LICENSE",
    name: "Giấy phép kinh doanh / Giấy tạm trú tạm vắng",
    badge: "Dãy trọ quy mô lớn",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    icon: FileBadge,
    description: "Giấy chứng nhận đăng ký hộ kinh doanh nhà trọ hoặc danh sách đăng ký lưu trú / tạm trú với Công an khu vực.",
    exampleHint: "Bản chụp Giấy chứng nhận đăng ký kinh doanh hoặc văn bản xác nhận của Công an phường/xã."
  },
  {
    id: "AUTHORIZATION_CONTRACT",
    name: "Hợp đồng ủy quyền quản lý nhà trọ",
    badge: "Dành cho chủ thứ cấp",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    icon: ScrollText,
    description: "Dành cho người thuê lại nguyên căn nhà rồi ngăn phòng cho thuê lại, có hợp đồng hoặc giấy ủy quyền hợp pháp từ chủ nhà.",
    exampleHint: "Hợp đồng thuê nhà nguyên căn còn hiệu lực kèm điều khoản cho phép cho thuê lại."
  },
  {
    id: "HOUSE_OWNERSHIP",
    name: "Sổ hồng / Sổ đỏ / Quyền sở hữu nhà đất",
    badge: "Chủ sở hữu chính",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Building,
    description: "Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở đứng tên chủ trọ tại địa chỉ nhà trọ.",
    exampleHint: "Trang thông tin thửa đất, nhà ở và chủ sở hữu trên Giấy chứng nhận."
  }
];

/**
 * Dropzone đơn lẻ hỗ trợ Drag-Drop trên Desktop và Camera / Thư viện ảnh trên Mobile
 */
export function SingleDropzone({
  label,
  sublabel,
  value,
  onChange,
  onClear,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
  maxSizeMb = 5,
  required = false
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewModal, setPreviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Xử lý đọc file và tạo Base64 Data URL
  const processFile = (file) => {
    setErrorMsg("");
    if (!file) return;

    // Kiểm tra dung lượng (Tối đa 5MB)
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`Tệp quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn tệp nhỏ hơn ${maxSizeMb}MB.`);
      return;
    }

    // Kiểm tra định dạng
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setErrorMsg("Định dạng không hỗ trợ. Chỉ chấp nhận ảnh PNG, JPG hoặc tài liệu PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        dataUrl: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
        isPdf
      });
    };
    reader.onerror = () => {
      setErrorMsg("Không thể đọc tệp tin. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const isPdf = typeof value === "string" 
    ? (value.toLowerCase().includes(".pdf") || value.startsWith("data:application/pdf")) 
    : Boolean(value?.isPdf);

  const fileUrl = typeof value === "string" ? value : (value?.dataUrl || "");
  const fileName = typeof value === "string" ? "Tài liệu đã tải lên" : (value?.name || "Tài liệu minh chứng");

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {sublabel && <span className="text-[11px] text-slate-500">{sublabel}</span>}
        </div>
      )}

      {/* Input File ẩn hỗ trợ Desktop click & Mobile Popup (Camera / Gallery / Files) */}
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      {/* Input File riêng ép bật Camera trên Mobile */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      {fileUrl ? (
        // ── Trạng thái ĐÃ TẢI LÊN ──
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-orange-300">
          <div className="flex items-center gap-3">
            {isPdf ? (
              <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center shrink-0 text-rose-600">
                <FileText className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-0.5">PDF</span>
              </div>
            ) : (
              <div 
                className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group shrink-0 cursor-pointer"
                onClick={() => setPreviewModal(true)}
              >
                <img 
                  src={fileUrl} 
                  alt={fileName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs font-bold text-slate-800 truncate" title={fileName}>
                  {fileName}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isPdf ? "Tài liệu văn bản định dạng PDF" : "Hình ảnh rõ nét, hợp lệ"}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {!isPdf && (
                  <button
                    type="button"
                    onClick={() => setPreviewModal(true)}
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Xem ảnh lớn
                  </button>
                )}
                {isPdf && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Mở tệp PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Thay đổi tệp
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
              title="Xóa tệp này"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // ── Trạng thái CHƯA CÓ FILE (DROPZONE THEO THIẾT KẾ YÊU CẦU) ──
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 select-none",
            isDragOver 
              ? "border-orange-500 bg-orange-50/70 scale-[1.01] shadow-lg shadow-orange-500/10" 
              : "border-slate-300 hover:border-orange-400 bg-slate-50/70 hover:bg-orange-50/30"
          )}
        >
          {/* Icon Đám mây / Mũi tên tải lên */}
          <div className="w-12 h-12 rounded-2xl bg-orange-100/80 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-inner group-hover:scale-110 transition">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>

          {/* Dòng chữ hướng dẫn theo chuẩn mô tả */}
          <p className="text-xs font-bold text-slate-800 leading-snug">
            Kéo thả ảnh vào đây, hoặc{" "}
            <span className="text-orange-600 hover:underline">BẤM ĐỂ CHỌN TỆP</span>
          </p>

          {/* Nút chụp ảnh nhanh tối ưu cho Mobile Web */}
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-sm transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp ảnh ngay</span>
            </button>

            <span className="text-[11px] text-slate-400">hoặc chọn từ Thư viện</span>
          </div>

          <p className="text-[10px] text-slate-400 mt-2">
            (Hỗ trợ định dạng: PNG, JPG, PDF - Tối đa {maxSizeMb}MB)
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modal xem trước ảnh lớn */}
      {previewModal && fileUrl && !isPdf && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewModal(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain mx-auto" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bộ tài liệu hoàn chỉnh gồm 2 cấp độ:
 * 1. CCCD 2 mặt (Mặt trước + Mặt sau)
 * 2. Một trong các giấy tờ chứng minh địa điểm (Hóa đơn điện nước, GPKD, Hợp đồng ủy quyền, Sổ đỏ...)
 */
export default function LandlordDocUploader({
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  ownershipDoc,
  setOwnershipDoc,
  ownershipType,
  setOwnershipType
}) {
  const selectedTypeInfo = PROOF_DOCUMENT_TYPES.find(t => t.id === ownershipType) || PROOF_DOCUMENT_TYPES[0];

  return (
    <div className="space-y-5">
      {/* Banner Cấp độ 1: Xác minh qua Giấy tờ & Hóa đơn */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Cấp độ 1: Xác minh qua Giấy tờ & Hóa đơn
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Chính xác cao nhất
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Nhằm ngăn chặn tin ảo và đối tượng lừa đảo cọc tiền phòng của sinh viên, Chủ trọ vui lòng tải lên 
              <strong> ảnh CCCD 2 mặt</strong> và <strong>1 trong các giấy tờ chứng minh địa điểm trọ</strong> bên dưới.
            </p>
          </div>
        </div>
      </div>

      {/* ── MỤC 1: ẢNH CHỤP CCCD (2 MẶT) ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Ảnh chụp CCCD / CMND (2 mặt)
            </h4>
          </div>
          <span className="text-[11px] font-bold text-rose-500">Bắt buộc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <SingleDropzone
            label="Mặt trước CCCD"
            sublabel="Rõ mặt, số và họ tên"
            value={idCardFront}
            onChange={(file) => setIdCardFront(file.dataUrl)}
            onClear={() => setIdCardFront("")}
            required
          />

          <SingleDropzone
            label="Mặt sau CCCD"
            sublabel="Rõ vân tay & ngày cấp"
            value={idCardBack}
            onChange={(file) => setIdCardBack(file.dataUrl)}
            onClear={() => setIdCardBack("")}
            required
          />
        </div>
      </div>

      {/* ── MỤC 2: GIẤY TỜ CHỨNG MINH ĐỊA ĐIỂM (CHỌN 1 TRONG CÁC LOẠI) ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Giấy tờ chứng minh địa điểm nhà trọ
            </h4>
          </div>
          <span className="text-[11px] font-bold text-orange-600">Chọn 1 trong 4 loại</span>
        </div>

        <p className="text-[11px] text-slate-500 -mt-2">
          Chọn loại giấy tờ thuận tiện nhất đối với bạn để chứng minh quyền quản lý cơ sở trọ:
        </p>

        {/* Danh sách 4 loại giấy tờ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROOF_DOCUMENT_TYPES.map((docType) => {
            const isSelected = ownershipType === docType.id;
            const Icon = docType.icon;
            return (
              <div
                key={docType.id}
                onClick={() => setOwnershipType(docType.id)}
                className={cn(
                  "p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between",
                  isSelected
                    ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0",
                        isSelected ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {docType.name}
                      </span>
                    </div>
                  </div>

                  <span className={cn(
                    "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border mb-1.5",
                    docType.badgeColor
                  )}>
                    {docType.badge}
                  </span>

                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {docType.description}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? "font-bold text-orange-600" : "text-slate-400"}>
                    {isSelected ? "● Đang chọn loại này" : "Nhấp để chọn"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Khung tải lên tệp cho loại giấy tờ đang chọn */}
        <div className="pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-200/60 mb-3 text-[11px] text-slate-700">
            <span className="font-bold text-orange-800">Gợi ý tải lên ({selectedTypeInfo.name}): </span>
            <span>{selectedTypeInfo.exampleHint}</span>
          </div>

          <SingleDropzone
            label={`Tải lên: ${selectedTypeInfo.name}`}
            sublabel="Ảnh chụp sắc nét hoặc tệp PDF hóa đơn"
            value={ownershipDoc}
            onChange={(file) => setOwnershipDoc(file.dataUrl)}
            onClear={() => setOwnershipDoc("")}
            accept="image/png,image/jpeg,image/webp,application/pdf"
            maxSizeMb={5}
            required
          />
        </div>
      </div>
    </div>
  );
}
