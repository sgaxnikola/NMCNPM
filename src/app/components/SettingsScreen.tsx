import { useEffect, useState } from "react";
import { Pencil, Save, Building2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { changePassword, fetchAccountByUsername } from "../api";
import type { UserRole } from "../types";

interface SettingsScreenProps {
  currentEmail: string | null;
}

export function SettingsScreen({ currentEmail }: SettingsScreenProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; email: string; role: UserRole | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!currentEmail) {
        setProfile(null);
        return;
      }
      setProfileLoading(true);
      try {
        const data = await fetchAccountByUsername(currentEmail);
        if (cancelled) return;
        const rawRole = (data?.role ?? "").toLowerCase();
        const role: UserRole =
          rawRole === "leader" ? "leader" : rawRole === "viceleader" || rawRole === "vice_leader" ? "viceLeader" : "accountant";
        setProfile({
          fullName: (data?.fullName ?? "").trim() || currentEmail,
          email: (data?.username ?? currentEmail).trim().toLowerCase(),
          role,
        });
      } catch {
        if (cancelled) return;
        setProfile({
          fullName: currentEmail,
          email: currentEmail.trim().toLowerCase(),
          role: null,
        });
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentEmail]);

  const handleChangePassword = async () => {
    if (!currentEmail) {
      toast.error("Không xác định được tài khoản hiện tại");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin", { description: "Cần nhập mật khẩu hiện tại, mật khẩu mới và xác nhận." });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới quá ngắn", { description: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePassword({
        email: currentEmail,
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      toast.error("Đổi mật khẩu thất bại", { description: message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#F2F2FD" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: "#CFCFEF" }}>
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Cài đặt</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4 max-w-3xl">
        {/* Personal Info */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={18} style={{ color: "#6F6AF8" }} />
              <h3 style={{ fontWeight: 600, color: "#1A1A2E" }}>Thông tin cá nhân</h3>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#6F6AF8", fontWeight: 500 }}
            >
              <Pencil size={14} /> {isEditingProfile ? "Hủy" : "Chỉnh sửa"}
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm" style={{ color: "#717182" }}>Họ tên:</label>
              {isEditingProfile ? (
                <input
                  defaultValue={profile?.fullName ?? ""}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  disabled
                />
              ) : (
                <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>
                  {profileLoading ? "Đang tải..." : (profile?.fullName ?? "—")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm" style={{ color: "#717182" }}>Email:</label>
              {isEditingProfile ? (
                <input
                  defaultValue={profile?.email ?? ""}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  disabled
                />
              ) : (
                <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>
                  {profileLoading ? "Đang tải..." : (profile?.email ?? currentEmail ?? "—")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm" style={{ color: "#717182" }}>Vai trò:</label>
              <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ background: "#6F6AF815", color: "#6F6AF8", fontWeight: 500 }}>
                {profileLoading ? "Đang tải..." : (profile?.role === "leader" ? "Tổ trưởng" : profile?.role === "viceLeader" ? "Tổ phó" : "Kế toán")}
              </span>
            </div>
            {isEditingProfile && (
              <button
                className="flex items-center gap-1 px-4 py-2 text-white rounded-md text-sm mt-2 opacity-60 cursor-not-allowed"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
                disabled
                title="Chưa hỗ trợ sửa thông tin cá nhân trong phiên bản này"
              >
                <Save size={14} /> Lưu thay đổi
              </button>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} style={{ color: "#6F6AF8" }} />
            <h3 style={{ fontWeight: 600, color: "#1A1A2E" }}>Đổi mật khẩu</h3>
          </div>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-3 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full px-3 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "#717182", fontWeight: 500 }}>Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3 py-2 border rounded-md text-sm"
                style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isSavingPassword}
              className="flex items-center gap-1 px-4 py-2 text-white rounded-md text-sm disabled:opacity-60"
              style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
            >
              <Save size={14} /> {isSavingPassword ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {/* Building Info */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#CFCFEF", borderRadius: 8 }}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} style={{ color: "#6F6AF8" }} />
            <h3 style={{ fontWeight: 600, color: "#1A1A2E" }}>Thông tin chung cư</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Tên tòa nhà:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>Chung cư BlueMoon</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Địa chỉ:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>Ngã tư Văn Phú, Hà Đông, Hà Nội</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Số tầng:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>30 (1 tầng kiot, 4 tầng đế, 24 tầng nhà ở, 1 tầng penthouse)</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Diện tích xây dựng:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>450 m²</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Năm hoàn thành:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>2023</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm" style={{ color: "#717182" }}>Tổng số căn hộ:</label>
              <span className="text-sm" style={{ color: "#1A1A2E", fontWeight: 500 }}>576</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
