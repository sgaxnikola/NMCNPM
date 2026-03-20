import { useState, useEffect, useMemo } from "react";
import { Building2, Users, Wallet, TrendingUp, Bell, Plus, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { FeeItem, Payment, Resident, Household } from "../types";
import { fetchHouseholds, fetchResidents, fetchPopulationEvents } from "../api";
import { getMaintenanceCount } from "./ApartmentScreen";

/** Tổng số căn trong tòa (30 tầng × 10 căn/tầng, khớp với ApartmentScreen) */
const TOTAL_APARTMENTS = 30 * 10;

interface DashboardProps {
  fees: FeeItem[];
  payments: Payment[];
  canManageFees: boolean;
  onCreateFee: () => void;
  onCollectPayment: () => void;
  onNavigate: (page: string) => void;
}

const emptyChartData: { label: string; amount: number }[] = [];
const FEE_COLORS = ["#6F6AF8", "#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#00BCD4"];
const filterTabs: Array<"Hôm nay" | "Tuần này" | "Tháng này"> = ["Hôm nay", "Tuần này", "Tháng này"];

type PopulationEventType = "in" | "out";

interface PopulationEvent {
  type: PopulationEventType;
  name: string;
  apartment: string;
  date: string;
  reason?: string;
}

export function DashboardScreen({ fees, payments, canManageFees, onCreateFee, onCollectPayment, onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"Hôm nay" | "Tuần này" | "Tháng này">("Tháng này");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [populationChanges, setPopulationChanges] = useState<PopulationEvent[]>([]);

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
      .catch(() => setHouseholds([]));

    fetchResidents()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Resident[] = data.map((r: any) => ({
          id: r.id ?? 0,
          householdId: r.householdId ?? r.maHo ?? null,
          fullName: r.fullName ?? r.hoTen ?? "",
          dob: r.dob ?? r.ngaySinh ?? null,
          gender: r.gender ?? r.gioiTinh ?? null,
          cccd: r.cccd ?? r.cccdCmnd ?? null,
          relationToHead: r.relationToHead ?? r.quanHeVoiChuHo ?? null,
          phone: r.phone ?? r.soDienThoai ?? null,
          email: r.email ?? null,
          vehicleInfo: r.vehicleInfo ?? r.phuongTienBienSo ?? null,
        }));
        setResidents(mapped);
      })
      .catch(() => setResidents([]));

    fetchPopulationEvents()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: PopulationEvent[] = data.map((e: any) => ({
          type: e.type as PopulationEventType,
          name: e.name ?? "",
          apartment: e.apartment ?? "",
          date: e.date ?? "",
          reason: e.reason ?? undefined,
        }));
        const sorted = mapped
          .filter((e) => e.date)
          .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
          .slice(0, 6);
        setPopulationChanges(sorted);
      })
      .catch(() => setPopulationChanges([]));
  }, []);

  const totalResidents = residents.length;
  const householdCount = households.length;

  // Map tỉ lệ hoàn thành + tình trạng hạn nộp cho từng khoản thu
  const feeCompletionInfo = useMemo(() => {
    const map = new Map<
      number,
      { pct: number; isDeadlinePassed: boolean; type: FeeItem["type"] }
    >();

    if (!fees.length || !householdCount) return map;

    const today = new Date();
    today.setSeconds(0, 0);

    for (const fee of fees) {
      const amount = Number(fee.amount || "0");
      let pct = 0;
      if (amount && amount > 0) {
        const units =
          fee.chargeType === "per_resident" ? totalResidents : householdCount;
        if (units) {
          const expected = amount * units;
          const collected = payments
            .filter((p) => p.feeId === fee.id)
            .reduce((sum, p) => sum + p.amount, 0);
          pct =
            expected > 0
              ? Math.max(0, Math.min(100, Math.round((collected / expected) * 100)))
              : 0;
        }
      }

      let isDeadlinePassed = false;
      if (fee.deadline) {
        const d = new Date(fee.deadline);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          isDeadlinePassed = d.getTime() < today.getTime();
        }
      }

      map.set(fee.id, { pct, isDeadlinePassed, type: fee.type });
    }

    return map;
  }, [fees, payments, householdCount, totalResidents]);

  // Dữ liệu tỉ lệ hoàn thành top 5 khoản thu (dùng cho nhiều hình tròn nhỏ)
  const topFeeCompletionData = useMemo(() => {
    if (!fees.length) return [];

    const all = fees.map((fee) => {
      const info = feeCompletionInfo.get(fee.id);
      return {
        id: fee.id,
        name: fee.name,
        value: info?.pct ?? 0,
        type: fee.type,
      };
    });

    // Ưu tiên khoản bắt buộc, sau đó theo tỉ lệ hoàn thành giảm dần
    const sorted = all
      .sort((a, b) => {
        if (a.type === "mandatory" && b.type !== "mandatory") return -1;
        if (a.type !== "mandatory" && b.type === "mandatory") return 1;
        return b.value - a.value;
      });

    return sorted.slice(0, 5);
  }, [fees, feeCompletionInfo]);

  const occupiedApartments = householdCount;
  const maintenanceApartments = getMaintenanceCount();
  const emptyApartments = Math.max(0, TOTAL_APARTMENTS - occupiedApartments);
  const occupancyRate = TOTAL_APARTMENTS > 0 ? Math.round((occupiedApartments / TOTAL_APARTMENTS) * 100) : 0;

  // Tính tỉ lệ thu chung dựa trên tất cả khoản thu
  const { overallRate } = useMemo(() => {
    if (!fees.length || !householdCount) {
      return { overallRate: 0 };
    }

    let expectedTotal = 0;
    let collectedTotal = 0;

    for (const fee of fees) {
      const amount = Number(fee.amount || "0");
      if (!amount || amount <= 0) continue;

      const units =
        fee.chargeType === "per_resident"
          ? totalResidents
          : householdCount;

      if (!units) continue;

      const expected = amount * units;
      const collected = payments
        .filter((p) => p.feeId === fee.id)
        .reduce((sum, p) => sum + p.amount, 0);

      expectedTotal += expected;
      collectedTotal += collected;
    }

    const rate =
      expectedTotal > 0
        ? Math.min(100, Math.round((collectedTotal / expectedTotal) * 100))
        : 0;

    return { overallRate: rate };
  }, [fees, payments, householdCount, totalResidents]);

  const stats = [
    { label: "Tổng căn hộ", value: TOTAL_APARTMENTS.toString(), icon: Building2, color: "#6F6AF8", link: "apartments" as const, subInfo: { occupancyRate, occupied: occupiedApartments, empty: emptyApartments, maintenance: maintenanceApartments } },
    { label: "Tổng cư dân", value: totalResidents.toString(), icon: Users, color: "#7874F9", link: "residents" as const },
    { label: "Khoản thu", value: fees.length.toString(), icon: Wallet, color: "#4CAF50", link: "fees" as const },
    { label: "Tỉ lệ thu", value: `${overallRate}%`, icon: TrendingUp, color: "#FF9800", link: "statistics" as const },
  ];

  const recentFees = fees.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Trang chủ</h1>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} style={{ color: "#1A1A2E" }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#F44336" }} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ background: "#6F6AF8", fontWeight: 600 }}>
            NV
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-6 pt-4">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-sm transition-all"
            style={{
              background: activeTab === tab ? "#6F6AF8" : "#fff",
              color: activeTab === tab ? "#fff" : "#1A1A2E",
              border: `1px solid ${activeTab === tab ? "#6F6AF8" : "#CFCFEF"}`,
              fontWeight: activeTab === tab ? 600 : 400,
              borderRadius: 20,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const subInfo = "subInfo" in stat ? stat.subInfo : null;
            return (
              <div key={stat.label} className="bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <button onClick={() => onNavigate(stat.link)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#6F6AF8" }}>
                    Xem chi tiết <ArrowRight size={12} />
                  </button>
                </div>
                <div className="text-2xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>{stat.value}</div>
                <div className="text-sm" style={{ color: "#717182" }}>{stat.label}</div>
                {subInfo != null && (
                  <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: "#F2F2FD" }}>
                    <div className="text-[11px]" style={{ color: "#717182" }}>Tỉ lệ lấp đầy: <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{subInfo.occupancyRate}%</span></div>
                    <div className="text-[11px]" style={{ color: "#717182" }}>Số căn ở: <span style={{ color: "#4CAF50", fontWeight: 500 }}>{subInfo.occupied}</span></div>
                    <div className="text-[11px]" style={{ color: "#717182" }}>Số căn trống: <span style={{ color: "#FF9800", fontWeight: 500 }}>{subInfo.empty}</span></div>
                    <div className="text-[11px]" style={{ color: "#717182" }}>Căn bảo trì: <span style={{ color: "#F44336", fontWeight: 500 }}>{subInfo.maintenance}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Nhiều hình tròn nhỏ - mỗi khoản thu là 1 vòng tròn, tối đa 5, ưu tiên khoản bắt buộc */}
          <div className="col-span-3 bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <h3 className="mb-4" style={{ fontWeight: 600, color: "#1A1A2E" }}>Tỉ lệ hoàn thành các khoản thu</h3>
            {topFeeCompletionData.length === 0 ? (
              <p className="text-sm" style={{ color: "#717182" }}>
                Chưa có đủ dữ liệu để tính tỉ lệ hoàn thành (cần có khoản thu và thu phí tương ứng).
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {topFeeCompletionData.map((item, index) => (
                  <div key={item.id} className="flex flex-col items-center justify-center gap-2">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Hoàn thành", value: item.value },
                            { name: "Chưa hoàn thành", value: Math.max(0, 100 - item.value) },
                          ]}
                          innerRadius={28}
                          outerRadius={40}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <Cell fill={FEE_COLORS[index % FEE_COLORS.length]} />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                        <Tooltip formatter={(value: any, name: any) => [`${value}%`, name as string]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center px-1">
                      <div className="text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                        {item.name}
                      </div>
                      <div className="text-[11px]" style={{ color: "#717182" }}>
                        Hoàn thành {item.value}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Population Changes */}
          <div className="col-span-2 bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <h3 className="mb-4" style={{ fontWeight: 600, color: "#1A1A2E" }}>Biến động dân cư</h3>
            {populationChanges.length === 0 ? (
              <p className="text-sm" style={{ color: "#717182" }}>
                Chưa có dữ liệu biến động. Khi thêm/cập nhật hộ khẩu và nhân khẩu, các thay đổi gần đây sẽ hiển thị tại đây.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto pr-1">
                {populationChanges.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#F2F2FD" }}>
                    <div>
                      <div className="text-sm" style={{ fontWeight: 500, color: "#1A1A2E" }}>{item.name}</div>
                      <div className="text-xs" style={{ color: "#717182" }}>
                        {item.apartment} ·{" "}
                        {item.date
                          ? new Date(item.date).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: item.type === "in" ? "#4CAF5015" : "#F4433615",
                          color: item.type === "in" ? "#4CAF50" : "#F44336",
                          fontWeight: 500,
                        }}
                      >
                        {item.type === "in" ? "Chuyển đến" : "Chuyển đi"}
                      </span>
                      {item.reason && (
                        <span className="text-[11px]" style={{ color: "#717182", maxWidth: 180, textAlign: "right" }}>
                          {item.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Recent Fees */}
          <div className="col-span-3 bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <h3 className="mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>Khoản thu gần đây</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm" style={{ color: "#717182" }}>
                  <th className="pb-2" style={{ fontWeight: 500 }}>Tên khoản thu</th>
                  <th className="pb-2" style={{ fontWeight: 500 }}>Số tiền (VNĐ)</th>
                  <th className="pb-2" style={{ fontWeight: 500 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentFees.map((fee) => (
                  <tr key={fee.id} className="text-sm border-t" style={{ borderColor: "#F2F2FD" }}>
                    <td className="py-2" style={{ color: "#1A1A2E" }}>{fee.name}</td>
                    <td className="py-2" style={{ color: "#1A1A2E" }}>{fee.amount} {fee.unit}</td>
                    <td className="py-2">
                      {(() => {
                        const info = feeCompletionInfo.get(fee.id);
                        const pct = info?.pct ?? 0;
                        const isDeadlinePassed = info?.isDeadlinePassed ?? false;
                        let label = "Đang thu";
                        let bg = "#6F6AF815";
                        let color = "#6F6AF8";

                        if (fee.type === "mandatory") {
                          if (pct >= 100) {
                            label = "Hoàn thành";
                            bg = "#4CAF5015";
                            color = "#4CAF50";
                          } else if (isDeadlinePassed) {
                            label = "Quá hạn";
                            bg = "#F4433615";
                            color = "#F44336";
                          }
                        } else {
                          // Tự nguyện: không bắt buộc 100%, chỉ phân biệt còn hạn / đã kết thúc
                          if (isDeadlinePassed) {
                            label = "Kết thúc vận động";
                            bg = "#FF980015";
                            color = "#FF9800";
                          } else {
                            label = "Đang vận động";
                          }
                        }

                        return (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: bg,
                          color,
                          fontWeight: 500,
                        }}
                      >
                        {label}
                      </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div className="col-span-2 bg-white rounded-lg p-4 border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <h3 className="mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>Thao tác nhanh</h3>
            <div className="space-y-3">
              <button
                onClick={onCreateFee}
                disabled={!canManageFees}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#6F6AF8", borderRadius: 6 }}
              >
                <Plus size={18} /> <span style={{ fontWeight: 500 }}>Tạo khoản thu</span>
              </button>
              <button
                onClick={onCollectPayment}
                disabled={!canManageFees}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#4CAF50", borderRadius: 6 }}
              >
                <Wallet size={18} /> <span style={{ fontWeight: 500 }}>Thu phí</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all hover:bg-gray-50"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              >
                <Bell size={18} style={{ color: "#6F6AF8" }} />{" "}
                <span style={{ fontWeight: 500 }}>Tạo thông báo (Email / SMS)</span>
              </button>
              {!canManageFees && (
                <p className="text-xs mt-1" style={{ color: "#717182" }}>
                  Chỉ tài khoản <span style={{ fontWeight: 600 }}>Kế toán</span> mới được tạo khoản thu và thu phí.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}