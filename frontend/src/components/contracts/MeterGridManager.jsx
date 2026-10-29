import React, { useState, useEffect, useRef, useMemo } from "react";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import {
  Zap, Droplets, Receipt, Calendar, ArrowLeft, ArrowRight, Save,
  CheckCircle2, Clock, AlertCircle, FileSpreadsheet, Printer, Copy,
  Share2, Camera, UploadCloud, Search, Filter, RefreshCw, Sparkles,
  ChevronDown, ChevronUp, Edit3, X, Check, Info, AlertTriangle, Send,
  ChevronRight, Hash, DollarSign, Home, Phone, User, FileText,
  Download, Loader2, Image as ImageIcon, Sliders, MessageSquare, AlertOctagon, HelpCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Format tiền tệ VNĐ
const formatVND = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 đ";
  return Number(amount).toLocaleString("vi-VN") + " đ";
};

// Format số công tơ
const formatMeterNumber = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  return Number(val).toLocaleString("vi-VN");
};

// Đọc số tiền bằng chữ tiếng Việt
const docSoTienBangChu = (so) => {
  if (!so || isNaN(so) || so <= 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const docHangTram = (n, dayDu = true) => {
    let str = "";
    const tram = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const donVi = n % 10;
    if (dayDu || tram > 0) {
      str += " " + chuSo[tram] + " trăm";
      str += docHangChuc(chuc, donVi);
    } else {
      str += docHangChuc(chuc, donVi);
    }
    return str;
  };

  const docHangChuc = (chuc, donVi) => {
    let str = "";
    if (chuc > 1) {
      str += " " + chuSo[chuc] + " mươi";
      if (donVi === 1) str += " mốt";
      else if (donVi === 5) str += " lăm";
      else if (donVi > 0) str += " " + chuSo[donVi];
    } else if (chuc === 1) {
      str += " mười";
      if (donVi === 5) str += " lăm";
      else if (donVi > 0) str += " " + chuSo[donVi];
    } else if (donVi > 0) {
      str += " lẻ " + chuSo[donVi];
    }
    return str;
  };

  let str = "";
  const ty = Math.floor(so / 1000000000);
  let soDu = so % 1000000000;
  const trieu = Math.floor(soDu / 1000000);
  soDu = soDu % 1000000;
  const nghin = Math.floor(soDu / 1000);
  const dong = soDu % 1000;

  if (ty > 0) str += docHangTram(ty, false) + " tỷ";
  if (trieu > 0) str += docHangTram(trieu, ty > 0) + " triệu";
  if (nghin > 0) str += docHangTram(nghin, trieu > 0 || ty > 0) + " nghìn";
  if (dong > 0) str += docHangTram(dong, nghin > 0 || trieu > 0 || ty > 0);

  str = str.trim();
  if (!str) return "Không đồng";
  return str.charAt(0).toUpperCase() + str.slice(1) + " đồng chẵn";
};

export default function MeterGridManager({ onBackToDashboard }) {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Vị trí con trỏ đang nhập liệu: { rowIndex, colKey: 'electricCurrent' | 'waterCurrent' }
  const [activeCell, setActiveCell] = useState(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [saveToast, setSaveToast] = useState(null);
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Modal đính kèm ảnh công tơ điện/nước minh bạch
  const [photoModal, setPhotoModal] = useState({
    open: false,
    rowIndex: null,
    type: "electric", // 'electric' | 'water'
    photoUrl: ""
  });

  // Modal tùy chỉnh phụ phí / nợ cũ riêng cho từng phòng
  const [feeModal, setFeeModal] = useState({
    open: false,
    rowIndex: null
  });

  // Modal xem và in Hóa đơn / Phiếu thu chính thức
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState("");

  useEffect(() => {
    if (!viewingInvoice) return;
    const amount = Number(viewingInvoice.totalAmount) || 0;
    const roomClean = String(viewingInvoice.roomNumber || "P101").replace(/[^a-zA-Z0-9]/g, "");
    const addInfo = `TT TIEN TRO P${roomClean} T${month}`;
    const qrPayload = `https://img.vietqr.io/image/MB-0907297338-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=LE%20KHAI`;

    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(url => {
      setInvoiceQrUrl(url);
    }).catch(err => {
      console.error("Lỗi tạo QR:", err);
    });
  }, [viewingInvoice, month]);
  const invoiceGridCardRef = useRef(null);
  const [isCapturingGridImage, setIsCapturingGridImage] = useState(false);

  // Tham chiếu các ô input trong bảng lưới: key = `input-${rowIndex}-${colKey}`
  const inputRefs = useRef({});
  const excelFileInputRef = useRef(null);

  // Modal ghi nhận thanh toán & Thu một phần (Debt Tracking)
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    rowIndex: null,
    status: "paid",
    paidAmount: "",
    note: ""
  });

  // Modal cài đặt đơn giá chung cho cả dãy (Batch Rates)
  const [batchRatesModal, setBatchRatesModal] = useState(false);
  const [batchRates, setBatchRates] = useState({
    electricPrice: 3500,
    waterPrice: 15000,
    wifiFee: 50000,
    trashFee: 20000,
    applyToProperty: "all"
  });

  // 1. TẢI DỮ LIỆU BẢNG LƯỚI TỪ SERVER HOẶC LOCAL STORAGE
  const loadGridData = async (targetMonth = month, targetYear = year) => {
    setLoading(true);
    setSaveToast(null);
    try {
      // 1. Thử gọi API backend
      const res = await base44.bills.getGrid(targetMonth, targetYear);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRows(res.data);
        saveToLocalCache(targetMonth, targetYear, res.data);
        setLoading(false);
        return;
      }

      // 2. Nếu API không trả về hoặc đang offline: Kiểm tra LocalStorage
      const cached = getFromLocalCache(targetMonth, targetYear);
      if (cached && cached.length > 0) {
        setRows(cached);
        setLoading(false);
        return;
      }

      // 3. Nếu mở tháng mới hoàn toàn chưa có dữ liệu: Tự động nhảy số cũ từ tháng trước!
      const prevM = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevY = targetMonth === 1 ? targetYear - 1 : targetYear;
      const prevCached = getFromLocalCache(prevM, prevY);

      if (prevCached && prevCached.length > 0) {
        // Tự động lấy số mới tháng trước làm số cũ tháng này
        const rolloverRows = prevCached.map((prev, idx) => {
          const elPrev = prev.electricCurrent !== "" && prev.electricCurrent !== null ? Number(prev.electricCurrent) : Number(prev.electricPrevious);
          const waPrev = prev.waterCurrent !== "" && prev.waterCurrent !== null ? Number(prev.waterCurrent) : Number(prev.waterPrevious);
          const debt = prev.status === "unpaid" ? (Number(prev.totalAmount) || 0) : 0;
          const otherTotal = (prev.otherFees || []).reduce((s, f) => s + (Number(f.amount) || 0), 0);
          const rent = Number(prev.monthlyRent) || 0;

          return {
            ...prev,
            id: `row_local_${targetYear}_${targetMonth}_${idx}`,
            electricPrevious: elPrev,
            electricCurrent: "", // Mở tháng mới -> để trống sẵn sàng đi đọc công tơ
            electricUsage: 0,
            electricTotal: 0,
            waterPrevious: waPrev,
            waterCurrent: "",
            waterUsage: 0,
            waterTotal: 0,
            previousDebt: debt,
            totalAmount: rent + otherTotal + debt,
            status: "draft",
            billId: null,
            isAutoRollover: true,
            hasPrevRecord: true,
            note: debt > 0 ? `Chuyển nợ cũ ${formatVND(debt)} từ Tháng ${prevM}` : ""
          };
        });
        setRows(rolloverRows);
        saveToLocalCache(targetMonth, targetYear, rolloverRows);
        setLoading(false);
        return;
      }

      // 4. Fallback mẫu mặc định nếu chưa từng có dữ liệu
      const defaultRows = generateDefaultMockRows(targetMonth, targetYear);
      setRows(defaultRows);
      saveToLocalCache(targetMonth, targetYear, defaultRows);
    } catch (err) {
      console.warn("Lỗi tải bảng lưới, sử dụng fallback:", err);
      const cached = getFromLocalCache(targetMonth, targetYear) || generateDefaultMockRows(targetMonth, targetYear);
      setRows(cached);
    } finally {
      setLoading(false);
    }
  };

  // Helper lưu LocalStorage
  const saveToLocalCache = (m, y, data) => {
    try {
      localStorage.setItem(`smartstay_meter_grid_${y}_${m}`, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage error:", e);
    }
  };

  // Helper đọc LocalStorage
  const getFromLocalCache = (m, y) => {
    try {
      const item = localStorage.getItem(`smartstay_meter_grid_${y}_${m}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  };

  // Dữ liệu mẫu demo trực quan
  const generateDefaultMockRows = (m, y) => {
    const isPrevMonth9 = m === 9 && y === 2026;
    return [
      {
        id: "row_1",
        roomNumber: "P.101",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Nguyễn Văn A",
        tenantPhone: "0912 345 678",
        monthlyRent: 2500000,
        electricPrice: 3500,
        electricPrevious: 1120,
        electricCurrent: isPrevMonth9 ? 1205 : 1290,
        electricUsage: 85,
        electricTotal: 297500,
        waterPrice: 15000,
        waterPrevious: 82,
        waterCurrent: isPrevMonth9 ? 86 : 91,
        waterUsage: isPrevMonth9 ? 4 : 5,
        waterTotal: isPrevMonth9 ? 60000 : 75000,
        otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
        otherTotal: 70000,
        previousDebt: 0,
        totalAmount: 2942500,
        status: isPrevMonth9 ? "paid" : "unpaid",
        isAutoRollover: !isPrevMonth9,
        hasPrevRecord: true,
        note: ""
      },
      {
        id: "row_2",
        roomNumber: "P.102",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Lê Thị Hoa",
        tenantPhone: "0938 888 999",
        monthlyRent: 2200000,
        electricPrice: 3500,
        electricPrevious: isPrevMonth9 ? 410 : 490,
        electricCurrent: isPrevMonth9 ? 490 : 570,
        electricUsage: 80,
        electricTotal: 280000,
        waterPrice: 15000,
        waterPrevious: isPrevMonth9 ? 25 : 30,
        waterCurrent: isPrevMonth9 ? 30 : 35,
        waterUsage: 5,
        waterTotal: 75000,
        otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
        otherTotal: 70000,
        previousDebt: 0,
        totalAmount: 2625000,
        status: isPrevMonth9 ? "paid" : "unpaid",
        isAutoRollover: !isPrevMonth9,
        hasPrevRecord: true,
        note: ""
      },
      {
        id: "row_3",
        roomNumber: "P.103",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Trần Minh Quân",
        tenantPhone: "0909 112 233",
        monthlyRent: 2400000,
        electricPrice: 3500,
        electricPrevious: isPrevMonth9 ? 750 : 835,
        electricCurrent: isPrevMonth9 ? 835 : 920,
        electricUsage: 85,
        electricTotal: 297500,
        waterPrice: 15000,
        waterPrevious: isPrevMonth9 ? 48 : 53,
        waterCurrent: isPrevMonth9 ? 53 : 59,
        waterUsage: isPrevMonth9 ? 5 : 6,
        waterTotal: isPrevMonth9 ? 75000 : 90000,
        otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
        otherTotal: 70000,
        previousDebt: 150000,
        totalAmount: 3007500,
        status: "unpaid",
        isAutoRollover: !isPrevMonth9,
        hasPrevRecord: true,
        note: "Nợ cũ 150.000 đ tiền rác"
      },
      {
        id: "row_4",
        roomNumber: "P.104",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Phạm Thùy Linh",
        tenantPhone: "0944 556 778",
        monthlyRent: 2000000,
        electricPrice: 3500,
        electricPrevious: isPrevMonth9 ? 320 : 395,
        electricCurrent: isPrevMonth9 ? 395 : 465,
        electricUsage: isPrevMonth9 ? 75 : 70,
        electricTotal: isPrevMonth9 ? 262500 : 245000,
        waterPrice: 15000,
        waterPrevious: isPrevMonth9 ? 18 : 22,
        waterCurrent: isPrevMonth9 ? 22 : 26,
        waterUsage: 4,
        waterTotal: 60000,
        otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
        otherTotal: 70000,
        previousDebt: 0,
        totalAmount: 2375000,
        status: isPrevMonth9 ? "paid" : "unpaid",
        isAutoRollover: !isPrevMonth9,
        hasPrevRecord: true,
        note: ""
      },
      {
        id: "row_5",
        roomNumber: "P.201",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Hoàng Đức Nam",
        tenantPhone: "0977 123 999",
        monthlyRent: 2600000,
        electricPrice: 3500,
        electricPrevious: isPrevMonth9 ? 910 : 998,
        electricCurrent: isPrevMonth9 ? 998 : 1088,
        electricUsage: 90,
        electricTotal: 315000,
        waterPrice: 15000,
        waterPrevious: isPrevMonth9 ? 60 : 66,
        waterCurrent: isPrevMonth9 ? 66 : 72,
        waterUsage: 6,
        waterTotal: 90000,
        otherFees: [{ name: "Wifi", amount: 50000 }, { name: "Rác", amount: 20000 }],
        otherTotal: 70000,
        previousDebt: 0,
        totalAmount: 3075000,
        status: isPrevMonth9 ? "paid" : "draft",
        isAutoRollover: !isPrevMonth9,
        hasPrevRecord: true,
        note: ""
      },
      {
        id: "row_6",
        roomNumber: "P.202",
        propertyName: "Dãy trọ Cô Ba (Hẻm 51)",
        tenantName: "Phòng Trống (Đang tu bổ)",
        tenantPhone: "",
        monthlyRent: 2200000,
        electricPrice: 3500,
        electricPrevious: 150,
        electricCurrent: 150,
        electricUsage: 0,
        electricTotal: 0,
        waterPrice: 15000,
        waterPrevious: 12,
        waterCurrent: 12,
        waterUsage: 0,
        waterTotal: 0,
        otherFees: [],
        otherTotal: 0,
        previousDebt: 0,
        totalAmount: 0,
        status: "draft",
        isAutoRollover: false,
        hasPrevRecord: false,
        note: "Phòng đang trống"
      }
    ];
  };

  useEffect(() => {
    loadGridData(month, year);
  }, [month, year]);

  // 2. CHUYỂN ĐỔI THÁNG TRƯỚC / THÁNG SAU
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  };

  // 3. TÍNH TOÁN REAL-TIME KHI GÕ CHỈ SỐ MỚI
  const handleCellChange = (rowIndex, colKey, rawValue) => {
    // Chỉ cho phép nhập số
    const cleanValue = rawValue.replace(/[^0-9]/g, "");

    setRows(prevRows => {
      const updated = [...prevRows];
      const row = { ...updated[rowIndex] };

      if (colKey === "electricCurrent") {
        row.electricCurrent = cleanValue;
        if (cleanValue !== "") {
          const elPrev = Number(row.electricPrevious) || 0;
          const elCurr = Number(cleanValue);
          row.electricUsage = Math.max(0, elCurr - elPrev);
          row.electricTotal = row.electricUsage * (Number(row.electricPrice) || 3500);
          row.status = row.status === "paid" ? "paid" : "unpaid";
        } else {
          row.electricUsage = 0;
          row.electricTotal = 0;
        }
      } else if (colKey === "waterCurrent") {
        row.waterCurrent = cleanValue;
        if (cleanValue !== "") {
          const waPrev = Number(row.waterPrevious) || 0;
          const waCurr = Number(cleanValue);
          row.waterUsage = Math.max(0, waCurr - waPrev);
          row.waterTotal = row.waterUsage * (Number(row.waterPrice) || 15000);
          row.status = row.status === "paid" ? "paid" : "unpaid";
        } else {
          row.waterUsage = 0;
          row.waterTotal = 0;
        }
      } else if (colKey === "electricPrevious") {
        row.electricPrevious = Number(cleanValue) || 0;
        if (row.electricCurrent !== "") {
          row.electricUsage = Math.max(0, Number(row.electricCurrent) - row.electricPrevious);
          row.electricTotal = row.electricUsage * (Number(row.electricPrice) || 3500);
        }
      } else if (colKey === "waterPrevious") {
        row.waterPrevious = Number(cleanValue) || 0;
        if (row.waterCurrent !== "") {
          row.waterUsage = Math.max(0, Number(row.waterCurrent) - row.waterPrevious);
          row.waterTotal = row.waterUsage * (Number(row.waterPrice) || 15000);
        }
      } else if (colKey === "previousDebt") {
        row.previousDebt = Number(cleanValue) || 0;
      }

      // Tính tổng thu
      const rent = Number(row.monthlyRent) || 0;
      const otherTotal = (row.otherFees || []).reduce((s, f) => s + (Number(f.amount) || 0), 0);
      const debt = Number(row.previousDebt) || 0;
      row.otherTotal = otherTotal;
      row.totalAmount = rent + (row.electricTotal || 0) + (row.waterTotal || 0) + otherTotal + debt;

      updated[rowIndex] = row;
      saveToLocalCache(month, year, updated);
      return updated;
    });
  };

  // 4. ĐIỀU HƯỚNG BÀN PHÍM SIÊU TỐC (ENTER, TAB, PHÍM MŨI TÊN)
  // Cầm điện thoại đi đọc công tơ 1 vòng 3 phút là xong cả dãy trọ!
  const handleKeyDown = (e, rowIndex, colKey) => {
    const totalRows = filteredRows.length;

    // Phím Enter hoặc Mũi tên xuống: Nhảy ngay xuống phòng tiếp theo trong cùng cột
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = rowIndex + 1 < totalRows ? rowIndex + 1 : 0;
      const targetRef = inputRefs.current[`input-${nextRow}-${colKey}`];
      if (targetRef) {
        targetRef.focus();
        targetRef.select();
      }
    }
    // Mũi tên lên: Nhảy lên phòng phía trên
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = rowIndex - 1 >= 0 ? rowIndex - 1 : totalRows - 1;
      const targetRef = inputRefs.current[`input-${prevRow}-${colKey}`];
      if (targetRef) {
        targetRef.focus();
        targetRef.select();
      }
    }
    // Phím Tab: Nhảy sang cột nước hoặc phòng tiếp theo
    else if (e.key === "Tab" && !e.shiftKey) {
      if (colKey === "electricCurrent") {
        e.preventDefault();
        const targetRef = inputRefs.current[`input-${rowIndex}-waterCurrent`];
        if (targetRef) {
          targetRef.focus();
          targetRef.select();
        }
      } else if (colKey === "waterCurrent") {
        // Hết ô nước phòng này -> Nhảy sang ô điện phòng tiếp theo!
        if (rowIndex + 1 < totalRows) {
          e.preventDefault();
          const targetRef = inputRefs.current[`input-${rowIndex + 1}-electricCurrent`];
          if (targetRef) {
            targetRef.focus();
            targetRef.select();
          }
        }
      }
    }
    // Shift + Tab: Lùi lại
    else if (e.key === "Tab" && e.shiftKey) {
      if (colKey === "waterCurrent") {
        e.preventDefault();
        const targetRef = inputRefs.current[`input-${rowIndex}-electricCurrent`];
        if (targetRef) {
          targetRef.focus();
          targetRef.select();
        }
      } else if (colKey === "electricCurrent" && rowIndex > 0) {
        e.preventDefault();
        const targetRef = inputRefs.current[`input-${rowIndex - 1}-waterCurrent`];
        if (targetRef) {
          targetRef.focus();
          targetRef.select();
        }
      }
    }
  };

  // 5. LƯU BẢNG CHỐT SỐ TOÀN BỘ DÃY TRỌ
  const handleSaveAll = async (createBills = false) => {
    setSaving(true);
    try {
      saveToLocalCache(month, year, rows);

      const payload = {
        month,
        year,
        rows,
        createBills
      };

      const res = await base44.bills.batchSaveGrid(payload);

      setSaveToast({
        type: "success",
        message: createBills
          ? `Đã chốt số và phát hành hóa đơn Tháng ${month}/${year} cho toàn bộ ${rows.length} phòng!`
          : `Đã lưu thành công dữ liệu chốt số công tơ Tháng ${month}/${year}!`
      });

      // Tải lại để cập nhật trạng thái mới nhất
      loadGridData(month, year);
    } catch (err) {
      saveToLocalCache(month, year, rows);
      setSaveToast({
        type: "success",
        message: `Đã lưu an toàn vào máy (Local Storage) cho ${rows.length} phòng!`
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  // 6. XUẤT EXCEL / CSV CÓ HỖ TRỢ TIẾNG VIỆT ĐẦY ĐỦ
  const handleExportCSV = () => {
    const headers = [
      "Phòng",
      "Khu trọ",
      "Khách thuê",
      "SĐT",
      "Giá phòng (VNĐ)",
      "Điện cũ",
      "Điện mới",
      "Điện tiêu thụ (kWh)",
      "Đơn giá điện",
      "Tiền điện (VNĐ)",
      "Nước cũ",
      "Nước mới",
      "Nước tiêu thụ (m3)",
      "Đơn giá nước",
      "Tiền nước (VNĐ)",
      "Phụ phí (VNĐ)",
      "Nợ cũ (VNĐ)",
      "Tổng thu (VNĐ)",
      "Trạng thái",
      "Ghi chú"
    ];

    const csvRows = [headers.join(",")];

    rows.forEach(r => {
      const rowData = [
        `"${r.roomNumber}"`,
        `"${r.propertyName || ""}"`,
        `"${r.tenantName || ""}"`,
        `"${r.tenantPhone || ""}"`,
        r.monthlyRent || 0,
        r.electricPrevious || 0,
        r.electricCurrent || 0,
        r.electricUsage || 0,
        r.electricPrice || 3500,
        r.electricTotal || 0,
        r.waterPrevious || 0,
        r.waterCurrent || 0,
        r.waterUsage || 0,
        r.waterPrice || 15000,
        r.waterTotal || 0,
        r.otherTotal || 0,
        r.previousDebt || 0,
        r.totalAmount || 0,
        `"${r.status === "paid" ? "Đã thu" : (r.status === "unpaid" ? "Chưa thu" : "Chưa chốt")}"`,
        `"${r.note || ""}"`
      ];
      csvRows.push(rowData.join(","));
    });

    // Thêm BOM \uFEFF để Microsoft Excel mở trực tiếp không bị lỗi font tiếng Việt
    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bang_Chot_Dien_Nuoc_Thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. CẢNH BÁO THÔNG MINH (CHỐNG RÒ RỈ NƯỚC & CHẬP ĐIỆN)
  const getSmartWarnings = (row) => {
    const waUsage = Number(row.waterUsage) || 0;
    const elUsage = Number(row.electricUsage) || 0;

    // Rò rỉ nước: dùng từ 15 m³ trở lên (mức bình thường chỉ 3-6 m³/phòng)
    const hasWaterLeak = waUsage >= 15;
    // Chập điện / Hao điện: dùng từ 250 kWh trở lên
    const hasElectricSurge = elUsage >= 250;

    return {
      hasWaterLeak,
      hasElectricSurge,
      hasWarning: hasWaterLeak || hasElectricSurge,
      waterLeakMsg: hasWaterLeak 
        ? `🚨 CẢNH BÁO RÒ RỈ NƯỚC: Tiêu thụ ${waUsage} m³ (tăng đột biến)! Kiểm tra van xả bồn cầu hoặc bục ống nước trước khi gửi hóa đơn.` 
        : "",
      electricSurgeMsg: hasElectricSurge 
        ? `⚡ CẢNH BÁO HAO ĐIỆN: Tiêu thụ ${elUsage} kWh (tăng đột biến)! Kiểm tra chập dây hoặc máy lạnh rò ga.` 
        : ""
    };
  };

  // 6. XUẤT FILE EXCEL (.XLSX) THỰC THỤ BẰNG THƯ VIỆN XLSX (SHEETJS)
  const handleExportXLSX = () => {
    try {
      const dataForSheet = [
        ["BẢNG CHỐT SỐ ĐIỆN NƯỚC & TÍNH TIỀN PHÒNG TRỌ (SMARTSTAY GRID)"],
        [`Tháng ${month} Năm ${year} - Xuất ngày ${new Date().toLocaleDateString("vi-VN")}`],
        [],
        [
          "STT",
          "Số phòng",
          "Khu trọ",
          "Khách thuê",
          "Số điện thoại",
          "Tiền phòng (VNĐ)",
          "Điện cũ",
          "Điện mới",
          "Điện tiêu thụ (kWh)",
          "Đơn giá điện (đ/kWh)",
          "Tiền điện (VNĐ)",
          "Nước cũ",
          "Nước mới",
          "Nước tiêu thụ (m³)",
          "Đơn giá nước (đ/m³)",
          "Tiền nước (VNĐ)",
          "Phụ phí (VNĐ)",
          "Nợ cũ (VNĐ)",
          "Tổng thu (VNĐ)",
          "Trạng thái",
          "Cảnh báo & Ghi chú"
        ]
      ];

      filteredRows.forEach((r, idx) => {
        const warnings = getSmartWarnings(r);
        let warningNote = r.note || "";
        if (warnings.hasWaterLeak) warningNote += " [🚨 CẢNH BÁO RÒ RỈ NƯỚC]";
        if (warnings.hasElectricSurge) warningNote += " [⚡ CẢNH BÁO HAO ĐIỆN]";

        dataForSheet.push([
          idx + 1,
          r.roomNumber,
          r.propertyName || "",
          r.tenantName || "",
          r.tenantPhone || "",
          Number(r.monthlyRent) || 0,
          Number(r.electricPrevious) || 0,
          r.electricCurrent !== "" ? Number(r.electricCurrent) : "",
          Number(r.electricUsage) || 0,
          Number(r.electricPrice) || 3500,
          Number(r.electricTotal) || 0,
          Number(r.waterPrevious) || 0,
          r.waterCurrent !== "" ? Number(r.waterCurrent) : "",
          Number(r.waterUsage) || 0,
          Number(r.waterPrice) || 15000,
          Number(r.waterTotal) || 0,
          Number(r.otherTotal) || 0,
          Number(r.previousDebt) || 0,
          Number(r.totalAmount) || 0,
          r.status === "paid" ? "Đã thu" : (r.status === "partial" ? `Thu 1 phần (Nợ ${r.remainingDebt || 0}đ)` : "Chưa thu"),
          warningNote
        ]);
      });

      // Dòng tổng cộng
      dataForSheet.push([]);
      dataForSheet.push([
        "TỔNG CỘNG",
        `${filteredRows.length} phòng`,
        "",
        "",
        "",
        filteredRows.reduce((s, r) => s + (Number(r.monthlyRent) || 0), 0),
        "",
        "",
        stats.totalElectricityUsage,
        "",
        stats.totalElectricityCost,
        "",
        "",
        stats.totalWaterUsage,
        "",
        stats.totalWaterCost,
        filteredRows.reduce((s, r) => s + (Number(r.otherTotal) || 0), 0),
        stats.totalDebt,
        stats.grandTotal,
        "",
        ""
      ]);

      const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
      ws["!cols"] = [
        { wch: 6 },  { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 14 },
        { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
        { wch: 30 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Tháng ${month}-${year}`);
      XLSX.writeFile(wb, `Bang_Chot_Dien_Nuoc_Thang_${month}_${year}.xlsx`);

      setSaveToast({
        type: "success",
        message: `🎉 Đã xuất file Excel Bang_Chot_Dien_Nuoc_Thang_${month}_${year}.xlsx thành công!`
      });
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      alert("Lỗi xuất file Excel: " + err.message);
    }
  };

  // TẢI FILE EXCEL MẪU CHUẨN
  const handleDownloadTemplate = () => {
    const templateData = [
      ["BẢNG MẪU NHẬP LIỆU CHỐT SỐ ĐIỆN NƯỚC - SMARTSTAY"],
      ["Hướng dẫn: Điền số phòng, chỉ số điện nước và phụ phí theo các cột bên dưới rồi tải lên hệ thống"],
      [],
      [
        "Số phòng",
        "Khu trọ",
        "Khách thuê",
        "Số điện thoại",
        "Giá phòng",
        "Điện cũ",
        "Điện mới",
        "Đơn giá điện",
        "Nước cũ",
        "Nước mới",
        "Đơn giá nước",
        "Phụ phí (Wifi+Rác)",
        "Nợ cũ",
        "Ghi chú"
      ],
      ["P.101", "Khu trọ Cô Ba", "Nguyễn Văn A", "0912345678", 2500000, 1290, 1375, 3500, 91, 95, 15000, 70000, 0, ""],
      ["P.102", "Khu trọ Cô Ba", "Lê Thị Hoa", "0938888999", 2200000, 840, 910, 3500, 60, 64, 15000, 70000, 0, ""],
      ["P.103", "Khu trọ Cô Ba", "Trần Minh Khang", "0977112233", 2400000, 950, 1020, 3500, 75, 79, 15000, 70000, 0, ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
      { wch: 12 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
    XLSX.writeFile(wb, "Mau_Nhap_Chot_So_Dien_Nuoc_SmartStay.xlsx");
  };

  // NHẬP TỪ FILE EXCEL (.XLSX / .XLS)
  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          alert("File Excel không có dữ liệu hợp lệ!");
          return;
        }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowStr = (rawJson[i] || []).join(" ").toLowerCase();
          if (rowStr.includes("phòng") || rowStr.includes("phong") || rowStr.includes("room")) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert("Không tìm thấy dòng tiêu đề cột (cần có cột 'Số phòng' hoặc 'Phòng')!");
          return;
        }

        const headers = rawJson[headerRowIdx].map(h => String(h || "").trim().toLowerCase());
        const findCol = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const colRoom = findCol(["phòng", "phong", "room"]);
        const colProp = findCol(["khu trọ", "khu tro", "dãy", "cơ sở", "tòa nhà"]);
        const colTenant = findCol(["khách", "người thuê", "họ tên", "tên", "tenant"]);
        const colPhone = findCol(["sđt", "sdt", "điện thoại", "phone"]);
        const colRent = findCol(["giá phòng", "tiền phòng", "rent"]);
        const colElecPrev = findCol(["điện cũ", "dien cu"]);
        const colElecCurr = findCol(["điện mới", "dien moi"]);
        const colElecPrice = findCol(["giá điện", "đơn giá điện"]);
        const colWaterPrev = findCol(["nước cũ", "nuoc cu"]);
        const colWaterCurr = findCol(["nước mới", "nuoc moi"]);
        const colWaterPrice = findCol(["giá nước", "đơn giá nước"]);
        const colOther = findCol(["phụ phí", "phu phi", "dịch vụ", "wifi"]);
        const colDebt = findCol(["nợ cũ", "no cu", "nợ"]);
        const colNote = findCol(["ghi chú", "ghi chu", "note"]);

        const importedRows = [];
        for (let i = headerRowIdx + 1; i < rawJson.length; i++) {
          const r = rawJson[i];
          if (!r || !r[colRoom] || String(r[colRoom]).trim().toLowerCase().startsWith("tổng")) continue;

          const roomNum = String(r[colRoom]).trim();
          const rent = Number(r[colRent]) || 2000000;
          const elPrev = Number(r[colElecPrev]) || 0;
          const elCurr = r[colElecCurr] !== undefined && r[colElecCurr] !== "" ? Number(r[colElecCurr]) : "";
          const elPrice = Number(r[colElecPrice]) || 3500;
          const elUsage = elCurr !== "" ? Math.max(0, elCurr - elPrev) : 0;
          const elTotal = elUsage * elPrice;

          const waPrev = Number(r[colWaterPrev]) || 0;
          const waCurr = r[colWaterCurr] !== undefined && r[colWaterCurr] !== "" ? Number(r[colWaterCurr]) : "";
          const waPrice = Number(r[colWaterPrice]) || 15000;
          const waUsage = waCurr !== "" ? Math.max(0, waCurr - waPrev) : 0;
          const waTotal = waUsage * waPrice;

          const other = Number(r[colOther]) || 70000;
          const debt = Number(r[colDebt]) || 0;
          const total = rent + elTotal + waTotal + other + debt;

          importedRows.push({
            id: `row_import_${Date.now()}_${i}`,
            roomNumber: roomNum,
            propertyName: (colProp !== -1 && r[colProp]) ? String(r[colProp]).trim() : (rows[0]?.propertyName || "Khu trọ hiện tại"),
            tenantName: (colTenant !== -1 && r[colTenant]) ? String(r[colTenant]).trim() : "Khách thuê",
            tenantPhone: (colPhone !== -1 && r[colPhone]) ? String(r[colPhone]).trim() : "",
            monthlyRent: rent,
            electricPrevious: elPrev,
            electricCurrent: elCurr,
            electricUsage: elUsage,
            electricPrice: elPrice,
            electricTotal: elTotal,
            waterPrevious: waPrev,
            waterCurrent: waCurr,
            waterUsage: waUsage,
            waterPrice: waPrice,
            waterTotal: waTotal,
            otherFees: [{ name: "Dịch vụ", amount: other }],
            otherTotal: other,
            previousDebt: debt,
            totalAmount: total,
            status: elCurr !== "" ? "unpaid" : "draft",
            note: (colNote !== -1 && r[colNote]) ? String(r[colNote]).trim() : ""
          });
        }

        if (importedRows.length === 0) {
          alert("Không tìm thấy hàng dữ liệu phòng nào trong file Excel!");
          return;
        }

        setRows(importedRows);
        saveToLocalCache(month, year, importedRows);
        alert(`🎉 NHẬP EXCEL THÀNH CÔNG!\n\nĐã nhập ${importedRows.length} phòng vào Bảng chốt số Tháng ${month}/${year}.`);
      } catch (err) {
        console.error("Lỗi đọc file Excel:", err);
        alert("Lỗi khi đọc file Excel: " + err.message);
      } finally {
        if (excelFileInputRef.current) excelFileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // SAO CHÉP MẪU TIN NHẮN ZALO CHO RIÊNG 1 PHÒNG
  const handleCopySingleZalo = (row) => {
    const m = month;
    const y = year;
    const vietqrLink = `https://img.vietqr.io/image/MB-0907297338-compact2.png?amount=${Number(row.totalAmount || 0)}&addInfo=${encodeURIComponent(`P_${row.roomNumber} T${m}`)}&accountName=LE%20KHAI`;

    let msg = `Kính gửi phòng ${row.roomNumber} (${row.propertyName || "Dãy trọ"}):\n`;
    msg += `• Tiền phòng T${m}/${y}: ${formatVND(row.monthlyRent)}\n`;
    msg += `• Điện (${row.electricPrevious} -> ${row.electricCurrent || row.electricPrevious} = ${row.electricUsage || 0} kWh x ${formatVND(row.electricPrice)}): ${formatVND(row.electricTotal)}\n`;
    msg += `• Nước (${row.waterPrevious} -> ${row.waterCurrent || row.waterPrevious} = ${row.waterUsage || 0} m³ x ${formatVND(row.waterPrice)}): ${formatVND(row.waterTotal)}\n`;
    if (row.otherTotal > 0) {
      msg += `• Phụ phí (Wifi, Rác): ${formatVND(row.otherTotal)}\n`;
    }
    if (row.previousDebt > 0) {
      msg += `• Nợ cũ: ${formatVND(row.previousDebt)}\n`;
    }
    msg += `👉 TỔNG CỘNG: ${formatVND(row.totalAmount)}\n\n`;
    msg += `🏦 THÔNG TIN CHUYỂN KHOẢN (VietQR):\n`;
    msg += `• MB Bank - STK: 0907297338 (LE KHAI)\n`;
    msg += `• Nội dung CK: P_${row.roomNumber} T${m}\n`;
    msg += `📲 Quét mã VietQR tự động điền tiền: ${vietqrLink}\n`;
    msg += `⏰ Hạn đóng: Ngày 10/${m}/${y}`;

    navigator.clipboard.writeText(msg);
    setSaveToast({
      type: "success",
      message: `🎉 Đã sao chép tin nhắn Zalo phòng ${row.roomNumber}! Mở Zalo dán (Ctrl+V) để gửi ngay.`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // MỞ MODAL GHI NHẬN THANH TOÁN (HỖ TRỢ THU MỘT PHẦN)
  const handleOpenPaymentModal = (idx) => {
    const row = filteredRows[idx];
    setPaymentModal({
      open: true,
      rowIndex: idx,
      status: row.status === "paid" ? "paid" : (row.status === "partial" ? "partial" : "unpaid"),
      paidAmount: row.status === "paid" ? String(row.totalAmount) : (row.paidAmount ? String(row.paidAmount) : ""),
      note: row.note || ""
    });
  };

  const handleSavePayment = () => {
    if (paymentModal.rowIndex === null) return;
    const targetIdx = paymentModal.rowIndex;

    setRows(prev => {
      const updated = [...prev];
      const r = { ...updated[targetIdx] };
      const tot = Number(r.totalAmount) || 0;

      if (paymentModal.status === "paid") {
        r.status = "paid";
        r.paidAmount = tot;
        r.remainingDebt = 0;
        r.note = paymentModal.note || "Đã thu đủ 100%";
      } else if (paymentModal.status === "partial") {
        const paid = Number(paymentModal.paidAmount) || 0;
        const rem = Math.max(0, tot - paid);
        r.status = "partial";
        r.paidAmount = paid;
        r.remainingDebt = rem;
        r.note = `Đã thu ${formatVND(paid)} (còn nợ ${formatVND(rem)} chuyển tháng sau)`;
      } else {
        r.status = "unpaid";
        r.paidAmount = 0;
        r.remainingDebt = tot;
        r.note = paymentModal.note || "";
      }

      updated[targetIdx] = r;
      saveToLocalCache(month, year, updated);
      return updated;
    });

    setPaymentModal({ open: false, rowIndex: null, status: "paid", paidAmount: "", note: "" });
  };

  // ÁP DỤNG ĐƠN GIÁ CHUNG CẢ DÃY (BATCH RATES)
  const handleApplyBatchRates = () => {
    setRows(prev => {
      const updated = prev.map(r => {
        if (batchRates.applyToProperty !== "all" && r.propertyName !== batchRates.applyToProperty) {
          return r;
        }

        const elPrice = Number(batchRates.electricPrice) || r.electricPrice || 3500;
        const waPrice = Number(batchRates.waterPrice) || r.waterPrice || 15000;
        const elTotal = (Number(r.electricUsage) || 0) * elPrice;
        const waTotal = (Number(r.waterUsage) || 0) * waPrice;

        const otherFees = [
          { name: "Wifi", amount: Number(batchRates.wifiFee) || 0 },
          { name: "Rác", amount: Number(batchRates.trashFee) || 0 }
        ];
        const otherTotal = (Number(batchRates.wifiFee) || 0) + (Number(batchRates.trashFee) || 0);
        const debt = Number(r.previousDebt) || 0;
        const rent = Number(r.monthlyRent) || 0;

        return {
          ...r,
          electricPrice: elPrice,
          electricTotal: elTotal,
          waterPrice: waPrice,
          waterTotal: waTotal,
          otherFees,
          otherTotal,
          totalAmount: rent + elTotal + waTotal + otherTotal + debt
        };
      });

      saveToLocalCache(month, year, updated);
      return updated;
    });

    setBatchRatesModal(false);
    alert("🎉 Đã áp dụng đơn giá điện, nước & phụ phí thành công cho toàn bộ phòng!");
  };

  // 7. IN BẢNG KÊ THU TIỀN
  const handlePrint = () => {
    window.print();
  };

  // 8. SAO CHÉP MẪU TIN NHẮN ZALO GỬI CẢ DÃY TRỌ
  const handleCopyZaloSummary = () => {
    let msg = `📋 BẢNG THÔNG BÁO TIỀN PHÒNG & ĐIỆN NƯỚC - THÁNG ${month}/${year}\n`;
    msg += `📍 ${rows[0]?.propertyName || "Nhà trọ SmartStay"}\n`;
    msg += `-------------------------------------------\n\n`;

    rows.forEach(r => {
      msg += `🏠 Phòng ${r.roomNumber} (${r.tenantName || "Khách thuê"}):\n`;
      msg += `• Tiền phòng: ${formatVND(r.monthlyRent)}\n`;
      msg += `• Điện: ${r.electricPrevious} -> ${r.electricCurrent || r.electricPrevious} (${r.electricUsage || 0} kWh) = ${formatVND(r.electricTotal)}\n`;
      msg += `• Nước: ${r.waterPrevious} -> ${r.waterCurrent || r.waterPrevious} (${r.waterUsage || 0} m³) = ${formatVND(r.waterTotal)}\n`;
      if (r.otherTotal > 0) {
        msg += `• Phụ phí: ${formatVND(r.otherTotal)}\n`;
      }
      if (r.previousDebt > 0) {
        msg += `• Nợ cũ: ${formatVND(r.previousDebt)}\n`;
      }
      msg += `👉 TỔNG CỘNG: ${formatVND(r.totalAmount)}\n`;
      msg += `-------------------------------------------\n`;
    });

    msg += `\n⏰ Hạn thanh toán: Ngày 10/${month}/${year}\n`;
    msg += `💳 Quý khách vui lòng chuyển khoản theo số tài khoản niêm yết hoặc gửi trực tiếp cho chủ nhà. Xin cảm ơn!`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  // Lọc dữ liệu hiển thị
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchSearch =
        search === "" ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(search.toLowerCase())) ||
        (r.tenantName && r.tenantName.toLowerCase().includes(search.toLowerCase())) ||
        (r.tenantPhone && r.tenantPhone.includes(search));

      const matchProperty =
        propertyFilter === "all" || r.propertyName === propertyFilter;

      const warnings = getSmartWarnings(r);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "recorded" && r.electricCurrent !== "") ||
        (statusFilter === "unrecorded" && r.electricCurrent === "") ||
        (statusFilter === "paid" && r.status === "paid") ||
        (statusFilter === "partial" && r.status === "partial") ||
        (statusFilter === "unpaid" && (r.status === "unpaid" || r.status === "draft")) ||
        (statusFilter === "hasDebt" && r.previousDebt > 0) ||
        (statusFilter === "warning" && warnings.hasWarning);

      return matchSearch && matchProperty && matchStatus;
    });
  }, [rows, search, propertyFilter, statusFilter]);

  // Danh sách các khu trọ duy nhất để lọc
  const properties = useMemo(() => {
    const set = new Set();
    rows.forEach(r => {
      if (r.propertyName) set.add(r.propertyName);
    });
    return Array.from(set);
  }, [rows]);

  // Thống kê tổng quan nhanh (KPIs)
  const stats = useMemo(() => {
    let recordedRooms = 0;
    let totalElectricityUsage = 0;
    let totalElectricityCost = 0;
    let totalWaterUsage = 0;
    let totalWaterCost = 0;
    let totalDebt = 0;
    let grandTotal = 0;

    let warningCount = 0;
    let waterLeakCount = 0;
    let electricSurgeCount = 0;

    rows.forEach(r => {
      if (r.electricCurrent !== "" && r.electricCurrent !== null) {
        recordedRooms++;
      }
      totalElectricityUsage += Number(r.electricUsage) || 0;
      totalElectricityCost += Number(r.electricTotal) || 0;
      totalWaterUsage += Number(r.waterUsage) || 0;
      totalWaterCost += Number(r.waterTotal) || 0;
      totalDebt += Number(r.previousDebt) || 0;
      grandTotal += Number(r.totalAmount) || 0;

      const w = getSmartWarnings(r);
      if (w.hasWarning) warningCount++;
      if (w.hasWaterLeak) waterLeakCount++;
      if (w.hasElectricSurge) electricSurgeCount++;
    });

    return {
      totalRooms: rows.length,
      recordedRooms,
      percent: rows.length > 0 ? Math.round((recordedRooms / rows.length) * 100) : 0,
      totalElectricityUsage,
      totalElectricityCost,
      totalWaterUsage,
      totalWaterCost,
      totalDebt,
      grandTotal,
      warningCount,
      waterLeakCount,
      electricSurgeCount
    };
  }, [rows]);

  // Tìm hàng đang được focus để hiển thị thanh điều khiển ngón tay cái trên Mobile
  const activeRow = activeCell !== null ? filteredRows[activeCell.rowIndex] : null;

  return (
    <div className="space-y-6 pb-20">
      
      {/* ── HEADER & THANH ĐIỀU HƯỚNG THÁNG ── */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Tiêu đề & Tag giới thiệu */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Bảng Chốt Số Điện Nước Dạng Lưới
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Excel Thông Minh 2.0
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động kế thừa chỉ số cũ từ tháng trước • Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono font-bold">Enter</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono font-bold">Tab</kbd> để nhảy phòng siêu tốc
                </p>
              </div>
            </div>
          </div>

          {/* Bộ chọn Tháng / Năm & Nút bấm nhanh */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white rounded-xl text-slate-700 transition font-bold flex items-center gap-1 text-xs"
                title="Lùi 1 tháng"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Tháng trước</span>
              </button>

              <div className="px-3 py-1 flex items-center gap-1.5 bg-white rounded-xl shadow-xs border border-slate-200/60 mx-1">
                <Calendar className="w-4 h-4 text-amber-500" />
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-transparent font-black text-sm text-slate-900 outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
                <span className="text-slate-400 font-bold">/</span>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-transparent font-black text-sm text-slate-900 outline-none cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-white rounded-xl text-slate-700 transition font-bold flex items-center gap-1 text-xs"
                title="Sang tháng tiếp theo"
              >
                <span className="hidden sm:inline">Tháng sau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nút hành động */}
            <Button
              onClick={() => handleSaveAll(false)}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm text-xs gap-1.5 h-10 px-4"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
              <span>Lưu bảng chốt</span>
            </Button>

            <Button
              onClick={() => handleSaveAll(true)}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl shadow-sm text-xs gap-1.5 h-10 px-4"
            >
              <Receipt className="w-4 h-4" />
              <span>Chốt & Phát hành HĐ</span>
            </Button>
          </div>
        </div>

        {/* ── CHỈ SỐ NHANH (KPI STATS) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100">
          
          {/* Tổng phòng & Tiến độ chốt */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 block">Tiến độ ghi số</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{stats.recordedRooms}</span>
              <span className="text-xs text-slate-500 font-bold">/ {stats.totalRooms} phòng</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          {/* Điện tiêu thụ */}
          <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Tổng Điện</span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5">
              {stats.totalElectricityUsage.toLocaleString("vi-VN")} <span className="text-xs font-semibold">kWh</span>
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-1 truncate">
              {formatVND(stats.totalElectricityCost)}
            </div>
          </div>

          {/* Nước tiêu thụ */}
          <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-200/60">
            <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Tổng Nước</span>
            </div>
            <div className="text-lg font-black text-sky-900 mt-0.5">
              {stats.totalWaterUsage.toLocaleString("vi-VN")} <span className="text-xs font-semibold">m³</span>
            </div>
            <div className="text-[11px] font-bold text-sky-700 mt-1 truncate">
              {formatVND(stats.totalWaterCost)}
            </div>
          </div>

          {/* Nợ cũ còn đọng */}
          <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-200/60">
            <span className="text-[11px] font-bold text-rose-700 block">Nợ cũ tồn đọng</span>
            <div className="text-lg font-black text-rose-700 mt-0.5 truncate">
              {formatVND(stats.totalDebt)}
            </div>
            <span className="text-[10px] text-rose-600 font-bold block mt-1">Từ các tháng trước</span>
          </div>

          {/* Tổng tiền thu toàn dãy */}
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/60 lg:col-span-2">
            <span className="text-[11px] font-bold text-emerald-800 block">Tổng thu dự kiến Tháng {month}/{year}</span>
            <div className="text-xl md:text-2xl font-black text-emerald-700 mt-0.5 truncate">
              {formatVND(stats.grandTotal)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Bao gồm: Tiền phòng + Điện + Nước + Phụ phí + Nợ cũ
            </span>
          </div>
        </div>

        {/* ── BỘ LỌC & CÔNG CỤ TIỆN ÍCH ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* Ô tìm kiếm */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm số phòng, tên khách, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lọc theo khu trọ */}
            {properties.length > 1 && (
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả khu trọ ({properties.length})</option>
                {properties.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}

            {/* Lọc theo trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                "border px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none transition",
                statusFilter === "warning" 
                  ? "bg-rose-50 border-rose-400 text-rose-800" 
                  : "bg-slate-50 border-slate-200 text-slate-700"
              )}
            >
              <option value="all">Tất cả trạng thái ({rows.length})</option>
              <option value="unrecorded">⚡ Chưa ghi số</option>
              <option value="recorded">✅ Đã ghi số</option>
              <option value="unpaid">⏳ Chưa thanh toán</option>
              <option value="partial">💵 Đã thu một phần</option>
              <option value="paid">💰 Đã thanh toán đủ</option>
              <option value="hasDebt">⚠️ Có nợ cũ</option>
              {stats.warningCount > 0 && (
                <option value="warning">🚨 Cảnh báo rò rỉ / chập điện ({stats.warningCount})</option>
              )}
            </select>

            {/* Nút lọc nhanh cảnh báo nếu có */}
            {stats.warningCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "warning" ? "all" : "warning")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black border transition flex items-center gap-1.5 animate-pulse",
                  statusFilter === "warning"
                    ? "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/20"
                    : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                )}
                title="Bấm để xem ngay các phòng có lượng nước hoặc điện tăng đột biến"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>{stats.warningCount} phòng cảnh báo</span>
              </button>
            )}
          </div>

          {/* Nút Xuất/Nhập Excel, Cài đơn giá & Zalo */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-end md:self-auto flex-wrap">
            {/* Input file Excel ẩn */}
            <input
              ref={excelFileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleImportExcel}
            />

            {/* Nút Nhập từ Excel */}
            <button
              type="button"
              onClick={() => excelFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Nhập danh sách phòng và số liệu từ file Excel có sẵn (.xlsx, .xls)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhập Excel</span>
            </button>

            {/* Nút Xuất Excel .xlsx */}
            <button
              type="button"
              onClick={handleExportXLSX}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-xs"
              title="Tải bảng tính Excel đầy đủ định dạng (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>

            {/* Nút Cài đơn giá chung cả dãy */}
            <button
              type="button"
              onClick={() => setBatchRatesModal(true)}
              className="px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#f97316] transition flex items-center gap-1.5 shadow-xs"
              title="Cài đặt nhanh đơn giá điện, nước, phụ phí cho cả dãy"
            >
              <Sliders className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="hidden sm:inline">Đơn giá chung</span>
            </button>

            {/* Nút Copy Zalo toàn bộ dãy */}
            <button
              type="button"
              onClick={handleCopyZaloSummary}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5",
                copiedZalo
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
              title="Sao chép toàn bộ thông báo tiền trọ cả dãy để dán vào nhóm Zalo"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
              <span>{copiedZalo ? "Đã chép!" : "Zalo cả dãy"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
              title="In bảng kê chốt số"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Thanh gợi ý phím tắt & Thông báo nhảy số tự động */}
        {showKeyboardHint && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cơ chế tự động nhảy số:</strong> Khi chuyển sang Tháng {month}, số cũ đã tự động kế thừa từ số mới của tháng trước. Chỉ cần nhập số mới rồi bấm <kbd className="font-bold bg-white px-1.5 py-0.5 rounded shadow-xs border border-amber-300">Enter</kbd> để nhảy xuống phòng tiếp theo.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyboardHint(false)}
              className="text-amber-700 hover:text-amber-900 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toast thông báo lưu */}
        {saveToast && (
          <div className="mt-3 p-3 bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveToast.message}</span>
          </div>
        )}
      </div>

      {/* ── BẢNG LƯỚI CHỐT SỐ ĐIỆN NƯỚC (THE EXCEL-STYLE GRID) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto relative max-h-[75vh]">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* HEADER 2 TẦNG CHUYÊN NGHIỆP */}
            <thead className="bg-slate-900 text-white font-black sticky top-0 z-20 select-none">
              
              {/* Tầng 1: Nhóm cột chính */}
              <tr className="border-b border-slate-800">
                <th rowSpan={2} className="py-3 px-3 w-12 text-center border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                  STT
                </th>
                <th rowSpan={2} className="py-3 px-4 min-w-[150px] border-r border-slate-800 sticky left-12 z-30 bg-slate-900">
                  Phòng / Khách thuê
                </th>
                <th rowSpan={2} className="py-3 px-3 min-w-[110px] text-right border-r border-slate-800">
                  Giá phòng
                </th>

                {/* Nhóm Điện (4 cột con) */}
                <th colSpan={4} className="py-2 px-3 text-center bg-amber-950/80 text-amber-300 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>ĐIỆN (kWh)</span>
                  </div>
                </th>

                {/* Nhóm Nước (4 cột con) */}
                <th colSpan={4} className="py-2 px-3 text-center bg-sky-950/80 text-sky-300 border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>NƯỚC (m³)</span>
                  </div>
                </th>

                <th rowSpan={2} className="py-3 px-3 min-w-[90px] text-right border-r border-slate-800">
                  Phụ phí
                </th>
                <th rowSpan={2} className="py-3 px-3 min-w-[90px] text-right border-r border-slate-800">
                  Nợ cũ
                </th>
                <th rowSpan={2} className="py-3 px-4 min-w-[125px] text-right border-r border-slate-800 bg-emerald-950/80 text-emerald-300">
                  Tổng thu
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center min-w-[100px] border-r border-slate-800">
                  Trạng thái
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center min-w-[90px]">
                  Thao tác
                </th>
              </tr>

              {/* Tầng 2: Cột con của Điện và Nước */}
              <tr className="text-[11px] border-b border-slate-800">
                {/* Điện */}
                <th className="py-2 px-2 text-right bg-amber-950/60 text-amber-200 border-r border-slate-800 min-w-[70px]">
                  Số Cũ
                </th>
                <th className="py-2 px-2 text-right bg-amber-900/60 text-white border-r border-slate-800 min-w-[85px]">
                  Số Mới *
                </th>
                <th className="py-2 px-2 text-right bg-amber-950/60 text-amber-200 border-r border-slate-800 min-w-[65px]">
                  Tiêu thụ
                </th>
                <th className="py-2 px-2 text-right bg-amber-950/60 text-amber-200 border-r border-slate-800 min-w-[90px]">
                  Thành tiền
                </th>

                {/* Nước */}
                <th className="py-2 px-2 text-right bg-sky-950/60 text-sky-200 border-r border-slate-800 min-w-[65px]">
                  Số Cũ
                </th>
                <th className="py-2 px-2 text-right bg-sky-900/60 text-white border-r border-slate-800 min-w-[80px]">
                  Số Mới *
                </th>
                <th className="py-2 px-2 text-right bg-sky-950/60 text-sky-200 border-r border-slate-800 min-w-[60px]">
                  Khối
                </th>
                <th className="py-2 px-2 text-right bg-sky-950/60 text-sky-200 border-r border-slate-800 min-w-[85px]">
                  Thành tiền
                </th>
              </tr>
            </thead>

            {/* DỮ LIỆU CÁC HÀNG (BODY) */}
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <p className="font-bold">Đang tải bảng chốt số Tháng {month}/{year}...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Không tìm thấy phòng nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isFocused = activeCell?.rowIndex === idx;
                  const isNegativeElectric = row.electricCurrent !== "" && Number(row.electricCurrent) < Number(row.electricPrevious);
                  const isNegativeWater = row.waterCurrent !== "" && Number(row.waterCurrent) < Number(row.waterPrevious);
                  const warnings = getSmartWarnings(row);

                  return (
                    <tr
                      key={row.id || idx}
                      className={cn(
                        "transition-colors group",
                        isFocused
                          ? "bg-orange-50/70"
                          : idx % 2 === 0
                            ? "bg-white hover:bg-slate-50/80"
                            : "bg-[#fcfaf5]/60 hover:bg-slate-50/80"
                      )}
                    >
                      {/* STT */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-400 border-r border-slate-200 sticky left-0 z-10 bg-inherit">
                        {idx + 1}
                      </td>

                      {/* Phòng & Khách thuê (Sticky left) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 sticky left-12 z-10 bg-inherit">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm tracking-tight px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {row.roomNumber}
                          </span>
                          <div className="truncate max-w-[130px]">
                            <span className="font-bold text-slate-800 block truncate text-xs">
                              {row.tenantName || "Phòng trống"}
                            </span>
                            {row.tenantPhone && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {row.tenantPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Giá phòng */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 border-r border-slate-200">
                        {formatVND(row.monthlyRent)}
                      </td>

                      {/* ── ĐIỆN: SỐ CŨ ── */}
                      <td className="py-2.5 px-2 text-right border-r border-slate-200 bg-amber-50/20">
                        <span className="font-mono font-bold text-slate-600" title="Chỉ số tháng trước">
                          {formatMeterNumber(row.electricPrevious)}
                        </span>
                        {row.isAutoRollover && (
                          <span className="block text-[9px] text-amber-600 font-semibold" title="Tự động lấy số mới tháng trước">
                            (nhảy số)
                          </span>
                        )}
                      </td>

                      {/* ── ĐIỆN: SỐ MỚI (INPUT) ── */}
                      <td className="py-1.5 px-1.5 border-r border-slate-200 bg-amber-50/40">
                        <div className="relative">
                          <input
                            ref={el => inputRefs.current[`input-${idx}-electricCurrent`] = el}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            placeholder={formatMeterNumber(row.electricPrevious)}
                            value={row.electricCurrent ?? ""}
                            onFocus={(e) => {
                              e.target.select();
                              setActiveCell({ rowIndex: idx, colKey: "electricCurrent" });
                            }}
                            onChange={(e) => handleCellChange(idx, "electricCurrent", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "electricCurrent")}
                            className={cn(
                              "w-full text-right font-mono font-black text-sm px-2 py-1.5 rounded-lg border outline-none transition",
                              isNegativeElectric
                                ? "bg-rose-50 border-rose-400 text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                : "bg-white border-amber-300 text-amber-950 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
                            )}
                          />
                          {isNegativeElectric && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]" title="Số mới nhỏ hơn số cũ!">
                              !
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ── ĐIỆN: TIÊU THỤ (KWH) ── */}
                      <td className={cn(
                        "py-2.5 px-2 text-right font-mono font-bold border-r border-slate-200 transition",
                        warnings.hasElectricSurge 
                          ? "bg-amber-100 text-amber-900 border-amber-300 font-black" 
                          : "bg-amber-50/20 text-amber-800"
                      )}>
                        <div className="flex items-center justify-end gap-1">
                          {warnings.hasElectricSurge && (
                            <span className="text-[10px] text-amber-600 font-black" title={warnings.electricSurgeMsg}>
                              ⚡⚠️
                            </span>
                          )}
                          <span className={cn(
                            row.electricUsage > 0 ? "font-black" : "text-slate-400",
                            warnings.hasElectricSurge && "text-amber-900 font-black underline decoration-wavy"
                          )}>
                            {formatMeterNumber(row.electricUsage)}
                          </span>
                        </div>
                        {warnings.hasElectricSurge && (
                          <span className="block text-[9px] text-amber-700 font-extrabold uppercase tracking-tight">
                            Hao điện
                          </span>
                        )}
                      </td>

                      {/* ── ĐIỆN: THÀNH TIỀN ── */}
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-900 border-r border-slate-200 bg-amber-50/20">
                        {formatVND(row.electricTotal)}
                      </td>

                      {/* ── NƯỚC: SỐ CŨ ── */}
                      <td className="py-2.5 px-2 text-right border-r border-slate-200 bg-sky-50/20">
                        <span className="font-mono font-bold text-slate-600">
                          {formatMeterNumber(row.waterPrevious)}
                        </span>
                      </td>

                      {/* ── NƯỚC: SỐ MỚI (INPUT) ── */}
                      <td className="py-1.5 px-1.5 border-r border-slate-200 bg-sky-50/40">
                        <div className="relative">
                          <input
                            ref={el => inputRefs.current[`input-${idx}-waterCurrent`] = el}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            placeholder={formatMeterNumber(row.waterPrevious)}
                            value={row.waterCurrent ?? ""}
                            onFocus={(e) => {
                              e.target.select();
                              setActiveCell({ rowIndex: idx, colKey: "waterCurrent" });
                            }}
                            onChange={(e) => handleCellChange(idx, "waterCurrent", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "waterCurrent")}
                            className={cn(
                              "w-full text-right font-mono font-black text-sm px-2 py-1.5 rounded-lg border outline-none transition",
                              isNegativeWater
                                ? "bg-rose-50 border-rose-400 text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                : "bg-white border-sky-300 text-sky-950 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs"
                            )}
                          />
                          {isNegativeWater && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]" title="Số mới nhỏ hơn số cũ!">
                              !
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ── NƯỚC: KHỐI (M3) ── */}
                      <td className={cn(
                        "py-2.5 px-2 text-right font-mono font-bold border-r border-slate-200 transition",
                        warnings.hasWaterLeak 
                          ? "bg-rose-100 text-rose-900 border-rose-300 font-black" 
                          : "bg-sky-50/20 text-sky-800"
                      )}>
                        <div className="flex items-center justify-end gap-1">
                          {warnings.hasWaterLeak && (
                            <span className="text-[10px] text-rose-600 animate-pulse font-black" title={warnings.waterLeakMsg}>
                              🚨
                            </span>
                          )}
                          <span className={cn(
                            row.waterUsage > 0 ? "font-black" : "text-slate-400",
                            warnings.hasWaterLeak && "text-rose-700 font-black underline decoration-wavy"
                          )}>
                            {formatMeterNumber(row.waterUsage)}
                          </span>
                        </div>
                        {warnings.hasWaterLeak && (
                          <span className="block text-[9px] text-rose-600 font-extrabold uppercase tracking-tight">
                            Rò rỉ?
                          </span>
                        )}
                      </td>

                      {/* ── NƯỚC: THÀNH TIỀN ── */}
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-sky-900 border-r border-slate-200 bg-sky-50/20">
                        {formatVND(row.waterTotal)}
                      </td>

                      {/* ── PHỤ PHÍ ── */}
                      <td className="py-2.5 px-2 text-right border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => setFeeModal({ open: true, rowIndex: idx })}
                          className="font-mono font-bold text-slate-700 hover:text-orange-600 hover:underline"
                          title="Bấm để xem / chỉnh sửa chi tiết phụ phí"
                        >
                          {formatVND(row.otherTotal)}
                        </button>
                      </td>

                      {/* ── NỢ CŨ ── */}
                      <td className="py-2.5 px-2 text-right border-r border-slate-200">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.previousDebt ? formatMeterNumber(row.previousDebt) : ""}
                          placeholder="0"
                          onChange={(e) => handleCellChange(idx, "previousDebt", e.target.value)}
                          className={cn(
                            "w-full text-right font-mono font-bold px-1.5 py-1 rounded border outline-none text-xs transition",
                            row.previousDebt > 0
                              ? "bg-rose-50 border-rose-300 text-rose-700 font-black"
                              : "bg-transparent border-transparent hover:border-slate-300 text-slate-500"
                          )}
                          title="Nợ tồn từ tháng trước"
                        />
                      </td>

                      {/* ── TỔNG THU ── */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-700 bg-emerald-50/40 border-r border-slate-200">
                        {formatVND(row.totalAmount)}
                      </td>

                      {/* ── TRẠNG THÁI (BẤM VÀO ĐỂ GHI NHẬN THU TIỀN / THU MỘT PHẦN) ── */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(idx)}
                          className="hover:scale-105 transition-transform"
                          title="Bấm để ghi nhận Đã thu / Thu một phần / Nợ lại"
                        >
                          {row.status === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã thu đủ
                            </span>
                          ) : row.status === "partial" ? (
                            <span className="inline-flex flex-col items-center text-[10px] font-bold px-2 py-0.5 rounded-xl bg-orange-100 text-[#ea580c] border border-orange-300 cursor-pointer shadow-xs">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Thu 1 phần</span>
                              <span className="text-[9px] text-rose-600 font-extrabold">Nợ {formatVND(row.remainingDebt || 0)}</span>
                            </span>
                          ) : row.electricCurrent !== "" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 cursor-pointer shadow-xs">
                              <Clock className="w-3 h-3" />
                              Chưa thu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer">
                              Chưa ghi
                            </span>
                          )}
                        </button>
                      </td>

                      {/* ── THAO TÁC ── */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Chụp / Tải ảnh công tơ điện */}
                          <button
                            type="button"
                            onClick={() => setPhotoModal({
                              open: true,
                              rowIndex: idx,
                              type: "electric",
                              photoUrl: row.electricPhoto || ""
                            })}
                            className={cn(
                              "p-1.5 rounded-lg border transition",
                              row.electricPhoto
                                ? "bg-amber-100 border-amber-300 text-amber-700"
                                : "hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-transparent"
                            )}
                            title="Đính kèm ảnh công tơ điện minh bạch"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút 1 chạm: Gửi / Copy Zalo kèm mã VietQR chuẩn */}
                          <button
                            type="button"
                            onClick={() => handleCopySingleZalo(row)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition shadow-xs"
                            title="Sao chép tin nhắn Zalo kèm mã VietQR cho phòng này"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Xem & In Hóa đơn */}
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(row)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                            title="Xem & in Phiếu thu / Hóa đơn tiền trọ"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Chi tiết / Ghi chú */}
                          <button
                            type="button"
                            onClick={() => setFeeModal({ open: true, rowIndex: idx })}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            title="Xem chi tiết phụ phí & ghi chú"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── THANH ĐIỀU KHIỂN TIỆN LỢI TRÊN MOBILE / THUMB BAR ── */}
      {/* Cầm điện thoại đi đọc công tơ: Nút bấm to ở dưới cùng màn hình giúp chuyển phòng siêu tiện */}
      {activeRow && !viewingInvoice && !paymentModal.open && !batchRatesModal && !photoModal.open && !feeModal.open && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-slate-900 text-white p-3.5 rounded-3xl shadow-2xl border border-slate-700 z-30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-amber-400 text-sm">
                Phòng {activeRow.roomNumber}
              </span>
              <span className="text-xs text-slate-300 font-bold truncate">
                ({activeRow.tenantName || "Trống"})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Đang nhập: {activeCell?.colKey === "electricCurrent" ? "⚡ Điện Mới" : "💧 Nước Mới"} • Bấm Enter để nhảy phòng
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextRow = activeCell.rowIndex + 1 < filteredRows.length ? activeCell.rowIndex + 1 : 0;
                const targetRef = inputRefs.current[`input-${nextRow}-${activeCell.colKey}`];
                if (targetRef) {
                  targetRef.focus();
                  targetRef.select();
                }
              }}
              className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-xs rounded-2xl flex items-center gap-1 shadow-md"
            >
              <span>Phòng tiếp</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL GHI NHẬN THU TIỀN & THU MỘT PHẦN (DEBT TRACKING) ── */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Ghi nhận thu tiền phòng {filteredRows[paymentModal.rowIndex]?.roomNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng tiền cần thu: <strong>{formatVND(filteredRows[paymentModal.rowIndex]?.totalAmount)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModal({ open: false, rowIndex: null, status: "paid", paidAmount: "", note: "" })}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Trạng thái thanh toán:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "paid", label: "Đã thu đủ (100%)", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                  { id: "partial", label: "Thu một phần", color: "border-orange-500 bg-orange-50 text-[#ea580c]" },
                  { id: "unpaid", label: "Chưa thanh toán", color: "border-rose-400 bg-rose-50 text-rose-800" }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPaymentModal(p => ({
                      ...p,
                      status: st.id,
                      paidAmount: st.id === "paid" ? String(filteredRows[paymentModal.rowIndex]?.totalAmount) : (st.id === "unpaid" ? "0" : p.paidAmount)
                    }))}
                    className={cn(
                      "py-2 px-1 text-center rounded-xl text-xs font-bold border-2 transition",
                      paymentModal.status === st.id ? st.color : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Nếu chọn thu một phần */}
              {paymentModal.status === "partial" && (
                <div className="p-3.5 bg-orange-50/80 rounded-2xl border border-orange-200 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-orange-950">
                    Số tiền khách đã trả (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={paymentModal.paidAmount}
                    onChange={(e) => setPaymentModal(p => ({ ...p, paidAmount: e.target.value }))}
                    placeholder="VD: 2000000"
                    className="w-full p-2.5 rounded-xl border border-orange-300 bg-white text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-600 font-semibold">
                    <span>Số nợ còn lại:</span>
                    <strong className="text-rose-600 font-black text-sm">
                      {formatVND(Math.max(0, (Number(filteredRows[paymentModal.rowIndex]?.totalAmount) || 0) - (Number(paymentModal.paidAmount) || 0)))}
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    💡 Số nợ này sẽ tự động chuyển sang cột <strong>Nợ cũ</strong> của tháng sau.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thanh toán:</label>
                <input
                  type="text"
                  value={paymentModal.note}
                  onChange={(e) => setPaymentModal(p => ({ ...p, note: e.target.value }))}
                  placeholder="VD: Chuyển khoản qua MB Bank lúc 14h..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setPaymentModal({ open: false, rowIndex: null, status: "paid", paidAmount: "", note: "" })}
                className="rounded-full text-xs"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSavePayment}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 shadow-md shadow-emerald-500/20"
              >
                Lưu ghi nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CÀI ĐẶT ĐƠN GIÁ CHUNG CẢ DÃY (BATCH RATES) ── */}
      {batchRatesModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#f97316]" />
                  <span>Cài đặt đơn giá chung cho cả dãy</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Áp dụng nhanh đơn giá điện nước và phụ phí cho toàn bộ phòng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchRatesModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Áp dụng cho:</label>
                <select
                  value={batchRates.applyToProperty}
                  onChange={(e) => setBatchRates(b => ({ ...b, applyToProperty: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="all">Tất cả các khu trọ</option>
                  {properties.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá điện (VNĐ/kWh):</label>
                  <input
                    type="number"
                    value={batchRates.electricPrice}
                    onChange={(e) => setBatchRates(b => ({ ...b, electricPrice: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-slate-200 text-sm font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá nước (VNĐ/m³):</label>
                  <input
                    type="number"
                    value={batchRates.waterPrice}
                    onChange={(e) => setBatchRates(b => ({ ...b, waterPrice: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-slate-200 text-sm font-bold text-sky-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phí Wifi (VNĐ/tháng):</label>
                  <input
                    type="number"
                    value={batchRates.wifiFee}
                    onChange={(e) => setBatchRates(b => ({ ...b, wifiFee: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phí rác (VNĐ/tháng):</label>
                  <input
                    type="number"
                    value={batchRates.trashFee}
                    onChange={(e) => setBatchRates(b => ({ ...b, trashFee: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Khi bấm áp dụng, hệ thống sẽ tự động tính lại thành tiền điện nước và tổng thu cho toàn bộ phòng trong bảng tính.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setBatchRatesModal(false)}
                className="rounded-full text-xs"
              >
                Hủy
              </Button>
              <Button
                onClick={handleApplyBatchRates}
                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 shadow-md shadow-orange-500/20"
              >
                Áp dụng ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: ĐÍNH KÈM ẢNH CHỤP CÔNG TƠ MINH BẠCH ── */}
      {photoModal.open && photoModal.rowIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Ảnh công tơ {photoModal.type === "electric" ? "Điện" : "Nước"} - Phòng {filteredRows[photoModal.rowIndex]?.roomNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModal({ open: false, rowIndex: null, type: "electric", photoUrl: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Chụp ảnh đồng hồ để sinh viên đối soát minh bạch khi xem hóa đơn trên app, chống tranh chấp.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Đường dẫn ảnh (URL hoặc dán ảnh chụp)
                </label>
                <input
                  type="text"
                  placeholder="https://... hoặc link ảnh Cloudinary / Drive"
                  value={photoModal.photoUrl}
                  onChange={(e) => setPhotoModal(prev => ({ ...prev, photoUrl: e.target.value }))}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {photoModal.photoUrl && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-48 flex items-center justify-center bg-slate-50">
                  <img
                    src={photoModal.photoUrl}
                    alt="Công tơ"
                    className="max-h-48 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPhotoModal({ open: false, rowIndex: null, type: "electric", photoUrl: "" })}
                className="rounded-xl text-xs font-bold"
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  const targetRow = filteredRows[photoModal.rowIndex];
                  const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                  if (rawIndex !== -1) {
                    setRows(prev => {
                      const updated = [...prev];
                      if (photoModal.type === "electric") {
                        updated[rawIndex].electricPhoto = photoModal.photoUrl;
                      } else {
                        updated[rawIndex].waterPhoto = photoModal.photoUrl;
                      }
                      return updated;
                    });
                  }
                  setPhotoModal({ open: false, rowIndex: null, type: "electric", photoUrl: "" });
                }}
                className="bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Lưu ảnh công tơ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XEM VÀ IN HÓA ĐƠN CHI TIẾT TỪ BẢNG LƯỚI (HỖ TRỢ COPY ẢNH GỬI ZALO) ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
          
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-grid-invoice, #printable-grid-invoice * { visibility: visible !important; }
              #printable-grid-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                margin: 0 !important;
                padding: 20px !important;
              }
              .no-print-area { display: none !important; }
            }
          `}</style>

          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-200 relative">
            
            {/* Thanh điều khiển trên cùng */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 no-print-area" data-html2canvas-ignore="true">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#f97316]" />
                <span>Hóa đơn điện tử phòng {viewingInvoice.roomNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── KHU VỰC THẺ HÓA ĐƠN ĐƯỢC CHỤP ẢNH & IN ẤN (invoiceGridCardRef) ── */}
            <div 
              id="printable-grid-invoice"
              ref={invoiceGridCardRef}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              {/* Header Hóa đơn */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#f97316] font-black text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SmartStay Utility Billing</span>
                </div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  PHIẾU THU TIỀN PHÒNG & ĐIỆN NƯỚC
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kỳ thanh toán: <b className="text-slate-800">Tháng {month}/{year}</b> • Mã số: <b className="font-mono text-slate-700">PT-{year}{month < 10 ? `0${month}` : month}-{viewingInvoice.roomNumber || 'P101'}</b>
                </p>
              </div>

              {/* Thông tin 2 bên */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Bên cho thuê (Chủ trọ):</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{viewingInvoice.propertyName || "Nhà trọ SmartStay"}</span>
                  <span className="text-slate-500 block text-[11px]">Khu vực Cần Thơ</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Bên thuê phòng:</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{viewingInvoice.tenantName || "Khách thuê"} - Phòng {viewingInvoice.roomNumber}</span>
                  <span className="text-slate-500 block text-[11px]">SĐT: {viewingInvoice.tenantPhone || "Chưa có"}</span>
                </div>
              </div>

              {/* BẢNG KÊ CHI TIẾT CÁC KHOẢN (TABLE) */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="py-2 px-3 text-left">Khoản mục</th>
                      <th className="py-2 px-3 text-left">Chỉ số / Diễn giải</th>
                      <th className="py-2 px-3 text-right">Đơn giá</th>
                      <th className="py-2 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">1. Tiền thuê phòng</td>
                      <td className="py-2 px-3 text-slate-500">Định kỳ 1 tháng</td>
                      <td className="py-2 px-3 text-right">{formatVND(viewingInvoice.monthlyRent)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatVND(viewingInvoice.monthlyRent)}</td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 font-bold text-amber-900">2. Tiền điện</td>
                      <td className="py-2 px-3 text-amber-800 font-mono">
                        {viewingInvoice.electricPrevious} ➔ {viewingInvoice.electricCurrent || viewingInvoice.electricPrevious} ({viewingInvoice.electricUsage} kWh)
                      </td>
                      <td className="py-2 px-3 text-right text-amber-900">{formatVND(viewingInvoice.electricPrice || 3500)}</td>
                      <td className="py-2 px-3 text-right font-black text-amber-900">{formatVND(viewingInvoice.electricTotal)}</td>
                    </tr>
                    <tr className="bg-sky-50/40">
                      <td className="py-2 px-3 font-bold text-sky-900">3. Tiền nước</td>
                      <td className="py-2 px-3 text-sky-800 font-mono">
                        {viewingInvoice.waterPrevious} ➔ {viewingInvoice.waterCurrent || viewingInvoice.waterPrevious} ({viewingInvoice.waterUsage} m³)
                      </td>
                      <td className="py-2 px-3 text-right text-sky-900">{formatVND(viewingInvoice.waterPrice || 15000)}</td>
                      <td className="py-2 px-3 text-right font-black text-sky-900">{formatVND(viewingInvoice.waterTotal)}</td>
                    </tr>
                    {Number(viewingInvoice.otherTotal) > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">4. Dịch vụ chung</td>
                        <td className="py-2 px-3 text-slate-500">
                          {(viewingInvoice.otherFees || []).map(f => `${f.name} (${formatVND(f.amount)})`).join(' + ') || 'Wifi + Rác'}
                        </td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatVND(viewingInvoice.otherTotal)}</td>
                      </tr>
                    )}
                    {Number(viewingInvoice.previousDebt) > 0 && (
                      <tr className="bg-rose-50/40">
                        <td className="py-2 px-3 font-bold text-rose-800">5. Nợ cũ tháng trước</td>
                        <td className="py-2 px-3 text-rose-700">Chuyển tiếp chưa thanh toán</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-700">+{formatVND(viewingInvoice.previousDebt)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng cộng & Bằng chữ */}
              <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/90">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-sm">TỔNG CỘNG THANH TOÁN:</span>
                  <span className="font-heading font-black text-2xl text-[#f97316]">
                    {formatVND(viewingInvoice.totalAmount)}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 italic">
                  (Bằng chữ: <b>{docSoTienBangChu(Number(viewingInvoice.totalAmount))}</b>)
                </div>
              </div>

              {/* Thông tin chuyển khoản, MÃ VIETQR THẬT và Con dấu */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs gap-3">
                <div className="space-y-1 flex-1 text-left w-full sm:w-auto">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Tài khoản thanh toán:</span>
                  <span className="text-slate-600 block">Ngân hàng: <b>MB Bank (Quân Đội)</b></span>
                  <span className="text-slate-600 block">Số tài khoản: <b className="font-mono text-slate-900 text-sm">0907297338</b> (LE KHAI)</span>
                  <span className="text-slate-500 block text-[11px]">Nội dung CK: <b className="font-mono text-orange-600 font-bold">TT TIEN TRO {viewingInvoice.roomNumber} T{month}</b></span>
                </div>

                {/* Mã QR VietQR thanh toán quét trực tiếp - Tạo bằng QRCode Base64 đảm bảo 100% không bao giờ bể ảnh */}
                <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">MB Bank</span>
                    <span className="text-[9px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">VietQR</span>
                  </div>
                  {invoiceQrUrl ? (
                    <img 
                      src={invoiceQrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-24 h-24 object-contain rounded-lg shadow-2xs"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-slate-50 rounded-lg">
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    </div>
                  )}
                  <span className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-tight">Quét mã trả tiền</span>
                </div>

                {/* Con dấu trạng thái */}
                <div className={cn(
                  "px-3.5 py-2 rounded-2xl border-2 font-black text-xs uppercase tracking-widest text-center shrink-0 rotate-[-6deg]",
                  viewingInvoice.status === "paid"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/90 shadow-xs"
                    : "border-orange-500 text-orange-600 bg-orange-50/90 shadow-xs"
                )}>
                  {viewingInvoice.status === "paid" ? "✓ ĐÃ THU ĐỦ" : "⚠ CHƯA THU"}
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                Cảm ơn bạn đã đồng hành cùng khu trọ! Vui lòng thanh toán trước ngày 10/{month}/{year}.
              </div>
            </div>

            {/* ── CÁC NÚT HÀNH ĐỘNG: COPY ẢNH GỬI ZALO, TẢI ẢNH, XUẤT PDF, COPY TEXT ── */}
            <div className="flex items-center justify-end gap-2 pt-4 flex-wrap no-print-area" data-html2canvas-ignore="true">
              
              {/* Nút Copy ảnh Zalo */}
              <Button
                type="button"
                disabled={isCapturingGridImage}
                onClick={async () => {
                  if (!invoiceGridCardRef.current) return;
                  try {
                    setIsCapturingGridImage(true);
                    const canvas = await html2canvas(invoiceGridCardRef.current, {
                      scale: 2,
                      useCORS: true,
                                            backgroundColor: "#ffffff",
                      logging: false
                    });
                    canvas.toBlob(async (blob) => {
                      if (!blob) {
                        alert("Không thể tạo ảnh, vui lòng thử nút Tải ảnh hoặc In PDF!");
                        setIsCapturingGridImage(false);
                        return;
                      }
                      try {
                        if (navigator.clipboard && window.ClipboardItem) {
                          await navigator.clipboard.write([
                            new ClipboardItem({ "image/png": blob })
                          ]);
                          alert("🎉 ĐÃ SAO CHÉP ẢNH HÓA ĐƠN VÀO BỘ NHỚ TẠM!\n\n👉 Bây giờ bạn chỉ cần mở khung chat Zalo của khách và bấm Ctrl + V (Dán) để gửi ảnh hóa đơn nét căng ngay lập tức.");
                        } else {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `Hoa_Don_Thang_${month}_${viewingInvoice.roomNumber}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                          alert("Đã tự động tải file ảnh về máy! Bạn có thể kéo thả ảnh này vào Zalo để gửi cho khách.");
                        }
                      } catch (err) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `Hoa_Don_Thang_${month}_${viewingInvoice.roomNumber}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert("Đã tự động tải file ảnh về máy! Bạn có thể kéo thả ảnh này vào Zalo để gửi cho khách.");
                      } finally {
                        setIsCapturingGridImage(false);
                      }
                    }, "image/png");
                  } catch (e) {
                    console.error("Lỗi html2canvas:", e);
                    setIsCapturingGridImage(false);
                    alert("Không thể chụp ảnh tự động. Bạn hãy bấm 'Tải ảnh PNG' hoặc 'In / Xuất PDF' nhé!");
                  }
                }}
                className="rounded-xl font-black bg-[#f97316] hover:bg-[#ea580c] text-white text-xs h-9 shadow-md shadow-orange-500/20 flex items-center gap-1.5"
              >
                {isCapturingGridImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo ảnh...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Copy ảnh gửi Zalo</span>
                  </>
                )}
              </Button>

              {/* Nút Tải ảnh PNG */}
              <Button
                type="button"
                variant="outline"
                disabled={isCapturingGridImage}
                onClick={async () => {
                  if (!invoiceGridCardRef.current) return;
                  try {
                    setIsCapturingGridImage(true);
                    const canvas = await html2canvas(invoiceGridCardRef.current, {
                      scale: 2,
                      useCORS: true,
                                            backgroundColor: "#ffffff",
                      logging: false
                    });
                    const dataUrl = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = dataUrl;
                    a.download = `Hoa_Don_Thang_${month}_${viewingInvoice.roomNumber}.png`;
                    a.click();
                    alert("🎉 Đã tải file ảnh hóa đơn PNG về máy!");
                  } catch (e) {
                    console.error("Lỗi tải ảnh:", e);
                  } finally {
                    setIsCapturingGridImage(false);
                  }
                }}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải ảnh PNG</span>
              </Button>

              {/* Nút In / Xuất PDF */}
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-purple-600" />
                <span>In / Xuất PDF</span>
              </Button>

              {/* Nút Copy chữ */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const msg = `📋 HÓA ĐƠN TIỀN TRỌ THÁNG ${month}/${year} - PHÒNG ${viewingInvoice.roomNumber}\n` +
                    `• Khách thuê: ${viewingInvoice.tenantName || 'Bạn'}\n` +
                    `• Tiền phòng: ${formatVND(viewingInvoice.monthlyRent)}\n` +
                    `• Điện (${viewingInvoice.electricPrevious} -> ${viewingInvoice.electricCurrent || viewingInvoice.electricPrevious}): ${viewingInvoice.electricUsage} kWh = ${formatVND(viewingInvoice.electricTotal)}\n` +
                    `• Nước (${viewingInvoice.waterPrevious} -> ${viewingInvoice.waterCurrent || viewingInvoice.waterPrevious}): ${viewingInvoice.waterUsage} m³ = ${formatVND(viewingInvoice.waterTotal)}\n` +
                    (Number(viewingInvoice.otherTotal) > 0 ? `• Phụ phí (Wifi, Rác): ${formatVND(viewingInvoice.otherTotal)}\n` : '') +
                    (Number(viewingInvoice.previousDebt) > 0 ? `• Nợ cũ tháng trước: ${formatVND(viewingInvoice.previousDebt)}\n` : '') +
                    `👉 TỔNG CỘNG: ${formatVND(viewingInvoice.totalAmount)}\n` +
                    `💳 STK: 0907297338 MB Bank (LE KHAI)\n` +
                    `⏰ Hạn đóng: 10/${month}/${year}`;
                  navigator.clipboard.writeText(msg);
                  alert("Đã sao chép nội dung văn bản hóa đơn!");
                }}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy chữ</span>
              </Button>

              {/* Nút Đóng */}
              <Button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="rounded-xl font-bold text-xs bg-slate-900 text-white h-9 px-4"
              >
                Đóng
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: TÙY CHỈNH PHỤ PHÍ & GHI CHÚ RIÊNG CỦA PHÒNG ── */}
      {feeModal.open && feeModal.rowIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Phụ phí & Ghi chú - Phòng {filteredRows[feeModal.rowIndex]?.roomNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeeModal({ open: false, rowIndex: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết phụ phí */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Danh sách phụ phí tháng này (Wifi, Rác, Xe, Giặt ủi...)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(filteredRows[feeModal.rowIndex]?.otherFees || []).map((fee, feeIdx) => (
                    <div key={feeIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fee.name}
                        onChange={(e) => {
                          const targetRow = filteredRows[feeModal.rowIndex];
                          const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                          if (rawIndex !== -1) {
                            setRows(prev => {
                              const updated = [...prev];
                              const newFees = [...updated[rawIndex].otherFees];
                              newFees[feeIdx] = { ...newFees[feeIdx], name: e.target.value };
                              updated[rawIndex].otherFees = newFees;
                              return updated;
                            });
                          }
                        }}
                        className="flex-1 text-xs p-2 rounded-xl border border-slate-200"
                        placeholder="Tên phí (vd: Wifi)"
                      />
                      <input
                        type="number"
                        value={fee.amount}
                        onChange={(e) => {
                          const targetRow = filteredRows[feeModal.rowIndex];
                          const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                          if (rawIndex !== -1) {
                            setRows(prev => {
                              const updated = [...prev];
                              const newFees = [...updated[rawIndex].otherFees];
                              newFees[feeIdx] = { ...newFees[feeIdx], amount: Number(e.target.value) || 0 };
                              updated[rawIndex].otherFees = newFees;
                              const oTot = newFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                              updated[rawIndex].otherTotal = oTot;
                              updated[rawIndex].totalAmount =
                                (Number(updated[rawIndex].monthlyRent) || 0) +
                                (Number(updated[rawIndex].electricTotal) || 0) +
                                (Number(updated[rawIndex].waterTotal) || 0) +
                                oTot +
                                (Number(updated[rawIndex].previousDebt) || 0);
                              return updated;
                            });
                          }
                        }}
                        className="w-28 text-xs p-2 rounded-xl border border-slate-200 font-mono text-right"
                        placeholder="Số tiền"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const targetRow = filteredRows[feeModal.rowIndex];
                          const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                          if (rawIndex !== -1) {
                            setRows(prev => {
                              const updated = [...prev];
                              const newFees = updated[rawIndex].otherFees.filter((_, i) => i !== feeIdx);
                              updated[rawIndex].otherFees = newFees;
                              const oTot = newFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                              updated[rawIndex].otherTotal = oTot;
                              updated[rawIndex].totalAmount =
                                (Number(updated[rawIndex].monthlyRent) || 0) +
                                (Number(updated[rawIndex].electricTotal) || 0) +
                                (Number(updated[rawIndex].waterTotal) || 0) +
                                oTot +
                                (Number(updated[rawIndex].previousDebt) || 0);
                              return updated;
                            });
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetRow = filteredRows[feeModal.rowIndex];
                    const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                    if (rawIndex !== -1) {
                      setRows(prev => {
                        const updated = [...prev];
                        const newFees = [...(updated[rawIndex].otherFees || []), { name: "Phụ phí khác", amount: 0 }];
                        updated[rawIndex].otherFees = newFees;
                        return updated;
                      });
                    }
                  }}
                  className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  + Thêm khoản phụ phí
                </button>
              </div>

              {/* Ghi chú cho khách thuê */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ghi chú hóa đơn (khách thuê sẽ đọc được)
                </label>
                <textarea
                  rows={2}
                  value={filteredRows[feeModal.rowIndex]?.note || ""}
                  onChange={(e) => {
                    const targetRow = filteredRows[feeModal.rowIndex];
                    const rawIndex = rows.findIndex(r => r.id === targetRow.id);
                    if (rawIndex !== -1) {
                      setRows(prev => {
                        const updated = [...prev];
                        updated[rawIndex].note = e.target.value;
                        return updated;
                      });
                    }
                  }}
                  placeholder="Vd: Tháng này đổi bóng đèn LED tặng khách..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setFeeModal({ open: false, rowIndex: null })}
                className="bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Xong
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

