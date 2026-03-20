import { useState } from "react";
import { Building2, Eye, EyeOff, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { UserRole } from "../types";
import { loginAccount, registerAccount } from "../api";

interface LoginScreenProps {
  onLogin: (role: UserRole, email: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"Kế toán" | "Tổ trưởng" | "Tổ phó">("Kế toán");
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const roles: Array<"Kế toán" | "Tổ trưởng" | "Tổ phó"> = ["Kế toán", "Tổ trưởng", "Tổ phó"];

  const mapDisplayRoleToValue = (display: "Kế toán" | "Tổ trưởng" | "Tổ phó"): UserRole => {
    if (display === "Kế toán") return "accountant";
    if (display === "Tổ trưởng") return "leader";
    return "viceLeader";
  };

  const validateLogin = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const result = await loginAccount({ email, password });
      const userRole = result.role;
      const displayRole = roles.find((r) => mapDisplayRoleToValue(r) === userRole) ?? userRole;
      toast.success("Đăng nhập thành công", { description: `Xin chào, vai trò: ${displayRole}` });
      onLogin(userRole, email.trim().toLowerCase());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      toast.error("Đăng nhập thất bại", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const mappedRole = mapDisplayRoleToValue(role);
      await registerAccount({ email, password, role: mappedRole });
      toast.success("Đăng ký thành công", { description: "Tài khoản đã được lưu trên hệ thống. Bạn có thể đăng nhập ngay." });
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng ký thất bại";
      toast.error("Đăng ký thất bại", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = () => {
    const e = email.trim();
    if (!e) {
      setErrors({ email: "Vui lòng nhập email" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setErrors({ email: "Email không hợp lệ" });
      return;
    }
    setErrors({});
    toast.info("Chức năng quên mật khẩu đang được phát triển trên phiên bản này.");
  };

  const handleForgotStep2 = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu mới";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    toast.info("Chức năng quên mật khẩu đang được phát triển trên phiên bản này.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "register") handleRegister();
      else if (mode === "forgot") { forgotStep === 1 ? handleForgotStep1() : handleForgotStep2(); }
    }
  };

  const goBackToLogin = () => {
    setMode("login");
    setForgotStep(1);
    setForgotEmail("");
    setErrors({});
  };

  return (
    <div className="flex h-full w-full">
      {/* Left - Illustration */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6F6AF8 0%, #4a45c2 100%)" }}
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1762902858673-cd9d7432bf9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMHB1cnBsZSUyMG5pZ2h0fGVufDF8fHx8MTc3MzQwMzk4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Apartment building"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center text-white px-10">
          <Building2 size={80} className="mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl mb-3" style={{ fontWeight: 700 }}>BlueMoon</h1>
          <p className="text-lg opacity-80">Phần mềm Quản lý Thu phí Chung cư</p>
          <p className="text-sm opacity-60 mt-2">Ngã tư Văn Phú, Hà Đông, Hà Nội</p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center" style={{ background: "#F2F2FD" }}>
        <div className="w-full max-w-sm px-8" onKeyDown={handleKeyDown}>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#6F6AF8" }}>
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-lg" style={{ fontWeight: 700, color: "#1A1A2E" }}>BlueMoon</span>
          </div>

          {/* Form Quên mật khẩu */}
          {mode === "forgot" ? (
            <>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: "#1A1A2E" }}>Quên mật khẩu</h2>
              <p className="text-sm mb-6" style={{ color: "#717182" }}>
                {forgotStep === 1 ? "Nhập email đã đăng ký để đặt lại mật khẩu." : "Đặt mật khẩu mới cho tài khoản của bạn."}
              </p>
              {forgotStep === 1 ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: undefined })); }}
                      placeholder="Nhập email đã đăng ký"
                      className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2"
                      style={{ borderColor: errors.email ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                    />
                    {errors.email && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.email}</p>}
                  </div>
                  <button
                    onClick={handleForgotStep1}
                    disabled={loading}
                    className="w-full py-2.5 text-white rounded-md transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Đang xử lý..." : "Tiếp tục"}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Email</label>
                    <p className="px-3 py-2 bg-gray-100 rounded-md text-sm" style={{ color: "#1A1A2E" }}>{forgotEmail}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Mật khẩu mới</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2 pr-10"
                        style={{ borderColor: errors.password ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "#6F6AF8" }}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.password}</p>}
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2"
                      style={{ borderColor: errors.confirmPassword ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                    />
                    {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.confirmPassword}</p>}
                  </div>
                  <button
                    onClick={handleForgotStep2}
                    disabled={loading}
                    className="w-full py-2.5 text-white rounded-md transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </button>
                </>
              )}
              <div className="mt-4">
                <button type="button" className="text-sm hover:underline" style={{ color: "#6F6AF8" }} onClick={goBackToLogin}>Quay lại đăng nhập</button>
              </div>
            </>
          ) : (
          <>
          <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: "#1A1A2E" }}>
            {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
          </h2>

          {/* Role Dropdown (chỉ khi đăng ký) */}
          {mode === "register" && (
          <div className="mb-4">
            <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Vai trò</label>
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                onBlur={() => setTimeout(() => setShowRoleDropdown(false), 150)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left"
                style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
                aria-expanded={showRoleDropdown}
                aria-haspopup="listbox"
              >
                <span style={{ color: "#1A1A2E" }}>{role}</span>
                <ChevronDown size={16} style={{ color: "#6F6AF8" }} className={`transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-full left-0 w-full bg-white border rounded-md mt-1 z-10 shadow-lg" style={{ borderColor: "#CFCFEF", borderRadius: 6 }} role="listbox">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setShowRoleDropdown(false); }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      style={{ color: "#1A1A2E", background: r === role ? "#F2F2FD" : undefined }}
                      role="option"
                      aria-selected={r === role}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
              placeholder="Nhập email của bạn"
              className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2"
              style={{ borderColor: errors.email ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="Nhập mật khẩu"
                className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2 pr-10"
                style={{ borderColor: errors.password ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                aria-invalid={!!errors.password}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#6F6AF8" }}
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.password}</p>}
          </div>

          {/* Confirm Password (chỉ khi đăng ký) */}
          {mode === "register" && (
            <div className="mb-6">
              <label className="block text-sm mb-1.5" style={{ color: "#1A1A2E", fontWeight: 500 }}>Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-3 py-2.5 bg-white border rounded-md outline-none focus:ring-2"
                  style={{ borderColor: errors.confirmPassword ? "#F44336" : "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: "#F44336" }}>{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full py-2.5 text-white rounded-md transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#6F6AF8", borderRadius: 6, fontWeight: 600 }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading
              ? (mode === "login" ? "Đang đăng nhập..." : "Đang đăng ký...")
              : (mode === "login" ? "Đăng nhập" : "Đăng ký")}
          </button>

          {/* Links */}
          <div className="flex justify-between mt-4">
            {mode === "login" ? (
              <>
                <button type="button" className="text-sm hover:underline" style={{ color: "#6F6AF8" }} onClick={() => { setMode("forgot"); setErrors({}); setForgotStep(1); }}>Quên mật khẩu?</button>
                <button type="button" className="text-sm hover:underline" style={{ color: "#6F6AF8" }} onClick={() => { setMode("register"); setErrors({}); }}>Đăng ký tài khoản</button>
              </>
            ) : (
              <button type="button" className="text-sm hover:underline" style={{ color: "#6F6AF8" }} onClick={() => { setMode("login"); setErrors({}); setConfirmPassword(""); }}>Đã có tài khoản? Đăng nhập</button>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
