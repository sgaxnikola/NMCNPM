import ExcelJS from "exceljs";
import type { Household } from "../types";

type ResidentRow = {
  id: number;
  householdId?: number;
  household?: { id?: number };
  fullName?: string | null;
  dob?: string | null;
  gender?: string | null;
  cccd?: string | null;
  relationToHead?: string | null;
  phone?: string | null;
  email?: string | null;
  vehicleInfo?: string | null;
};

function formatDob(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
}

function residentHouseholdId(r: ResidentRow): number | null {
  const hid = r.householdId ?? r.household?.id;
  if (hid == null || Number.isNaN(Number(hid))) return null;
  return Number(hid);
}

/**
 * Xuất file Excel (2 sheet: nhân khẩu chi tiết + tổng hợp hộ).
 * `households` và `residents` nên cùng bộ lọc (vd. theo ô tìm kiếm).
 */
export async function downloadHouseholdRegistryExcel(
  households: Household[],
  residents: ResidentRow[]
): Promise<void> {
  const byId = new Map(households.map((h) => [h.id, h]));
  const allowed = new Set(households.map((h) => h.id));

  const residentRows = residents
    .filter((r) => {
      const hid = residentHouseholdId(r);
      return hid != null && allowed.has(hid);
    })
    .map((r) => {
      const hid = residentHouseholdId(r)!;
      const hh = byId.get(hid);
      return {
        maHo: `HK${hid}`,
        diaChi: hh?.address ?? "",
        chuHo: hh?.headName ?? "",
        hoTen: r.fullName ?? "",
        ngaySinh: formatDob(r.dob),
        gioiTinh: r.gender ?? "",
        cccd: r.cccd ?? "",
        sdt: r.phone ?? "",
        email: r.email ?? "",
        quanHe: r.relationToHead ?? "",
        phuongTien: r.vehicleInfo ?? "",
        _sortHo: hid,
        _sortTen: (r.fullName ?? "").toLowerCase(),
      };
    });

  residentRows.sort((a, b) => {
    if (a._sortHo !== b._sortHo) return a._sortHo - b._sortHo;
    return a._sortTen.localeCompare(b._sortTen, "vi");
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BlueMoon";
  workbook.created = new Date();

  const sheet1 = workbook.addWorksheet("Nhân khẩu", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet1.columns = [
    { header: "STT", key: "stt", width: 5 },
    { header: "Mã hộ", key: "maHo", width: 10 },
    { header: "Địa chỉ / Căn hộ", key: "diaChi", width: 22 },
    { header: "Chủ hộ (hộ)", key: "chuHo", width: 22 },
    { header: "Họ tên", key: "hoTen", width: 24 },
    { header: "Ngày sinh", key: "ngaySinh", width: 12 },
    { header: "Giới tính", key: "gioiTinh", width: 10 },
    { header: "CCCD", key: "cccd", width: 16 },
    { header: "SĐT", key: "sdt", width: 14 },
    { header: "Email", key: "email", width: 28 },
    { header: "Quan hệ", key: "quanHe", width: 14 },
    { header: "Phương tiện (ghi trên nhân khẩu)", key: "phuongTien", width: 36 },
  ];

  residentRows.forEach((row, i) => {
    sheet1.addRow({
      stt: i + 1,
      maHo: row.maHo,
      diaChi: row.diaChi,
      chuHo: row.chuHo,
      hoTen: row.hoTen,
      ngaySinh: row.ngaySinh,
      gioiTinh: row.gioiTinh,
      cccd: row.cccd,
      sdt: row.sdt,
      email: row.email,
      quanHe: row.quanHe,
      phuongTien: row.phuongTien,
    });
  });

  const header1 = sheet1.getRow(1);
  header1.font = { bold: true, color: { argb: "FF1A1A2E" } };
  header1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF0FB" },
  };
  header1.alignment = { vertical: "middle", wrapText: true };

  const sheet2 = workbook.addWorksheet("Tổng hợp hộ", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet2.columns = [
    { header: "STT", key: "stt", width: 5 },
    { header: "Mã hộ", key: "maHo", width: 10 },
    { header: "Địa chỉ / Căn hộ", key: "diaChi", width: 24 },
    { header: "Chủ hộ", key: "chuHo", width: 24 },
    { header: "Số nhân khẩu (ghi nhận)", key: "soNhanKhau", width: 18 },
  ];

  const sortedHh = [...households].sort((a, b) => a.id - b.id);
  sortedHh.forEach((h, i) => {
    const n = residents.filter((r) => residentHouseholdId(r) === h.id).length;
    sheet2.addRow({
      stt: i + 1,
      maHo: `HK${h.id}`,
      diaChi: h.address ?? "",
      chuHo: h.headName ?? "",
      soNhanKhau: n > 0 ? n : (h.members ?? 0),
    });
  });

  const header2 = sheet2.getRow(1);
  header2.font = { bold: true, color: { argb: "FF1A1A2E" } };
  header2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF0FB" },
  };

  const buf = await workbook.xlsx.writeBuffer();
  const name = `ho-khau-bluemoon-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.xlsx`;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
