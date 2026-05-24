import { useEffect, useMemo, useState } from "react";
import { Download, Printer, ChevronDown, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { toast } from "sonner";
import type { FeeItem, Payment, Household } from "../types";
import { fetchHouseholds, fetchReportSummary } from "../api";
import ExcelJS from "exceljs";
import { DatePickerInput } from "./shared/DatePickerInput";

interface StatisticsScreenProps {
  fees: FeeItem[];
  payments: Payment[];
}

export function StatisticsScreen({ fees, payments }: StatisticsScreenProps) {
  const feeNames = fees.map((f) => f.name);
  const [selectedFee, setSelectedFee] = useState(feeNames[0] ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDateInput, setStartDateInput] = useState("2026-03-01");
  const [endDateInput, setEndDateInput] = useState("2026-03-31");

  // Các giá trị filter thực sự đang áp dụng sau khi bấm "Lọc"
  const [filterFeeName, setFilterFeeName] = useState<string | null>(feeNames[0] ?? null);
  const [filterStartDate, setFilterStartDate] = useState<string | null>("2026-03-01");
  const [filterEndDate, setFilterEndDate] = useState<string | null>("2026-03-31");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchReportSummary>> | null>(null);

  useEffect(() => {
    fetchReportSummary()
      .then(setReport)
      .catch(() => setReport(null));
  }, []);

  useEffect(() => {
    // Nếu danh sách khoản thu thay đổi, đảm bảo chọn được khoản đầu tiên
    if (!selectedFee && feeNames.length > 0) {
      setSelectedFee(feeNames[0]);
      setFilterFeeName(feeNames[0]);
    }

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

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterFeeName && p.feeName !== filterFeeName) return false;
      if (filterStartDate && p.date && p.date < filterStartDate) return false;
      if (filterEndDate && p.date && p.date > filterEndDate) return false;
      return true;
    });
  }, [payments, filterFeeName, filterStartDate, filterEndDate]);

  const totalPaid = filteredPayments.length;
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollectedFormatted = totalCollected.toLocaleString("vi-VN");

  const selectedFeeObj =
    fees.find((f) => f.name === (filterFeeName || selectedFee)) ?? fees[0];
  const amountPerUnit = selectedFeeObj ? Number(selectedFeeObj.amount || "0") : 0;

  const totalMembers = households.reduce((sum, h) => sum + (h.members ?? 0), 0);
  const liableUnits =
    selectedFeeObj?.chargeType === "per_resident"
      ? totalMembers
      : households.length;

  const expectedTotal =
    selectedFeeObj?.chargeType === "per_vehicle"
      ? 0
      : amountPerUnit > 0 && liableUnits > 0
        ? amountPerUnit * liableUnits
        : 0;

  const collectedForSelectedFee = filteredPayments
    .filter((p) => !selectedFeeObj || p.feeId === selectedFeeObj.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const completionRate =
    expectedTotal > 0 ? Math.min(100, Math.round((collectedForSelectedFee / expectedTotal) * 100)) : 0;

  const exportRows = useMemo(() => {
    const householdById = new Map<number, Household>();
    for (const h of households) householdById.set(h.id, h);

    return filteredPayments.map((p, idx) => {
      const hh = p.householdId != null ? householdById.get(p.householdId) : undefined;
      return {
        "STT": idx + 1,
        "Hộ gia đình": hh?.address ?? p.householdId ?? "",
        "Chủ hộ": (hh?.headName ?? p.householdHead ?? "") || "",
        "Khoản thu": p.feeName ?? "",
        "Số tiền đã nộp": p.amount ?? 0,
        "Trạng thái": "Đã thanh toán",
        "Ngày nộp": p.date ?? "",
      };
    });
  }, [filteredPayments, households]);

  const buildSafeReportName = () =>
    (filterFeeName || selectedFee || "thong_ke").replace(/[\\/:*?\"<>|]/g, "_");

  const handleExportCsv = () => {
    if (exportRows.length === 0) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }
    const headers = Object.keys(exportRows[0]);
    const escapeCsv = (v: unknown) => {
      const s = String(v ?? "");
      // Escape quotes and wrap if contains comma/newline/quote
      const escaped = s.replace(/\"/g, "\"\"");
      return /[\",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };
    const lines = [
      headers.join(","),
      ...exportRows.map((row) => headers.map((h) => escapeCsv((row as any)[h])).join(",")),
    ];
    // Add UTF-8 BOM so Excel opens Vietnamese correctly
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildSafeReportName()}_thong_ke.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Xuất file thành công", { description: a.download });
  };

  const handleExportExcel = async () => {
    if (exportRows.length === 0) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "BlueMoon";
      wb.created = new Date();
      const ws = wb.addWorksheet("ThongKe");

      const headers = Object.keys(exportRows[0]);
      ws.addRow(headers);
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).alignment = { vertical: "middle" };

      for (const r of exportRows) {
        ws.addRow(headers.map((h) => (r as any)[h]));
      }

      // Basic column sizing
      ws.columns = headers.map((h, idx) => {
        const maxLen = Math.max(
          h.length,
          ...exportRows.slice(0, 200).map((r) => String((r as any)[headers[idx]] ?? "").length)
        );
        return { width: Math.min(40, Math.max(10, Math.ceil(maxLen * 1.1))) };
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${buildSafeReportName()}_thong_ke.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Xuất Excel thành công", { description: a.download });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xuất Excel thất bại";
      toast.error("Xuất Excel thất bại", { description: msg });
    }
  };

  const handlePrint = () => {
    if (exportRows.length === 0) {
      toast.info("Không có dữ liệu để in");
      return;
    }
    const title = `Báo cáo thống kê - ${filterFeeName || selectedFee || "Khoản thu"}`;
    const meta = `Từ ${filterStartDate ?? "—"} đến ${filterEndDate ?? "—"}`;
    const headers = Object.keys(exportRows[0]);
    const html = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
      h1 { font-size: 18px; margin: 0 0 6px 0; }
      .meta { font-size: 12px; margin-bottom: 16px; color: #444; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5ff; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="meta">${meta} • Tổng tiền: ${totalCollectedFormatted} VNĐ • Tỉ lệ hoàn thành: ${completionRate}%</div>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${exportRows.map((r) => `<tr>${headers.map((h) => `<td>${String((r as any)[h] ?? "")}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  </body>
</html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      toast.error("Không mở được cửa sổ in (bị chặn pop-up)");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Some browsers don't reliably trigger `onload` for about:blank + document.write.
    // Trigger print from the opener side after a short delay.
    try {
      w.focus();
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 250);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E4F0] bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Thống kê các khoản thu</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {report && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bm-card p-4">
                <div className="text-sm" style={{ color: "#717182" }}>Tổng số hộ</div>
                <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                  {report.totalHouseholds}
                </div>
              </div>
              <div className="bm-card p-4">
                <div className="text-sm" style={{ color: "#717182" }}>Tổng nhân khẩu</div>
                <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                  {report.totalResidents}
                </div>
              </div>
              <div className="bm-card p-4">
                <div className="text-sm" style={{ color: "#717182" }}>Tổng tiền đã thu</div>
                <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#4CAF50" }}>
                  {Math.round(report.totalCollected).toLocaleString("vi-VN")} VNĐ
                </div>
              </div>
              <div className="bm-card p-4">
                <div className="text-sm" style={{ color: "#717182" }}>Tổng tiền chưa thu</div>
                <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#F44336" }}>
                  {Math.round(report.totalUncollected).toLocaleString("vi-VN")} VNĐ
                </div>
              </div>
            </div>
            {(report.unpaidHouseholds?.length ?? 0) > 0 && (
              <div className="bm-card p-4">
                <div className="text-sm mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                  Hộ chưa đóng phí ({report.unpaidHouseholds.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: "#717182" }}>
                        <th className="text-left py-2">Căn hộ</th>
                        <th className="text-left py-2">Chủ hộ</th>
                        <th className="text-left py-2">Khoản thu</th>
                        <th className="text-right py-2">Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.unpaidHouseholds.slice(0, 50).map((u, i) => (
                        <tr key={`${u.householdId}-${u.feeId}-${i}`} className="border-t" style={{ borderColor: "#F0F0FA" }}>
                          <td className="py-2">{u.address}</td>
                          <td className="py-2">{u.headName || "—"}</td>
                          <td className="py-2">{u.feeName}</td>
                          <td className="py-2 text-right tabular-nums">
                            {Math.round(u.remainingAmount).toLocaleString("vi-VN")} VNĐ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Filter Bar */}
        <div className="bm-card p-4 flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 border rounded-md min-w-[220px] text-left"
              style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
            >
              <span className="text-sm" style={{ color: "#1A1A2E" }}>{selectedFee || "Chọn khoản thu"}</span>
              <ChevronDown size={14} style={{ color: "#6F6AF8" }} className="ml-auto" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg" style={{ borderColor: "#CFCFEF", borderRadius: 6 }}>
                {feeNames.length === 0 ? (
                  <div className="px-3 py-2 text-sm" style={{ color: "#717182" }}>Chưa có khoản thu</div>
                ) : (
                  feeNames.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setSelectedFee(f);
                        setFilterFeeName(f);
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      style={{ color: "#1A1A2E" }}
                    >
                      {f}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="min-w-[160px]">
            <DatePickerInput
              value={startDateInput}
              onChange={setStartDateInput}
              placeholder="Từ ngày"
              icon={false}
              buttonClassName="px-3 py-2"
            />
          </div>
          <span className="text-sm" style={{ color: "#717182" }}>—</span>
          <div className="min-w-[160px]">
            <DatePickerInput
              value={endDateInput}
              onChange={setEndDateInput}
              placeholder="Đến ngày"
              icon={false}
              buttonClassName="px-3 py-2"
            />
          </div>
          <button
            className="px-4 py-2 text-white rounded-md text-sm"
            style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
            onClick={() => {
              setFilterFeeName(selectedFee || null);
              setFilterStartDate(startDateInput || null);
              setFilterEndDate(endDateInput || null);
            }}
          >
            Lọc
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bm-card bm-card-hover p-4">
            <div className="text-sm" style={{ color: "#717182" }}>Số giao dịch đã thu</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>{filteredPayments.length}</div>
          </div>
          <div className="bm-card bm-card-hover p-4">
            <div className="text-sm" style={{ color: "#717182" }}>Tổng tiền đã thu</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#4CAF50" }}>{totalCollectedFormatted} VNĐ</div>
          </div>
          <div className="bm-card bm-card-hover p-4">
            <div className="text-sm" style={{ color: "#717182" }}>Tỉ lệ hoàn thành</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#6F6AF8" }}>{completionRate}%</div>
          </div>
        </div>

        {/* Table - dữ liệu từ payments */}
        <div className="bm-table">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F2F2FD" }}>
                {["STT", "Hộ gia đình", "Chủ hộ", "Khoản thu", "Số tiền đã nộp", "Trạng thái", "Ngày nộp"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "#717182" }}>Chưa có giao dịch thu phí nào. Thu phí sẽ hiển thị tại đây.</td>
                </tr>
              ) : (
                filteredPayments.map((row, i) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: "#F2F2FD", background: i % 2 === 1 ? "#FAFAFF" : "#fff" }}>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>{i + 1}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>{row.householdId}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>{row.householdHead}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>{row.feeName}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>{row.amount.toLocaleString("vi-VN")} VNĐ</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "#4CAF5015", color: "#4CAF50", fontWeight: 500 }}
                      >
                        Đã thanh toán
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#717182" }}>{row.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredPayments.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#EEF0FB" }}>
              <span className="text-sm" style={{ color: "#717182" }}>Hiển thị {filteredPayments.length} kết quả</span>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft size={16} style={{ color: "#717182" }} /></button>
                <button type="button" className="w-8 h-8 rounded text-sm text-white" style={{ background: "#6F6AF8", fontWeight: 500 }}>1</button>
                <button type="button" className="p-1.5 rounded hover:bg-gray-100"><ChevronRight size={16} style={{ color: "#717182" }} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-md text-sm" style={{ background: "#4CAF50", borderRadius: 6, fontWeight: 500 }}
          >
            <Download size={16} /> Xuất Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-md text-sm" style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
          >
            <Printer size={16} style={{ color: "#6F6AF8" }} /> In báo cáo
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
          >
            <Download size={16} style={{ color: "#4CAF50" }} /> Xuất CSV
          </button>
        </div>

        {/* Recent Payments from system state */}
        <div className="bm-card bm-card-hover p-4">
          <h2 className="text-sm mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>Giao dịch thu phí gần đây</h2>
          {filteredPayments.length === 0 ? (
            <p className="text-sm" style={{ color: "#717182" }}>Chưa có giao dịch nào được ghi nhận trong hệ thống.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F2F2FD" }}>
                  {["STT", "Khoản thu", "Hộ gia đình", "Số tiền", "Ngày nộp"].map((h) => (
                    <th key={h} className="text-left px-3 py-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.slice(-10).reverse().map((p, index) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "#F2F2FD", background: index % 2 === 1 ? "#FAFAFF" : "#fff" }}>
                    <td className="px-3 py-2" style={{ color: "#717182" }}>{index + 1}</td>
                    <td className="px-3 py-2" style={{ color: "#1A1A2E", fontWeight: 500 }}>{p.feeName}</td>
                    <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{p.householdId} - {p.householdHead}</td>
                    <td className="px-3 py-2" style={{ color: "#1A1A2E" }}>{p.amount.toLocaleString("vi-VN")} VNĐ</td>
                    <td className="px-3 py-2" style={{ color: "#717182" }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
