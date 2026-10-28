import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Plus,
  RefreshCw,
  FolderHeart,
  FileText,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import PassRoomCard from "@/components/pass/PassRoomCard";
import CreatePassModal from "@/components/pass/CreatePassModal";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const CAMPUSES = [
  "Tất cả khu vực",
  "ĐH Cần Thơ",
  "ĐH Y Dược",
  "ĐH Nam Cần Thơ",
  "ĐH FPT",
  "ĐH Kỹ thuật Công nghệ Cần Thơ",
  "Khu vực Ninh Kiều",
  "Khu vực Cái Răng"
];

const PRICE_RANGES = [
  { label: "Tất cả mức giá", min: "", max: "" },
  { label: "Dưới 1.5 triệu", min: "0", max: "1500000" },
  { label: "1.5 - 2.5 triệu", min: "1500000", max: "2500000" },
  { label: "2.5 - 3.5 triệu", min: "2500000", max: "3500000" },
  { label: "Trên 3.5 triệu", min: "3500000", max: "" }
];

const MONTH_RANGES = [
  { label: "Tất cả thời hạn", min: "", max: "" },
  { label: "Dưới 3 tháng", min: "1", max: "3" },
  { label: "3 - 6 tháng", min: "3", max: "6" },
  { label: "Trên 6 tháng", min: "6", max: "" }
];

export default function RoomPass() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc filter từ URL query
  const qParam = searchParams.get("q") || "";
  const campusParam = searchParams.get("campus") || "Tất cả khu vực";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const minMonthsParam = searchParams.get("minMonths") || "";
  const maxMonthsParam = searchParams.get("maxMonths") || "";
  const verifiedOnlyParam = searchParams.get("verifiedOnly") === "true";
  const sortParam = searchParams.get("sort") || "latest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // States
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Local filter states để người dùng tương tác mượt mà
  const [searchKeyword, setSearchKeyword] = useState(qParam);

  // Cập nhật URL Query
  const updateQueryParam = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || value === "Tất cả khu vực" || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    // Reset về page 1 nếu filter thay đổi (trừ khi chính là update page)
    if (!updates.page && updates.page !== 1) {
      next.delete("page");
    }
    setSearchParams(next);
  };

  // Tải dữ liệu từ API
  useEffect(() => {
    loadPassRooms();
  }, [
    qParam,
    campusParam,
    minPriceParam,
    maxPriceParam,
    minMonthsParam,
    maxMonthsParam,
    verifiedOnlyParam,
    sortParam,
    pageParam
  ]);

  const loadPassRooms = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.PassRoom.list({
        q: qParam,
        campus: campusParam === "Tất cả khu vực" ? "" : campusParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        minMonths: minMonthsParam,
        maxMonths: maxMonthsParam,
        verifiedOnly: verifiedOnlyParam,
        sort: sortParam,
        page: pageParam,
        limit: 12
      });

      if (res && res.success && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.data.length);
      } else {
        // Fallback local storage nếu API chưa kết nối
        const localRooms = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
        setItems(localRooms);
        setTotalCount(localRooms.length);
      }
    } catch (err) {
      console.warn("Lỗi loadPassRooms:", err);
      const localRooms = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
      setItems(localRooms);
      setTotalCount(localRooms.length);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQueryParam({ q: searchKeyword.trim(), page: 1 });
  };

  // Reset bộ lọc
  const handleResetFilters = () => {
    setSearchKeyword("");
    setSearchParams(new URLSearchParams());
  };

  // Mở modal tạo tin (kiểm tra auth)
  const handleOpenCreateModal = () => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="bg-[#fdfbf7] min-h-screen font-sans pb-16">
      {/* 1. Page Hero Banner */}
      <PageHero
        icon={KeyRound}
        title="Pass Phòng & Sang Nhượng Cọc"
        subtitle="Chuyển nhượng tiền cọc phòng trọ an toàn, bảo vệ quyền lợi 3 bên với sự xác nhận trực tiếp từ chủ trọ Cần Thơ."
        actionLabel="Đăng pass phòng"
        onAction={handleOpenCreateModal}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner cảnh báo an toàn & Lợi ích */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/80 rounded-3xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#f97316] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#f97316]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-sm md:text-base">
                An toàn chuyển cọc với SmartStay Pass
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                100% phòng hiển thị huy hiệu xanh đã được chủ trọ xác nhận bằng mã token bảo mật. Tránh bẫy lừa đảo chuyển tiền trước.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            {user && (
              <Link to="/pass-phong/cua-toi" className="w-full md:w-auto">
                <Button variant="outline" className="w-full md:w-auto rounded-full border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold h-10 text-xs flex items-center gap-1.5 shadow-sm">
                  <FileText className="w-4 h-4 text-[#f97316]" /> Quản lý tin của tôi
                </Button>
              </Link>
            )}
            <Button
              onClick={handleOpenCreateModal}
              className="w-full md:w-auto rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-10 text-xs shadow-md shadow-[#f97316]/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Đăng pass phòng
            </Button>
          </div>
        </div>

        {/* 2. Thanh Tìm Kiếm & Bộ Lọc Đầy Đủ */}
        <div className="bg-white rounded-3xl border border-[#f4ebd9] p-5 shadow-sm mb-8 space-y-4">
          {/* Hàng 1: Search Box & Select Trường */}
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Tìm theo tên phòng, đường, phường (VD: Hẻm 51, KDC Hồng Phát...)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-11 pr-24 h-12 rounded-2xl border-slate-200 bg-[#fdfbf7] text-sm focus:border-[#f97316]"
              />
              <Button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 text-xs"
              >
                Tìm kiếm
              </Button>
            </form>

            <select
              value={campusParam}
              onChange={(e) => updateQueryParam({ campus: e.target.value })}
              className="h-12 px-4 rounded-2xl border border-slate-200 bg-[#fdfbf7] text-xs font-bold text-slate-700 outline-none focus:border-[#f97316] cursor-pointer"
            >
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Hàng 2: Bộ lọc chi tiết (Khoảng giá, Tháng HĐ, Xác nhận, Sắp xếp) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Mức giá */}
              <select
                value={PRICE_RANGES.find(r => r.min === minPriceParam && r.max === maxPriceParam)?.label || "Tất cả mức giá"}
                onChange={(e) => {
                  const range = PRICE_RANGES.find(r => r.label === e.target.value);
                  updateQueryParam({ minPrice: range?.min, maxPrice: range?.max });
                }}
                className="h-9 px-3 rounded-full border border-slate-200 bg-[#fdfbf7] text-xs font-semibold text-slate-600 outline-none focus:border-[#f97316]"
              >
                {PRICE_RANGES.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>

              {/* Filter Thời hạn HĐ */}
              <select
                value={MONTH_RANGES.find(r => r.min === minMonthsParam && r.max === maxMonthsParam)?.label || "Tất cả thời hạn"}
                onChange={(e) => {
                  const range = MONTH_RANGES.find(r => r.label === e.target.value);
                  updateQueryParam({ minMonths: range?.min, maxMonths: range?.max });
                }}
                className="h-9 px-3 rounded-full border border-slate-200 bg-[#fdfbf7] text-xs font-semibold text-slate-600 outline-none focus:border-[#f97316]"
              >
                {MONTH_RANGES.map((m) => (
                  <option key={m.label} value={m.label}>{m.label}</option>
                ))}
              </select>

              {/* Checkbox Chỉ phòng đã xác nhận */}
              <label className="flex items-center gap-2 px-3.5 h-9 rounded-full bg-emerald-50 border border-emerald-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnlyParam}
                  onChange={(e) => updateQueryParam({ verifiedOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                  style={{ accentColor: "#059669" }}
                />
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Chỉ phòng đã duyệt
                </span>
              </label>

              {(qParam || campusParam !== "Tất cả khu vực" || minPriceParam || verifiedOnlyParam) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline ml-1"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
              </span>
              <select
                value={sortParam}
                onChange={(e) => updateQueryParam({ sort: e.target.value })}
                className="h-9 px-3 rounded-full border border-slate-200 bg-[#fdfbf7] text-xs font-bold text-slate-700 outline-none focus:border-[#f97316]"
              >
                <option value="latest">Mới đăng nhất</option>
                <option value="price_asc">Giá pass thấp đến cao</option>
                <option value="price_desc">Giá pass cao đến thấp</option>
                <option value="months_desc">Thời hạn HĐ còn nhiều nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Danh Sách Phòng (Grid / Skeleton Loading / Empty State) */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading font-black text-slate-900 text-xl">
            {loading ? "Đang tải danh sách..." : `${totalCount} phòng đang pass cọc`}
          </h2>
          {campusParam !== "Tất cả khu vực" && (
            <span className="text-xs font-bold text-[#f97316] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Khu vực: {campusParam}
            </span>
          )}
        </div>

        {loading ? (
          /* Skeleton Loading Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-2xl w-full" />
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-9 bg-slate-200 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[32px] p-16 text-center border border-[#f4ebd9] shadow-sm max-w-xl mx-auto my-8">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5 text-[#f97316]">
              <KeyRound className="w-10 h-10" />
            </div>
            <h3 className="font-heading font-black text-xl text-slate-900 mb-2">
              Không tìm thấy phòng pass phù hợp
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Thử thay đổi bộ lọc khu vực hoặc khoảng giá để xem thêm các phòng khác. Bạn cũng có thể đăng tin nếu cần tìm người nhận cọc phòng của mình!
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="rounded-full px-6 font-bold border-slate-300 text-slate-700 h-11 text-xs"
              >
                Đặt lại bộ lọc
              </Button>
              <Button
                onClick={handleOpenCreateModal}
                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-6 h-11 text-xs shadow-sm"
              >
                Đăng tin pass phòng ngay
              </Button>
            </div>
          </div>
        ) : (
          /* Grid Thẻ Phòng Mới */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <PassRoomCard key={item._id || item.id} room={item} onUpdate={loadPassRooms} />
            ))}
          </div>
        )}

        {/* 4. Phân trang (Pagination) */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={pageParam <= 1}
              onClick={() => updateQueryParam({ page: pageParam - 1 })}
              className="rounded-full h-10 px-4 text-xs font-bold border-slate-200 text-slate-600 disabled:opacity-40"
            >
              Trang trước
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => updateQueryParam({ page: p })}
                className={`w-10 h-10 rounded-full text-xs font-bold transition-colors ${
                  p === pageParam
                    ? "bg-[#f97316] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
            <Button
              variant="outline"
              disabled={pageParam >= totalPages}
              onClick={() => updateQueryParam({ page: pageParam + 1 })}
              className="rounded-full h-10 px-4 text-xs font-bold border-slate-200 text-slate-600 disabled:opacity-40"
            >
              Trang sau
            </Button>
          </div>
        )}
      </div>

      {/* Modal Đăng Pass Phòng */}
      <CreatePassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadPassRooms();
        }}
      />
    </div>
  );
}