import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { confirmOnlinePayment, createOnlinePayment, fetchResidentPortalSummary } from "../api";

interface ResidentPortalScreenProps {
  username: string;
}

export function ResidentPortalScreen({ username }: ResidentPortalScreenProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [customPayByFeeId, setCustomPayByFeeId] = useState<Record<number, string>>({});

  const digitsOnly = (s: string) => (s ?? "").replace(/\D/g, "");
  const formatVnd = (s: string) => {
    const d = digitsOnly(s);
    if (!d) return "";
    return Number(d).toLocaleString("vi-VN");
  };
  const parseVnd = (s: string) => {
    const d = digitsOnly(s);
    const n = Number(d || "0");
    return Number.isFinite(n) ? n : 0;
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await fetchResidentPortalSummary(username);
      setSummary(s);
    } catch (err) {
      toast.error("Không tải được cổng cư dân", { description: err instanceof Error ? err.message : "Lỗi không xác định" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fees = useMemo(() => {
    const list = Array.isArray(summary?.fees) ? summary.fees : [];
    return list as Array<{
      feeId: number;
      feeName: string;
      expectedAmount: number;
      paidAmount: number;
      remainingAmount: number;
      paid: boolean;
    }>;
  }, [summary]);

  const payments = useMemo(() => (Array.isArray(summary?.payments) ? summary.payments : []) as any[], [summary]);

  const household = summary?.household as any;
  const profile = summary?.profile as any;
  const members = (Array.isArray(summary?.members) ? summary.members : []) as any[];

  const handleOnlinePay = async (feeId: number, amount: number) => {
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Số tiền thanh toán không hợp lệ", { description: "Vui lòng nhập số tiền > 0." });
        return;
      }
      const created = await createOnlinePayment({ username, feeId, amount });
      const paymentId = Number(created?.paymentId ?? created?.id);
      toast.info("Đã tạo giao dịch online", { description: "Đang xác nhận thanh toán..." });
      if (Number.isFinite(paymentId) && paymentId > 0) {
        await confirmOnlinePayment({ username, paymentId });
        toast.success("Thanh toán thành công");
        setCustomPayByFeeId((prev) => {
          const next = { ...prev };
          delete next[feeId];
          return next;
        });
        await refresh();
      } else {
        toast.warning("Giao dịch đã tạo nhưng thiếu mã để xác nhận. Vui lòng tải lại trang.");
      }
    } catch (err) {
      toast.error("Thanh toán online thất bại", { description: err instanceof Error ? err.message : "Lỗi không xác định" });
    }
  };

  if (loading) {
    return <div className="min-h-full p-6">Đang tải...</div>;
  }

  if (!summary) {
    return <div className="min-h-full p-6">Không có dữ liệu.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="max-w-full space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-2xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>
          Cổng cư dân
        </h1>
        <p className="text-sm mt-1" style={{ color: "#717182" }}>
          Xem thông tin hộ gia đình và tình trạng các khoản thu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
          <div className="text-sm mb-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
            Thông tin cá nhân
          </div>
          <div className="text-sm" style={{ color: "#1A1A2E" }}>
            <div>
              <span style={{ color: "#717182" }}>Họ tên:</span> {profile?.fullName ?? "—"}
            </div>
            <div>
              <span style={{ color: "#717182" }}>Email:</span> {profile?.email ?? username}
            </div>
            <div>
              <span style={{ color: "#717182" }}>SĐT:</span> {profile?.phone ?? "—"}
            </div>
            <div>
              <span style={{ color: "#717182" }}>CCCD:</span> {profile?.cccd ?? "—"}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
          <div className="text-sm mb-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
            Thông tin căn hộ / hộ gia đình
          </div>
          <div className="text-sm" style={{ color: "#1A1A2E" }}>
            <div>
              <span style={{ color: "#717182" }}>Mã hộ:</span> {household?.id ?? "—"}
            </div>
            <div>
              <span style={{ color: "#717182" }}>Căn hộ:</span> {household?.address ?? "—"}
            </div>
            <div>
              <span style={{ color: "#717182" }}>Chủ hộ:</span> {household?.headName ?? "—"}
            </div>
            <div>
              <span style={{ color: "#717182" }}>Số thành viên:</span> {household?.members ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
        <div className="text-sm mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>
          Thành viên trong hộ
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr style={{ color: "#717182" }}>
                <th className="text-left py-2">Họ tên</th>
                <th className="text-left py-2">Quan hệ</th>
                <th className="text-left py-2">SĐT</th>
                <th className="text-left py-2 w-[36%]">Email</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className="py-2" colSpan={4}>
                    —
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-t" style={{ borderColor: "#F0F0FA" }}>
                    <td className="py-2">{m.fullName ?? "—"}</td>
                    <td className="py-2">{m.relationToHead ?? "—"}</td>
                    <td className="py-2">{m.phone ?? "—"}</td>
                    <td className="py-2 break-words">{m.email ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm" style={{ fontWeight: 600, color: "#1A1A2E" }}>
            Các khoản thu (đã thanh toán / chưa thanh toán)
          </div>
          <button
            className="text-sm px-3 py-1.5 rounded-md"
            style={{ background: "#F2F2FD", color: "#4a45c2", fontWeight: 600 }}
            onClick={refresh}
          >
            Làm mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr style={{ color: "#717182" }}>
                <th className="text-left py-2 w-[28%]">Khoản thu</th>
                <th className="text-right py-2">Phải nộp</th>
                <th className="text-right py-2">Đã thanh toán</th>
                <th className="text-right py-2">Còn lại</th>
                <th className="text-left py-2">Trạng thái</th>
                <th className="text-right py-2">Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr>
                  <td className="py-2" colSpan={6}>
                    —
                  </td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.feeId} className="border-t" style={{ borderColor: "#F0F0FA" }}>
                    <td className="py-2 pr-3">{f.feeName ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums px-3">{Math.round(Number(f.expectedAmount ?? 0)).toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-right tabular-nums px-3">{Math.round(Number(f.paidAmount ?? 0)).toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-right tabular-nums px-3">{Math.round(Number(f.remainingAmount ?? 0)).toLocaleString("vi-VN")}</td>
                    <td className="py-2 px-3">{f.paid ? "Đã thanh toán" : "Chưa thanh toán"}</td>
                    <td className="py-2 text-right pl-3">
                      {Number(f.expectedAmount ?? 0) <= 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            value={formatVnd(customPayByFeeId[f.feeId] ?? "")}
                            onChange={(e) =>
                              setCustomPayByFeeId((prev) => ({
                                ...prev,
                                [f.feeId]: digitsOnly(e.target.value),
                              }))
                            }
                            inputMode="numeric"
                            placeholder="Nhập số tiền"
                            className="w-[140px] px-2.5 py-1.5 border rounded-md text-sm text-right"
                            style={{ borderColor: "#CFCFEF", borderRadius: 6, color: "#1A1A2E" }}
                          />
                          <button
                            disabled={parseVnd(customPayByFeeId[f.feeId] ?? "") <= 0}
                            className="px-3 py-1.5 rounded-md disabled:opacity-50"
                            style={{ background: "#6F6AF8", color: "#fff", fontWeight: 600 }}
                            onClick={() => handleOnlinePay(f.feeId, parseVnd(customPayByFeeId[f.feeId] ?? ""))}
                          >
                            Thanh toán
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={Number(f.remainingAmount ?? 0) <= 0}
                          className="px-3 py-1.5 rounded-md disabled:opacity-50"
                          style={{ background: "#6F6AF8", color: "#fff", fontWeight: 600 }}
                          onClick={() => handleOnlinePay(f.feeId, Number(f.remainingAmount ?? 0))}
                        >
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
        <div className="text-sm mb-3" style={{ fontWeight: 600, color: "#1A1A2E" }}>
          Lịch sử thanh toán
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "#717182" }}>
                <th className="text-left py-2 pr-3">Khoản thu</th>
                <th className="text-right py-2 px-3">Số tiền</th>
                <th className="text-left py-2 px-3">Ngày</th>
                <th className="text-left py-2 px-3">Phương thức</th>
                <th className="text-left py-2 pl-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td className="py-2" colSpan={5}>
                    —
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "#F0F0FA" }}>
                    <td className="py-2 pr-3">{p.feeName ?? p.fee?.name ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums px-3">{Math.round(Number(p.amount ?? 0)).toLocaleString("vi-VN")}</td>
                    <td className="py-2 px-3">{p.paymentDate ?? p.date ?? "—"}</td>
                    <td className="py-2 px-3">{p.paymentMethod ?? "CASH"}</td>
                    <td className="py-2 pl-3">{p.paymentStatus ?? "PAID"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

