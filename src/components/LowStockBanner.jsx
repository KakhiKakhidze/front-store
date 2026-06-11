import { useState, useEffect } from "react";
import { api } from "../api";
import { AlertTriangle, ChevronDown, ChevronUp, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function LowStockBanner() {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get("/alerts").then(setData).catch(() => {});
  }, []);

  if (!data || data.count === 0 || dismissed) return null;

  const critical = data.items.filter((i) => i.current_qty < 10);
  const warning  = data.items.filter((i) => i.current_qty >= 10 && i.current_qty < 25);
  const low      = data.items.filter((i) => i.current_qty >= 25);

  return (
    <div className="rounded-xl border overflow-hidden animate-slide-up"
      style={{ borderColor: "#fde68a", background: "#fffbeb" }}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "#fef3c7" }}>
          <AlertTriangle size={15} style={{ color: "#d97706" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
            {data.count} პროდუქტს სჭირდება შეკვეთა
          </p>
          <p className="text-xs" style={{ color: "#b45309" }}>
            მარაგი 50 ერთეულზე ნაკლებია
            {critical.length > 0 && <> · <span className="font-semibold text-red-600">{critical.length} კრიტიკული</span></>}
            {warning.length > 0 && <> · <span className="font-semibold" style={{ color: "#d97706" }}>{warning.length} გაფრთხ.</span></>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/purchasing/new"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ background: "#d97706" }}
          >
            <ShoppingCart size={12} />
            მოთხოვნა
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors hover:bg-amber-100"
            style={{ color: "#92400e" }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "დახურვა" : "სია"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-amber-400 hover:bg-amber-100 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Expanded item list */}
      {expanded && (
        <div style={{ borderTop: "1px solid #fde68a" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0"
            style={{ borderColor: "#fde68a" }}>
            {data.items.map((item) => {
              const isCrit = item.current_qty < 10;
              const isWarn = item.current_qty >= 10 && item.current_qty < 25;
              return (
                <Link
                  key={item.id}
                  to="/tender/new"
                  state={{ fromAlert: item }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-100/50 transition-colors"
                  style={{ borderColor: "#fde68a" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: isCrit ? "#fee2e2" : isWarn ? "#fef3c7" : "#ecfdf5",
                      color: isCrit ? "#dc2626" : isWarn ? "#d97706" : "#059669",
                    }}
                  >
                    {item.current_qty}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#78350f" }}>{item.name}</p>
                    <p className="text-[10px]" style={{ color: "#a16207" }}>
                      {item.unit_of_measure} · {item.category_name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
