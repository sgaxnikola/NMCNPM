import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Home, Layers, X, Users, Phone, Mail, Building2, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { Household, Resident } from "../types";
import { createHousehold, createResident, fetchHouseholds, fetchResidents, createPopulationEvent } from "../api";

const APARTMENT_MAINTENANCE_STORAGE_KEY = "bluemoon_apartment_maintenance";
const APARTMENT_BUSINESS_STORAGE_KEY = "bluemoon_apartment_business";

type ApartmentStatus = "occupied" | "empty";
type ApartmentUsage = "residential" | "commercial";

type MaintenanceMap = Record<string, { on: boolean; note: string }>;

type BusinessInfo = {
  name: string;
  taxCode: string;
  type: string;
  goods: string;
  phone: string;
  email: string;
  website: string;
};

interface ApartmentUnit {
  id: string;
  number: string;
  area: number;
  status: ApartmentStatus;
  usage: ApartmentUsage;
  owner?: string;
  members?: number;
  phone?: string;
  email?: string;
  business?: BusinessInfo;
}

function getMaintenanceMapFromStorage(): MaintenanceMap {
  try {
    const raw = localStorage.getItem(APARTMENT_MAINTENANCE_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

function getBusinessMapFromStorage(): Record<string, BusinessInfo> {
  try {
    const raw = localStorage.getItem(APARTMENT_BUSINESS_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

export function getMaintenanceCount(): number {
  const map = getMaintenanceMapFromStorage();
  return Object.values(map).filter((v) => v?.on === true).length;
}

function normalizeAddress(addr: string | null | undefined): string {
  return (addr ?? "").trim().toLowerCase().replace(/^căn\s+/, "").replace(/\s+/g, "");
}

function generateFloorApartments(floor: number): ApartmentUnit[] {
  const block = "A";
  const units: ApartmentUnit[] = [];
  const areas = [55, 68, 75, 85, 92, 105, 48, 62, 72, 80];

  for (let room = 1; room <= 10; room++) {
    const roomStr = room.toString().padStart(2, "0");
    const floorStr = floor.toString().padStart(2, "0");
    const id = `${block}-${floorStr}${roomStr}`;
    const isCommercial = floor >= 1 && floor <= 4;
    units.push({
      id,
      number: id,
      area: areas[(floor + room) % areas.length],
      status: "empty",
      usage: isCommercial ? "commercial" : "residential",
    });
  }
  return units;
}

const statusConfig: Record<ApartmentStatus, { bg: string; color: string; label: string }> = {
  occupied: { bg: "#4CAF5018", color: "#4CAF50", label: "Đang ở" },
  empty: { bg: "#FF980018", color: "#FF9800", label: "Chưa có người ở" },
};

export function ApartmentScreen() {
  const [selectedFloor, setSelectedFloor] = useState(12);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentUnit | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApartmentStatus | "all">("all");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [maintenanceMap, setMaintenanceMap] = useState<MaintenanceMap>(() => getMaintenanceMapFromStorage());
  const [businessMap, setBusinessMap] = useState<Record<string, BusinessInfo>>(() => getBusinessMapFromStorage());

  // Form thêm hộ khẩu nhanh
  const [showAddHousehold, setShowAddHousehold] = useState(false);
  const [hFullName, setHFullName] = useState("");
  const [hDob, setHDob] = useState("");
  const [hGender, setHGender] = useState("Nam");
  const [hCccd, setHCccd] = useState("");
  const [hPhone, setHPhone] = useState("");
  const [hEmail, setHEmail] = useState("");
  const [hVehicleInfo, setHVehicleInfo] = useState("");

  const appendPopulationEvent = useCallback(
    async (event: { name: string; apartment: string; type: "in" | "out"; reason?: string }) => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        await createPopulationEvent({
          type: event.type,
          name: event.name,
          apartment: event.apartment,
          date: today,
          reason: event.reason,
        });
      } catch {
        // lỗi ghi log không chặn luồng chính
      }
    },
    []
  );

  const reloadData = useCallback(async () => {
    try {
      const hh = await fetchHouseholds();
      setHouseholds(Array.isArray(hh) ? hh : []);
    } catch (e: any) {
      toast.error("Không tải được danh sách hộ khẩu", { description: e?.message });
      setHouseholds([]);
    }
    try {
      const rs = await fetchResidents();
      setResidents(Array.isArray(rs) ? rs : []);
    } catch {
      setResidents([]);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const addressToHousehold = useMemo(() => {
    const map = new Map<string, Household>();
    for (const h of households) {
      const key = normalizeAddress(h.address);
      if (key) map.set(key, h);
    }
    return map;
  }, [households]);

  const headByHouseholdId = useMemo(() => {
    const map = new Map<number, Resident>();
    for (const r of residents) {
      if (r.relationToHead && r.relationToHead.trim().toLowerCase() === "chủ hộ" && r.householdId != null) {
        map.set(r.householdId, r);
      }
    }
    return map;
  }, [residents]);

  const baseApartments = useMemo(() => generateFloorApartments(selectedFloor), [selectedFloor]);
  const apartments = useMemo<ApartmentUnit[]>(() => {
    return baseApartments.map((apt) => {
      const key = normalizeAddress(apt.number);
      const h = addressToHousehold.get(key);
      const business = businessMap[apt.id];

      // Cửa hàng / shophouse lấy info doanh nghiệp
      if (apt.usage === "commercial") {
        return {
          ...apt,
          status: business ? "occupied" : "empty",
          business,
        };
      }

      // Căn hộ ở
      if (!h) return { ...apt };
      const head = headByHouseholdId.get(h.id);
      return {
        ...apt,
        status: "occupied",
        owner: h.headName ?? head?.fullName ?? "—",
        members: h.members ?? 0,
        phone: head?.phone ?? undefined,
        email: head?.email ?? undefined,
      };
    });
  }, [baseApartments, addressToHousehold, headByHouseholdId, businessMap]);

  const filtered = apartments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const occupiedCount = apartments.filter((a) => a.status === "occupied" && a.usage === "residential").length;
  const emptyCount = apartments.filter((a) => a.status === "empty" && a.usage === "residential").length;
  const maintenanceCount = Object.values(maintenanceMap).filter((v) => v.on).length;

  const setMaintenance = useCallback((apartmentId: string, on: boolean, note: string) => {
    setMaintenanceMap((prev) => {
      const next = { ...prev };
      if (on) {
        next[apartmentId] = { on: true, note: note.trim() || "" };
      } else {
        delete next[apartmentId];
      }
      try {
        localStorage.setItem(APARTMENT_MAINTENANCE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setBusinessInfo = useCallback((apartmentId: string, updater: (prev: BusinessInfo) => BusinessInfo) => {
    setBusinessMap((prev) => {
      const current = prev[apartmentId] ?? {
        name: "",
        taxCode: "",
        type: "",
        goods: "",
        phone: "",
        email: "",
        website: "",
      };
      const nextInfo = updater(current);
      const next = { ...prev, [apartmentId]: nextInfo };
      try {
        localStorage.setItem(APARTMENT_BUSINESS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const blocks = ["A"];

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
          <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Quản lý Căn hộ</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: cfg.color }} />
                  <span style={{ color: "#717182" }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Floor selector */}
          <div className="w-[68px] min-w-[68px] bg-white border-r flex flex-col items-center py-3" style={{ borderColor: "#CFCFEF" }}>
            <button
              onClick={() => setSelectedFloor(Math.min(30, selectedFloor + 1))}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors mb-1"
              disabled={selectedFloor >= 30}
            >
              <ChevronUp size={18} style={{ color: selectedFloor >= 30 ? "#CFCFEF" : "#6F6AF8" }} />
            </button>
            <div className="flex-1 overflow-auto w-full px-2 flex flex-col gap-1 scrollbar-thin">
              {Array.from({ length: 30 }, (_, i) => 30 - i).map((floor) => (
                <button
                  key={floor}
                  onClick={() => { setSelectedFloor(floor); setSelectedApartment(null); }}
                  className="w-full py-1.5 rounded text-xs text-center transition-all shrink-0"
                  style={{
                    background: selectedFloor === floor ? "#6F6AF8" : "transparent",
                    color: selectedFloor === floor ? "#fff" : "#1A1A2E",
                    fontWeight: selectedFloor === floor ? 600 : 400,
                    borderRadius: 6,
                  }}
                >
                  T{floor}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedFloor(Math.max(1, selectedFloor - 1))}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors mt-1"
              disabled={selectedFloor <= 1}
            >
              <ChevronDown size={18} style={{ color: selectedFloor <= 1 ? "#CFCFEF" : "#6F6AF8" }} />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Floor info */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} style={{ color: "#6F6AF8" }} />
                  <span style={{ fontWeight: 600, color: "#1A1A2E" }}>Tầng {selectedFloor}</span>
                </div>
                <span className="text-sm" style={{ color: "#717182" }}>
                  {apartments.length} căn hộ (Block A)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F2F2FD", color: "#717182", fontWeight: 500 }}>
                  {selectedFloor <= 4 ? "Tầng shophouse" : selectedFloor <= 29 ? "Tầng căn hộ" : "Tầng penthouse"}
                </span>
                <div className="flex gap-2 ml-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#4CAF5015", color: "#4CAF50", fontWeight: 500 }}>
                    {occupiedCount} đang ở
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FF980015", color: "#FF9800", fontWeight: 500 }}>
                    {emptyCount} trống
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F4433615", color: "#F44336", fontWeight: 500 }}>
                    {maintenanceCount} bảo trì
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {blocks.map((b) => (
                    <button
                      key={b}
                      className="px-3 py-1 rounded text-xs transition-all"
                      style={{
                        background: "#F2F2FD",
                        color: "#717182",
                        fontWeight: 500,
                        borderRadius: 6,
                      }}
                    >
                      Block {b}
                    </button>
                  ))}
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ApartmentStatus | "all")}
                  className="px-3 py-1.5 border rounded text-xs"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="occupied">Đang ở</option>
                  <option value="empty">Chưa có người ở</option>
                </select>
              </div>
            </div>

            {/* Grid căn */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="border rounded-lg p-4 bg-white w-full" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  {filtered.map((apt) => {
                    const cfg = statusConfig[apt.status];
                    const isSelected = selectedApartment?.id === apt.id;
                    const isMaintenance = maintenanceMap[apt.id]?.on === true;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedApartment(isSelected ? null : apt)}
                        className="relative p-2.5 rounded-lg border-2 transition-all hover:shadow-md flex flex-col items-center justify-center"
                        style={{
                          background: isMaintenance ? "#F4433608" : cfg.bg,
                          borderColor: isSelected ? "#6F6AF8" : isMaintenance ? "#F4433640" : "transparent",
                          borderRadius: 8,
                          minHeight: 72,
                        }}
                      >
                        <div className="text-xs" style={{ fontWeight: 600, color: cfg.color }}>
                          {apt.number.split("-")[1]}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "#717182" }}>
                          {apt.area}m²
                        </div>
                        {apt.status === "occupied" && (
                          <div className="text-[9px] mt-1 truncate" style={{ color: "#717182" }}>
                            {apt.usage === "commercial"
                              ? apt.business?.name || "Cửa hàng"
                              : apt.owner?.split(" ").slice(-1)[0]}
                          </div>
                        )}
                        {isMaintenance && (
                          <div className="absolute top-1 right-1" title="Đang bảo trì">
                            <Wrench size={12} style={{ color: "#F44336" }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panel chi tiết dưới grid */}
            {selectedApartment && (
              <div className="mt-2 px-6 pb-4">
                <div className="bg-white rounded-lg border overflow-auto" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#CFCFEF", background: "#F8F8FC" }}>
                    <div className="flex items-center gap-2">
                      <Home size={16} style={{ color: "#6F6AF8" }} />
                      <span style={{ fontWeight: 600, color: "#1A1A2E" }}>Căn {selectedApartment.number}</span>
                    </div>
                    <button onClick={() => setSelectedApartment(null)} className="p-1 rounded hover:bg:white/50">
                      <X size={16} style={{ color: "#717182" }} />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedApartment.status === "occupied" && selectedApartment.usage === "residential" && (
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: statusConfig.occupied.bg, color: statusConfig.occupied.color, fontWeight: 500 }}>
                          Đang ở
                        </span>
                      )}
                      {selectedApartment.status === "empty" && selectedApartment.usage === "residential" && (
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: statusConfig.empty.bg, color: statusConfig.empty.color, fontWeight: 500 }}>
                          Chưa có người ở
                        </span>
                      )}
                      {maintenanceMap[selectedApartment.id]?.on && (
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4433618", color: "#F44336", fontWeight: 500 }}>
                          Bảo trì
                        </span>
                      )}
                    </div>

                    {/* Trạng thái bảo trì */}
                    <div className="p-3 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                      <h4 className="text-xs mb-2" style={{ fontWeight: 600, color: "#6F6AF8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Trạng thái căn hộ
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={maintenanceMap[selectedApartment.id]?.on === true}
                          onChange={(e) =>
                            setMaintenance(
                              selectedApartment.id,
                              e.target.checked,
                              maintenanceMap[selectedApartment.id]?.note ?? ""
                            )
                          }
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#F44336" }}
                        />
                        <span className="text-sm" style={{ color: "#1A1A2E" }}>Đang bảo trì</span>
                      </label>
                      {maintenanceMap[selectedApartment.id]?.on && (
                        <div className="mt-2">
                          <label className="block text-xs mb-1" style={{ color: "#717182" }}>Chú thích bảo trì</label>
                          <textarea
                            value={maintenanceMap[selectedApartment.id]?.note ?? ""}
                            onChange={(e) =>
                              setMaintenance(selectedApartment.id, true, e.target.value)
                            }
                            rows={2}
                            placeholder="VD: Sửa trần nhà, sửa sàn, sơn lại tường..."
                            className="w-full px-2.5 py-2 border rounded text-sm resize-none"
                            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info basic */}
                    <div className="space-y-3 p-3 rounded-lg" style={{ background: "#F2F2FD", borderRadius: 8 }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#717182" }}>Mã căn hộ</span>
                        <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedApartment.number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#717182" }}>Diện tích</span>
                        <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedApartment.area} m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#717182" }}>Tầng</span>
                        <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedFloor}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#717182" }}>Block</span>
                        <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedApartment.number.split("-")[0]}</span>
                      </div>
                    </div>

                    {/* Căn hộ ở */}
                    {selectedApartment.usage === "residential" && selectedApartment.status === "occupied" && (
                      <div>
                        <h4 className="text-xs mb-2 mt-2" style={{ fontWeight: 600, color: "#6F6AF8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Thông tin chủ hộ
                        </h4>
                        <div className="space-y-2.5 p-3 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                          <div className="flex items-center gap-2 text-sm">
                            <Users size={14} style={{ color: "#6F6AF8" }} />
                            <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selectedApartment.owner}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} style={{ color: "#717182" }} />
                            <span style={{ color: "#717182" }}>{selectedApartment.phone ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} style={{ color: "#717182" }} />
                            <span style={{ color: "#717182" }}>{selectedApartment.email ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users size={14} style={{ color: "#717182" }} />
                            <span style={{ color: "#717182" }}>{selectedApartment.members} nhân khẩu</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shophouse */}
                    {selectedApartment.usage === "commercial" && (
                      <div>
                        <h4 className="text-xs mb-2 mt-2" style={{ fontWeight: 600, color: "#6F6AF8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Thông tin cửa hàng / doanh nghiệp
                        </h4>
                        <div className="space-y-2.5 p-3 rounded-lg border" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 size={14} style={{ color: "#6F6AF8" }} />
                            <input
                              value={businessMap[selectedApartment.id]?.name ?? ""}
                              onChange={(e) =>
                                setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Tên cửa hàng / doanh nghiệp"
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                            />
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <label className="text-xs" style={{ color: "#717182" }}>Loại hình kinh doanh</label>
                            <input
                              value={businessMap[selectedApartment.id]?.type ?? ""}
                              onChange={(e) =>
                                setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, type: e.target.value }))
                              }
                              placeholder="VD: Cửa hàng tiện lợi, Café, Văn phòng..."
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                            />
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <label className="text-xs" style={{ color: "#717182" }}>Mặt hàng kinh doanh</label>
                            <input
                              value={businessMap[selectedApartment.id]?.goods ?? ""}
                              onChange={(e) =>
                                setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, goods: e.target.value }))
                              }
                              placeholder="VD: Đồ uống, tạp hóa, dược phẩm..."
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                            />
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <label className="text-xs" style={{ color: "#717182" }}>Mã số thuế</label>
                            <input
                              value={businessMap[selectedApartment.id]?.taxCode ?? ""}
                              onChange={(e) =>
                                setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, taxCode: e.target.value }))
                              }
                              placeholder="VD: 0101234567"
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: "#717182" }}>Số điện thoại</label>
                              <input
                                value={businessMap[selectedApartment.id]?.phone ?? ""}
                                onChange={(e) =>
                                  setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, phone: e.target.value }))
                                }
                                placeholder="09xxxxxxxx"
                                className="w-full px-2 py-1 border rounded text-sm"
                                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: "#717182" }}>Email</label>
                              <input
                                value={businessMap[selectedApartment.id]?.email ?? ""}
                                onChange={(e) =>
                                  setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="contact@business.com"
                                className="w-full px-2 py-1 border rounded text-sm"
                                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <label className="text-xs" style={{ color: "#717182" }}>Website</label>
                            <input
                              value={businessMap[selectedApartment.id]?.website ?? ""}
                              onChange={(e) =>
                                setBusinessInfo(selectedApartment.id, (prev) => ({ ...prev, website: e.target.value }))
                              }
                              placeholder="https://example.com"
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gợi ý thêm hộ khẩu cho căn ở trống */}
                    {selectedApartment.usage === "residential" && selectedApartment.status === "empty" && (
                      <div className="p-4 rounded-lg text-center" style={{ background: "#FF980008", borderRadius: 8 }}>
                        <Home size={32} className="mx-auto mb-2" style={{ color: "#FF9800", opacity: 0.5 }} />
                        <div className="text-sm" style={{ color: "#FF9800", fontWeight: 500 }}>Chưa có người ở</div>
                        <div className="text-xs mt-1" style={{ color: "#717182" }}>
                          Thêm hộ khẩu tại mục Cư dân với địa chỉ trùng mã căn (vd: {selectedApartment.number}) hoặc bấm nút dưới đây để tạo nhanh.
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddHousehold(true)}
                          className="mt-3 px-4 py-2 rounded-md text-xs text:white"
                          style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
                        >
                          Thêm hộ khẩu cho căn {selectedApartment.number}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal thêm hộ khẩu từ căn trống */}
      {showAddHousehold && selectedApartment && selectedApartment.usage === "residential" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddHousehold(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-sm" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                Thêm hộ khẩu cho căn {selectedApartment.number}
              </h2>
              <button onClick={() => setShowAddHousehold(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="text-xs px-3 py-2 rounded-md" style={{ background: "#F2F2FD", color: "#717182" }}>
                Địa chỉ hộ khẩu sẽ tự động gắn với mã căn <span style={{ fontWeight: 600, color: "#1A1A2E" }}>{selectedApartment.number}</span>.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                    Họ tên chủ hộ <span style={{ color: "#F44336" }}>*</span>
                  </label>
                  <input
                    value={hFullName}
                    onChange={(e) => setHFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>Ngày sinh</label>
                  <input
                    value={hDob}
                    onChange={(e) => setHDob(e.target.value)}
                    type="date"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>Giới tính</label>
                  <select
                    value={hGender}
                    onChange={(e) => setHGender(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>CCCD</label>
                  <input
                    value={hCccd}
                    onChange={(e) => setHCccd(e.target.value)}
                    placeholder="012345678901"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>Số điện thoại</label>
                  <input
                    value={hPhone}
                    onChange={(e) => setHPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>Email</label>
                  <input
                    value={hEmail}
                    onChange={(e) => setHEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>Phương tiện & biển số</label>
                <textarea
                  value={hVehicleInfo}
                  onChange={(e) => setHVehicleInfo(e.target.value)}
                  rows={2}
                  placeholder="VD: Xe máy 29A-12345; Ô tô 30H-678.90"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                type="button"
                onClick={() => setShowAddHousehold(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedApartment) return;
                  if (!hFullName.trim()) {
                    toast.error("Vui lòng nhập họ tên chủ hộ");
                    return;
                  }
                  try {
                    const created = await createHousehold({
                      address: selectedApartment.number,
                      members: 1,
                    });
                    const householdId = created.id ?? created.maHo;
                    try {
                      await createResident({
                        householdId,
                        fullName: hFullName.trim(),
                        dob: hDob || undefined,
                        gender: hGender || undefined,
                        cccd: hCccd || undefined,
                        relationToHead: "Chủ hộ",
                        phone: hPhone || undefined,
                        email: hEmail || undefined,
                        vehicleInfo: hVehicleInfo || undefined,
                      });
                    } catch (e: any) {
                      toast.error("Không tạo được chủ hộ", { description: e?.message });
                    }
                    toast.success("Đã thêm hộ khẩu cho căn " + selectedApartment.number);
                    const today = new Date().toISOString().slice(0, 10);
                    appendPopulationEvent({
                      type: "in",
                      name: hFullName.trim(),
                      apartment: selectedApartment.number,
                      reason: "Thêm hộ khẩu từ màn Căn hộ",
                    });
                    setShowAddHousehold(false);
                    setHFullName("");
                    setHDob("");
                    setHGender("Nam");
                    setHCccd("");
                    setHPhone("");
                    setHEmail("");
                    setHVehicleInfo("");
                    await reloadData();
                  } catch (e: any) {
                    toast.error("Không tạo được hộ khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
              >
                Lưu hộ khẩu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
