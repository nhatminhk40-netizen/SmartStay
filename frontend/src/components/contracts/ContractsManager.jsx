import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, ClockAlert, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

import ContractStats from "./ContractStats";
import ContractList from "./ContractList";
import ContractModal from "./ContractModal";
import ContractDetailModal from "./ContractDetailModal";
import DepositModal from "./DepositModal";
import EndContractModal from "./EndContractModal";
import RenewContractModal from "./RenewContractModal";

export default function ContractsManager() {
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState(null);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedForDeposit, setSelectedForDeposit] = useState(null);

  const [endModalOpen, setEndModalOpen] = useState(false);
  const [selectedForEnd, setSelectedForEnd] = useState(null);

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedForRenew, setSelectedForRenew] = useState(null);

  // Load contracts from backend API
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.contracts.list({
        status: statusFilter,
        q: searchTerm.trim(),
        page,
        limit: 10
      });

      setContracts(res.data || []);
      setStats(res.stats || {});
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: err.message || "Không thể tải danh sách hợp đồng."
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Điều phối các hành động từ bảng danh sách
  const handleAction = (actionType, contract) => {
    switch (actionType) {
      case "detail":
        setSelectedForDetail(contract);
        setDetailModalOpen(true);
        break;
      case "deposit":
        setSelectedForDeposit(contract);
        setDepositModalOpen(true);
        break;
      case "renew":
        setSelectedForRenew(contract);
        setRenewModalOpen(true);
        break;
      case "end":
        setSelectedForEnd(contract);
        setEndModalOpen(true);
        break;
      case "edit":
        setEditingContract(contract);
        setCreateModalOpen(true);
        break;
      default:
        break;
    }
  };

  const filterTabs = [
    { id: "all", label: "Tất cả hợp đồng" },
    { id: "active", label: "Đang hiệu lực" },
    { id: "expiring_soon", label: "Sắp hết hạn (30 ngày)" },
    { id: "unpaid_deposit", label: "Chưa thu cọc" },
    { id: "ended", label: "Đã kết thúc" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Thẻ thống kê 4 chỉ số trên cùng ── */}
      <ContractStats
        stats={stats}
        onFilterExpiring={() => {
          setStatusFilter("expiring_soon");
          setPage(1);
        }}
        onFilterUnpaid={() => {
          setStatusFilter("unpaid_deposit");
          setPage(1);
        }}
      />

      {/* ── Banner cảnh báo nổi bật cho hợp đồng sắp hết hạn trong 30 ngày ── */}
      {stats.expiringSoonCount > 0 && statusFilter !== "expiring_soon" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <ClockAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Có {stats.expiringSoonCount} hợp đồng phòng trọ sắp đáo hạn trong vòng 30 ngày tới!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Vui lòng chủ động trao đổi với sinh viên/khách thuê để tiến hành gia hạn hợp đồng hoặc chuẩn bị nhận phòng đón khách mới.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setStatusFilter("expiring_soon");
              setPage(1);
            }}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 px-4 h-9 shadow-sm"
          >
            Lọc danh sách cần gia hạn
          </Button>
        </div>
      )}

      {/* ── 2. Thanh công cụ tìm kiếm, bộ lọc & nút Tạo mới ── */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#f4ebd9] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-black text-lg text-slate-900">
              Danh sách Hợp đồng & Tiền cọc
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#f97316]">
              {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchContracts}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <Button
              onClick={() => {
                setEditingContract(null);
                setCreateModalOpen(true);
              }}
              className="rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 h-10 shadow-md shadow-[#f97316]/20"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Tạo hợp đồng mới
            </Button>
          </div>
        </div>

        {/* Filter buttons & Search Box */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-[#fdfbf7] text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px] md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo phòng, tên khách, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 rounded-xl text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Bảng danh sách hợp đồng ── */}
      <ContractList
        contracts={contracts}
        loading={loading}
        onAction={handleAction}
        onCreateNew={() => {
          setEditingContract(null);
          setCreateModalOpen(true);
        }}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-2">
          <span>
            Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({totalCount} hợp đồng)
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg text-xs"
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* ── 4. Modals ── */}
      <ContractModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialData={editingContract}
        onSuccess={() => {
          toast({
            title: editingContract ? "Đã cập nhật hợp đồng" : "Đã tạo hợp đồng mới",
            description: "Dữ liệu hợp đồng và trạng thái phòng đã được cập nhật thành công."
          });
          fetchContracts();
        }}
      />

      <ContractDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        contract={selectedForDetail}
        onAction={(type, c) => {
          handleAction(type, c);
        }}
      />

      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        contract={selectedForDeposit}
        onSuccess={() => {
          toast({
            title: "Đã cập nhật tiền cọc",
            description: "Trạng thái tiền cọc và biên lai thu đã được ghi nhận."
          });
          fetchContracts();
        }}
      />

      <RenewContractModal
        open={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        contract={selectedForRenew}
        onSuccess={() => {
          toast({
            title: "Gia hạn hợp đồng thành công",
            description: "Thời hạn hợp đồng và ngày kết thúc mới đã được cập nhật."
          });
          fetchContracts();
        }}
      />

      <EndContractModal
        open={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        contract={selectedForEnd}
        onSuccess={() => {
          toast({
            title: "Thanh lý hợp đồng thành công",
            description: "Hợp đồng đã đóng và phòng trọ đã sẵn sàng đón khách mới."
          });
          fetchContracts();
        }}
      />
    </div>
  );
}
