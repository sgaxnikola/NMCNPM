/** Thu theo căn, nhân khẩu, hoặc theo từng phương tiện (mức khác nhau cho xe máy/ô tô/xe đạp) */
export type FeeChargeType = "per_apartment" | "per_resident" | "per_vehicle";

export type FeeFrequency = "daily" | "weekly" | "monthly" | "yearly" | "one_time";

export interface FeeItem {
  id: number;
  name: string;
  type: "mandatory" | "voluntary";
  amount: string;
  unit: string;
  /** Cách tính: theo căn hoặc theo nhân khẩu. Mặc định per_apartment */
  chargeType?: FeeChargeType;
  /** Mức thu mỗi xe (khi chargeType = per_vehicle), VNĐ */
  vehicleRateMotorcycle?: number;
  vehicleRateCar?: number;
  vehicleRateBicycle?: number;
  deadline: string;
  status: "active" | "completed" | "expired";
  collected: number;
  total: number;
  note: string;
  /** Tần suất: monthly, quarterly, yearly, one_time */
  frequency?: FeeFrequency;
  /** Ngày bắt đầu đợt thu đầu tiên (yyyy-MM-dd) */
  startDate?: string;
  /** Ngày kết thúc đợt thu đầu tiên = ngày bắt đầu đợt 2 (yyyy-MM-dd) */
  endDate?: string;
}

export type UserRole = "accountant" | "leader" | "viceLeader" | "resident";

export interface Payment {
  id: number;
  feeId: number;
  feeName: string;
  roundId?: number | null;
  householdId: string;
  householdHead: string;
  amount: number;
  date: string;
}

export interface Household {
  id: number;
  members: number | null;
  address: string | null;
  headName?: string | null;
}

export interface Resident {
  id: number;
  householdId: number | null;
  fullName: string;
  dob: string | null;
  gender: string | null;
  cccd: string | null;
  relationToHead: string | null;
  phone?: string | null;
  email?: string | null;
  vehicleInfo?: string | null;
}



