import { useEffect, useMemo, useState } from "react";
import { Download, Printer, ChevronDown, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { toast } from "sonner";
import type { FeeItem, Payment, Household } from "../types";
import { fetchHouseholds } from "../api";

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
    amountPerUnit > 0 && liableUnits > 0 ? amountPerUnit * liableUnits : 0;

  const collectedForSelectedFee = filteredPayments
    .filter((p) => !selectedFeeObj || p.feeId === selectedFeeObj.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const completionRate =
    expectedTotal > 0 ? Math.min(100, Math.round((collectedForSelectedFee / expectedTotal) * 100)) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Thống kê các khoản thu</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
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
          <input
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
          />
          <span className="text-sm" style={{ color: "#717182" }}>—</span>
          <input
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
          />
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="text-sm" style={{ color: "#717182" }}>Số giao dịch đã thu</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#1A1A2E" }}>{filteredPayments.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="text-sm" style={{ color: "#717182" }}>Tổng tiền đã thu</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#4CAF50" }}>{totalCollectedFormatted} VNĐ</div>
          </div>
          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <div className="text-sm" style={{ color: "#717182" }}>Tỉ lệ hoàn thành</div>
            <div className="text-2xl mt-1" style={{ fontWeight: 700, color: "#6F6AF8" }}>{completionRate}%</div>
          </div>
        </div>

        {/* Table - dữ liệu từ payments */}
        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
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
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#F2F2FD" }}>
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
            onClick={() => toast.success("Xuất file Excel thành công", { description: `${selectedFee}_thong_ke.xlsx` })}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-md text-sm" style={{ background: "#4CAF50", borderRadius: 6, fontWeight: 500 }}
          >
            <Download size={16} /> Xuất Excel
          </button>
          <button
            onClick={() => toast.info("Đang chuẩn bị in báo cáo...")}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-md text-sm" style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
          >
            <Printer size={16} style={{ color: "#6F6AF8" }} /> In báo cáo
          </button>
        </div>

        {/* Recent Payments from system state */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
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
