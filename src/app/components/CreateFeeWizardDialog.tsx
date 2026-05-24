import { useMemo, useState, type ReactNode } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type ChargeType = "per_apartment" | "per_resident" | "per_vehicle";
type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "one_time";

const cycleLabels: Record<string, string> = {
  daily: "Ngày",
  weekly: "Tuần",
  monthly: "Tháng",
  yearly: "Năm",
};

const STEP_LABELS = ["Thông tin", "Lịch thu", "Thời gian", "Số tiền"];

interface CreateFeeWizardDialogProps {
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
    vehicleRateMotorcycle?: number;
    vehicleRateCar?: number;
    vehicleRateBicycle?: number;
  }) => void;
}

function digitsOnly(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

function formatVndFromDigits(digits: string): string {
  const clean = digitsOnly(digits);
  if (!clean) return "";
  return Number(clean).toLocaleString("vi-VN");
}

function formatDateVNFromISO(iso: string): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

function isoToDate(iso: string): Date | null {
  const m = (iso ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function DatePickerField({
  label,
  valueIso,
  onChangeIso,
  error,
}: {
  label: string;
  valueIso: string;
  onChangeIso: (nextIso: string) => void;
  error?: string;
}) {
  const selected = valueIso ? isoToDate(valueIso) : null;
  const display = selected ? format(selected, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày";

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#717182", fontWeight: 600 }}>
        <CalendarIcon size={14} style={{ color: "#6F6AF8" }} aria-hidden />
        {label}
      </label>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-11 px-3 border rounded-lg flex items-center justify-between gap-3 transition-colors hover:bg-gray-50"
            style={{
              borderColor: error ? "#F44336" : "#CFCFEF",
              color: selected ? "#1A1A2E" : "#9B9BB0",
              background: "#fff",
            }}
          >
            <span className="text-sm font-medium">{display}</span>
            <CalendarIcon size={16} style={{ color: "#717182" }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 z-[80]" align="start">
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            onSelect={(d) => {
              if (!d) return;
              onChangeIso(dateToIso(d));
            }}
            locale={vi}
          />
        </PopoverContent>
      </Popover>

      {selected ? (
        <p className="text-xs mt-1" style={{ color: "#9B9BB0" }}>
          Định dạng: {formatDateVNFromISO(valueIso)}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs mt-1" style={{ color: "#F44336" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-4">
      {[1, 2, 3, 4].map((n) => {
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex-1 flex flex-col gap-1 min-w-0">
            <div
              className="h-1 rounded-full transition-colors"
              style={{
                background: done || active ? "#6F6AF8" : "#E8E8F4",
              }}
            />
            <span
              className="text-[10px] leading-tight truncate text-center"
              style={{
                color: active ? "#6F6AF8" : "#9B9BB0",
                fontWeight: active ? 600 : 400,
              }}
            >
              {STEP_LABELS[n - 1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-1">
      <div>
        <div className="text-xs uppercase tracking-wide" style={{ color: "#9B9BB0", fontWeight: 600 }}>
          Bước {step}/4
        </div>
        <div className="text-base mt-0.5" style={{ fontWeight: 700, color: "#1A1A2E" }}>
          {STEP_LABELS[step - 1]}
        </div>
      </div>
      <div className="text-right shrink-0">{children}</div>
    </div>
  );
}

const inputBase =
  "w-full px-3 py-2.5 border rounded-lg outline-none transition-shadow focus:ring-2 focus:ring-offset-0 min-h-[44px]";
const inputStyle = (err: boolean) => ({
  borderColor: err ? "#F44336" : "#CFCFEF",
  borderRadius: 8,
  color: "#1A1A2E",
  boxShadow: err ? undefined : "inset 0 1px 2px rgba(26, 26, 46, 0.04)",
});

export function CreateFeeWizardDialog({ onClose, onSubmit }: CreateFeeWizardDialogProps) {
  const [step, setStep] = useState(1);

  const [feeName, setFeeName] = useState("");
  const [feeType, setFeeType] = useState<"mandatory" | "voluntary">("mandatory");
  const [chargeType, setChargeType] = useState<ChargeType>("per_apartment");

  const [scheduleType, setScheduleType] = useState<"cycle" | "one_time">("cycle");
  const [cycle, setCycle] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  const [startDateIso, setStartDateIso] = useState("");
  const [endDateIso, setEndDateIso] = useState("");
  const [deadlineIso, setDeadlineIso] = useState("");

  const [amountMode, setAmountMode] = useState<"fixed" | "custom">("fixed");
  const [amountDigits, setAmountDigits] = useState("");
  const [vMotoDigits, setVMotoDigits] = useState("");
  const [vCarDigits, setVCarDigits] = useState("");
  const [vBikeDigits, setVBikeDigits] = useState("");
  const [notes, setNotes] = useState("");

  const unitHint = useMemo(() => {
    if (chargeType === "per_resident") return "VNĐ/nhân khẩu";
    if (chargeType === "per_vehicle") return "VNĐ/xe (theo loại phương tiện)";
    return "VNĐ/căn";
  }, [chargeType]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!feeName.trim()) e.feeName = "Vui lòng nhập tên khoản thu";
    }

    if (s === 3) {
      if (scheduleType === "one_time") {
        if (!deadlineIso) e.deadline = "Vui lòng chọn thời hạn";
      } else {
        if (!startDateIso) e.startDate = "Vui lòng chọn ngày bắt đầu";
        if (!endDateIso) e.endDate = "Vui lòng chọn ngày kết thúc";
        if (startDateIso && endDateIso && startDateIso > endDateIso) e.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
      }
    }

    if (s === 4) {
      if (chargeType === "per_vehicle") {
        const m = Number(vMotoDigits || "0");
        const c = Number(vCarDigits || "0");
        const b = Number(vBikeDigits || "0");
        if (feeType === "mandatory" && m + c + b <= 0) {
          e.amount = "Nhập ít nhất một mức thu cho loại phương tiện";
        }
      } else if (amountMode === "fixed") {
        if (!amountDigits || Number(amountDigits) <= 0) e.amount = "Vui lòng nhập số tiền hợp lệ";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 4) {
      if (!validateStep(1) || !validateStep(3) || !validateStep(4)) return;

      const frequency: Frequency =
        scheduleType === "cycle" ? (cycle as Frequency) : "one_time";

      onSubmit({
        name: feeName.trim(),
        type: feeType,
        amount:
          chargeType === "per_vehicle"
            ? String(Number(vMotoDigits || "0") + Number(vCarDigits || "0") + Number(vBikeDigits || "0"))
            : amountMode === "fixed"
              ? amountDigits
              : "0",
        unit: "VNĐ",
        deadline: scheduleType === "one_time" ? deadlineIso : endDateIso,
        note: notes,
        chargeType,
        frequency,
        startDate: scheduleType === "cycle" ? startDateIso : "",
        endDate: scheduleType === "cycle" ? endDateIso : "",
        vehicleRateMotorcycle:
          chargeType === "per_vehicle" ? Number(vMotoDigits || "0") : undefined,
        vehicleRateCar: chargeType === "per_vehicle" ? Number(vCarDigits || "0") : undefined,
        vehicleRateBicycle: chargeType === "per_vehicle" ? Number(vBikeDigits || "0") : undefined,
      });
      return;
    }

    if (step === 1 && !validateStep(1)) return;
    if (step === 3 && !validateStep(3)) return;
    if (step === 4 && !validateStep(4)) return;
    setStep((p) => Math.min(4, p + 1));
  };

  const back = () => setStep((p) => Math.max(1, p - 1));

  const seg = (active: boolean) => ({
    background: active ? "#6F6AF8" : "#FFFFFF",
    color: active ? "#fff" : "#1A1A2E",
    fontWeight: 600 as const,
    border: `1.5px solid ${active ? "#6F6AF8" : "#E0E0F0"}`,
    boxShadow: active ? "0 2px 8px rgba(111, 106, 248, 0.35)" : "none",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[min(90vh,640px)]"
        style={{ borderRadius: 16, border: "1px solid #E8E8F4" }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #EEF0F8" }}>
          <div>
            <h2 className="text-lg" style={{ fontWeight: 800, color: "#1A1A2E", letterSpacing: "-0.02em" }}>
              Tạo khoản thu
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9B9BB0" }}>
              Thiết lập khoản thu theo từng bước
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={20} style={{ color: "#717182" }} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 shrink-0">
          <StepProgress current={step} />
        </div>

        <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="rounded-xl p-4 mb-2" style={{ background: "#F7F8FC", border: "1px solid #EEF0F8" }}>
            <StepTitle step={step}>
              <div className="text-xs leading-snug" style={{ color: "#717182" }}>
                {scheduleType === "cycle" ? "Chu kì" : "Một đợt"} · {unitHint}
              </div>
            </StepTitle>

            <div className="space-y-4 mt-3">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                      Tên khoản thu <span style={{ color: "#F44336" }}>*</span>
                    </label>
                    <input
                      value={feeName}
                      onChange={(e) => {
                        setFeeName(e.target.value);
                        setErrors({});
                      }}
                      placeholder="VD: Phí dịch vụ, Phí vệ sinh..."
                      className={inputBase}
                      style={inputStyle(!!errors.feeName)}
                    />
                    {errors.feeName && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.feeName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#717182", fontWeight: 600 }}>
                        Cách tính
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setChargeType("per_apartment")}
                          className="w-full h-14 px-2 rounded-lg text-sm leading-tight text-center flex items-center justify-center"
                          style={seg(chargeType === "per_apartment")}
                        >
                          Theo căn
                        </button>
                        <button
                          type="button"
                          onClick={() => setChargeType("per_resident")}
                          className="w-full h-14 px-2 rounded-lg text-sm leading-tight text-center flex items-center justify-center"
                          style={seg(chargeType === "per_resident")}
                        >
                          Theo nhân khẩu
                        </button>
                        <button
                          type="button"
                          onClick={() => setChargeType("per_vehicle")}
                          className="w-full h-14 px-2 rounded-lg text-sm leading-tight text-center flex items-center justify-center"
                          style={seg(chargeType === "per_vehicle")}
                        >
                          Theo phương tiện
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#717182", fontWeight: 600 }}>
                        Hình thức
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFeeType("mandatory")}
                          className="w-full h-14 px-3 rounded-lg text-sm leading-tight text-center flex items-center justify-center"
                          style={seg(feeType === "mandatory")}
                        >
                          Bắt buộc
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeType("voluntary")}
                          className="w-full h-14 px-3 rounded-lg text-sm leading-tight text-center flex items-center justify-center"
                          style={seg(feeType === "voluntary")}
                        >
                          Đóng góp
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm mb-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                      Thu theo
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setScheduleType("cycle")} className="flex-1 px-3 py-3 rounded-lg text-sm" style={seg(scheduleType === "cycle")}>
                        Chu kì
                      </button>
                      <button type="button" onClick={() => setScheduleType("one_time")} className="flex-1 px-3 py-3 rounded-lg text-sm" style={seg(scheduleType === "one_time")}>
                        1 đợt duy nhất
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed" style={{ background: "#FFFFFF", border: "1px solid #E8E8F4", color: "#717182" }}>
                    {scheduleType === "cycle"
                      ? "Chu kì sẽ tự động tạo đợt thu: mỗi vòng lặp (ngày / tuần / tháng / năm) tương ứng một đợt."
                      : "Một lần thu theo thời hạn bạn chọn — hệ thống tạo một đợt thu duy nhất."}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  {scheduleType === "cycle" ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        <DatePickerField
                          label="Ngày bắt đầu (kỳ mẫu)"
                          valueIso={startDateIso}
                          onChangeIso={(next) => {
                            setStartDateIso(next);
                            setErrors({});
                          }}
                          error={errors.startDate}
                        />
                        <DatePickerField
                          label="Ngày kết thúc (kỳ mẫu)"
                          valueIso={endDateIso}
                          onChangeIso={(next) => {
                            setEndDateIso(next);
                            setErrors({});
                          }}
                          error={errors.endDate}
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-2" style={{ color: "#717182", fontWeight: 600 }}>
                          Vòng lặp (chu kì)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(["daily", "weekly", "monthly", "yearly"] as const).map((c) => (
                            <button key={c} type="button" onClick={() => setCycle(c)} className="px-2 py-2.5 rounded-lg text-sm" style={seg(cycle === c)}>
                              {cycleLabels[c]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed" style={{ background: "#FFFFFF", border: "1px solid #E8E8F4", color: "#717182" }}>
                        {cycle === "monthly"
                          ? "Ví dụ: bắt đầu 4/3 – kết thúc 4/4 là kỳ mẫu của tháng 3; đợt tiếp theo là tháng 4 (4/4–4/5), cứ mỗi tháng một đợt. Đợt kế tiếp được hệ thống tạo khi đến ngày bắt đầu đợt đó (ví dụ đến 4/4 mới có đợt tháng 4)."
                          : cycle === "weekly"
                            ? "Mỗi tuần một đợt (Tuần 1, Tuần 2, …). Đợt sau xuất hiện khi đến ngày bắt đầu tuần đó."
                            : cycle === "yearly"
                              ? "Mỗi năm một đợt: Đợt thu năm 2026, 2027, …"
                              : `Mỗi chu kì (${cycleLabels[cycle]}) tương ứng một đợt thu; đợt kế tiếp được tạo khi đến ngày bắt đầu kỳ đó.`}
                      </div>
                    </>
                  ) : (
                    <div>
                      <DatePickerField
                        label="Thời hạn"
                        valueIso={deadlineIso}
                        onChangeIso={(next) => {
                          setDeadlineIso(next);
                          setErrors({});
                        }}
                        error={errors.deadline}
                      />
                    </div>
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  {chargeType === "per_vehicle" ? (
                    <div className="space-y-3">
                      <p className="text-xs leading-relaxed" style={{ color: "#717182" }}>
                        Mỗi hộ phải nộp = tổng (số xe máy × mức xe máy) + (số ô tô × mức ô tô) + (số xe đạp × mức xe đạp), theo phương tiện đã đăng ký trong hồ sơ hộ.
                      </p>
                      <div>
                        <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                          Xe máy (VNĐ/xe)
                        </label>
                        <input
                          value={formatVndFromDigits(vMotoDigits)}
                          onChange={(e) => {
                            setVMotoDigits(digitsOnly(e.target.value));
                            setErrors({});
                          }}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className={inputBase}
                          style={inputStyle(!!errors.amount)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                          Ô tô (VNĐ/xe)
                        </label>
                        <input
                          value={formatVndFromDigits(vCarDigits)}
                          onChange={(e) => {
                            setVCarDigits(digitsOnly(e.target.value));
                            setErrors({});
                          }}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className={inputBase}
                          style={inputStyle(!!errors.amount)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                          Xe đạp (VNĐ/xe)
                        </label>
                        <input
                          value={formatVndFromDigits(vBikeDigits)}
                          onChange={(e) => {
                            setVBikeDigits(digitsOnly(e.target.value));
                            setErrors({});
                          }}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className={inputBase}
                          style={inputStyle(!!errors.amount)}
                        />
                      </div>
                      {errors.amount && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.amount}</p>}
                    </div>
                  ) : (
                    <>
                  <div>
                    <label className="block text-sm mb-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                      Số tiền
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAmountMode("fixed")} className="flex-1 px-3 py-3 rounded-lg text-sm" style={seg(amountMode === "fixed")}>
                        Cố Định
                      </button>
                      <button type="button" onClick={() => setAmountMode("custom")} className="flex-1 px-3 py-3 rounded-lg text-sm" style={seg(amountMode === "custom")}>
                        Không Cố Định
                      </button>
                    </div>
                  </div>

                  {amountMode === "fixed" ? (
                    <div>
                      <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                        Nhập số tiền (VNĐ) <span style={{ color: "#F44336" }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={formatVndFromDigits(amountDigits)}
                          onChange={(e) => {
                            setAmountDigits(digitsOnly(e.target.value));
                            setErrors({});
                          }}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className={`${inputBase} pr-14`}
                          style={inputStyle(!!errors.amount)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#717182" }}>
                          VNĐ
                        </span>
                      </div>
                      {errors.amount && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.amount}</p>}
                      <p className="text-xs mt-1" style={{ color: "#717182" }}>
                        {chargeType === "per_apartment" ? "Áp dụng theo căn hộ" : "Áp dụng theo từng nhân khẩu"}
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed" style={{ background: "#FFFFFF", border: "1px solid #E8E8F4", color: "#717182" }}>
                      Tùy tâm: kỳ vọng thu = 0; theo dõi qua giao dịch thanh toán thực tế.
                    </div>
                  )}
                    </>
                  )}

                  <div>
                    <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                      Ghi chú
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Nhập ghi chú (tuỳ chọn)..."
                      className={`${inputBase} resize-none min-h-[88px]`}
                      style={inputStyle(false)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 px-5 py-4 border-t shrink-0" style={{ borderColor: "#EEF0F8", background: "#FAFBFF" }}>
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="px-5 py-2.5 border rounded-lg text-sm disabled:opacity-50 transition-opacity"
            style={{ borderColor: "#D8D8E8", borderRadius: 8, color: "#1A1A2E", fontWeight: 600, background: "#fff" }}
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => goNext()}
            className="px-7 py-2.5 text-white rounded-lg text-sm shadow-md transition-opacity hover:opacity-95"
            style={{ background: "#6F6AF8", borderRadius: 8, fontWeight: 700 }}
          >
            {step === 4 ? "Tạo khoản thu" : "Tiếp theo"}
          </button>
        </div>
      </div>
    </div>
  );
}
