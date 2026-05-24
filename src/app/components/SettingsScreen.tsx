import { useEffect, useState } from "react";
import { Pencil, Save, Building2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { changePassword, fetchAccountByUsername, updateAccountProfile } from "../api";
import type { UserRole } from "../types";

interface SettingsScreenProps {
  currentEmail: string | null;
  onProfileSaved?: (info: { username: string; fullName: string }) => void;
}

export function SettingsScreen({ currentEmail, onProfileSaved }: SettingsScreenProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; email: string; role: UserRole | null } | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
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
          rawRole === "resident"
            ? "resident"
            : rawRole === "leader"
              ? "leader"
              : rawRole === "viceleader" || rawRole === "vice_leader"
                ? "viceLeader"
                : "accountant";
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

  useEffect(() => {
    if (isEditingProfile && profile) {
      setEditFullName(profile.fullName);
      setEditEmail(profile.email);
    }
  }, [isEditingProfile, profile]);

  const handleSaveProfile = async () => {
    if (!currentEmail) {
      toast.error("Không xác định được tài khoản hiện tại");
      return;
    }
    const nextEmail = editEmail.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@")) {
      toast.error("Email không hợp lệ", { description: "Vui lòng nhập địa chỉ email đúng định dạng." });
      return;
    }
    setIsSavingProfile(true);
    try {
      const data = await updateAccountProfile({
        username: currentEmail,
        fullName: editFullName,
        newUsername: nextEmail,
      });
      const rawRole = (data?.role ?? "").toLowerCase();
      const role: UserRole =
        rawRole === "resident"
          ? "resident"
          : rawRole === "leader"
            ? "leader"
            : rawRole === "viceleader" || rawRole === "vice_leader"
              ? "viceLeader"
              : "accountant";
      const savedUser = (data?.username ?? nextEmail).trim().toLowerCase();
      const savedName = (data?.fullName ?? editFullName).trim() || savedUser;
      setProfile({
        fullName: savedName,
        email: savedUser,
        role,
      });
      setIsEditingProfile(false);
      onProfileSaved?.({ username: savedUser, fullName: savedName });
      toast.success("Đã lưu thông tin cá nhân");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu thất bại";
      toast.error("Không lưu được thông tin", { description: message });
    } finally {
      setIsSavingProfile(false);
    }
  };

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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E4F0] bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>Cài đặt</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4 max-w-3xl">
        {/* Personal Info */}
        <div className="bm-card bm-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={18} style={{ color: "#6F6AF8" }} />
              <h3 style={{ fontWeight: 600, color: "#1A1A2E" }}>Thông tin cá nhân</h3>
            </div>
            <button
              type="button"
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
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  placeholder="Họ và tên"
                  maxLength={100}
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
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  placeholder="Email đăng nhập"
                  maxLength={50}
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
                {profileLoading
                  ? "Đang tải..."
                  : profile?.role === "leader"
                    ? "Tổ trưởng"
                    : profile?.role === "viceLeader"
                      ? "Tổ phó"
                      : profile?.role === "resident"
                        ? "Cư dân"
                        : "Kế toán"}
              </span>
            </div>
            {isEditingProfile && (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile || profileLoading}
                className="flex items-center gap-1 px-4 py-2 text-white rounded-md text-sm mt-2 disabled:opacity-60"
                style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 500 }}
              >
                <Save size={14} /> {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bm-card bm-card-hover p-6">
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
        <div className="bm-card bm-card-hover p-6">
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
