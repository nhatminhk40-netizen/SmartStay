import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Truck,
  Loader2,
  Navigation,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  Package,
  Sparkles,
  Info,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Crosshair,
  ArrowLeftRight,
  Route,
  Star,
  UserCheck,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import { LOGISTICS_VEHICLES } from "@/lib/smartstayData";
import { cn } from "@/lib/utils";
import InteractiveLogisticsMap, { parseCoordinates } from "@/components/InteractiveLogisticsMap";

// Danh sách các địa điểm & khu trọ phổ biến tại TP Cần Thơ
const CAN_THO_LOCATIONS = [
  {
    name: "Can Tho Ecolodge (Cái Răng)",
    address: "Can Tho Ecolodge, 542, Khu vực 3, Ba Láng, Cái Răng, Cần Thơ",
    lat: 9.9878,
    lng: 105.7415,
    tag: "Khu du lịch"
  },
  {
    name: "Đền thờ Vua Hùng (Bình Thủy)",
    address: "Đền thờ Vua Hùng, Võ Văn Kiệt, Bình Thủy, Cần Thơ",
    lat: 10.0676,
    lng: 105.7317,
    tag: "Di tích"
  },
  {
    name: "Supper Trọ 686 (An Bình)",
    address: "Supper Trọ 686, Ấp Mỹ Phước, P. An Bình, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0090,
    lng: 105.7380,
    tag: "Khu trọ"
  },
  {
    name: "LOTTE Mart Cần Thơ (Mậu Thân)",
    address: "LOTTE Mart Cần Thơ, 84 Đ. Mậu Thân, P. An Hòa, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0465,
    lng: 105.7725,
    tag: "Trung tâm"
  },
  {
    name: "Hẻm 51 Đường 3/2 (Khu nhà trọ tập trung)",
    address: "Hẻm 51, Đ. 3 Tháng 2, P. Xuân Khánh, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0270,
    lng: 105.7720,
    tag: "Khu trọ"
  },
  {
    name: "ĐH FPT Cần Thơ (KDC An Bình / Hồng Phát)",
    address: "Số 600, Đ. Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0125,
    lng: 105.7325,
    tag: "Đại học"
  },
  {
    name: "ĐH Cần Thơ - Khu 2 (Đ. 3 Tháng 2)",
    address: "Khu II, Đ. 3 Tháng 2, P. Xuân Khánh, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0299,
    lng: 105.7706,
    tag: "Đại học"
  },
  {
    name: "ĐH Y Dược Cần Thơ (Đ. Nguyễn Văn Cừ)",
    address: "179 Đ. Nguyễn Văn Cừ, P. An Khánh, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0350,
    lng: 105.7570,
    tag: "Đại học"
  },
  {
    name: "ĐH Nam Cần Thơ (Nguyễn Văn Cừ nối dài)",
    address: "168 Đ. Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều, Cần Thơ",
    lat: 9.9960,
    lng: 105.7350,
    tag: "Đại học"
  },
  {
    name: "KDC 91B, P. An Khánh, Ninh Kiều",
    address: "KDC 91B, Đ. Nguyễn Hiền, P. An Khánh, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0380,
    lng: 105.7520,
    tag: "Khu dân cư"
  },
  {
    name: "KDC Hồng Phát, P. An Bình, Ninh Kiều",
    address: "KDC Hồng Phát, Đ. Hoàng Quốc Việt, P. An Bình, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0150,
    lng: 105.7400,
    tag: "Khu dân cư"
  },
  {
    name: "Khu trọ Hưng Lợi (Đ. Tầm Vu / 30 Tháng 4)",
    address: "Đ. Tầm Vu, P. Hưng Lợi, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0180,
    lng: 105.7650,
    tag: "Khu trọ"
  },
  {
    name: "Bến Ninh Kiều (Trung tâm TP)",
    address: "Bến Ninh Kiều, P. Tân An, Q. Ninh Kiều, Cần Thơ",
    lat: 10.0335,
    lng: 105.7875,
    tag: "Trung tâm"
  },
  {
    name: "Quận Cái Răng (Cầu Cái Răng / Chợ Nổi)",
    address: "Đ. Lê Bình, P. Lê Bình, Q. Cái Răng, Cần Thơ",
    lat: 9.9980,
    lng: 105.7850,
    tag: "Cái Răng"
  }
];

const ADDON_SERVICES = [
  {
    id: "loading",
    name: "Hỗ trợ bốc xếp / khiêng lầu",
    price: 80000,
    desc: "Tài xế và phụ xe hỗ trợ khiêng đồ lên/xuống phòng trọ tận nơi"
  },
  {
    id: "wrapping",
    name: "Màng bọc PE bảo vệ đồ đạc",
    price: 30000,
    desc: "Quấn bọc chống xước tủ lạnh, nệm, đồ điện tử an toàn"
  },
  {
    id: "assembly",
    name: "Tháo lắp giường / bàn học cơ bản",
    price: 50000,
    desc: "Có sẵn máy bắt vít và dụng cụ kỹ thuật hỗ trợ"
  }
];

export default function Transfers() {
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState(LOGISTICS_VEHICLES[0].id);
  const [distance, setDistance] = useState(7.1); // Khoảng cách tự động đo theo đường đi thực tế
  const [duration, setDuration] = useState(16); // Thời gian lái xe ước tính (phút)
  const [selectedAddons, setSelectedAddons] = useState(["loading"]);
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeTab, setActiveTab] = useState("transporters"); // 'transporters' | 'my' | 'all'
  const [transporters, setTransporters] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // Vị trí đón và đến (Object đầy đủ gồm name, address, lat, lng)
  const [pickupLocation, setPickupLocation] = useState(CAN_THO_LOCATIONS[0]); // Supper Trọ 686
  const [dropoffLocation, setDropoffLocation] = useState(CAN_THO_LOCATIONS[1]); // LOTTE Mart Cần Thơ

  // Form states
  const [customerName, setCustomerName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [moveDate, setMoveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [locatingGPS, setLocatingGPS] = useState(false);

  const activeVehicle =
    LOGISTICS_VEHICLES.find((v) => v.id === selectedVehicle) || LOGISTICS_VEHICLES[0];

  // Tính cước tự động dựa trên khoảng cách đường bộ thực tế (không cho chỉnh tay)
  const baseCost = activeVehicle.basePrice;
  const distanceCost = activeVehicle.perKm * distance;
  const addonsCost = selectedAddons.reduce((sum, id) => {
    const item = ADDON_SERVICES.find((a) => a.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  const rawTotal = baseCost + distanceCost + addonsCost;
  const studentDiscount = Math.round(rawTotal * 0.15); // Ưu đãi người thuê 15%
  const finalTotal = rawTotal - studentDiscount;

  // Tải danh sách đơn đặt xe và danh sách tài xế
  const loadRequests = async () => {
    setLoadingList(true);
    try {
      const [allData, driverData] = await Promise.all([
        base44.entities.Logistics.list(),
        base44.entities.Logistics.getTransporters()
      ]);
      setItems(Array.isArray(allData) ? allData : []);
      setTransporters(Array.isArray(driverData) ? driverData : []);
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleAcceptTrip = async (tripId) => {
    if (!user) {
      alert("Vui lòng đăng nhập với tài khoản Tài xế hoặc Quản trị để nhận đơn.");
      return;
    }
    setProcessingId(tripId);
    try {
      const res = await base44.entities.Logistics.accept(tripId);
      if (res && res.success) {
        alert("🎉 Bạn đã nhận cuốc xe thành công! Hãy liên hệ khách hàng để xác nhận điểm đón.");
        await loadRequests();
      } else {
        alert(res?.message || "Không thể nhận chuyến xe.");
      }
    } catch (err) {
      alert("Lỗi nhận đơn: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (tripId, nextStatus) => {
    setProcessingId(tripId);
    try {
      const res = await base44.entities.Logistics.updateStatus(tripId, nextStatus);
      if (res && res.success) {
        await loadRequests();
      } else {
        alert(res?.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (user) {
      if (!customerName && user.fullName) setCustomerName(user.fullName);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Cập nhật vị trí đón
  const handlePickupChange = (newLoc) => {
    setPickupLocation(newLoc);
  };

  // Cập nhật vị trí đến
  const handleDropoffChange = (newLoc) => {
    setDropoffLocation(newLoc);
  };

  // Xử lý khi người dùng gõ trực tiếp vào ô Điểm đón (hỗ trợ cả tọa độ e.g. 10.02102, 105.7013)
  const handlePickupInputChange = (val) => {
    const coord = parseCoordinates(val);
    if (coord) {
      handlePickupChange({
        name: `Tọa độ (${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)})`,
        address: val,
        lat: coord.lat,
        lng: coord.lng
      });
      return;
    }
    const cleanLower = val.toLowerCase().trim();
    const matched = CAN_THO_LOCATIONS.find(
      (l) =>
        l.name.toLowerCase() === cleanLower ||
        l.address.toLowerCase() === cleanLower ||
        (cleanLower.length >= 4 && (cleanLower.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(cleanLower)))
    );
    if (matched) {
      handlePickupChange({
        ...matched,
        address: val.length > matched.name.length ? val : matched.address
      });
      return;
    }
    handlePickupChange({
      ...pickupLocation,
      name: val,
      address: val
    });
  };

  // Xử lý khi người dùng gõ trực tiếp vào ô Điểm đến (hỗ trợ cả tọa độ e.g. 10.02102, 105.7013)
  const handleDropoffInputChange = (val) => {
    const coord = parseCoordinates(val);
    if (coord) {
      handleDropoffChange({
        name: `Tọa độ (${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)})`,
        address: val,
        lat: coord.lat,
        lng: coord.lng
      });
      return;
    }
    const cleanLower = val.toLowerCase().trim();
    const matched = CAN_THO_LOCATIONS.find(
      (l) =>
        l.name.toLowerCase() === cleanLower ||
        l.address.toLowerCase() === cleanLower ||
        (cleanLower.length >= 4 && (cleanLower.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(cleanLower)))
    );
    if (matched) {
      handleDropoffChange({
        ...matched,
        address: val.length > matched.name.length ? val : matched.address
      });
      return;
    }
    handleDropoffChange({
      ...dropoffLocation,
      name: val,
      address: val
    });
  };

  // Hoán đổi 2 điểm đón và đến
  const handleSwapRoute = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  // Lấy định vị vị trí hiện tại bằng GPS trình duyệt
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGPS(false);
        const { latitude, longitude } = pos.coords;
        const coordStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        const gpsLoc = {
          name: "Vị trí GPS của bạn",
          address: `Vị trí hiện tại (${coordStr} - Cần Thơ)`,
          lat: latitude,
          lng: longitude
        };
        handlePickupChange(gpsLoc);
      },
      (err) => {
        setLocatingGPS(false);
        alert("Không thể lấy vị trí hiện tại: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  const toggleAddon = (id) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((x) => x !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    alert("Dịch vụ Chuyển phòng & Dọn trọ hiện đang trong quá trình phát triển và tạm khóa nhận đơn mới. Quý khách vui lòng quay lại sau nhé!");
  };

  return (
    <>
      <PageHero
        icon={Truck}
        title="Dịch vụ Chuyển phòng & Dọn trọ (Tạm khóa)"
        subtitle="Hệ thống xe ba gác & xe tải chuyển đồ Cần Thơ — Tính năng đang trong quá trình phát triển và hoàn thiện mạng lưới tài xế đối tác."
        actionLabel="🔒 Đang phát triển"
        onAction={() => {
          alert("Dịch vụ Chuyển phòng & Dọn trọ hiện đang trong quá trình phát triển và hoàn thiện. SmartStay sẽ sớm mở lại trong thời gian tới!");
        }}
      />

      <section className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* BANNER TẠM KHÓA - TÍNH NĂNG ĐANG PHÁT TRIỂN */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-center shadow-sm relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Tạm khóa · Tính năng đang phát triển
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
              Dịch vụ Chuyển phòng & Dọn trọ đang được phát triển
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Hệ thống kết nối đội xe ba gác & xe tải chở đồ đang trong giai đoạn mở rộng mạng lưới tài xế đối tác tại các quận Ninh Kiều, Cái Răng, Bình Thủy và chuẩn hóa bảo hiểm đồ đạc. Tính năng đặt chuyến sẽ sớm mở lại trong bản cập nhật tới!
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <Button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md"
              >
                Khám phá phòng trọ ➔
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = "/ghep-ban")}
                className="rounded-2xl border-slate-300 text-slate-700 font-bold text-xs"
              >
                Tìm bạn ở ghép ➔
              </Button>
            </div>
          </div>
        </div>
        {/* BANNER HƯỚNG DẪN DÀNH RIÊNG CHO TÀI XẾ */}
        {user?.role === "transporter" && (
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-white">Bác tài {user.fullName || "Tài xế"} ơi!</h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-400 text-slate-950">Đối tác vận tải</span>
                </div>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  Trang này là cổng đặt xe dành cho Người thuê. Để xem đơn mới và nhận cuốc xe, bác tài vui lòng vào Cổng riêng nhé!
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = "/tai-xe"}
              className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl whitespace-nowrap shadow-md transition-all shrink-0"
            >
              Vào Cổng Nhận Chuyến (/tai-xe) ➔
            </Button>
          </div>
        )}

        {/* BANNER HƯỚNG DẪN DÀNH CHO CHỦ TRỌ */}
        {user?.role === "landlord" && (
          <div className="bg-orange-50 border border-orange-200 text-orange-950 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Bác Chủ trọ {user.fullName || ""} đang ở mục Chuyển phòng & Dọn trọ</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Quản lý phòng trọ, hóa đơn và hợp đồng điện tử tại Kênh Quản Trị Trọ của bác.
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = "/chu-tro"}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-2xl whitespace-nowrap shadow-sm shrink-0"
            >
              Vào Kênh Chủ Trọ (/chu-tro) ➔
            </Button>
          </div>
        )}

        {/* Banner 3 cam kết vàng */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Đúng giờ 100%</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tài xế có mặt trước 10-15 phút theo lịch hẹn. Linh hoạt các khung giờ rảnh của người thuê.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Bảo hiểm đồ đạc</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đồ dùng, nệm, tủ, thiết bị điện tử được che chắn và chằng buộc cẩn thận, đền bù nếu trầy xước.
              </p>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Ưu đãi người thuê 15%</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Giá minh bạch theo số km đường bộ đo tự động trên bản đồ, không kỳ kèo phát sinh chi phí ẩn.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tính Cước & Lộ Trình Bản Đồ Tự Động */}
        <div id="booking-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (7 cột): Chọn xe, Bản đồ tương tác & Tùy chọn */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
              {/* 1. Chọn loại xe */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">1. Chọn loại xe chuyển trọ</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lựa chọn phương tiện phù hợp với khối lượng đồ dùng phòng của bạn
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                    Cần Thơ Logistics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LOGISTICS_VEHICLES.map((v) => {
                    const isSelected = selectedVehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicle(v.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between",
                          isSelected
                            ? "border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-400/20"
                            : "border-border hover:border-slate-300 bg-background"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                        <div>
                          <div className="text-3xl mb-2">{v.icon}</div>
                          <div className="font-bold text-foreground text-sm leading-tight mb-1">{v.name}</div>
                          <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {v.capacity}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/80 flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">Mở cửa:</span>
                          <span className="font-extrabold text-foreground text-xs">
                            {Number(v.basePrice).toLocaleString()}đ
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. LỘ TRÌNH VÀ BẢN ĐỒ ĐƯỜNG BỘ TỰ ĐỘNG */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Route className="w-5 h-5 text-orange-500" />
                      2. Lộ trình & Bản đồ đường bộ Cần Thơ
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bản đồ tự động vẽ tuyến đường đi thực tế qua phố và đo số km chuẩn xác (không tự ý chỉnh tay)
                    </p>
                  </div>
                </div>

                {/* Khung nhập 2 điểm đón & đến */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3.5 mb-4 shadow-sm">
                  {/* Điểm đón */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                        Điểm đón (A - Phòng trọ cũ):
                      </label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locatingGPS}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        {locatingGPS ? "Đang lấy GPS..." : "GPS Vị trí của tôi"}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        value={pickupLocation.address || pickupLocation.name}
                        onChange={(e) => handlePickupInputChange(e.target.value)}
                        placeholder="Gõ địa chỉ hoặc dán tọa độ (VD: 10.02102, 105.7013)..."
                        className="bg-white rounded-xl text-xs h-11 pr-28 shadow-sm border-slate-300"
                      />
                      <select
                        aria-label="Chọn điểm đón gợi ý"
                        value={pickupLocation.name}
                        onChange={(e) => {
                          const found = CAN_THO_LOCATIONS.find((l) => l.name === e.target.value);
                          if (found) handlePickupChange(found);
                        }}
                        className="absolute right-1 top-1 bottom-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg px-2 border-0 outline-none cursor-pointer max-w-[105px] truncate"
                      >
                        <option value="">Gợi ý trọ...</option>
                        {CAN_THO_LOCATIONS.map((loc) => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nút đảo chiều */}
                  <div className="flex justify-center -my-1">
                    <button
                      type="button"
                      onClick={handleSwapRoute}
                      title="Đảo chiều đón và đến"
                      className="w-8 h-8 rounded-full bg-white border border-slate-300 shadow-md hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Điểm đến */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm" />
                        Điểm đến (B - Phòng trọ mới):
                      </label>
                      <span className="text-[11px] text-slate-500">Gõ tên trọ, trường ĐH hoặc tọa độ</span>
                    </div>
                    <div className="relative">
                      <Input
                        value={dropoffLocation.address || dropoffLocation.name}
                        onChange={(e) => handleDropoffInputChange(e.target.value)}
                        placeholder="Gõ địa chỉ hoặc dán tọa độ (VD: 10.02102, 105.7013)..."
                        className="bg-white rounded-xl text-xs h-11 pr-28 shadow-sm border-slate-300"
                      />
                      <select
                        aria-label="Chọn điểm đến gợi ý"
                        value={dropoffLocation.name}
                        onChange={(e) => {
                          const found = CAN_THO_LOCATIONS.find((l) => l.name === e.target.value);
                          if (found) handleDropoffChange(found);
                        }}
                        className="absolute right-1 top-1 bottom-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg px-2 border-0 outline-none cursor-pointer max-w-[105px] truncate"
                      >
                        <option value="">Gợi ý đến...</option>
                        {CAN_THO_LOCATIONS.map((loc) => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BẢN ĐỒ TỰ ĐỘNG VẼ TUYẾN ĐƯỜNG ĐI THỰC TẾ & ĐỒNG BỘ GOOGLE MAPS */}
                <InteractiveLogisticsMap
                  pickup={pickupLocation}
                  dropoff={dropoffLocation}
                  onPickupChange={handlePickupChange}
                  onDropoffChange={handleDropoffChange}
                  distance={distance}
                  onDistanceChange={setDistance}
                  estimatedDuration={duration}
                  onDurationChange={setDuration}
                />
              </div>

              {/* 3. Dịch vụ hỗ trợ kèm theo */}
              <div className="border-t border-border pt-6">
                <label className="text-sm font-bold text-foreground block mb-3">
                  3. Dịch vụ hỗ trợ kèm theo (Tùy chọn)
                </label>
                <div className="space-y-2.5">
                  {ADDON_SERVICES.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                          isChecked
                            ? "border-orange-400 bg-orange-50/40"
                            : "border-border hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-xs text-foreground">{addon.name}</p>
                            <p className="text-[11px] text-muted-foreground">{addon.desc}</p>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-foreground flex-shrink-0">
                          +{Number(addon.price).toLocaleString()}đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 cột): Bảng Tính Cước & Form Đặt Chuyến */}
          <div className="lg:col-span-5 space-y-6">
            {/* Box Tổng Tiền & Chi Tiết Cước (Minh bạch 100% theo đường bộ - Tone màu cam ấm SmartStay) */}
            <div className="bg-white border-2 border-orange-200/90 rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
              <div
                className="absolute -top-14 -right-14 w-44 h-44 rounded-full opacity-40 blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #fed7aa, transparent 70%)" }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-30 blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #ffedd5, transparent 70%)" }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-orange-100 pb-4 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-extrabold tracking-wider uppercase mb-1">
                      <Sparkles className="w-3 h-3 text-orange-600" />
                      Bảng giá niêm yết tự động
                    </span>
                    <h4 className="font-extrabold text-xl text-slate-900 mt-1">{activeVehicle.name}</h4>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-3xl shadow-xs">
                    {activeVehicle.icon}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Cước cơ bản (mở cửa):</span>
                    <span className="font-bold text-slate-900">{Number(baseCost).toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>
                      Cước km ({Number(activeVehicle.perKm).toLocaleString()}đ × {distance}km đường bộ):
                    </span>
                    <span className="font-bold text-slate-900">{Number(distanceCost).toLocaleString()}đ</span>
                  </div>
                  {addonsCost > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Dịch vụ hỗ trợ cộng thêm:</span>
                      <span className="font-bold text-orange-600">+{Number(addonsCost).toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-emerald-800 font-bold shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      Ưu đãi người thuê (-15%):
                    </span>
                    <span className="text-emerald-700 font-extrabold">-{Number(studentDiscount).toLocaleString()}đ</span>
                  </div>
                </div>

                {/* Khung tổng tiền thanh toán nổi bật màu cam SmartStay */}
                <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white rounded-2xl p-4 sm:p-4.5 shadow-lg shadow-orange-500/20 flex items-center justify-between mt-5">
                  <div>
                    <span className="text-xs text-orange-100 font-semibold block">
                      Tổng cước thanh toán:
                    </span>
                    <span className="text-[10px] text-orange-200 font-medium block mt-0.5">
                      (Tự động tính theo tuyến đường {distance} km)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {Number(finalTotal).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông báo đặt xe thành công */}
            {bookingSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Đặt xe thành công!</h4>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Mã chuyến: <span className="font-mono font-bold">{bookingSuccess.id}</span>
                      <br />
                      Lộ trình: {bookingSuccess.distanceKm} km. Tài xế sẽ gọi điện thoại tới số{" "}
                      <strong>{bookingSuccess.phone}</strong> trong vòng 5-10 phút để xác nhận chuyển trọ.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Điền Thông Tin Đặt Xe (Đồng bộ 100% với bản đồ) */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-1">Thông tin đặt chuyến</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Điểm đón và điểm đến được đồng bộ tự động từ bản đồ bên trái
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Họ tên bạn</label>
                    <Input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="rounded-xl h-11 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Số điện thoại / Zalo *</label>
                    <Input
                      type="tel"
                      required
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl h-11 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    Địa chỉ đón (Phòng trọ cũ tại Cần Thơ) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="VD: Supper Trọ 686, Ấp Mỹ Phước, An Bình"
                    value={pickupLocation.address || pickupLocation.name}
                    onChange={(e) => handlePickupInputChange(e.target.value)}
                    className="rounded-xl h-11 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Địa chỉ đến (Phòng trọ mới) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="VD: LOTTE Mart Cần Thơ, 84 Đ. Mậu Thân"
                    value={dropoffLocation.address || dropoffLocation.name}
                    onChange={(e) => handleDropoffInputChange(e.target.value)}
                    className="rounded-xl h-11 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    Thời gian cần chuyển
                  </label>
                  <Input
                    type="text"
                    placeholder="VD: 08:30 sáng Thứ Bảy tuần này hoặc Hôm nay"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    className="rounded-xl h-11 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    Ghi chú đồ đạc
                  </label>
                  <Input
                    type="text"
                    placeholder="VD: 1 nệm, 1 bàn xếp, 3 thùng carton sách, lầu 2..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl h-11 text-xs"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => alert("Dịch vụ Chuyển phòng & Dọn trọ hiện đang trong quá trình phát triển và tạm khóa nhận đơn mới. Quý khách hàng vui lòng quay lại sau nhé!")}
                  className="w-full h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm shadow-none cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Tính năng đang phát triển (Tạm khóa nhận đơn)</span>
                </Button>

                <p className="text-[11px] text-center text-muted-foreground mt-2">
                  🔒 Tính năng đang trong giai đoạn hoàn thiện mạng lưới tài xế đối tác.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Danh sách các chuyến xe & Đội xe chuyển trọ */}
        <div className="pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground">Hệ thống Điều phối Vận chuyển Cần Thơ</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kết nối người thuê với các bác tài ba gác, xe tải nhỏ uy tín - Cam kết đúng giá, không phụ phí phát sinh
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRequests}
                className="rounded-full text-xs font-semibold"
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Tab chọn hiển thị */}
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("transporters")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "transporters"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Đội xe đối tác xác thực ({transporters.length})</span>
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("my")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "my"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Đơn đặt của tôi</span>
              </button>
            )}
            {user?.role === "admin" && (
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all",
                  activeTab === "all"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Giám sát hệ thống ({items.length})
              </button>
            )}
          </div>

          {/* Render Tab Đối tác vận chuyển */}
          {activeTab === "transporters" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transporters.map((dr) => (
                <div key={dr._id || dr.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-foreground text-sm">{dr.fullName}</h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Đối tác xác thực</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{dr.transporterProfile?.vehicleType || "Xe ba gác chuyển trọ"}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span>Đánh giá uy tín:</span>
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        ★ {dr.transporterProfile?.rating || 5.0} / 5.0 ({dr.transporterProfile?.totalTrips || 10}+ cuốc)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Biển số xe:</span>
                      <span className="font-semibold text-foreground">{dr.transporterProfile?.licensePlate || "65B1-888.99"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Khu vực:</span>
                      <span className="text-foreground">{dr.transporterProfile?.operatingArea || "Ninh Kiều / Cái Răng"}</span>
                    </div>
                  </div>
                  {dr.transporterProfile?.bio && (
                    <p className="text-[11px] text-muted-foreground italic mb-3">"{dr.transporterProfile.bio}"</p>
                  )}
                  <a
                    href={`tel:${dr.phone || '0939556677'}`}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Gọi tài xế: {dr.phone || '0939 556 677'}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            /* Render Tab Danh sách các đơn chuyển trọ */
            loadingList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center bg-card rounded-2xl border border-border text-muted-foreground text-sm">
                Chưa có chuyến xe nào được ghi nhận. Hãy là người đầu tiên đặt xe!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items
                  .filter((item) => {
                    if (activeTab === "pending") return item.status === "pending";
                    if (activeTab === "my" && user) {
                      const cleanUserPhone = user.phone ? user.phone.replace(/\s+/g, '') : '';
                      const cleanItemPhone = item.phone ? item.phone.replace(/\s+/g, '') : '';
                      return (
                        (cleanUserPhone && cleanItemPhone.includes(cleanUserPhone.slice(-6))) ||
                        item.driver?._id === user._id ||
                        item.driver === user._id ||
                        item.user?._id === user._id ||
                        item.user === user._id
                      );
                    }
                    return true;
                  })
                  .map((item) => {
                    const isTransporterOrAdmin = user?.role === 'transporter' || user?.role === 'admin' || user?.role === 'employee';
                    const itemId = item._id || item.id;

                    return (
                      <div
                        key={itemId}
                        className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                              {item.vehicleType || "Xe ba gác chuyển trọ"}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                item.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status === "in_progress"
                                  ? "bg-sky-100 text-sky-700"
                                  : item.status === "assigned"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {item.status === "completed"
                                ? "✓ Đã hoàn thành"
                                : item.status === "in_progress"
                                ? "🚚 Đang vận chuyển"
                                : item.status === "assigned"
                                ? "👤 Đã có tài xế"
                                : "⏳ Chờ tài xế nhận"}
                            </span>
                          </div>

                          <h4 className="font-bold text-foreground text-sm mb-2 flex items-center justify-between">
                            <span>{item.customerName || "Người thuê Cần Thơ"}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{item.distanceKm || 5} km</span>
                          </h4>

                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">
                                <strong>Từ:</strong> {item.pickupAddress}
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">
                                <strong>Đến:</strong> {item.dropoffAddress}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 italic pt-1">
                                "{item.notes}"
                              </div>
                            )}
                          </div>

                          {/* Thông tin tài xế tiếp nhận */}
                          {item.driverName && (
                            <div className="mt-3 p-2.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs">
                              <div className="font-bold text-orange-900 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-orange-600" />
                                Tài xế: {item.driverName}
                              </div>
                              <div className="text-orange-800 mt-1 flex items-center justify-between text-[11px]">
                                <span>SĐT: <a href={`tel:${item.driverPhone}`} className="underline font-bold">{item.driverPhone}</a></span>
                                <span>{item.driverLicensePlate || item.driverVehicle || "Đã nhận cuốc"}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Trạng thái đơn dành cho Người thuê */}
                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Giá chốt trọn gói:
                            </span>
                            <span className="font-extrabold text-orange-600 text-sm">
                              {item.estimatedPrice ? Number(item.estimatedPrice).toLocaleString() : "190.000"}đ
                            </span>
                          </div>

                          {item.status === "pending" && (
                            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                              <span>Đang kết nối tài xế phù hợp gần điểm đón của bạn...</span>
                            </div>
                          )}

                          {item.status === "assigned" && (
                            <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold">Đã có tài xế tiếp nhận</p>
                                <p className="text-[11px] text-purple-700">Tài xế đang chuẩn bị xuất phát</p>
                              </div>
                              {item.driverPhone && (
                                <a
                                  href={`tel:${item.driverPhone}`}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                                >
                                  <Phone className="w-3 h-3" /> Gọi tài xế
                                </a>
                              )}
                            </div>
                          )}

                          {item.status === "in_progress" && (
                            <div className="mt-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                                  Đang vận chuyển
                                </p>
                                <p className="text-[11px] text-sky-700">Chuyến xe đang di chuyển về phòng mới</p>
                              </div>
                              {item.driverPhone && (
                                <a
                                  href={`tel:${item.driverPhone}`}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                                >
                                  <Phone className="w-3 h-3" /> Gọi tài xế
                                </a>
                              )}
                            </div>
                          )}

                          {item.status === "completed" && (
                            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Chuyến xe hoàn tất an toàn!</span>
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-700">Đã thanh toán</span>
                            </div>
                          )}

                          {/* Dành riêng cho Quản trị viên (Admin) nếu cần điều phối cưỡng chế */}
                          {user?.role === "admin" && (
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex gap-1.5">
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptTrip(itemId)}
                                  className="flex-1 bg-emerald-600 text-white text-[11px] h-7 rounded-lg"
                                >
                                  Admin điều phối
                                </Button>
                              )}
                              {item.status === "assigned" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(itemId, "in_progress")}
                                  className="flex-1 bg-sky-600 text-white text-[11px] h-7 rounded-lg"
                                >
                                  Admin bắt đầu
                                </Button>
                              )}
                              {item.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(itemId, "completed")}
                                  className="flex-1 bg-purple-600 text-white text-[11px] h-7 rounded-lg"
                                >
                                  Admin hoàn thành
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}