import { Home, Building2, Users, Wallet, BarChart3, Settings, LogOut } from "lucide-react";
import type { UserRole } from "../types";

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  role: UserRole;
}

const menuItems = [
  { id: "dashboard", label: "Trang chủ", icon: Home },
  { id: "apartments", label: "Căn hộ", icon: Building2 },
  { id: "residents", label: "Cư dân", icon: Users },
  { id: "fees", label: "Khoản thu", icon: Wallet },
  { id: "statistics", label: "Thống kê", icon: BarChart3 },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const getRoleDisplay = (role: UserRole) => {
  if (role === "accountant") return "Kế toán";
  if (role === "leader") return "Tổ trưởng";
  return "Tổ phó";
};

const getMenuForRole = (role: UserRole) => {
  // Kế toán: tập trung thu phí, thống kê
  if (role === "accountant") {
    return menuItems;
  }
  // Tổ trưởng / Tổ phó: quản lý cư dân, căn hộ, xem thống kê, không cấu hình khoản thu
  return menuItems.filter((m) => m.id !== "fees");
};

export function Sidebar({ active, onNavigate, onLogout, role }: SidebarProps) {
  const items = getMenuForRole(role);

  return (
    <div
      className="flex flex-col h-full w-[250px] min-w-[250px]"
      style={{ background: "#6F6AF8", color: "#fff" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Building2 size={22} className="text-white" />
        </div>
        <span className="text-xl" style={{ fontWeight: 700 }}>BlueMoon</span>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-b border-white/20">
        <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
          NV
        </div>
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>Nguyễn Văn A</div>
          <div className="text-xs opacity-70">{getRoleDisplay(role)}</div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left w-full"
              style={{
                background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: "0.9rem",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all w-full text-left hover:bg-white/10"
          style={{ fontSize: "0.9rem" }}
        >
          <LogOut size={20} strokeWidth={1.5} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
