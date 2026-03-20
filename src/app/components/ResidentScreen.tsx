import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Users, Save } from "lucide-react";
import { toast } from "sonner";
import type { Household, Resident } from "../types";
import {
  createHousehold,
  createResident,
  deleteHousehold,
  deleteResident,
  updateResident,
  fetchHouseholds,
  fetchResidents,
  updateHousehold,
  fetchPopulationEvents,
  createPopulationEvent,
  fetchTempResidence,
  createTempResidence,
  createVehicle,
  deleteVehicle,
  fetchVehicles,
} from "../api";

type PopulationEventType = "in" | "out";

interface PopulationEvent {
  type: PopulationEventType;
  name: string;
  apartment: string;
  date: string;
  reason?: string;
}

type TempStatusType = "temporary_in" | "temporary_out";

interface TempRecord {
  id: string;
  householdId: number;
  type: TempStatusType;
  name: string;
  fromDate: string;
  toDate?: string;
  note?: string;
}

type VehicleType = "motorcycle" | "car" | "bicycle";

interface VehicleItem {
  id: number;
  householdId: number;
  type: VehicleType;
  plate: string | null;
  note: string | null;
}

function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  return norm(a) === norm(b);
}

export function ResidentScreen() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("members");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState<PopulationEvent[]>([]);
  const [tempRecords, setTempRecords] = useState<TempRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);

  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleNote, setVehicleNote] = useState("");

  const [showTempModal, setShowTempModal] = useState(false);
  const [tempType, setTempType] = useState<TempStatusType>("temporary_in");
  const [tempName, setTempName] = useState("");
  const [tempFromDate, setTempFromDate] = useState("");
  const [tempToDate, setTempToDate] = useState("");
  const [tempNote, setTempNote] = useState("");

  const [showAddHousehold, setShowAddHousehold] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newMembers, setNewMembers] = useState("1");
  const [hFullName, setHFullName] = useState("");
  const [hDob, setHDob] = useState("");
  const [hGender, setHGender] = useState("Nam");
  const [hCccd, setHCccd] = useState("");
  const [hPhone, setHPhone] = useState("");
  const [hEmail, setHEmail] = useState("");
  const [hVehicleInfo, setHVehicleInfo] = useState("");

  const [showAddResident, setShowAddResident] = useState(false);
  const [rFullName, setRFullName] = useState("");
  const [rDob, setRDob] = useState("");
  const [rGender, setRGender] = useState("Nam");
  const [rCccd, setRCccd] = useState("");
  const [rRelation, setRRelation] = useState("Thành viên");
  const [rPhone, setRPhone] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rVehicleInfo, setRVehicleInfo] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Household | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [showEditHousehold, setShowEditHousehold] = useState(false);
  const [editHousehold, setEditHousehold] = useState<Household | null>(null);
  const [editAddress, setEditAddress] = useState("");

  const [showEditResident, setShowEditResident] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [erFullName, setErFullName] = useState("");
  const [erCccd, setErCccd] = useState("");
  const [erPhone, setErPhone] = useState("");
  const [erEmail, setErEmail] = useState("");
  const [erVehicleInfo, setErVehicleInfo] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const hh = await fetchHouseholds();
      setHouseholds((hh ?? []).map((h: any) => ({
        id: h.id ?? h.maHo,
        members: h.members ?? h.soThanhVien ?? null,
        address: h.address ?? h.diaChi ?? null,
        headName: h.headName ?? null,
      })));
    } catch (e: any) {
      toast.error("Không tải được danh sách hộ khẩu", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setResidents([]);
      setEvents([]);
      setTempRecords([]);
      setVehicles([]);
      return;
    }
    fetchResidents(selectedId)
      .then((list: any[]) =>
        setResidents((list ?? []).map((r) => ({
          id: r.id,
          householdId: r.household?.id ?? selectedId,
          fullName: r.fullName,
          dob: r.dob ?? null,
          gender: r.gender ?? null,
          cccd: r.cccd ?? null,
          relationToHead: r.relationToHead ?? null,
          phone: r.phone ?? null,
          email: r.email ?? null,
          vehicleInfo: r.vehicleInfo ?? null,
        })))
      )
      .catch(() => setResidents([]));

    fetchPopulationEvents(selectedId)
      .then((list: any[]) => {
        const mapped: PopulationEvent[] = (list ?? []).map((e: any) => ({
          type: e.type as PopulationEventType,
          name: e.name ?? "",
          apartment: e.apartment ?? "",
          date: e.date ?? "",
          reason: e.reason ?? undefined,
        }));
        setEvents(mapped);
      })
      .catch(() => setEvents([]));

    fetchTempResidence(selectedId)
      .then((list: any[]) => {
        const mapped: TempRecord[] = (list ?? []).map((r: any) => ({
          id: String(r.id ?? `${selectedId}-${Math.random()}`),
          householdId: selectedId,
          type: r.type as TempStatusType,
          name: r.name ?? "",
          fromDate: r.fromDate ?? "",
          toDate: r.toDate ?? undefined,
          note: r.note ?? undefined,
        }));
        setTempRecords(mapped);
      })
      .catch(() => setTempRecords([]));

    fetchVehicles(selectedId)
      .then((list: any[]) => {
        const mapped: VehicleItem[] = (list ?? []).map((v: any) => ({
          id: Number(v.id ?? 0),
          householdId: Number(v.householdId ?? selectedId),
          type: (v.type ?? "motorcycle") as VehicleType,
          plate: v.plate ?? null,
          note: v.note ?? null,
        }));
        setVehicles(mapped.filter((v) => v.id));
      })
      .catch(() => setVehicles([]));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter((h) => {
      const idMatch = `HK${h.id}`.toLowerCase().includes(q) || String(h.id).includes(q);
      const addressMatch = (h.address ?? "").toLowerCase().includes(q);
      const nameMatch = (h.headName ?? "").toLowerCase().includes(q);
      return idMatch || addressMatch || nameMatch;
    });
  }, [households, search]);

  const selected = households.find((h) => h.id === selectedId) ?? null;

  const selectedEvents = useMemo(
    () => (selected ? events.filter((e) => sameAddress(e.apartment, selected.address)) : []),
    [events, selected]
  );

  const registrationDate = useMemo(() => {
    if (!selected) return "—";
    const ins = selectedEvents.filter((e) => e.type === "in" && e.date);
    if (!ins.length) return "—";
    return ins.reduce((min, e) => (e.date < min ? e.date : min), ins[0].date);
  }, [selected, selectedEvents]);

  const selectedTempRecords = useMemo(
    () => (selected ? tempRecords.filter((r) => r.householdId === selected.id) : []),
    [selected, tempRecords]
  );

  const historyItems = useMemo(() => {
    if (!selected) return [];
    const items: Array<{ date: string; label: string; detail: string }> = [];
    for (const e of selectedEvents) {
      items.push({
        date: e.date,
        label: e.type === "in" ? "Nhân khẩu đến / đăng ký" : "Nhân khẩu chuyển đi / xóa hộ",
        detail: `${e.name}${e.reason ? ` – ${e.reason}` : ""}`,
      });
    }
    for (const r of selectedTempRecords) {
      items.push({
        date: r.fromDate,
        label: r.type === "temporary_in" ? "Đăng ký tạm trú" : "Đăng ký tạm vắng",
        detail: `${r.name}${r.note ? ` – ${r.note}` : ""}${
          r.toDate ? ` (đến ${r.toDate})` : ""
        }`,
      });
    }
    return items
      .filter((i) => i.date)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [selected, selectedEvents, selectedTempRecords]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto" style={{ background: "#F2F2FD" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Quản lý hộ khẩu</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#CFCFEF" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm hộ khẩu..."
              className="pl-9 pr-4 py-2 border rounded-md bg-white text-sm"
              style={{ borderColor: "#CFCFEF", borderRadius: 6, width: 240, color: "#1A1A2E" }}
            />
          </div>
          <button
            onClick={() => setShowAddHousehold(true)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm"
            style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
          >
            <Plus size={16} /> Thêm hộ khẩu
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="flex gap-4 h-full">
          {/* Table */}
          <div className={`bg-white rounded-lg border overflow-auto ${selected ? "flex-1" : "w-full"}`} style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F2F2FD" }}>
                  {["Mã hộ", "Chủ hộ", "Địa chỉ / Căn hộ", "Số nhân khẩu", "Hành động"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-sm" style={{ color: "#717182" }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-t cursor-pointer transition-colors"
                    style={{
                      borderColor: "#F2F2FD",
                      background: selectedId === row.id ? "#6F6AF810" : i % 2 === 1 ? "#FAFAFF" : "#fff",
                    }}
                    onClick={() => setSelectedId(selectedId === row.id ? null : row.id)}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "#6F6AF8", fontWeight: 500 }}>HK{row.id}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>{row.headName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>{row.address ?? "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A2E" }}>
                      <span className="flex items-center gap-1"><Users size={14} style={{ color: "#6F6AF8" }} /> {row.members ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setEditHousehold(row);
                            setEditAddress(row.address ?? "");
                            setShowEditHousehold(true);
                          }}
                        >
                          <Pencil size={14} style={{ color: "#6F6AF8" }} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(row);
                            setDeleteReason("");
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 size={14} style={{ color: "#F44336" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="w-[420px] min-w-[420px] bg-white rounded-lg border overflow-auto" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#CFCFEF", background: "#F2F2FD" }}>
                <h3 className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>Chi tiết hộ khẩu</h3>
                <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-gray-200">
                  <X size={16} style={{ color: "#717182" }} />
                </button>
              </div>

              {/* Info */}
              <div className="px-4 py-3 space-y-2 border-b" style={{ borderColor: "#CFCFEF" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#717182" }}>Mã hộ:</span>
                  <span style={{ color: "#1A1A2E", fontWeight: 500 }}>HK{selected.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#717182" }}>Địa chỉ:</span>
                  <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{selected.address ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#717182" }}>Ngày đăng ký:</span>
                  <span style={{ color: "#1A1A2E", fontWeight: 500 }}>{registrationDate}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "#CFCFEF" }}>
                {[
                  { id: "members", label: "Nhân khẩu" },
                  { id: "vehicles", label: "Phương tiện" },
                  { id: "temp", label: "Tạm trú/Tạm vắng" },
                  { id: "history", label: "Lịch sử thay đổi" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 py-2.5 text-xs transition-all"
                    style={{
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? "#6F6AF8" : "#717182",
                      borderBottom: activeTab === tab.id ? "2px solid #6F6AF8" : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Members Table */}
              {activeTab === "members" && (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#F2F2FD" }}>
                        {["Họ tên", "Ngày sinh", "GT", "CCCD", "SĐT", "Email", "Quan hệ", ""].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-xs" style={{ fontWeight: 600, color: "#1A1A2E" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {residents.map((m) => (
                        <tr key={m.id} className="border-t" style={{ borderColor: "#F2F2FD" }}>
                          <td className="px-3 py-2 text-xs" style={{ color: "#1A1A2E", fontWeight: 500 }}>{m.fullName}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#717182" }}>{m.dob ?? "—"}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#717182" }}>{m.gender ?? "—"}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#717182" }}>{m.cccd ?? "—"}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#717182" }}>{m.phone ?? "—"}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#717182" }}>{m.email ?? "—"}</td>
                          <td className="px-3 py-2 text-xs">
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                background: (m.relationToHead ?? "") === "Chủ hộ" ? "#6F6AF815" : "#F2F2FD",
                                color: (m.relationToHead ?? "") === "Chủ hộ" ? "#6F6AF8" : "#717182",
                                fontWeight: 500,
                              }}
                            >
                              {m.relationToHead ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <button
                              onClick={() => {
                                setEditingResident(m);
                                setErFullName(m.fullName ?? "");
                                setErCccd(m.cccd ?? "");
                                setErPhone(m.phone ?? "");
                                setErEmail(m.email ?? "");
                                setErVehicleInfo(m.vehicleInfo ?? "");
                                setShowEditResident(true);
                              }}
                              className="px-2 py-1 rounded text-[11px] mr-1"
                              style={{ color: "#6F6AF8" }}
                            >
                              Sửa
                            </button>
                            {(m.relationToHead ?? "") !== "Chủ hộ" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteResident(m.id);
                                    toast.success("Đã xóa nhân khẩu");
                                    const list = await fetchResidents(selected.id);
                                    setResidents((list ?? []).map((r: any) => ({
                                      id: r.id,
                                      householdId: r.household?.id ?? selected.id,
                                      fullName: r.fullName,
                                      dob: r.dob ?? null,
                                      gender: r.gender ?? null,
                                      cccd: r.cccd ?? null,
                                      relationToHead: r.relationToHead ?? null,
                                      phone: r.phone ?? null,
                                      email: r.email ?? null,
                                      vehicleInfo: r.vehicleInfo ?? null,
                                    })));
                                    // Cập nhật số nhân khẩu hiển thị cho hộ hiện tại
                                    setHouseholds((prev) =>
                                      prev.map((h) =>
                                        h.id === selected.id
                                          ? { ...h, members: Math.max(0, (h.members ?? 0) - 1) }
                                          : h
                                      )
                                    );
                                  } catch (e: any) {
                                    toast.error("Không xóa được nhân khẩu", { description: e?.message });
                                  }
                                }}
                                className="px-2 py-1 rounded text-[11px]"
                                style={{ color: "#F44336" }}
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "vehicles" && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: "#717182" }}>
                      Quản lý phương tiện của hộ <span style={{ fontWeight: 600 }}>HK{selected.id}</span>.
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                        Loại phương tiện
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      >
                        <option value="motorcycle">Xe máy</option>
                        <option value="car">Ô tô</option>
                        <option value="bicycle">Xe đạp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                        Biển số {vehicleType === "bicycle" ? "(không bắt buộc)" : <span style={{ color: "#F44336" }}>*</span>}
                      </label>
                      <input
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        disabled={vehicleType === "bicycle"}
                        placeholder={vehicleType === "bicycle" ? "Xe đạp không cần biển số" : "VD: 29A-12345"}
                        className="w-full px-3 py-2 border rounded-md text-sm disabled:opacity-60"
                        style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                        Ghi chú
                      </label>
                      <input
                        value={vehicleNote}
                        onChange={(e) => setVehicleNote(e.target.value)}
                        placeholder="VD: Honda Vision, màu đỏ..."
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (!selected) return;
                        if ((vehicleType === "motorcycle" || vehicleType === "car") && !vehiclePlate.trim()) {
                          toast.error("Xe máy/ô tô bắt buộc phải có biển số");
                          return;
                        }
                        try {
                          const saved = await createVehicle({
                            householdId: selected.id,
                            type: vehicleType,
                            plate: vehicleType === "bicycle" ? undefined : vehiclePlate.trim(),
                            note: vehicleNote.trim() || undefined,
                          });
                          setVehicles((prev) => [
                            ...prev,
                            {
                              id: Number(saved.id ?? 0),
                              householdId: Number(saved.householdId ?? selected.id),
                              type: (saved.type ?? vehicleType) as VehicleType,
                              plate: saved.plate ?? null,
                              note: saved.note ?? null,
                            },
                          ].filter((v) => v.id));
                          toast.success("Đã thêm phương tiện");
                          setVehiclePlate("");
                          setVehicleNote("");
                        } catch (e: any) {
                          toast.error("Không thêm được phương tiện", { description: e?.message });
                        }
                      }}
                      className="px-3 py-2 text-white rounded-md text-xs"
                      style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
                    >
                      + Thêm phương tiện
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="text-center text-sm" style={{ color: "#717182" }}>
                      Chưa có phương tiện nào.
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[260px]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "#F2F2FD" }}>
                            {["Loại", "Biển số", "Ghi chú", ""].map((h) => (
                              <th key={h} className="text-left px-3 py-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vehicles.map((v, i) => (
                            <tr key={v.id} className="border-t" style={{ borderColor: "#F2F2FD", background: i % 2 === 1 ? "#FAFAFF" : "#fff" }}>
                              <td className="px-3 py-2" style={{ color: "#1A1A2E", fontWeight: 500 }}>
                                {v.type === "motorcycle" ? "Xe máy" : v.type === "car" ? "Ô tô" : "Xe đạp"}
                              </td>
                              <td className="px-3 py-2" style={{ color: "#717182" }}>{v.plate ?? "—"}</td>
                              <td className="px-3 py-2" style={{ color: "#717182" }}>{v.note ?? "—"}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteVehicle(v.id);
                                      setVehicles((prev) => prev.filter((x) => x.id !== v.id));
                                      toast.success("Đã xóa phương tiện");
                                    } catch (e: any) {
                                      toast.error("Không xóa được phương tiện", { description: e?.message });
                                    }
                                  }}
                                  className="px-2 py-1 rounded text-[11px]"
                                  style={{ color: "#F44336" }}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "temp" && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs" style={{ color: "#717182" }}>
                      Ghi nhận các lần <span style={{ fontWeight: 600 }}>tạm trú / tạm vắng</span> của hộ này.
                    </div>
                    <button
                      onClick={() => setShowTempModal(true)}
                      className="px-3 py-1.5 rounded-md text-xs text-white"
                      style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
                    >
                      + Ghi nhận
                    </button>
                  </div>
                  {selectedTempRecords.length === 0 ? (
                    <div className="text-center text-sm" style={{ color: "#717182" }}>
                      Chưa có dữ liệu tạm trú / tạm vắng.
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[260px]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "#F2F2FD" }}>
                            {["Họ tên", "Loại", "Từ ngày", "Đến ngày", "Ghi chú"].map((h) => (
                              <th key={h} className="text-left px-3 py-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTempRecords.map((r, i) => (
                            <tr key={r.id} className="border-t" style={{ borderColor: "#F2F2FD", background: i % 2 === 1 ? "#FAFAFF" : "#fff" }}>
                              <td className="px-3 py-2" style={{ color: "#1A1A2E", fontWeight: 500 }}>{r.name}</td>
                              <td className="px-3 py-2">
                                <span
                                  className="px-2 py-0.5 rounded-full"
                                  style={{
                                    background: r.type === "temporary_in" ? "#4CAF5015" : "#FF980015",
                                    color: r.type === "temporary_in" ? "#4CAF50" : "#FF9800",
                                    fontWeight: 500,
                                  }}
                                >
                                  {r.type === "temporary_in" ? "Tạm trú" : "Tạm vắng"}
                                </span>
                              </td>
                              <td className="px-3 py-2" style={{ color: "#717182" }}>{r.fromDate || "—"}</td>
                              <td className="px-3 py-2" style={{ color: "#717182" }}>{r.toDate || "—"}</td>
                              <td className="px-3 py-2" style={{ color: "#717182" }}>{r.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="p-4 space-y-3">
                  {historyItems.length === 0 ? (
                    <div className="text-center text-sm" style={{ color: "#717182" }}>
                      Chưa có lịch sử thay đổi cho hộ này.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-auto">
                      {historyItems.map((item, idx) => (
                        <div
                          key={`${item.date}-${idx}`}
                          className="flex items-start gap-3 text-xs px-3 py-2 rounded-md"
                          style={{ background: "#F2F2FD", borderRadius: 6 }}
                        >
                          <div className="mt-0.5" style={{ color: "#6F6AF8", fontWeight: 600 }}>
                            {item.date}
                          </div>
                          <div className="flex-1">
                            <div style={{ color: "#1A1A2E", fontWeight: 600 }}>{item.label}</div>
                            <div style={{ color: "#717182" }}>{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: "#CFCFEF" }}>
                <button
                  onClick={() => setShowAddResident(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-white rounded text-xs"
                  style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
                >
                  <Plus size={12} /> Thêm nhân khẩu
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateHousehold(selected.id, {
                        address: selected.address ?? "",
                        members: Number(selected.members ?? 0),
                      });
                      toast.success("Đã cập nhật hộ khẩu");
                      refresh();
                    } catch (e: any) {
                      toast.error("Không cập nhật được hộ khẩu", { description: e?.message });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded text-xs"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
                >
                  <Pencil size={12} style={{ color: "#6F6AF8" }} /> Cập nhật
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Household Dialog */}
      {showAddHousehold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddHousehold(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>Thêm hộ khẩu</h2>
              <button onClick={() => setShowAddHousehold(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Địa chỉ</label>
                <input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="VD: Căn A-1205, Tầng 12"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Số thành viên</label>
                <input
                  value={newMembers}
                  onChange={(e) => setNewMembers(e.target.value)}
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Họ tên chủ hộ</label>
                <input
                  value={hFullName}
                  onChange={(e) => setHFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Ngày sinh chủ hộ</label>
                  <input
                    value={hDob}
                    onChange={(e) => setHDob(e.target.value)}
                    type="date"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Giới tính chủ hộ</label>
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
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>CCCD chủ hộ</label>
                <input
                  value={hCccd}
                  onChange={(e) => setHCccd(e.target.value)}
                  placeholder="012345678901"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Số điện thoại chủ hộ</label>
                  <input
                    value={hPhone}
                    onChange={(e) => setHPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Email chủ hộ</label>
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
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Phương tiện & biển số (chủ hộ)</label>
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
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => setShowAddHousehold(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!newAddress.trim()) {
                    toast.error("Vui lòng nhập địa chỉ");
                    return;
                  }
                  if (!hFullName.trim()) {
                    toast.error("Vui lòng nhập họ tên chủ hộ");
                    return;
                  }
                  try {
                    const created = await createHousehold({
                      address: newAddress.trim(),
                      members: Math.max(1, Number(newMembers || 1)),
                    });
                    const householdId = created.id ?? created.maHo;
                    toast.success("Đã thêm hộ khẩu");

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

                    const today = new Date().toISOString().slice(0, 10);
                    try {
                      await createPopulationEvent({
                        householdId,
                        type: "in",
                        name: hFullName.trim(),
                        apartment: newAddress.trim(),
                        date: today,
                        reason: "Thêm mới hộ khẩu",
                      });
                    } catch {
                      // nếu lỗi log, vẫn cho phép tạo hộ khẩu
                    }

                    setShowAddHousehold(false);
                    setNewAddress("");
                    setNewMembers("1");
                    setHFullName("");
                    setHDob("");
                    setHGender("Nam");
                    setHCccd("");
                    setHPhone("");
                    setHEmail("");
                    setHVehicleInfo("");
                    refresh();
                  } catch (e: any) {
                    toast.error("Không tạo được hộ khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Dialog */}
      {showAddResident && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddResident(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>Thêm nhân khẩu (HK{selected.id})</h2>
              <button onClick={() => setShowAddResident(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Họ tên</label>
                <input
                  value={rFullName}
                  onChange={(e) => setRFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Ngày sinh</label>
                  <input
                    value={rDob}
                    onChange={(e) => setRDob(e.target.value)}
                    type="date"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Giới tính</label>
                  <select
                    value={rGender}
                    onChange={(e) => setRGender(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>CCCD</label>
                <input
                  value={rCccd}
                  onChange={(e) => setRCccd(e.target.value)}
                  placeholder="012345678901"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Số điện thoại</label>
                  <input
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Email</label>
                  <input
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Phương tiện & biển số</label>
                <textarea
                  value={rVehicleInfo}
                  onChange={(e) => setRVehicleInfo(e.target.value)}
                  rows={2}
                  placeholder="VD: Xe máy 29A-12345; Ô tô 30H-678.90"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Quan hệ với chủ hộ</label>
                <input
                  value={rRelation}
                  onChange={(e) => setRRelation(e.target.value)}
                  placeholder="Chủ hộ / Vợ / Chồng / Con ..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => setShowAddResident(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!rFullName.trim()) {
                    toast.error("Vui lòng nhập họ tên");
                    return;
                  }
                  try {
                    await createResident({
                      householdId: selected.id,
                      fullName: rFullName.trim(),
                      dob: rDob || undefined,
                      gender: rGender || undefined,
                      cccd: rCccd || undefined,
                      relationToHead: rRelation || undefined,
                      phone: rPhone || undefined,
                      email: rEmail || undefined,
                      vehicleInfo: rVehicleInfo || undefined,
                    });
                    toast.success("Đã thêm nhân khẩu");
                    setShowAddResident(false);
                    setRFullName("");
                    setRDob("");
                    setRGender("Nam");
                    setRCccd("");
                    setRRelation("Thành viên");
                    setRPhone("");
                    setREmail("");
                    setRVehicleInfo("");
                    const list = await fetchResidents(selected.id);
                    setResidents((list ?? []).map((r: any) => ({
                      id: r.id,
                      householdId: r.household?.id ?? selected.id,
                      fullName: r.fullName,
                      dob: r.dob ?? null,
                      gender: r.gender ?? null,
                      cccd: r.cccd ?? null,
                      relationToHead: r.relationToHead ?? null,
                      phone: r.phone ?? null,
                      email: r.email ?? null,
                      vehicleInfo: r.vehicleInfo ?? null,
                    })));
                  } catch (e: any) {
                    toast.error("Không tạo được nhân khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Household Confirm Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                Xóa hộ khẩu HK{deleteTarget.id}
              </h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm" style={{ color: "#717182" }}>
                Vui lòng nhập <strong>lý do xóa</strong>. Thông tin này sẽ được ghi vào biến động dân cư (Chuyển đi).
              </p>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                  Lý do xóa hộ khẩu
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  placeholder="VD: Chuyển đi nơi khác, gộp hộ khẩu, nhập sai dữ liệu..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteHousehold(deleteTarget.id);

                    const today = new Date().toISOString().slice(0, 10);
                    try {
                      await createPopulationEvent({
                        householdId: deleteTarget.id,
                        type: "out",
                        name: deleteTarget.headName ?? `HK${deleteTarget.id}`,
                        apartment: deleteTarget.address ?? "",
                        date: today,
                        reason: deleteReason.trim() || undefined,
                      });
                    } catch {
                      // ignore log error
                    }

                    toast.success("Đã xóa hộ khẩu");
                    if (selectedId === deleteTarget.id) setSelectedId(null);
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                    setDeleteReason("");
                    refresh();
                  } catch (e: any) {
                    toast.error("Không xóa được hộ khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#F44336", borderRadius: 6, fontWeight: 600 }}
              >
                Xóa hộ khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Household Dialog */}
      {showEditHousehold && editHousehold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditHousehold(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                Chỉnh sửa hộ khẩu HK{editHousehold.id}
              </h2>
              <button onClick={() => setShowEditHousehold(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Địa chỉ / Căn hộ</label>
                <input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="VD: A-1205"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => setShowEditHousehold(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    const updated = await updateHousehold(editHousehold.id, {
                      address: editAddress.trim(),
                      members: editHousehold.members ?? 0,
                    });
                    toast.success("Đã cập nhật hộ khẩu");
                    setShowEditHousehold(false);
                    setEditHousehold(null);
                    await refresh();
                    if (selectedId === editHousehold.id) {
                      // cập nhật selected hiện tại để hiển thị thông tin mới
                      setSelectedId(editHousehold.id);
                    }
                  } catch (e: any) {
                    toast.error("Không cập nhật được hộ khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp residence / absence dialog */}
      {showTempModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTempModal(false)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                Ghi nhận tạm trú / tạm vắng (HK{selected.id})
              </h2>
              <button onClick={() => setShowTempModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Loại</label>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={tempType === "temporary_in"}
                      onChange={() => setTempType("temporary_in")}
                      className="w-3 h-3"
                    />
                    <span style={{ color: "#1A1A2E" }}>Tạm trú</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={tempType === "temporary_out"}
                      onChange={() => setTempType("temporary_out")}
                      className="w-3 h-3"
                    />
                    <span style={{ color: "#1A1A2E" }}>Tạm vắng</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Họ tên</label>
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Từ ngày</label>
                  <input
                    type="date"
                    value={tempFromDate}
                    onChange={(e) => setTempFromDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Đến ngày (tùy chọn)</label>
                  <input
                    type="date"
                    value={tempToDate}
                    onChange={(e) => setTempToDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Ghi chú</label>
                <textarea
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  rows={2}
                  placeholder="Lý do tạm trú / tạm vắng..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => setShowTempModal(false)}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!tempName.trim()) {
                    toast.error("Vui lòng nhập họ tên");
                    return;
                  }
                  if (!tempFromDate) {
                    toast.error("Vui lòng chọn ngày bắt đầu");
                    return;
                  }
                  if (!selected) return;
                  createTempResidence({
                    householdId: selected.id,
                    type: tempType,
                    name: tempName.trim(),
                    fromDate: tempFromDate,
                    toDate: tempToDate || undefined,
                    note: tempNote.trim() || undefined,
                  })
                    .then((saved: any) => {
                      const record: TempRecord = {
                        id: String(saved.id ?? `${selected.id}-${Date.now()}`),
                        householdId: selected.id,
                        type: saved.type as TempStatusType,
                        name: saved.name ?? tempName.trim(),
                        fromDate: saved.fromDate ?? tempFromDate,
                        toDate: (saved.toDate ?? tempToDate) || undefined,
                        note: (saved.note ?? tempNote) || undefined,
                      };
                      setTempRecords((prev) => [record, ...prev]);
                      toast.success("Đã ghi nhận tạm trú / tạm vắng");
                    })
                    .catch((e: any) => {
                      toast.error("Không ghi được tạm trú/tạm vắng", { description: e?.message });
                    })
                    .finally(() => {
                      setShowTempModal(false);
                      setTempName("");
                      setTempFromDate("");
                      setTempToDate("");
                      setTempNote("");
                      setTempType("temporary_in");
                    });
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resident Dialog */}
      {showEditResident && editingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowEditResident(false);
              setEditingResident(null);
            }}
          />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-2xl" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#CFCFEF" }}>
              <h2 className="text-base" style={{ fontWeight: 700, color: "#1A1A2E" }}>
                Chỉnh sửa nhân khẩu
              </h2>
              <button
                onClick={() => {
                  setShowEditResident(false);
                  setEditingResident(null);
                }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X size={18} style={{ color: "#717182" }} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                  Họ tên
                </label>
                <input
                  value={erFullName}
                  onChange={(e) => setErFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                  CCCD
                </label>
                <input
                  value={erCccd}
                  onChange={(e) => setErCccd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                    Số điện thoại
                  </label>
                  <input
                    value={erPhone}
                    onChange={(e) => setErPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                    Email
                  </label>
                  <input
                    value={erEmail}
                    onChange={(e) => setErEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>
                  Phương tiện
                </label>
                <textarea
                  value={erVehicleInfo}
                  onChange={(e) => setErVehicleInfo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "#CFCFEF" }}>
              <button
                onClick={() => {
                  setShowEditResident(false);
                  setEditingResident(null);
                }}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E", fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!editingResident) return;
                  if (!erFullName.trim()) {
                    toast.error("Vui lòng nhập họ tên");
                    return;
                  }
                  try {
                    await updateResident(editingResident.id, {
                      fullName: erFullName.trim(),
                      cccd: erCccd.trim(),
                      phone: erPhone.trim(),
                      email: erEmail.trim(),
                      vehicleInfo: erVehicleInfo.trim(),
                    });
                    toast.success("Đã cập nhật nhân khẩu");

                    // Reload residents for current household
                    if (selected) {
                      const list = await fetchResidents(selected.id);
                      setResidents((list ?? []).map((r: any) => ({
                        id: r.id,
                        householdId: r.household?.id ?? r.householdId ?? selected.id,
                        fullName: r.fullName,
                        dob: r.dob ?? null,
                        gender: r.gender ?? null,
                        cccd: r.cccd ?? null,
                        relationToHead: r.relationToHead ?? null,
                        phone: r.phone ?? null,
                        email: r.email ?? null,
                        vehicleInfo: r.vehicleInfo ?? null,
                      })));
                      // Refresh households so headName can reflect if "Chủ hộ" was edited
                      refresh();
                    }

                    setShowEditResident(false);
                    setEditingResident(null);
                  } catch (e: any) {
                    toast.error("Không cập nhật được nhân khẩu", { description: e?.message });
                  }
                }}
                className="px-4 py-2 text-white rounded-md text-sm"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
              >
                <span className="inline-flex items-center gap-1">
                  <Save size={14} /> Lưu
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
