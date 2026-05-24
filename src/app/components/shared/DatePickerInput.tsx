import { useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  placeholder = "Chọn ngày",
  disabled,
  className,
  buttonClassName,
  icon = true,
}: {
  label?: string;
  value: string;
  onChange: (nextIso: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  icon?: boolean;
}) {
  const selected = useMemo(() => (value ? isoToDate(value) : null), [value]);
  const display = selected ? format(selected, "dd/MM/yyyy", { locale: vi }) : placeholder;

  return (
    <div className={className}>
      {label ? (
        <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
          {label}
        </label>
      ) : null}

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`w-full min-h-[44px] px-3 border rounded-md text-left flex items-center justify-between gap-3 transition-colors disabled:opacity-60 ${buttonClassName ?? ""}`}
            style={{
              borderColor: error ? "#F44336" : "#CFCFEF",
              borderRadius: 6,
              background: "#fff",
              color: selected ? "#1A1A2E" : "#9B9BB0",
            }}
          >
            <span className="text-sm" style={{ fontWeight: selected ? 600 : 500 }}>
              {display}
            </span>
            {icon ? <CalendarIcon size={16} style={{ color: "#717182" }} /> : null}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 z-[90]" align="start">
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            onSelect={(d) => {
              if (!d) return;
              onChange(dateToIso(d));
            }}
            locale={vi}
          />
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="text-xs mt-1" style={{ color: "#F44336" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

