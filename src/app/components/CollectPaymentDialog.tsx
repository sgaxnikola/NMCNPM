import { useMemo, useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { FeeItem, Household } from "../types";
import { fetchHouseholds, fetchRoundsByFee, type CollectionRound } from "../api";

interface CollectPaymentDialogProps {
  fees: FeeItem[];
  onSubmit: (data: {
    fee: FeeItem;
    roundId: number;
    householdId: string;
    householdHead: string;
    amount: number;
    date: string;
  }) => void;
  onClose: () => void;
}

/** Tính số tiền cần nộp: theo căn = amount; theo nhân khẩu = amount * số người trong căn */
function computeAmountDue(fee: FeeItem | undefined, members: number | null): number {
  if (!fee) return 0;
  const base = Number(String(fee.amount).replace(/\s/g, "")) || 0;
  const count = fee.chargeType === "per_resident" ? (members ?? 1) : 1;
  return base * count;
}

export function CollectPaymentDialog({ fees, onSubmit, onClose }: CollectPaymentDialogProps) {
  const initialFee = fees[0];
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedFee, setSelectedFee] = useState<FeeItem | undefined>(initialFee);
  const [rounds, setRounds] = useState<CollectionRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<CollectionRound | null>(null);
  const [showRoundDropdown, setShowRoundDropdown] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdQuery, setHouseholdQuery] = useState("");
  const [payer, setPayer] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false);

  useEffect(() => {
    fetchHouseholds()
      .then((data) => {
        setHouseholds(Array.isArray(data) ? data : []);
        if (data?.length > 0 && !selectedHousehold) setSelectedHousehold(data[0]);
      })
      .catch(() => setHouseholds([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRounds() {
      if (!selectedFee) {
        setRounds([]);
        setSelectedRound(null);
        return;
      }
      try {
        const list = await fetchRoundsByFee(selectedFee.id);
        if (cancelled) return;
        const normalized = Array.isArray(list) ? list : [];
        setRounds(normalized);
        setSelectedRound(normalized[0] ?? null);
      } catch {
        if (cancelled) return;
        setRounds([]);
        setSelectedRound(null);
      }
    }
    loadRounds();
    return () => {
      cancelled = true;
    };
  }, [selectedFee?.id]);

  const filteredHouseholds = useMemo(() => {
    const q = householdQuery.trim().toLowerCase();
    if (!q) return households;
    return households.filter((h) => {
      const name = (h.headName ?? "").toLowerCase();
      const addr = (h.address ?? "").toLowerCase();
      const id = String(h.id);
      return name.includes(q) || addr.includes(q) || id.includes(q);
    });
  }, [households, householdQuery]);

  const amountDue = computeAmountDue(selectedFee, selectedHousehold?.members ?? null);
  const amountDueFormatted = amountDue.toLocaleString("vi-VN");

  const formatAmount = (value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    if (!digitsOnly) return "";
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleFillFullAmount = () => {
    setAmountPaid(amountDueFormatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" style={{ borderRadius: 8 }}>
        {/* Title */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
          <h2 className="text-lg" style={{ fontWeight: 700, color: "#1A1A2E" }}>Thu phí</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={20} style={{ color: "#717182" }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Section 1 - Fee Info */}
          <div className="p-4 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8, background: "#F2F2FD" }}>
            <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: "#6F6AF8" }}>Thông tin khoản thu</h3>
            <div className="relative mb-3">
              <button
                onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left"
                style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
              >
                <span className="text-sm" style={{ color: "#1A1A2E" }}>{selectedFee?.name ?? "Chưa có khoản thu"}</span>
                <ChevronDown size={16} style={{ color: "#6F6AF8" }} />
              </button>
              {showFeeDropdown && fees.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg" style={{ borderColor: "#CFCFEF", borderRadius: 6 }}>
                  {fees.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setSelectedFee(f); setSelectedRound(null); setShowFeeDropdown(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      style={{ color: "#1A1A2E" }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Round dropdown */}
            <div className="relative mb-3">
              <button
                onClick={() => setShowRoundDropdown(!showRoundDropdown)}
                disabled={!selectedFee || rounds.length === 0}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left disabled:opacity-60"
                style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
                title={rounds.length === 0 ? "Chưa có đợt thu cho khoản thu này" : undefined}
              >
                <span className="text-sm" style={{ color: "#1A1A2E" }}>
                  {selectedRound?.name ?? (rounds.length > 0 ? "Chọn đợt thu" : "Chưa có đợt thu")}
                </span>
                <ChevronDown size={16} style={{ color: "#6F6AF8" }} />
              </button>
              {showRoundDropdown && rounds.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg" style={{ borderColor: "#CFCFEF", borderRadius: 6 }}>
                  {rounds.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRound(r); setShowRoundDropdown(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      style={{ color: "#1A1A2E" }}
                    >
                      {r.name}{r.period ? ` (${r.period})` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedFee && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: selectedFee.type === "mandatory" ? "#6F6AF815" : "#4CAF5015",
                    color: selectedFee.type === "mandatory" ? "#6F6AF8" : "#4CAF50",
                    fontWeight: 500,
                  }}
                >
                  {selectedFee.type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                </span>
                <span style={{ color: "#717182" }}>{selectedFee.amount} {selectedFee.unit}</span>
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#E8E8F0", color: "#1A1A2E" }}>
                  {selectedFee.chargeType === "per_resident" ? "Thu theo nhân khẩu" : "Thu theo căn"}
                </span>
              </div>
            )}
          </div>

          {/* Section 2 - Household Info */}
          <div className="p-4 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8, background: "#F2F2FD" }}>
            <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: "#6F6AF8" }}>Thông tin hộ gia đình</h3>
            {households.length === 0 ? (
              <p className="text-sm" style={{ color: "#717182" }}>Chưa có hộ khẩu. Vui lòng thêm hộ ở mục Cư dân.</p>
            ) : (
              <>
                <div className="relative mb-3">
                  <button
                    onClick={() => setShowHouseholdDropdown(!showHouseholdDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
                  >
                    <span className="text-sm" style={{ color: "#1A1A2E" }}>
                      {selectedHousehold ? `${selectedHousehold.headName ?? "Hộ " + selectedHousehold.id} - Căn ${selectedHousehold.address ?? selectedHousehold.id}` : "Chọn hộ"}
                    </span>
                    <ChevronDown size={16} style={{ color: "#6F6AF8" }} />
                  </button>
                  {showHouseholdDropdown && (
                    <div
                      className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg"
                      style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
                    >
                      <div className="p-2 border-b" style={{ borderColor: "#F2F2FD" }}>
                        <input
                          value={householdQuery}
                          onChange={(e) => setHouseholdQuery(e.target.value)}
                          placeholder="Tìm theo tên, địa chỉ, mã hộ..."
                          className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                          autoFocus
                        />
                      </div>

                      <div className="max-h-64 overflow-auto">
                        {filteredHouseholds.length === 0 ? (
                          <div className="px-3 py-2 text-sm" style={{ color: "#717182" }}>
                            Không tìm thấy hộ phù hợp.
                          </div>
                        ) : (
                          filteredHouseholds.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => {
                                setSelectedHousehold(h);
                                setShowHouseholdDropdown(false);
                                setHouseholdQuery("");
                              }}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              style={{ color: "#1A1A2E" }}
                            >
                              {h.headName ?? "Hộ " + h.id} - {h.address ?? "ID " + h.id}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedHousehold && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span style={{ color: "#717182" }}>Mã hộ:</span> <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedHousehold.id}</span></div>
                      <div><span style={{ color: "#717182" }}>Chủ hộ:</span> <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedHousehold.headName ?? "—"}</span></div>
                      <div className="col-span-2"><span style={{ color: "#717182" }}>Địa chỉ:</span> <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedHousehold.address ?? "—"}</span></div>
                      <div><span style={{ color: "#717182" }}>Số nhân khẩu:</span> <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedHousehold.members ?? 0}</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: "#CFCFEF" }}>
                      <span className="text-sm" style={{ color: "#717182" }}>Số tiền cần nộp: </span>
                      <span className="text-lg" style={{ fontWeight: 700, color: "#6F6AF8" }}>{amountDueFormatted} VNĐ</span>
                      {selectedFee?.chargeType === "per_resident" && (selectedHousehold.members ?? 0) > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "#717182" }}>
                          ({selectedFee.amount} × {selectedHousehold.members} nhân khẩu)
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Section 3 - Payment Info */}
          <div className="p-4 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8, background: "#F2F2FD" }}>
            <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: "#6F6AF8" }}>Thông tin nộp tiền</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ fontWeight: 500, color: "#1A1A2E" }}>Người nộp</label>
                <input
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  placeholder="Nhập tên người nộp"
                  className="w-full px-3 py-2 bg-white border rounded-md outline-none text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ fontWeight: 500, color: "#1A1A2E" }}>Số tiền nộp</label>
                <div className="relative">
                  <input
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(formatAmount(e.target.value))}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border rounded-md outline-none text-sm pr-24"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                  <button
                    type="button"
                    onClick={handleFillFullAmount}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "#6F6AF810", color: "#6F6AF8", fontWeight: 600 }}
                  >
                    Nộp 100%
                  </button>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#717182" }}>VNĐ</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ fontWeight: 500, color: "#1A1A2E" }}>Ngày nộp</label>
                <input
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  type="date"
                  className="w-full px-3 py-2 bg-white border rounded-md outline-none text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-md transition-all hover:bg-gray-50"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (!selectedFee) {
                toast.error("Chưa có khoản thu nào để thu phí");
                return;
              }
              if (!selectedRound) {
                toast.error("Vui lòng chọn đợt thu");
                return;
              }
              if (!selectedHousehold) {
                toast.error("Vui lòng chọn hộ gia đình");
                return;
              }
              const numericAmount = Number(amountPaid.replace(/[^\d]/g, ""));
              if (!payer.trim() || !amountPaid || numericAmount <= 0) {
                toast.error("Vui lòng nhập đủ thông tin", { description: "Tên người nộp và số tiền nộp là bắt buộc" });
                return;
              }
              onSubmit({
                fee: selectedFee,
                householdId: String(selectedHousehold.id),
                householdHead: payer.trim() || (selectedHousehold.headName ?? ""),
                amount: numericAmount,
                date: paymentDate,
                roundId: selectedRound.id,
              });
              toast.success("Thu phí thành công", { description: `${payer.trim() || selectedHousehold.headName} đã nộp ${numericAmount.toLocaleString("vi-VN")} VNĐ` });
              onClose();
            }}
            className="px-5 py-2 text-white rounded-md transition-all hover:opacity-90"
            style={{ background: "#4CAF50", borderRadius: 6, fontWeight: 500 }}
          >
            Xác nhận thu phí
          </button>
        </div>
      </div>
    </div>
  );
}
