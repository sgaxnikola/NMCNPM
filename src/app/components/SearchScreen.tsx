import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { searchGlobal } from "../api";

type SearchData = Awaited<ReturnType<typeof searchGlobal>>;

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchData | null>(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Nhập từ khóa tìm kiếm");
      return;
    }
    setLoading(true);
    try {
      const data = await searchGlobal(q);
      setResult(data);
      if (
        !data.households?.length &&
        !data.residents?.length &&
        !data.fees?.length &&
        !data.vehicles?.length
      ) {
        toast.info("Không tìm thấy kết quả");
      }
    } catch (err) {
      toast.error("Tìm kiếm thất bại", {
        description: err instanceof Error ? err.message : "Lỗi không xác định",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="border-b border-[#E2E4F0] bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl" style={{ fontWeight: 700, color: "#1A1A2E" }}>
          Tìm kiếm
        </h1>
        <p className="text-sm mt-1" style={{ color: "#717182" }}>
          Hộ khẩu, nhân khẩu, khoản phí, phương tiện (biển số / căn hộ).
        </p>
      </div>

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#CFCFEF" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nhập tên, căn hộ, CCCD, biển số, tên khoản thu..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              style={{ borderColor: "#CFCFEF", borderRadius: 6 }}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 text-white rounded-md text-sm disabled:opacity-60"
            style={{ background: "#6F6AF8", fontWeight: 600 }}
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            <Section title={`Hộ khẩu (${result.households?.length ?? 0})`}>
              {(result.households ?? []).length === 0 ? (
                <Empty />
              ) : (
                <ul className="text-sm space-y-1">
                  {result.households.map((h) => (
                    <li key={h.id}>
                      <strong>{h.address}</strong> — Mã hộ {h.id}
                      {h.headName ? ` — Chủ hộ: ${h.headName}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Nhân khẩu (${result.residents?.length ?? 0})`}>
              {(result.residents ?? []).length === 0 ? (
                <Empty />
              ) : (
                <ul className="text-sm space-y-1">
                  {result.residents.map((r) => (
                    <li key={r.id}>
                      {r.fullName} — Hộ {r.householdId ?? "—"}
                      {r.cccd ? ` — CCCD: ${r.cccd}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Khoản phí (${result.fees?.length ?? 0})`}>
              {(result.fees ?? []).length === 0 ? (
                <Empty />
              ) : (
                <ul className="text-sm space-y-1">
                  {result.fees.map((f) => (
                    <li key={f.id}>
                      {f.name} — {Number(f.amount ?? 0).toLocaleString("vi-VN")} VNĐ
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Phương tiện (${result.vehicles?.length ?? 0})`}>
              {(result.vehicles ?? []).length === 0 ? (
                <Empty />
              ) : (
                <ul className="text-sm space-y-1">
                  {result.vehicles.map((v) => (
                    <li key={v.id}>
                      {v.type} — {v.plate || "Không biển số"} — {v.apartment || `Hộ ${v.householdId}`}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-4" style={{ borderColor: "#E6E6FA" }}>
      <div className="text-sm mb-2" style={{ fontWeight: 600, color: "#1A1A2E" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm" style={{ color: "#717182" }}>Không có dữ liệu.</p>;
}
