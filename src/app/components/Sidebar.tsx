import { Home, Building2, Users, Wallet, BarChart3, Settings, LogOut, User, Search } from "lucide-react";
import type { UserRole } from "../types";

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  role: UserRole;
  displayName: string;
}

const menuItems = [
  { id: "dashboard", label: "Trang chủ", icon: Home },
  { id: "apartments", label: "Căn hộ", icon: Building2 },
  { id: "residents", label: "Cư dân", icon: Users },
  { id: "search", label: "Tìm kiếm", icon: Search },
  { id: "fees", label: "Khoản thu", icon: Wallet },
  { id: "statistics", label: "Thống kê", icon: BarChart3 },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const getRoleDisplay = (role: UserRole) => {
  if (role === "accountant") return "Kế toán";
  if (role === "leader") return "Tổ trưởng";
  if (role === "resident") return "Cư dân";
  return "Tổ phó";
};

const getMenuForRole = (role: UserRole) => {
  if (role === "resident") {
    return [{ id: "resident", label: "Cổng cư dân", icon: User }];
  }
  if (role === "accountant") {
    return menuItems;
  }
  return menuItems.filter((m) => m.id !== "fees");
};

function getInitials(name: string) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "—";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts[0]?.[0] ?? "";
  const two = (parts.length >= 2 ? parts[parts.length - 2]?.[0] ?? "" : first) + last;
  return two.toUpperCase();
}

export function Sidebar({ active, onNavigate, onLogout, role, displayName }: SidebarProps) {
  const items = getMenuForRole(role);

  return (
    <aside
      className="flex h-full w-[228px] min-w-[228px] flex-col border-r border-white/10 shadow-[4px_0_24px_rgba(74,69,194,0.18)] sm:w-[240px] sm:min-w-[240px] lg:w-[260px] lg:min-w-[260px]"
      style={{
        background: "linear-gradient(165deg, #7B76FF 0%, #6F6AF8 38%, #4E49C4 100%)",
        color: "#fff",
      }}
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-inner ring-1 ring-white/20">
          <Building2 size={22} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <span className="block text-lg tracking-tight" style={{ fontWeight: 800 }}>
            BlueMoon
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">Quản lý chung cư</span>
        </div>
      </div>

      <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm ring-2 ring-white/25"
          style={{ fontWeight: 700 }}
        >
          {getInitials(displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm" style={{ fontWeight: 600 }}>
            {displayName || "—"}
          </div>
          <div className="truncate text-xs text-white/70">{getRoleDisplay(role)}</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.9rem] transition-all duration-200"
              style={{
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "rgba(255,255,255,0.22)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.28)" : undefined,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{
                  background: isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-6 pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.9rem] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <LogOut size={18} strokeWidth={1.75} />
          </span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
