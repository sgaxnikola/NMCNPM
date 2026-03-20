import type { UserRole } from "./types";

const API_BASE = "http://localhost:8080/api";

// Simple in-memory caching to reduce repeated network calls in UI.
// This improves perceived speed (especially when opening dialogs/screens repeatedly).
const CACHE_TTL_MS = 15_000;
let householdsCache: { ts: number; data: any[] } | null = null;
const residentsCacheByKey = new Map<string, { ts: number; data: any[] }>();

function isFresh(ts: number) {
  return Date.now() - ts < CACHE_TTL_MS;
}

function invalidateHouseholdsCache() {
  householdsCache = null;
}

function invalidateResidentsCache(householdId?: number) {
  if (householdId == null) {
    residentsCacheByKey.clear();
    return;
  }
  residentsCacheByKey.delete(`hh:${householdId}`);
  // household list views may also rely on /residents (all)
  residentsCacheByKey.delete("all");
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      if (typeof data === "string") return data;
      if (typeof (data as any)?.message === "string") return (data as any).message;
      if (typeof (data as any)?.error === "string") return (data as any).error;
    } catch {
      // ignore JSON parse errors
    }
    return text;
  } catch {
    return fallback;
  }
}

async function fetchJson<T>(path: string, init: RequestInit | undefined, fallbackError: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, fallbackError));
  }
  // Some endpoints may return empty body
  const text = await res.text();
  return (text ? JSON.parse(text) : ({} as T)) as T;
}

function mapBackendRoleToUserRole(role: string | null | undefined): UserRole {
  const normalized = (role ?? "").toLowerCase();
  if (normalized === "leader") return "leader";
  if (normalized === "viceleader" || normalized === "vice_leader") return "viceLeader";
  return "accountant";
}

export async function registerAccount(opts: { email: string; password: string; role: UserRole }) {
  const data = await fetchJson<any>(
    "/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: opts.email.trim().toLowerCase(),
        password: opts.password,
        fullName: opts.email.trim(),
        role: opts.role,
      }),
    },
    "Đăng ký tài khoản thất bại"
  );
  return {
    id: data.id as number | undefined,
    email: (data.username as string | undefined) ?? opts.email.trim().toLowerCase(),
    role: mapBackendRoleToUserRole(data.role as string | undefined),
  };
}

export async function loginAccount(opts: { email: string; password: string }) {
  const data = await fetchJson<any>(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: opts.email.trim().toLowerCase(),
        password: opts.password,
      }),
    },
    "Đăng nhập thất bại"
  );
  return {
    id: data.id as number | undefined,
    email: (data.username as string | undefined) ?? opts.email.trim().toLowerCase(),
    role: mapBackendRoleToUserRole(data.role as string | undefined),
  };
}

export async function fetchAccountByUsername(username: string) {
  const u = username.trim().toLowerCase();
  return fetchJson<{ id?: number; username?: string; fullName?: string; role?: string }>(
    `/auth/account?username=${encodeURIComponent(u)}`,
    undefined,
    "Không tải được thông tin tài khoản"
  );
}

export async function changePassword(opts: { email: string; currentPassword: string; newPassword: string }) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: opts.email.trim().toLowerCase(),
      currentPassword: opts.currentPassword,
      newPassword: opts.newPassword,
    }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, "Đổi mật khẩu thất bại"));
  return res.text();
}

export async function fetchFees() {
  return fetchJson<any[]>("/fees", undefined, "Không tải được danh sách khoản thu");
}

export async function fetchHouseholds() {
  if (householdsCache && isFresh(householdsCache.ts)) return householdsCache.data;
  const data = await fetchJson<any[]>("/households", undefined, "Không tải được danh sách hộ khẩu");
  householdsCache = { ts: Date.now(), data: Array.isArray(data) ? data : [] };
  return householdsCache.data;
}

export async function createHousehold(body: { members: number; address: string }) {
  const created = await fetchJson<any>(
    "/households",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: body.members,
        address: body.address,
      }),
    },
    "Không tạo được hộ khẩu"
  );
  invalidateHouseholdsCache();
  return created;
}

export async function updateHousehold(id: number, body: { members: number; address: string }) {
  const updated = await fetchJson<any>(
    `/households/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: body.members,
        address: body.address,
      }),
    },
    "Không cập nhật được hộ khẩu"
  );
  invalidateHouseholdsCache();
  return updated;
}

export async function deleteHousehold(id: number) {
  await fetchJson(`/households/${id}`, { method: "DELETE" }, "Không xóa được hộ khẩu");
  invalidateHouseholdsCache();
  invalidateResidentsCache(id);
}

export async function fetchResidents(householdId?: number) {
  const key = householdId ? `hh:${householdId}` : "all";
  const cached = residentsCacheByKey.get(key);
  if (cached && isFresh(cached.ts)) return cached.data;
  const query = householdId ? `?householdId=${householdId}` : "";
  const data = await fetchJson<any[]>(`/residents${query}`, undefined, "Không tải được danh sách nhân khẩu");
  const normalized = Array.isArray(data) ? data : [];
  residentsCacheByKey.set(key, { ts: Date.now(), data: normalized });
  return normalized;
}

export async function createResident(body: {
  householdId: number;
  fullName: string;
  dob?: string;
  gender?: string;
  cccd?: string;
  relationToHead?: string;
  phone?: string;
  email?: string;
  vehicleInfo?: string;
}) {
  const created = await fetchJson<any>(
    "/residents",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Không tạo được nhân khẩu"
  );
  invalidateResidentsCache(body.householdId);
  invalidateHouseholdsCache();
  return created;
}

export async function deleteResident(id: number) {
  await fetchJson(`/residents/${id}`, { method: "DELETE" }, "Không xóa được nhân khẩu");
  invalidateResidentsCache();
  invalidateHouseholdsCache();
}

export async function updateResident(
  id: number,
  body: {
    fullName?: string;
    cccd?: string;
    phone?: string;
    email?: string;
    vehicleInfo?: string;
  }
) {
  const updated = await fetchJson<any>(
    `/residents/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Không cập nhật được nhân khẩu"
  );
  invalidateResidentsCache();
  invalidateHouseholdsCache();
  return updated;
}

export async function fetchPopulationEvents(householdId?: number) {
  const query = householdId ? `?householdId=${householdId}` : "";
  return fetchJson<any[]>(`/population-events${query}`, undefined, "Không tải được biến động dân cư");
}

export async function createPopulationEvent(body: {
  householdId?: number;
  type: "in" | "out";
  name?: string;
  apartment?: string;
  date?: string;
  reason?: string;
}) {
  return fetchJson<any>(
    "/population-events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Không ghi được biến động dân cư"
  );
}

export async function fetchTempResidence(householdId: number) {
  return fetchJson<any[]>(`/temp-residence?householdId=${householdId}`, undefined, "Không tải được dữ liệu tạm trú/tạm vắng");
}

export async function createTempResidence(body: {
  householdId: number;
  type: "temporary_in" | "temporary_out";
  name: string;
  fromDate: string;
  toDate?: string;
  note?: string;
}) {
  return fetchJson<any>(
    "/temp-residence",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Không ghi được tạm trú/tạm vắng"
  );
}

export async function createFee(body: {
  name: string;
  amount: number;
  type: "mandatory" | "voluntary";
  chargeType?: "per_apartment" | "per_resident";
  deadline?: string;
}) {
  const payload: Record<string, unknown> = {
    name: body.name,
    amount: body.amount,
    type: body.type === "mandatory" ? 0 : 1,
    chargeType: body.chargeType ?? "per_apartment",
  };
  if (body.deadline) payload.deadline = body.deadline;
  return fetchJson<any>(
    "/fees",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Không tạo được khoản thu"
  );
}

export async function updateFee(
  id: number,
  body: {
    name?: string;
    amount?: number;
    type?: "mandatory" | "voluntary";
    chargeType?: "per_apartment" | "per_resident";
    deadline?: string;
  }
) {
  const payload: Record<string, unknown> = {};
  if (body.name != null) payload.name = body.name;
  if (body.amount != null) payload.amount = body.amount;
  if (body.type != null) payload.type = body.type === "mandatory" ? 0 : 1;
  if (body.chargeType != null) payload.chargeType = body.chargeType;
  if (body.deadline != null) payload.deadline = body.deadline;
  return fetchJson<any>(
    `/fees/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Không cập nhật được khoản thu"
  );
}

export async function deleteFee(id: number) {
  await fetchJson(`/fees/${id}`, { method: "DELETE" }, "Không xóa được khoản thu");
}

export type FeeObligationRow = {
  householdId: number;
  householdAddress: string | null;
  headName: string | null;
  members: number | null;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paid: boolean;
};

export async function fetchFeeObligations(feeId: number) {
  return fetchJson<FeeObligationRow[]>(
    `/fees/${feeId}/obligations`,
    undefined,
    "Không tải được danh sách phải nộp theo hộ"
  );
}

export type CollectionRound = {
  id: number;
  feeId: number;
  name: string;
  period?: string | null;
  deadline?: string | null;
  createdAt?: string | null;
};

export async function fetchRoundsByFee(feeId: number) {
  return fetchJson<CollectionRound[]>(
    `/rounds?feeId=${feeId}`,
    undefined,
    "Không tải được danh sách đợt thu"
  );
}

export async function createRound(
  feeId: number,
  body: { name: string; period?: string; deadline?: string }
) {
  return fetchJson<CollectionRound>(
    `/rounds?feeId=${feeId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name,
        period: body.period ?? null,
        deadline: body.deadline ?? null,
      }),
    },
    "Không tạo được đợt thu"
  );
}

export type RoundObligationRow = {
  householdId: number;
  householdAddress: string | null;
  headName: string | null;
  members: number | null;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paid: boolean;
};

export async function fetchRoundObligations(roundId: number) {
  return fetchJson<RoundObligationRow[]>(
    `/rounds/${roundId}/obligations`,
    undefined,
    "Không tải được danh sách phải nộp theo đợt"
  );
}

export async function fetchPayments() {
  return fetchJson<any[]>("/payments", undefined, "Không tải được danh sách thu phí");
}

export async function createPayment(body: {
  feeId: number;
  roundId?: number;
  householdId: number;
  payerName: string;
  amount: number;
  date: string;
}) {
  return fetchJson<any>(
    "/payments",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feeId: body.feeId,
        roundId: body.roundId ?? null,
        householdId: body.householdId,
        payerName: body.payerName,
        amount: body.amount,
        paymentDate: body.date,
      }),
    },
    "Không ghi nhận được thanh toán"
  );
}

export type VehicleType = "motorcycle" | "car" | "bicycle";

export async function fetchVehicles(householdId: number) {
  return fetchJson<any[]>(`/vehicles?householdId=${householdId}`, undefined, "Không tải được danh sách phương tiện");
}

export async function createVehicle(body: {
  householdId: number;
  type: VehicleType;
  plate?: string;
  note?: string;
}) {
  return fetchJson<any>(
    "/vehicles",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Không thêm được phương tiện"
  );
}

export async function deleteVehicle(id: number) {
  await fetchJson(`/vehicles/${id}`, { method: "DELETE" }, "Không xóa được phương tiện");
}

