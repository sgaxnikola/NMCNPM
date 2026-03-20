import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { DashboardScreen } from "./components/DashboardScreen";
import { CreateFeeDialog } from "./components/CreateFeeDialog";
import { CollectPaymentDialog } from "./components/CollectPaymentDialog";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { ResidentScreen } from "./components/ResidentScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { ApartmentScreen } from "./components/ApartmentScreen";
import { FeeScreen } from "./components/FeeScreen";
import type { FeeItem, Payment, UserRole } from "./types";
import { createFee, createPayment, fetchFees, fetchPayments } from "./api";

const AUTH_STORAGE_KEY = "bluemoon_auth";
const validRoles: UserRole[] = ["accountant", "leader", "viceLeader"];

function getStoredAuth(): { isLoggedIn: boolean; role: UserRole | null; email: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isLoggedIn: false, role: null, email: null };
    const data = JSON.parse(raw) as { role?: string; email?: string };
    const role = data?.role;
    if (typeof role !== "string" || !validRoles.includes(role as UserRole))
      return { isLoggedIn: false, role: null, email: null };
    return { isLoggedIn: true, role: role as UserRole, email: typeof data?.email === "string" ? data.email : null };
  } catch {
    return { isLoggedIn: false, role: null, email: null };
  }
}

function setStoredAuth(role: UserRole | null, email?: string) {
  try {
    if (role == null) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role, email: email ?? undefined }));
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
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showCreateFee, setShowCreateFee] = useState(false);
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchFees()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: FeeItem[] = data.map((f) => ({
          id: f.id ?? f.maKhoanThu,
          name: f.name ?? f.tenKhoanThu,
          type: (f.type ?? f.loaiKhoanThu) === 0 ? "mandatory" : "voluntary",
          amount: String(f.amount ?? f.soTien ?? 0),
          unit: "VNĐ",
          chargeType: (f.chargeType === "per_resident" ? "per_resident" : "per_apartment") as FeeItem["chargeType"],
          deadline: f.deadline ?? f.hanNop ?? "",
          status: "active",
          collected: 0,
          total: 0,
          note: "",
        }));
        setFees(mapped);
      })
      .catch(() => {});

    fetchPayments()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Payment[] = data.map((p: any) => ({
          id: p.id ?? 0,
          feeId: p.feeId ?? p.fee?.id ?? 0,
          feeName: p.feeName ?? p.fee?.name ?? "",
          roundId: p.roundId ?? null,
          householdId: String(p.householdId ?? ""),
          householdHead: p.payerName ?? p.householdHead ?? "",
          amount: Number(p.amount ?? 0),
          date: p.paymentDate ?? p.date ?? "",
        }));
        setPayments(mapped);
      })
      .catch(() => {});
  }, []);

  const refreshFees = () => {
    fetchFees()
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: FeeItem[] = data.map((f) => ({
          id: f.id ?? f.maKhoanThu,
          name: f.name ?? f.tenKhoanThu,
          type: (f.type ?? f.loaiKhoanThu) === 0 ? "mandatory" : "voluntary",
          amount: String(f.amount ?? f.soTien ?? 0),
          unit: "VNĐ",
          chargeType: (f.chargeType === "per_resident" ? "per_resident" : "per_apartment") as FeeItem["chargeType"],
          deadline: f.deadline ?? f.hanNop ?? "",
          status: "active",
          collected: 0,
          total: 0,
          note: "",
        }));
        setFees(mapped);
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
    chargeType?: "per_apartment" | "per_resident";
  }) => {
    const amountNumber = Number(data.amount || "0");
    const chargeType = data.chargeType ?? "per_apartment";
    setFees((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((f) => f.id)) + 1 : 1;
      const newFee: FeeItem = {
        id: nextId,
        name: data.name,
        type: data.type,
        amount: data.amount,
        unit: data.unit || "VNĐ",
        chargeType,
        deadline: data.deadline,
        status: "active",
        collected: 0,
        total: 0,
        note: data.note,
      };
      return [newFee, ...prev];
    });
    // Ghi xuống backend nếu đang chạy
    if (!Number.isNaN(amountNumber) && amountNumber > 0) {
      createFee({
        name: data.name,
        amount: amountNumber,
        type: data.type,
        chargeType,
        deadline: data.deadline || undefined,
      }).catch(() => {
        // nếu lỗi backend thì vẫn giữ state FE
      });
    }
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
            setPayments(
              list.map((p: any) => ({
                id: p.id ?? 0,
                feeId: p.feeId ?? p.fee?.id ?? 0,
                feeName: p.feeName ?? p.fee?.name ?? "",
                roundId: p.roundId ?? null,
                householdId: String(p.householdId ?? ""),
                householdHead: p.payerName ?? p.householdHead ?? "",
                amount: Number(p.amount ?? 0),
                date: p.paymentDate ?? p.date ?? "",
              }))
            );
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
      case "settings":
        return <SettingsScreen currentEmail={email} />;
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
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar
        active={currentPage}
        role={role}
        onNavigate={(page) => setCurrentPage(page)}
        onLogout={() => {
          toast.info("Đã đăng xuất thành công");
          setIsLoggedIn(false);
          setRole(null);
          setEmail(null);
          setStoredAuth(null);
          setCurrentPage("dashboard");
        }}
      />
      {renderContent()}

      {/* Dialogs */}
      {showCreateFee && (
        <CreateFeeDialog
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
