import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { DatePickerInput } from "./shared/DatePickerInput";

type ChargeType = "per_apartment" | "per_resident";
type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "one_time";

const cycleLabels: Record<string, string> = {
  daily: "Ngày",
  weekly: "Tuần",
  monthly: "Tháng",
  yearly: "Năm",
};

interface CreateFeeDialogProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: "mandatory" | "voluntary";
    amount: string;
    unit: string;
    deadline: string;
    note: string;
    chargeType: ChargeType;
    frequency: Frequency;
    startDate: string;
    endDate: string;
  }) => void;
}

export function CreateFeeDialog({ onClose, onSubmit }: CreateFeeDialogProps) {
  const [feeType, setFeeType] = useState<"mandatory" | "voluntary">("mandatory");
  const [chargeType, setChargeType] = useState<ChargeType>("per_apartment");
  const [isRecurring, setIsRecurring] = useState(true);
  const [cycle, setCycle] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const frequency: Frequency = isRecurring ? cycle : "one_time";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!feeName.trim()) e.feeName = "Vui lòng nhập tên khoản thu";
    if (feeType === "mandatory" && (!amount || Number(amount) <= 0)) e.amount = "Vui lòng nhập số tiền hợp lệ";
    if (!isRecurring && !deadline) e.deadline = "Vui lòng chọn thời hạn";
    if (isRecurring) {
      if (!startDate) e.startDate = "Vui lòng chọn ngày bắt đầu";
      if (!endDate) e.endDate = "Vui lòng chọn ngày kết thúc";
      if (startDate && endDate && startDate >= endDate) e.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: feeName,
      type: feeType,
      amount,
      unit: "VNĐ",
      deadline: isRecurring ? endDate : deadline,
      note: notes,
      chargeType,
      frequency,
      startDate,
      endDate,
    });
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // Auto-fill endDate based on cycle when startDate changes
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    clearError("startDate");
    if (val && !endDate) {
      try {
        const d = new Date(val);
        if (cycle === "daily") d.setDate(d.getDate() + 1);
        else if (cycle === "weekly") d.setDate(d.getDate() + 7);
        else if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
        else if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
        setEndDate(d.toISOString().slice(0, 10));
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" style={{ borderRadius: 8 }}>
        {/* Title */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
          <h2 className="text-lg" style={{ fontWeight: 700, color: "#1A1A2E" }}>Tạo khoản thu mới</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Đóng">
            <X size={20} style={{ color: "#717182" }} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Fee Type */}
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Loại khoản thu</label>
            <div className="flex gap-4">
              {(["mandatory", "voluntary"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: feeType === type ? "#6F6AF8" : "#CFCFEF" }}
                  >
                    {feeType === type && <div className="w-2 h-2 rounded-full" style={{ background: "#6F6AF8" }} />}
                  </div>
                  <input type="radio" name="feeType" className="sr-only" checked={feeType === type} onChange={() => setFeeType(type)} />
                  <span className="text-sm" style={{ color: "#1A1A2E" }}>
                    {type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* One-time vs Recurring toggle */}
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Hình thức thu</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className="flex-1 px-3 py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: !isRecurring ? "#6F6AF8" : "#F2F2FD",
                  color: !isRecurring ? "#fff" : "#1A1A2E",
                  fontWeight: !isRecurring ? 600 : 400,
                  border: `1.5px solid ${!isRecurring ? "#6F6AF8" : "#CFCFEF"}`,
                }}
              >
                Một lần
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className="flex-1 px-3 py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: isRecurring ? "#6F6AF8" : "#F2F2FD",
                  color: isRecurring ? "#fff" : "#1A1A2E",
                  fontWeight: isRecurring ? 600 : 400,
                  border: `1.5px solid ${isRecurring ? "#6F6AF8" : "#CFCFEF"}`,
                }}
              >
                <RefreshCw size={14} /> Lặp lại
              </button>
            </div>
          </div>

          {/* Cycle selector (only for recurring) */}
          {isRecurring && (
            <div>
              <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Chu kỳ lặp lại</label>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className="flex-1 px-3 py-2 rounded-md text-sm transition-all"
                    style={{
                      background: cycle === c ? "#6F6AF8" : "#F2F2FD",
                      color: cycle === c ? "#fff" : "#1A1A2E",
                      fontWeight: cycle === c ? 600 : 400,
                      border: `1px solid ${cycle === c ? "#6F6AF8" : "#CFCFEF"}`,
                    }}
                  >
                    {cycleLabels[c]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cách thu: theo căn / theo nhân khẩu */}
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500, color: "#1A1A2E" }}>Cách tính thu</label>
            <div className="flex gap-4">
              {(["per_apartment", "per_resident"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: chargeType === type ? "#6F6AF8" : "#CFCFEF" }}
                  >
                    {chargeType === type && <div className="w-2 h-2 rounded-full" style={{ background: "#6F6AF8" }} />}
                  </div>
                  <input type="radio" name="chargeType" className="sr-only" checked={chargeType === type} onChange={() => setChargeType(type)} />
                  <span className="text-sm" style={{ color: "#1A1A2E" }}>
                    {type === "per_apartment" ? "Thu theo căn" : "Thu theo nhân khẩu"}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "#717182" }}>
              {chargeType === "per_resident" ? "Số tiền nhân với số người trong mỗi căn" : "Mỗi căn một mức tiền cố định"}
            </p>
          </div>

          {/* Fee Name */}
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Tên khoản thu <span style={{ color: "#F44336" }}>*</span></label>
            <input
              value={feeName}
              onChange={(e) => { setFeeName(e.target.value); clearError("feeName"); }}
              placeholder="VD: Phí dịch vụ, Phí vệ sinh..."
              className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2"
              style={{ borderColor: errors.feeName ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
            />
            {errors.feeName && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.feeName}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>
              Số tiền {feeType === "mandatory" && <span style={{ color: "#F44336" }}>*</span>}
            </label>
            <div className="relative">
              <input
                value={amount}
                onChange={(e) => { setAmount(e.target.value); clearError("amount"); }}
                type="number"
                placeholder={feeType === "voluntary" ? "0 (tối thiểu)" : "0"}
                className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2 pr-14"
                style={{ borderColor: errors.amount ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#717182" }}>VNĐ</span>
            </div>
            {errors.amount && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.amount}</p>}
            {!errors.amount && (
              <p className="text-xs mt-1" style={{ color: "#717182" }}>
                {chargeType === "per_apartment" ? "VNĐ/căn" : "VNĐ/nhân khẩu (sẽ nhân với số người trong căn khi thu)"}
              </p>
            )}
          </div>

          {/* Recurring: start/end date */}
          {isRecurring ? (
            <div>
              <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>
                Đợt thu đầu tiên <span style={{ color: "#F44336" }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182" }}>Ngày bắt đầu</label>
                  <DatePickerInput
                    value={startDate}
                    onChange={(v) => handleStartDateChange(v)}
                    error={errors.startDate}
                    placeholder="Chọn ngày"
                    buttonClassName="px-3 py-2.5 outline-none focus:ring-2"
                  />
                  {errors.startDate && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182" }}>Ngày kết thúc</label>
                  <DatePickerInput
                    value={endDate}
                    onChange={(v) => { setEndDate(v); clearError("endDate"); }}
                    error={errors.endDate}
                    placeholder="Chọn ngày"
                    buttonClassName="px-3 py-2.5 outline-none focus:ring-2"
                  />
                  {errors.endDate && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.endDate}</p>}
                </div>
              </div>
              <div className="mt-2 px-3 py-2 rounded-md text-xs" style={{ background: "#F2F2FD", color: "#717182" }}>
                ⏳ Các đợt tiếp theo tự động lặp lại theo chu kỳ <strong style={{ color: "#6F6AF8" }}>{cycleLabels[cycle]}</strong>. Ngày bắt đầu đợt sau = ngày kết thúc đợt trước.
              </div>
            </div>
          ) : (
            /* One-time: just deadline */
            <div>
              <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Thời hạn <span style={{ color: "#F44336" }}>*</span></label>
              <DatePickerInput
                value={deadline}
                onChange={(v) => { setDeadline(v); clearError("deadline"); }}
                error={errors.deadline}
                placeholder="Chọn ngày"
                buttonClassName="px-3 py-2.5 outline-none focus:ring-2"
              />
              {errors.deadline && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.deadline}</p>}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm mb-1.5" style={{ fontWeight: 500, color: "#1A1A2E" }}>Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú..."
              className="w-full px-3 py-2.5 border rounded-md outline-none focus:ring-2 resize-none"
              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
            />
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
            onClick={handleSubmit}
            className="px-5 py-2 text-white rounded-md transition-all hover:opacity-90"
            style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
          >
            Tạo khoản thu
          </button>
        </div>
      </div>
    </div>
  );
}
