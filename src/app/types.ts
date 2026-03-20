/** Thu theo căn (1 số tiền/căn) hoặc theo nhân khẩu (số tiền × số người trong căn) */
export type FeeChargeType = "per_apartment" | "per_resident";

export interface FeeItem {
  id: number;
  name: string;
  type: "mandatory" | "voluntary";
  amount: string;
  unit: string;
  /** Cách tính: theo căn hoặc theo nhân khẩu. Mặc định per_apartment */
  chargeType?: FeeChargeType;
  deadline: string;
  status: "active" | "completed" | "expired";
  collected: number;
  total: number;
  note: string;
}

export type UserRole = "accountant" | "leader" | "viceLeader";

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



