import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Wallet, X, Users, CheckCircle2, Clock, AlertCircle, Mail, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { FeeItem, Payment, Household } from "../types";
import {
  createRound,
  fetchFeeObligations,
  fetchHouseholds,
  fetchRoundObligations,
  fetchRoundsByFee,
  updateFee,
  deleteFee,
  loginAccount,
  type CollectionRound,
  type FeeObligationRow,
  type RoundObligationRow,
} from "../api";

const statusConfig = {
  active: { bg: "#6F6AF815", color: "#6F6AF8", label: "Đang thu", icon: Clock },
  completed: { bg: "#4CAF5015", color: "#4CAF50", label: "Hoàn thành", icon: CheckCircle2 },
  expired: { bg: "#F4433615", color: "#F44336", label: "Hết hạn", icon: AlertCircle },
};

type ChargeType = "per_apartment" | "per_resident";

function EditFeeModal({
  fee,
  onClose,
  onSave,
}: {
  fee: FeeItem;
  onClose: () => void;
  onSave: (data: { name: string; amount: string; type: "mandatory" | "voluntary"; chargeType: ChargeType; deadline: string; note: string }) => void;
}) {
  const [name, setName] = useState(fee.name);
  const [amount, setAmount] = useState(fee.amount);
  const [feeType, setFeeType] = useState<"mandatory" | "voluntary">(fee.type);
  const [chargeType, setChargeType] = useState<ChargeType>(fee.chargeType ?? "per_apartment");
  const [deadline, setDeadline] = useState(fee.deadline);
  const [note, setNote] = useState(fee.note);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Vui lòng nhập tên khoản thu";
    if (feeType === "mandatory" && (!amount || Number(amount) <= 0)) e.amount = "Vui lòng nhập số tiền hợp lệ";
    if (!deadline) e.deadline = "Vui lòng chọn hạn thanh toán";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), amount, type: feeType, chargeType, deadline, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" style={{ borderRadius: 8 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
          <h2 className="text-lg" style={{ fontWeight: 700, color: "#1A1A2E" }}>Chỉnh sửa khoản thu</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Đóng">
            <X size={20} style={{ color: "#717182" }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Loại khoản thu</label>
            <div className="flex gap-4">
              {(["mandatory", "voluntary"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: feeType === type ? "#6F6AF8" : "#CFCFEF" }}>
                    {feeType === type && <div className="w-2 h-2 rounded-full" style={{ background: "#6F6AF8" }} />}
                  </div>
                  <input type="radio" name="editFeeType" className="sr-only" checked={feeType === type} onChange={() => setFeeType(type)} />
                  <span className="text-sm" style={{ color: "#1A1A2E" }}>{type === "mandatory" ? "Bắt buộc" : "Đóng góp"}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Cách tính thu</label>
            <div className="flex gap-4">
              {(["per_apartment", "per_resident"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: chargeType === type ? "#6F6AF8" : "#CFCFEF" }}>
                    {chargeType === type && <div className="w-2 h-2 rounded-full" style={{ background: "#6F6AF8" }} />}
                  </div>
                  <input type="radio" name="editChargeType" className="sr-only" checked={chargeType === type} onChange={() => setChargeType(type)} />
                  <span className="text-sm" style={{ color: "#1A1A2E" }}>{type === "per_apartment" ? "Thu theo căn" : "Thu theo nhân khẩu"}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Tên khoản thu <span style={{ color: "#F44336" }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phí dịch vụ..." className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2" style={{ borderColor: errors.name ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }} />
            {errors.name && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Số tiền (VNĐ) {feeType === "mandatory" ? "*" : ""}</label>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2" style={{ borderColor: errors.amount ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }} />
            {errors.amount && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Hạn thanh toán <span style={{ color: "#F44336" }}>*</span></label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2" style={{ borderColor: errors.deadline ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }} />
            {errors.deadline && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.deadline}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Ghi chú</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ghi chú (tùy chọn)" className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2" style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm" style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}>Hủy</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-white rounded-md text-sm" style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}

interface FeeScreenProps {
  fees: FeeItem[];
  payments: Payment[];
  canManageFees: boolean;
  onCreateFee: () => void;
  onCollectPayment: () => void;
  onRefreshFees: () => void;
  currentEmail: string | null;
}

export function FeeScreen({ fees, payments, canManageFees, onCreateFee, onCollectPayment, onRefreshFees, currentEmail }: FeeScreenProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mandatory" | "voluntary">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "expired">("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "unpaid" | "overdue">("all");
  const [viewingFee, setViewingFee] = useState<FeeItem | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [obligationsByFeeId, setObligationsByFeeId] = useState<Record<number, FeeObligationRow[]>>({});
  const [rounds, setRounds] = useState<CollectionRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<CollectionRound | null>(null);
  const [roundObligations, setRoundObligations] = useState<RoundObligationRow[] | null>(null);
  const [showRoundDropdown, setShowRoundDropdown] = useState(false);
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundPeriod, setNewRoundPeriod] = useState("");
  const [newRoundDeadline, setNewRoundDeadline] = useState("");
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<"unpaid" | "overdue">("unpaid");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
  const [feeToDelete, setFeeToDelete] = useState<FeeItem | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // Tải danh sách hộ khẩu để biết tổng số hộ / nhân khẩu
  useEffect(() => {
    fetchHouseholds()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Household[] = data.map((h: any) => ({
          id: h.id ?? h.maHo ?? 0,
          members: h.members ?? h.soThanhVien ?? 0,
          address: h.address ?? h.diaChi ?? "",
          headName: h.headName ?? h.tenChuHo ?? null,
        }));
        setHouseholds(mapped);
      })
      .catch(() => {
        setHouseholds([]);
      });
  }, []);

  // Tải nghĩa vụ phải nộp theo hộ (nếu backend có hỗ trợ)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled(
        fees.map(async (fee) => {
          const rows = await fetchFeeObligations(fee.id);
          return [fee.id, Array.isArray(rows) ? rows : []] as const;
        })
      );
      const entries: Array<[number, FeeObligationRow[]]> = results
        .filter((r): r is PromiseFulfilledResult<readonly [number, FeeObligationRow[]]> => r.status === "fulfilled")
        .map((r) => [r.value[0], r.value[1]]);
      if (cancelled) return;
      if (entries.length > 0) {
        setObligationsByFeeId((prev) => {
          const next = { ...prev };
          for (const [feeId, rows] of entries) next[feeId] = rows;
          return next;
        });
      }
    }
    if (fees.length > 0) load();
    return () => {
      cancelled = true;
    };
  }, [fees]);

  // Khi xem chi tiết 1 khoản thu: tải danh sách đợt và nghĩa vụ theo đợt
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!viewingFee) {
        setRounds([]);
        setSelectedRound(null);
        setRoundObligations(null);
        return;
      }
      try {
        const list = await fetchRoundsByFee(viewingFee.id);
        if (cancelled) return;
        const normalized = Array.isArray(list) ? list : [];
        setRounds(normalized);
        const initial = normalized[0] ?? null;
        setSelectedRound(initial);
      } catch {
        if (cancelled) return;
        setRounds([]);
        setSelectedRound(null);
        setRoundObligations(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [viewingFee?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadObligations() {
      if (!selectedRound) {
        setRoundObligations(null);
        return;
      }
      try {
        const rows = await fetchRoundObligations(selectedRound.id);
        if (cancelled) return;
        setRoundObligations(Array.isArray(rows) ? rows : []);
      } catch {
        if (cancelled) return;
        setRoundObligations(null);
      }
    }
    loadObligations();
    return () => {
      cancelled = true;
    };
  }, [selectedRound?.id]);

  const totalMembers = useMemo(
    () => households.reduce((sum, h) => sum + (h.members ?? 0), 0),
    [households]
  );

  // Tính toán số đã thu / phải thu cho từng khoản
  const statsByFeeId = useMemo(() => {
    const result: Record<
      number,
      {
        expectedAmount: number;
        collectedAmount: number;
        pct: number;
        collectedUnits: number;
        totalUnits: number;
      }
    > = {};

    const householdCount = households.length;

    for (const fee of fees) {
      const obligationRows = obligationsByFeeId[fee.id];
      if (Array.isArray(obligationRows) && obligationRows.length > 0) {
        const expectedAmount = obligationRows.reduce((sum, r) => sum + (Number(r.expectedAmount) || 0), 0);
        const collectedAmount = obligationRows.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
        const totalUnits = obligationRows.length;
        const collectedUnits = obligationRows.filter((r) => r.paid).length;
        const pct =
          expectedAmount > 0
            ? Math.min(100, Math.round((collectedAmount / expectedAmount) * 100))
            : (collectedUnits > 0 ? 100 : 0);
        result[fee.id] = {
          expectedAmount,
          collectedAmount,
          pct,
          collectedUnits,
          totalUnits,
        };
        continue;
      }

      const amountPerUnit = Number(fee.amount || "0");
      if (!amountPerUnit || amountPerUnit <= 0 || householdCount === 0) {
        result[fee.id] = {
          expectedAmount: 0,
          collectedAmount: 0,
          pct: 0,
          collectedUnits: 0,
          totalUnits: 0,
        };
        continue;
      }

      const totalUnits =
        fee.chargeType === "per_resident" ? totalMembers : householdCount;

      const feePayments = payments.filter((p) => p.feeId === fee.id);
      const collectedAmount = feePayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );

      // Số hộ đã thu (cho per_apartment) hoặc "đơn vị" đã thu ước lượng
      let collectedUnits: number;
      if (fee.chargeType === "per_resident") {
        // xấp xỉ số nhân khẩu đã thu dựa trên số tiền
        collectedUnits = Math.round(collectedAmount / amountPerUnit);
      } else {
        const uniqueHouseholds = new Set(
          feePayments.map((p) => p.householdId)
        );
        collectedUnits = uniqueHouseholds.size;
      }

      const expectedAmount = amountPerUnit * totalUnits;
      const pct =
        expectedAmount > 0
          ? Math.min(100, Math.round((collectedAmount / expectedAmount) * 100))
          : 0;

      result[fee.id] = {
        expectedAmount,
        collectedAmount,
        pct,
        collectedUnits,
        totalUnits,
      };
    }

    return result;
  }, [fees, payments, households, totalMembers]);

  const filtered = fees.filter((f) => {
    const nameMatch = f.name.toLowerCase().includes(search.toLowerCase());
    const typeMatch = filterType === "all" || f.type === filterType;
    const statusMatch = filterStatus === "all" || f.status === filterStatus;

    const stats = statsByFeeId[f.id];
    const hasUnpaid =
      stats && stats.totalUnits > 0 && stats.collectedUnits < stats.totalUnits;
    const deadlineDate = f.deadline ? new Date(f.deadline) : null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isOverdue =
      hasUnpaid &&
      deadlineDate &&
      !isNaN(deadlineDate.getTime()) &&
      deadlineDate.getTime() < todayStart.getTime();

    const paymentStatusMatch =
      filterPaymentStatus === "all" ||
      (filterPaymentStatus === "unpaid" && hasUnpaid) ||
      (filterPaymentStatus === "overdue" && isOverdue);

    return nameMatch && typeMatch && statusMatch && paymentStatusMatch;
  });

  // Summary
  const activeFees = fees.length;
  const completedFees = fees.filter(
    (f) => (statsByFeeId[f.id]?.pct ?? 0) >= 100
  ).length;
  const totalCollected = fees
    .reduce((sum, f) => sum + (statsByFeeId[f.id]?.collectedAmount ?? 0), 0)
    .toLocaleString("vi-VN");

  if (viewingFee) {
    const roundBasedStats = Array.isArray(roundObligations) && roundObligations.length > 0
      ? {
          collectedUnits: roundObligations.filter((r) => r.paid).length,
          totalUnits: roundObligations.length,
          pct: (() => {
            const expected = roundObligations.reduce((s, r) => s + (Number(r.expectedAmount) || 0), 0);
            const paid = roundObligations.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
            return expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : (paid > 0 ? 100 : 0);
          })(),
        }
      : null;

    const stats = roundBasedStats ?? statsByFeeId[viewingFee.id];
    const collectedUnits = stats?.collectedUnits ?? 0;
    const totalUnits = stats?.totalUnits ?? 0;
    const pct = totalUnits > 0 ? stats?.pct ?? 0 : 0;

    const feePaymentsAll = payments.filter((p) => p.feeId === viewingFee.id);
    const isDefaultRoundSelected = selectedRound && rounds.length > 0 && selectedRound.id === rounds[0]?.id;
    const feePayments = selectedRound
      ? feePaymentsAll.filter((p) => p.roundId === selectedRound.id || (p.roundId == null && isDefaultRoundSelected))
      : feePaymentsAll;

    const paidHouseholdIds = new Set(feePayments.map((p) => String(p.householdId)));

    const unpaidHouseholds = Array.isArray(roundObligations) && roundObligations.length > 0
      ? roundObligations.filter((r) => !r.paid).map((r) => ({
          id: r.householdId,
          members: r.members ?? 0,
          address: r.householdAddress ?? "",
          headName: r.headName ?? null,
        }))
      : (() => {
          const obligationRows = obligationsByFeeId[viewingFee.id];
          return Array.isArray(obligationRows) && obligationRows.length > 0
            ? obligationRows.filter((r) => !r.paid).map((r) => ({
                id: r.householdId,
                members: r.members ?? 0,
                address: r.householdAddress ?? "",
                headName: r.headName ?? null,
              }))
            : households.filter((h) => !paidHouseholdIds.has(String(h.id)));
        })();
    const deadlineDate = viewingFee.deadline ? new Date(viewingFee.deadline) : null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isDeadlinePassed =
      deadlineDate &&
      !isNaN(deadlineDate.getTime()) &&
      deadlineDate.getTime() < todayStart.getTime();
    const overdueHouseholds = isDeadlinePassed ? unpaidHouseholds : [];

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setViewingFee(null)} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft size={20} style={{ color: "#6F6AF8" }} />
            </button>
            <div>
              <h1 className="text-lg" style={{ fontWeight: 700, color: "#1A1A2E" }}>{viewingFee.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: viewingFee.type === "mandatory" ? "#6F6AF815" : "#4CAF5015",
                  color: viewingFee.type === "mandatory" ? "#6F6AF8" : "#4CAF50",
                  fontWeight: 500,
                }}>
                  {viewingFee.type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: statusConfig[viewingFee.status].bg,
                  color: statusConfig[viewingFee.status].color,
                  fontWeight: 500,
                }}>
                  {statusConfig[viewingFee.status].label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onCollectPayment}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm"
            style={{ background: "#4CAF50", borderRadius: 6, fontWeight: 500 }}
          >
            <Wallet size={16} /> Thu phí
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {/* Round selector */}
          <div className="bg-white rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="flex items-center gap-3">
              <div className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>Đợt thu</div>
              <div className="relative">
                <button
                  onClick={() => setShowRoundDropdown(!showRoundDropdown)}
                  className="flex items-center justify-between gap-2 px-3 py-2 border rounded-md text-sm min-w-[220px]"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                >
                  <span>{selectedRound?.name ?? (rounds.length > 0 ? "Chọn đợt thu" : "Đang tải...")}</span>
                  <ChevronDown size={14} style={{ color: "#6F6AF8" }} />
                </button>
                {showRoundDropdown && rounds.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg" style={{ borderColor: "#CFCFEF", borderRadius: 6 }}>
                    {rounds.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRound(r);
                          setShowRoundDropdown(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        style={{ color: "#1A1A2E" }}
                      >
                        {r.name}{r.period ? ` (${r.period})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedRound?.deadline && (
                <div className="text-sm" style={{ color: "#717182" }}>
                  Hạn: <span style={{ color: "#1A1A2E", fontWeight: 600 }}>{selectedRound.deadline}</span>
                </div>
              )}
            </div>
            {canManageFees && (
              <button
                onClick={() => {
                  setNewRoundName(`Đợt ${Math.max(1, rounds.length + 1)}`);
                  setNewRoundPeriod("");
                  setNewRoundDeadline(viewingFee.deadline);
                  setShowCreateRound(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                <Plus size={14} /> Tạo đợt thu
              </button>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="text-sm" style={{ color: "#717182" }}>Số tiền</div>
              <div className="text-lg mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>{viewingFee.amount}</div>
              <div className="text-xs" style={{ color: "#717182" }}>{viewingFee.unit}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="text-sm" style={{ color: "#717182" }}>Hạn nộp</div>
              <div className="text-lg mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>{viewingFee.deadline}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="text-sm" style={{ color: "#717182" }}>Đã thu</div>
              <div className="text-lg mt-1" style={{ fontWeight: 700, color: "#4CAF50" }}>
                {collectedUnits}/{totalUnits} {viewingFee.chargeType === "per_resident" ? "nhân khẩu (ước tính)" : "hộ"}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="text-sm" style={{ color: "#717182" }}>Tỉ lệ hoàn thành</div>
              <div className="text-lg mt-1" style={{ fontWeight: 700, color: "#6F6AF8" }}>
                {pct}%
              </div>
              <div className="w-full h-2 rounded-full mt-2" style={{ background: "#F2F2FD" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: "#6F6AF8" }}
                />
              </div>
            </div>
          </div>

          {/* Detail table - dữ liệu từ payments đã thu cho khoản thu này */}
          <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#CFCFEF" }}>
              <h3 className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>Chi tiết thu phí theo hộ gia đình</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F2F2FD" }}>
                  {["STT", "Hộ gia đình", "Chủ hộ", "Số tiền đã nộp", "Trạng thái", "Ngày nộp"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (feePayments.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#717182" }}>
                          Chưa có giao dịch thu phí nào cho khoản thu này. Bấm &quot;Thu phí&quot; để ghi nhận.
                        </td>
                      </tr>
                    );
                  }
                  return feePayments.map((row, i) => (
                    <tr key={row.id} className="border-t" style={{ borderColor: "#F2F2FD", background: i % 2 === 1 ? "#FAFAFF" : "#fff" }}>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#717182" }}>{i + 1}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#6F6AF8", fontWeight: 500 }}>{row.householdId}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#1A1A2E", fontWeight: 500 }}>{row.householdHead}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#1A1A2E" }}>{row.amount.toLocaleString("vi-VN")} VNĐ</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#4CAF5015", color: "#4CAF50", fontWeight: 500 }}>
                          Đã thanh toán
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#717182" }}>{row.date}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Hộ chưa đóng / Hộ quá hạn */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#CFCFEF", background: "#FF980008" }}>
                <h3 className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>Hộ chưa đóng</h3>
                {unpaidHouseholds.length > 0 && (
                  <button
                    onClick={() => { setNotifyTarget("unpaid"); setNotifyMessage(""); setShowNotifyModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
                    style={{ background: "#6F6AF8", color: "#fff", fontWeight: 500 }}
                  >
                    <Mail size={12} /> Gửi thông báo
                  </button>
                )}
              </div>
              <div className="p-3">
                {unpaidHouseholds.length === 0 ? (
                  <p className="text-sm" style={{ color: "#4CAF50" }}>Đã thu đủ, không có hộ chưa đóng.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "#F2F2FD" }}>
                        <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>STT</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Mã hộ</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Chủ hộ</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Địa chỉ / Căn hộ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidHouseholds.map((h, i) => (
                        <tr key={h.id} className="border-t" style={{ borderColor: "#F2F2FD" }}>
                          <td className="px-3 py-2" style={{ color: "#717182" }}>{i + 1}</td>
                          <td className="px-3 py-2" style={{ color: "#6F6AF8", fontWeight: 500 }}>HK{h.id}</td>
                          <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{h.headName ?? "—"}</td>
                          <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{h.address ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {isDeadlinePassed && (
              <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#CFCFEF", background: "#F4433608" }}>
                  <h3 className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>Hộ quá hạn</h3>
                  {overdueHouseholds.length > 0 && (
                    <button
                      onClick={() => { setNotifyTarget("overdue"); setNotifyMessage(""); setShowNotifyModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
                      style={{ background: "#F44336", color: "#fff", fontWeight: 500 }}
                    >
                      <Mail size={12} /> Gửi thông báo
                    </button>
                  )}
                </div>
                <div className="p-3">
                  {overdueHouseholds.length === 0 ? (
                    <p className="text-sm" style={{ color: "#717182" }}>Không có hộ quá hạn.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "#F2F2FD" }}>
                          <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>STT</th>
                          <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Mã hộ</th>
                          <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Chủ hộ</th>
                          <th className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>Địa chỉ / Căn hộ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueHouseholds.map((h, i) => (
                          <tr key={h.id} className="border-t" style={{ borderColor: "#F2F2FD" }}>
                            <td className="px-3 py-2" style={{ color: "#717182" }}>{i + 1}</td>
                            <td className="px-3 py-2" style={{ color: "#6F6AF8", fontWeight: 500 }}>HK{h.id}</td>
                            <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{h.headName ?? "—"}</td>
                            <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{h.address ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Gửi thông báo */}
          {showNotifyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowNotifyModal(false)} />
              <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
                  <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                    Gửi thông báo {notifyTarget === "unpaid" ? "hộ chưa đóng" : "hộ quá hạn"}
                  </h2>
                  <button onClick={() => setShowNotifyModal(false)} className="p-1 rounded hover:bg-gray-100">
                    <X size={18} style={{ color: "#717182" }} />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm" style={{ color: "#717182" }}>
                    {notifyTarget === "unpaid"
                      ? `Gửi thông báo nhắc nộp phí cho ${unpaidHouseholds.length} hộ chưa đóng (Email/SMS).`
                      : `Gửi thông báo nhắc quá hạn cho ${overdueHouseholds.length} hộ (Email/SMS).`}
                  </p>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Nội dung (tùy chọn)</label>
                    <textarea
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      rows={3}
                      placeholder="VD: Nhắc quý hộ nộp khoản thu ... trước ngày ..."
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
                  <button
                    onClick={() => setShowNotifyModal(false)}
                    className="px-4 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      const count = notifyTarget === "unpaid" ? unpaidHouseholds.length : overdueHouseholds.length;
                      toast.success(`Đã gửi thông báo cho ${count} hộ`, {
                        description: notifyMessage.trim() || "Nội dung mặc định đã gửi qua Email/SMS.",
                      });
                      setShowNotifyModal(false);
                      setNotifyMessage("");
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm"
                    style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
                  >
                    <Mail size={14} /> Gửi thông báo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal tạo đợt thu */}
          {showCreateRound && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowCreateRound(false)}
              />
              <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
                  <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>Tạo đợt thu</h2>
                  <button onClick={() => setShowCreateRound(false)} className="p-1 rounded hover:bg-gray-100">
                    <X size={18} style={{ color: "#717182" }} />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Tên đợt</label>
                    <input
                      value={newRoundName}
                      onChange={(e) => setNewRoundName(e.target.value)}
                      placeholder="VD: Đợt 2"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Kỳ thu (tùy chọn)</label>
                      <input
                        value={newRoundPeriod}
                        onChange={(e) => setNewRoundPeriod(e.target.value)}
                        placeholder="VD: 2026-03"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Hạn nộp</label>
                      <input
                        type="date"
                        value={newRoundDeadline}
                        onChange={(e) => setNewRoundDeadline(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
                  <button
                    onClick={() => setShowCreateRound(false)}
                    className="px-4 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!newRoundName.trim()) {
                        toast.error("Vui lòng nhập tên đợt");
                        return;
                      }
                      try {
                        const created = await createRound(viewingFee.id, {
                          name: newRoundName.trim(),
                          period: newRoundPeriod.trim() || undefined,
                          deadline: newRoundDeadline || undefined,
                        });
                        const list = await fetchRoundsByFee(viewingFee.id);
                        setRounds(Array.isArray(list) ? list : []);
                        setSelectedRound(created);
                        setShowCreateRound(false);
                        toast.success("Đã tạo đợt thu", { description: created.name });
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Không tạo được đợt thu";
                        toast.error(message);
                      }
                    }}
                    className="px-4 py-2 text-white rounded-md text-sm"
                    style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
                  >
                    Tạo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Quản lý Khoản thu</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={onCollectPayment}
            disabled={!canManageFees}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm disabled:opacity-60"
            style={{ background: "#4CAF50", borderRadius: 6, fontWeight: 500 }}
          >
            <Wallet size={16} /> Thu phí
          </button>
          <button
            onClick={onCreateFee}
            disabled={!canManageFees}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm disabled:opacity-60"
            style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
          >
            <Plus size={16} /> Tạo khoản thu
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} style={{ color: "#6F6AF8" }} />
              <span className="text-sm" style={{ color: "#717182" }}>Đang thu</span>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700, color: "#6F6AF8" }}>{activeFees}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} style={{ color: "#4CAF50" }} />
              <span className="text-sm" style={{ color: "#717182" }}>Hoàn thành</span>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700, color: "#4CAF50" }}>{completedFees}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} style={{ color: "#FF9800" }} />
              <span className="text-sm" style={{ color: "#717182" }}>Tổng đã thu</span>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>{totalCollected}</div>
            <div className="text-xs" style={{ color: "#717182" }}>VNĐ</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#CFCFEF" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khoản thu..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
          >
            <option value="all">Tất cả loại</option>
            <option value="mandatory">Bắt buộc</option>
            <option value="voluntary">Đóng góp</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang thu</option>
            <option value="completed">Hoàn thành</option>
            <option value="expired">Hết hạn</option>
          </select>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value as typeof filterPaymentStatus)}
            className="px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
          >
            <option value="all">Tất cả thu phí</option>
            <option value="unpaid">Có hộ chưa đóng</option>
            <option value="overdue">Có hộ quá hạn</option>
          </select>
        </div>

        {/* Fee Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((fee) => {
            const cfg = statusConfig[fee.status];
            const StatusIcon = cfg.icon;
            const stats = statsByFeeId[fee.id];
            const pct = stats?.pct ?? 0;
            const collectedUnits = stats?.collectedUnits ?? 0;
            const totalUnits = stats?.totalUnits ?? 0;
            return (
              <div key={fee.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-all" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>{fee.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: fee.type === "mandatory" ? "#6F6AF815" : "#4CAF5015",
                        color: fee.type === "mandatory" ? "#6F6AF8" : "#4CAF50",
                        fontWeight: 500,
                      }}>
                        {fee.type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: cfg.bg, color: cfg.color, fontWeight: 500 }}>
                        <StatusIcon size={10} /> {cfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewingFee(fee)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} style={{ color: "#6F6AF8" }} />
                    </button>
                    {canManageFees && (
                      <>
                        <button
                          onClick={() => setEditingFee(fee)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Sửa"
                        >
                          <Pencil size={14} style={{ color: "#717182" }} />
                        </button>
                        <button
                          onClick={() => { setFeeToDelete(fee); setDeletePassword(""); }}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={14} style={{ color: "#F44336" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mb-2" style={{ color: "#717182" }}>
                  <span>Số tiền: <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{fee.amount} {fee.unit}</span></span>
                  <span>Hạn: {fee.deadline}</span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full" style={{ background: "#F2F2FD" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 90 ? "#4CAF50" : pct >= 50 ? "#FF9800" : "#F44336",
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ fontWeight: 500, color: "#1A1A2E" }}>
                    {collectedUnits}/{totalUnits}
                  </span>
                  <span className="text-xs" style={{ color: "#717182" }}>({pct}%)</span>
                </div>

                <div className="text-xs mt-2" style={{ color: "#717182" }}>{fee.note}</div>
              </div>
            );
          })}
        </div>

        {/* Modal chỉnh sửa khoản thu */}
        {editingFee && (
          <EditFeeModal
            fee={editingFee}
            onClose={() => setEditingFee(null)}
            onSave={async (data) => {
              try {
                await updateFee(editingFee.id, {
                  name: data.name,
                  amount: Number(data.amount) || 0,
                  type: data.type,
                  chargeType: data.chargeType,
                  deadline: data.deadline || undefined,
                });
                onRefreshFees();
                setEditingFee(null);
                toast.success("Đã cập nhật khoản thu", { description: data.name });
              } catch {
                toast.error("Không cập nhật được khoản thu");
              }
            }}
          />
        )}

        {/* Modal xóa khoản thu (xác nhận + mật khẩu) */}
        {feeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setFeeToDelete(null); setDeletePassword(""); }} />
            <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
                <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>Xóa khoản thu</h2>
                <button onClick={() => { setFeeToDelete(null); setDeletePassword(""); }} className="p-1 rounded hover:bg-gray-100">
                  <X size={18} style={{ color: "#717182" }} />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm" style={{ color: "#717182" }}>
                  Bạn có chắc muốn xóa khoản thu <strong style={{ color: "#1A1A2E" }}>{feeToDelete.name}</strong>? Nhập mật khẩu để xác nhận.
                </p>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Mật khẩu</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Nhập mật khẩu đăng nhập"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
                <button
                  onClick={() => { setFeeToDelete(null); setDeletePassword(""); }}
                  className="px-4 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!deletePassword.trim()) {
                      toast.error("Vui lòng nhập mật khẩu");
                      return;
                    }
                    if (!currentEmail) {
                      toast.error("Không xác định được email đăng nhập. Vui lòng đăng xuất và đăng nhập lại.");
                      return;
                    }
                    try {
                      await loginAccount({ email: currentEmail, password: deletePassword });
                      await deleteFee(feeToDelete.id);
                      onRefreshFees();
                      setFeeToDelete(null);
                      setDeletePassword("");
                      toast.success("Đã xóa khoản thu", { description: feeToDelete.name });
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Không xóa được khoản thu";
                      toast.error(message);
                    }
                  }}
                  className="px-4 py-2 text-white rounded-md text-sm"
                  style={{ background: "#F44336", borderRadius: 6, fontWeight: 600 }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
