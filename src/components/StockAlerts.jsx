import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Bell, AlertTriangle, Package, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function StockAlerts() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchAlerts = () => {
    api.get("/alerts").then(setData).catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // re-check every 60s
    return () => clearInterval(interval);
  }, []);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = data?.count || 0;

  const urgency = (qty) => {
    if (qty === 0) return { label: "ამოწურულია", color: "#ef4444", bg: "#fef2f2", ring: "#fecaca" };
    if (qty < 10)  return { label: "კრიტიკული", color: "#ef4444", bg: "#fef2f2", ring: "#fecaca" };
    if (qty < 25)  return { label: "დაბალი",    color: "#f59e0b", bg: "#fffbeb", ring: "#fde68a" };
    return               { label: "გაფრთხ.",   color: "#3b82f6", bg: "#eff6ff", ring: "#bfdbfe" };
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        title="მარაგის გაფრთხილებები"
      >
        <Bell size={17} className={count > 0 ? "text-amber-500" : "text-gray-400"} />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
            style={{ background: count > 0 ? "#ef4444" : "#6b7280" }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] rounded-xl border border-gray-200 bg-white shadow-float z-50 animate-scale-in origin-top-right overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">მარაგის გაფრთხილება</span>
              {count > 0 && (
                <span className="rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Threshold notice */}
          <div className="px-4 py-2 border-b border-gray-100" style={{ background: "#fffbeb" }}>
            <p className="text-[11px] text-amber-700">
              ნაჩვენებია ყველა პროდუქტი რომლის მარაგი <strong>&lt; 50</strong> ერთეულია
            </p>
          </div>

          {/* Items list */}
          <div className="max-h-[340px] overflow-y-auto">
            {!data ? (
              <div className="py-8 text-center text-sm text-gray-400">იტვირთება...</div>
            ) : count === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Package size={18} className="text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500">ყველა პროდუქტი საკმარისი მარაგითაა</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.items.map((item) => {
                  const u = urgency(item.current_qty);
                  return (
                    <Link
                      key={item.id}
                      to="/tender/new"
                      state={{ fromAlert: item }}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Qty circle */}
                      <div
                        className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold"
                        style={{ background: u.bg, border: `1px solid ${u.ring}` }}
                      >
                        <span style={{ fontSize: 14, color: u.color, lineHeight: 1 }}>{item.current_qty}</span>
                        <span style={{ fontSize: 8, color: u.color, opacity: .7 }}>{item.unit_of_measure}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-gray-400">{item.code}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">{item.category_name}</span>
                        </div>
                      </div>

                      {/* Urgency badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                          style={{ background: u.bg, color: u.color }}
                        >
                          {u.label}
                        </span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
              <Link
                to="/inventory"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                ინვენტარის სრული სია <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
