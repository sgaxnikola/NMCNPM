import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { CreateFeeWizardDialog } from "./components/CreateFeeWizardDialog";
import { CollectPaymentDialog } from "./components/CollectPaymentDialog";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { ResidentScreen } from "./components/ResidentScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { ApartmentScreen } from "./components/ApartmentScreen";
import { FeeScreen } from "./components/FeeScreen";
import { ResidentPortalScreen } from "./components/ResidentPortalScreen";
import { SearchScreen } from "./components/SearchScreen";
import type { FeeItem, Payment, UserRole } from "./types";
import { createFee, createPayment, fetchAccountByUsername, fetchFees, fetchPayments } from "./api";

const AUTH_STORAGE_KEY = "bluemoon_auth";
const validRoles: UserRole[] = ["accountant", "leader", "viceLeader", "resident"];

function getStoredAuth(): { isLoggedIn: boolean; role: UserRole | null; email: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isLoggedIn: false, role: null, email: null };
    const data = JSON.parse(raw) as { role?: string; email?: string; username?: string };
    const role = data?.role;
    if (typeof role !== "string" || !validRoles.includes(role as UserRole))
      return { isLoggedIn: false, role: null, email: null };
    const user = typeof data?.username === "string" ? data.username : typeof data?.email === "string" ? data.email : null;
    return { isLoggedIn: true, role: role as UserRole, email: user };
  } catch {
    return { isLoggedIn: false, role: null, email: null };
  }
}

function setStoredAuth(role: UserRole | null, username?: string) {
  try {
    if (role == null) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      // keep both keys for backward compatibility
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role, username: username ?? undefined, email: username ?? undefined }));
    }
  } catch {
    // ignore
  }
}

export default function App() {
  const initialAuth = getStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(() => initialAuth.isLoggedIn);
  const [role, setRole] = useState<UserRole | null>(() => initialAuth.role);
  const [email, setEmail] = useState<string | null>(() => initialAuth.email);
  const [currentPage, setCurrentPage] = useState(() =>
    initialAuth.role === "resident" ? "resident" : "dashboard"
  );
  const [displayName, setDisplayName] = useState<string>(() => initialAuth.email ?? "");
  const [showCreateFee, setShowCreateFee] = useState(false);
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const normalizeLocalDate = (d: unknown): string | undefined => {
    if (d == null) return undefined;
    if (typeof d === "string") {
      const s = d.trim();
      if (!s) return undefined;
      return s.length >= 10 ? s.slice(0, 10) : s;
    }
    if (Array.isArray(d) && d.length >= 3) {
      const y = Number(d[0]);
      const m = Number(d[1]);
      const day = Number(d[2]);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return undefined;
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return undefined;
  };

  const mapFeeResponse = (data: any[]): FeeItem[] =>
    data.map((f) => {
      const ctRaw = f.chargeType ?? f.charge_type;
      let chargeType: FeeItem["chargeType"] = "per_apartment";
      if (ctRaw === "per_resident") chargeType = "per_resident";
      else if (ctRaw === "per_vehicle") chargeType = "per_vehicle";
      return {
      id: f.id ?? f.maKhoanThu,
      name: f.name ?? f.tenKhoanThu,
      type: (f.type ?? f.loaiKhoanThu) === 0 ? "mandatory" : "voluntary",
      amount: String(f.amount ?? f.soTien ?? 0),
      unit: "VNĐ",
      chargeType,
      vehicleRateMotorcycle: f.vehicleRateMotorcycle ?? f.vehicle_rate_motorcycle ?? undefined,
      vehicleRateCar: f.vehicleRateCar ?? f.vehicle_rate_car ?? undefined,
      vehicleRateBicycle: f.vehicleRateBicycle ?? f.vehicle_rate_bicycle ?? undefined,
      deadline: f.deadline ?? f.hanNop ?? "",
      status: "active",
      collected: 0,
      total: 0,
      note: "",
      frequency: f.frequency ?? "one_time",
      startDate: normalizeLocalDate(f.startDate) ?? undefined,
      endDate: normalizeLocalDate(f.endDate) ?? undefined,
    };
    });

  const mapPaymentResponse = (data: any[]): Payment[] =>
    data.map((p: any) => ({
      id: p.id ?? 0,
      feeId: p.feeId ?? p.fee?.id ?? 0,
      feeName: p.feeName ?? p.fee?.name ?? "",
      roundId: p.roundId ?? null,
      householdId: String(p.householdId ?? ""),
      householdHead: p.payerName ?? p.householdHead ?? "",
      amount: Number(p.amount ?? 0),
      date: p.paymentDate ?? p.date ?? "",
    }));

  useEffect(() => {
    fetchFees()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setFees(mapFeeResponse(data));
      })
      .catch(() => {});

    fetchPayments()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setPayments(mapPaymentResponse(data));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadName() {
      if (!isLoggedIn || !email) {
        setDisplayName("");
        return;
      }
      try {
        const data = await fetchAccountByUsername(email);
        if (cancelled) return;
        const name = String((data as any)?.fullName ?? "").trim();
        setDisplayName(name || String((data as any)?.username ?? "").trim() || email);
      } catch {
        if (cancelled) return;
        setDisplayName(email);
      }
    }
    loadName();
    return () => {
      cancelled = true;
    };
  }, [email, isLoggedIn]);

  // Guard: cư dân chỉ được ở trang cổng cư dân.
  useEffect(() => {
    if (!isLoggedIn || !role) return;
    if (role !== "resident") return;
    if (currentPage !== "resident") {
      setCurrentPage("resident");
    }
  }, [currentPage, isLoggedIn, role]);

  const refreshFees = () => {
    fetchFees()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setFees(mapFeeResponse(data));
      })
      .catch(() => {});
  };

  const handleAddFee = (data: {
    name: string;
    type: "mandatory" | "voluntary";
    amount: string;
    unit: string;
    deadline: string;
    note: string;
    chargeType?: "per_apartment" | "per_resident" | "per_vehicle";
    frequency?: string;
    startDate?: string;
    endDate?: string;
    vehicleRateMotorcycle?: number;
    vehicleRateCar?: number;
    vehicleRateBicycle?: number;
  }) => {
    const amountNumber = Number(data.amount || "0");
    const chargeType = data.chargeType ?? "per_apartment";
    const freq = data.frequency ?? "one_time";
    setFees((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((f) => f.id)) + 1 : 1;
      const newFee: FeeItem = {
        id: nextId,
        name: data.name,
        type: data.type,
        amount: chargeType === "per_vehicle" ? "0" : data.amount,
        unit: data.unit || "VNĐ",
        chargeType,
        vehicleRateMotorcycle: data.vehicleRateMotorcycle,
        vehicleRateCar: data.vehicleRateCar,
        vehicleRateBicycle: data.vehicleRateBicycle,
        deadline: data.deadline,
        status: "active",
        collected: 0,
        total: 0,
        note: data.note,
        frequency: freq as FeeItem["frequency"],
        startDate: data.startDate,
        endDate: data.endDate,
      };
      return [newFee, ...prev];
    });
    // Ghi xuống backend nếu đang chạy
    createFee({
      name: data.name,
      amount: chargeType === "per_vehicle" ? 0 : amountNumber,
      type: data.type,
      chargeType,
      deadline: data.deadline || undefined,
      frequency: freq,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      vehicleRateMotorcycle:
        chargeType === "per_vehicle" ? (data.vehicleRateMotorcycle ?? null) : null,
      vehicleRateCar: chargeType === "per_vehicle" ? (data.vehicleRateCar ?? null) : null,
      vehicleRateBicycle: chargeType === "per_vehicle" ? (data.vehicleRateBicycle ?? null) : null,
    })
      .then(() => refreshFees())
      .catch(() => {
        // nếu lỗi backend thì vẫn giữ state FE
      });
    toast.success("Tạo khoản thu thành công", { description: data.name });
  };

  const handleAddPayment = (data: {
    fee: FeeItem;
    roundId: number;
    householdId: string;
    householdHead: string;
    amount: number;
    date: string;
  }) => {
    setPayments((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const payment: Payment = {
        id: nextId,
        feeId: data.fee.id,
        feeName: data.fee.name,
        householdId: data.householdId,
        householdHead: data.householdHead,
        amount: data.amount,
        date: data.date,
      };
      return [...prev, payment];
    });
    // ghi nhận xuống backend nếu có
    createPayment({
      feeId: data.fee.id,
      roundId: data.roundId,
      householdId: Number(data.householdId) || 0,
      payerName: data.householdHead,
      amount: data.amount,
      date: data.date,
    })
      .then(() => {
        // Sau khi lưu backend thành công, tải lại danh sách thu phí để có dữ liệu đầy đủ
        fetchPayments()
          .then((list: any[]) => {
            if (!Array.isArray(list)) return;
            setPayments(mapPaymentResponse(list));
          })
          .catch(() => {});
      })
      .catch(() => {
        // nếu lỗi backend, vẫn giữ state FE (đã thêm vào prev ở trên)
      });
  };

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardScreen
            fees={fees}
            payments={payments}
            canManageFees={role === "accountant"}
            onCreateFee={() => setShowCreateFee(true)}
            onCollectPayment={() => setShowCollectPayment(true)}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      case "statistics":
        return <StatisticsScreen fees={fees} payments={payments} />;
      case "residents":
        return <ResidentScreen />;
      case "search":
        return <SearchScreen />;
      case "settings":
        return (
          <SettingsScreen
            currentEmail={email}
            onProfileSaved={(info) => {
              if (!info) return;
              if (info.username && info.username !== email && role) {
                setEmail(info.username);
                setStoredAuth(role, info.username);
              }
              const label = (info.fullName ?? "").trim() || info.username || email || "";
              if (label) setDisplayName(label);
            }}
          />
        );
      case "apartments":
        return <ApartmentScreen />;
      case "fees":
        return (
          <FeeScreen
            fees={fees}
            payments={payments}
            canManageFees={role === "accountant"}
            onCreateFee={() => setShowCreateFee(true)}
            onCollectPayment={() => setShowCollectPayment(true)}
            onRefreshFees={refreshFees}
            currentEmail={email}
          />
        );
      case "resident":
        return <ResidentPortalScreen username={email ?? ""} />;
      default:
        return null;
    }
  };

  if (!isLoggedIn || !role) {
    return (
      <LoginScreen
        onLogin={(loginRole, loginEmail) => {
          setRole(loginRole);
          setIsLoggedIn(true);
          setEmail(loginEmail);
          setStoredAuth(loginRole, loginEmail);
          setCurrentPage(loginRole === "resident" ? "resident" : "dashboard");
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 text-[#1A1A2E] antialiased selection:bg-[#6F6AF8]/20">
      <Sidebar
        active={currentPage}
        role={role}
        displayName={displayName}
        onNavigate={(page) => setCurrentPage(page)}
        onLogout={() => {
          toast.info("Đã đăng xuất thành công");
          setIsLoggedIn(false);
          setRole(null);
          setEmail(null);
          setDisplayName("");
          setStoredAuth(null);
          setCurrentPage("dashboard");
        }}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#F8F9FE] via-[#F2F2FD] to-[#E8EBF8]">
        {renderContent()}
      </main>

      {/* Dialogs */}
      {showCreateFee && (
        <CreateFeeWizardDialog
          onClose={() => setShowCreateFee(false)}
          onSubmit={(data) => {
            handleAddFee(data);
            setShowCreateFee(false);
          }}
        />
      )}
      {showCollectPayment && (
        <CollectPaymentDialog
          fees={fees}
          onSubmit={handleAddPayment}
          onClose={() => setShowCollectPayment(false)}
        />
      )}
    </div>
  );
}
