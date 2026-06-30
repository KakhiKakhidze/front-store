import { useState, useEffect } from "react";
import { api } from "../api";
import Badge from "../components/Badge";
import {
  ArrowDownUp, DollarSign, Clock, CalendarClock,
  Building2, AlertTriangle, Truck, RefreshCw, Gavel
} from "lucide-react";
import { Link } from "react-router-dom";

const TABS = [
  { id: "tender", label: "ტენდერები", icon: Gavel },
  { id: "movement", label: "მარაგის მოძრაობა", icon: ArrowDownUp },
  { id: "valuation", label: "შეფასება", icon: DollarSign },
  { id: "slow", label: "ნელი მოძრაობა", icon: Clock },
  { id: "expiry", label: "ვადა", icon: CalendarClock },
  { id: "consumption", label: "მოხმარება", icon: Building2 },
  { id: "variance", label: "განსხვავება", icon: AlertTriangle },
  { id: "supplier", label: "მომწოდებლები", icon: Truck },
];

function fmt(n) { return `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function Reports() {
  const [tab, setTab] = useState("tender");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", days: "30", department_id: "" });
  const [departments, setDepartments] = useState([]);

  useEffect(() => { api.get("/auth/departments").then(setDepartments); }, []);
  useEffect(() => { fetchReport(); }, [tab]);

  const fetchReport = async () => {
    setLoading(true); setData(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.days) params.set("days", filters.days);
      if (filters.department_id) params.set("department_id", filters.department_id);
      setData(await api.get(`/reports/${tab}?${params}`));
    } finally { setLoading(false); }
  };

  const thClass = "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap";
  const tdClass = "px-5 py-3";

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">ანგარიშები და ანალიტიკა</h1><p className="page-subtitle">საოპერაციო ანგარიშების გენერაცია და ნახვა</p></div>

      <div className="card p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              tab === t.id
                ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-600"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-3">
        {["movement", "consumption"].includes(tab) && (
          <>
            <div><label className="label">საწყისი</label><input type="date" className="input" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></div>
            <div><label className="label">საბოლოო</label><input type="date" className="input" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></div>
          </>
        )}
        {["slow", "expiry"].includes(tab) && (
          <div><label className="label">პერიოდი</label><select className="input w-auto" value={filters.days} onChange={(e) => setFilters((f) => ({ ...f, days: e.target.value }))}><option value="7">7 დღე</option><option value="14">14 დღე</option><option value="30">30 დღე</option><option value="60">60 დღე</option><option value="90">90 დღე</option></select></div>
        )}
        {tab === "consumption" && (
          <div><label className="label">განყოფილება</label><select className="input w-auto" value={filters.department_id} onChange={(e) => setFilters((f) => ({ ...f, department_id: e.target.value }))}><option value="">ყველა განყოფილება</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
        )}
        <button onClick={fetchReport} className="btn-primary btn-sm"><RefreshCw size={13} /> გენერაცია</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-gray-400">აირჩიეთ ანგარიში და დააჭირეთ გენერაციას.</div>
        ) : (
          <div className="overflow-x-auto">
            {tab === "movement" && (() => {
              const rows = Array.isArray(data) ? data : [];
              if (!rows.length) return <p className="p-8 text-center text-sm text-gray-400">მოძრაობები არ მოიძებნა.</p>;
              return (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">
                    <th className={thClass}>თარიღი</th><th className={thClass}>ნივთი</th><th className={thClass}>ტიპი</th>
                    <th className={`${thClass} text-right`}>რაოდ.</th><th className={`${thClass} text-right`}>ნაშთი</th>
                    <th className={thClass}>მითით.</th><th className={thClass}>შემსრ.</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <td className={`${tdClass} text-xs text-gray-600`}>{new Date(m.date).toLocaleString("ka-GE")}</td>
                        <td className={tdClass}><span className="font-semibold text-gray-900">{m.item_name}</span> <span className="text-gray-400 text-xs">({m.item_code})</span></td>
                        <td className={tdClass}><Badge status={m.movement_type} dot /></td>
                        <td className={`${tdClass} text-right font-mono font-semibold ${m.qty > 0 ? "text-emerald-600" : "text-red-600"}`}>{m.qty > 0 ? "+" : ""}{m.qty}</td>
                        <td className={`${tdClass} text-right font-mono text-gray-600`}>{m.balance_after}</td>
                        <td className={`${tdClass} font-mono text-xs text-gray-400`}>{m.reference_type}-{m.reference_id}</td>
                        <td className={`${tdClass} text-xs text-gray-600`}>{m.performer_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {tab === "valuation" && (
              <div className="p-6 space-y-4">
                <div className="text-right"><span className="text-sm text-gray-400">მთლიანი ჯამი: </span><span className="text-2xl font-extrabold font-mono text-gray-900">{fmt(data.grand_total)}</span></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200"><th className={thClass}>კატეგორია</th><th className={`${thClass} text-right`}>ნივთები</th><th className={`${thClass} text-right`}>მთლიანი ღირებულება</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rows?.map((r, i) => (
                      <tr key={i}><td className={`${tdClass} font-semibold text-gray-900`}>{r.category}</td><td className={`${tdClass} text-right text-gray-600`}>{r.item_count}</td><td className={`${tdClass} text-right font-mono font-semibold`}>{fmt(r.total_value)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "slow" && (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">ნივთები მოძრაობის გარეშე <span className="font-bold">{data.days}</span> დღე: <span className="font-bold text-gray-900">{data.count}</span></p>
                {!data.items?.length ? <p className="text-gray-400 text-sm">ნელი მოძრაობის ნივთები ვერ მოიძებნა.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200"><th className={thClass}>ნივთი</th><th className={thClass}>კატეგორია</th><th className={`${thClass} text-right`}>რაოდ.</th><th className={`${thClass} text-right`}>ღირებულება</th><th className={thClass}>ბოლო მოძრაობა</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.items.map((it) => (
                        <tr key={it.id}><td className={`${tdClass} font-semibold text-gray-900`}>{it.code} — {it.name}</td><td className={tdClass}>{it.category_name}</td><td className={`${tdClass} text-right font-mono`}>{it.current_qty}</td><td className={`${tdClass} text-right font-mono`}>{fmt(it.current_qty * it.unit_cost)}</td><td className={`${tdClass} text-xs`}>{it.last_movement ? new Date(it.last_movement).toLocaleDateString("ka-GE") : "არასდროს"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "expiry" && (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">ვადის ამოწურვა <span className="font-bold">{data.days}</span> დღეში: <span className="font-bold text-gray-900">{data.count}</span> ნივთი</p>
                {!data.items?.length ? <p className="text-gray-400 text-sm">ვადასთან ახლოს მყოფი ნივთები არ არის.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200"><th className={thClass}>ნივთი</th><th className={thClass}>პარტია</th><th className={thClass}>GRN</th><th className={`${thClass} text-right`}>რაოდ.</th><th className={thClass}>ვადა</th><th className={`${thClass} text-right`}>დარჩ. დღეები</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.items.map((it, i) => (
                        <tr key={i} className={it.days_until_expiry < 7 ? "bg-red-50/50" : ""}>
                          <td className={`${tdClass} font-semibold text-gray-900`}>{it.item_code} — {it.item_name}</td>
                          <td className={`${tdClass} font-mono text-xs text-gray-600`}>{it.batch_number}</td>
                          <td className={`${tdClass} font-mono text-xs text-gray-600`}>{it.grn_number}</td>
                          <td className={`${tdClass} text-right font-mono`}>{it.qty_received}</td>
                          <td className={tdClass}>{it.expiry_date}</td>
                          <td className={`${tdClass} text-right`}><Badge status={`${Math.round(it.days_until_expiry)}დ`} color={it.days_until_expiry < 7 ? "red" : it.days_until_expiry < 14 ? "yellow" : "green"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "consumption" && (
              <div className="p-6">
                <div className="text-right mb-4"><span className="text-sm text-gray-400">მთლიანი ხარჯი: </span><span className="font-mono font-extrabold text-lg">{fmt(data.total_cost)}</span></div>
                {!data.rows?.length ? <p className="text-gray-400 text-sm">არჩეული პერიოდის მოხმარების მონაცემები არ არის.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200"><th className={thClass}>განყოფილება</th><th className={thClass}>ნივთი</th><th className={`${thClass} text-right`}>გამოყენ. რაოდ.</th><th className={`${thClass} text-right`}>ხარჯი</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.rows.map((r, i) => (
                        <tr key={i}><td className={`${tdClass} font-semibold text-gray-900`}>{r.department}</td><td className={tdClass}>{r.item_code} — {r.item_name}</td><td className={`${tdClass} text-right font-mono`}>{r.total_qty} {r.unit_of_measure}</td><td className={`${tdClass} text-right font-mono font-semibold`}>{fmt(r.total_cost)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "variance" && (() => {
              const rows = Array.isArray(data) ? data : [];
              if (!rows.length) return <p className="p-8 text-center text-sm text-gray-400">განსხვავების მონაცემები არ არის. ჯერ შეასრულეთ ინვენტარიზაცია.</p>;
              return (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200"><th className={thClass}>ინვენტარიზაცია</th><th className={thClass}>ნივთი</th><th className={`${thClass} text-right`}>სისტ.</th><th className={`${thClass} text-right`}>ფიზიკ.</th><th className={`${thClass} text-right`}>სხვაობა</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.variance < 0 ? "bg-red-50/30" : "bg-amber-50/30"}>
                        <td className={`${tdClass} font-mono text-xs text-gray-600`}>{r.reference}</td>
                        <td className={`${tdClass} font-semibold text-gray-900`}>{r.item_code} — {r.item_name}</td>
                        <td className={`${tdClass} text-right font-mono`}>{r.system_qty}</td>
                        <td className={`${tdClass} text-right font-mono`}>{r.physical_qty}</td>
                        <td className={`${tdClass} text-right font-mono font-bold ${r.variance < 0 ? "text-red-600" : "text-amber-600"}`}>{r.variance > 0 ? "+" : ""}{r.variance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {tab === "tender" && (() => {
              const rows = Array.isArray(data) ? data : [];
              if (!rows.length) return <p className="p-8 text-center text-sm text-gray-400">ტენდერები ჯერ არ არსებობს.</p>;
              return (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">
                    <th className={thClass}>ტენდ. #</th>
                    <th className={thClass}>სათაური</th>
                    <th className={thClass}>შემქმნელი</th>
                    <th className={`${thClass} text-center`}>მოწვ.</th>
                    <th className={`${thClass} text-center`}>შეთ.</th>
                    <th className={thClass}>ვადა</th>
                    <th className={thClass}>სტატუსი</th>
                    <th className={thClass}>გამარჯვ.</th>
                    <th className={`${thClass} text-right`}>PO ღირ.</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className={tdClass}>
                          <Link to={`/tender/${r.id}`} className="font-mono text-xs font-semibold text-brand-500 hover:underline">
                            {r.tender_number}
                          </Link>
                        </td>
                        <td className={`${tdClass} font-semibold text-gray-900`}>{r.title}</td>
                        <td className={`${tdClass} text-gray-600`}>{r.creator_name}</td>
                        <td className={`${tdClass} text-center font-mono`}>{r.invited_count}</td>
                        <td className={`${tdClass} text-center font-mono`}>{r.bid_count}</td>
                        <td className={`${tdClass} text-xs ${new Date(r.deadline) < new Date() ? "text-red-500 font-semibold" : "text-gray-600"}`}>
                          {new Date(r.deadline).toLocaleDateString("ka-GE")}
                        </td>
                        <td className={tdClass}><Badge status={r.status} dot /></td>
                        <td className={`${tdClass} font-semibold text-emerald-600`}>{r.winner_name || <span className="text-gray-400 font-normal">—</span>}</td>
                        <td className={`${tdClass} text-right font-mono`}>{r.po_amount != null ? fmt(r.po_amount) : <span className="text-gray-400">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {tab === "supplier" && (() => {
              const rows = Array.isArray(data) ? data : [];
              return (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200"><th className={thClass}>მომწოდებელი</th><th className={`${thClass} text-center`}>სტატუსი</th><th className={`${thClass} text-right`}>მიწოდ. ვადა</th><th className={`${thClass} text-right`}>შეკვეთები</th><th className={`${thClass} text-right`}>დასრულებული</th><th className={`${thClass} text-right`}>GRN-ები</th><th className={`${thClass} text-right`}>მთლ. ხარჯი</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <tr key={r.id}><td className={`${tdClass} font-semibold text-gray-900`}>{r.name}</td><td className={`${tdClass} text-center`}>{r.preferred ? <Badge status="პრიორიტ." color="green" dot /> : <span className="text-gray-400">—</span>}</td><td className={`${tdClass} text-right font-mono`}>{r.lead_time_days}დ</td><td className={`${tdClass} text-right font-mono`}>{r.total_pos}</td><td className={`${tdClass} text-right font-mono`}>{r.completed_pos}</td><td className={`${tdClass} text-right font-mono`}>{r.total_grns}</td><td className={`${tdClass} text-right font-mono font-semibold`}>{fmt(r.total_spend)}</td></tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
