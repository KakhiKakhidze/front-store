import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";

export default function StockTakeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [take, setTake] = useState(null);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get(`/stocktake/${id}`).then((d) => { setTake(d); setItems(d.items || []); }); }, [id]);

  const updateCount = (idx, physical_qty) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, physical_qty: physical_qty === "" ? "" : Number(physical_qty), variance: physical_qty === "" ? null : Number(physical_qty) - it.system_qty } : it));
  };
  const updateNote = (idx, notes) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, notes } : it)));

  const handleSaveCounts = async () => {
    setSaving(true);
    try {
      await api.put(`/stocktake/${id}/count`, { counts: items.filter((it) => it.physical_qty !== null && it.physical_qty !== "").map((it) => ({ id: it.id, system_qty: it.system_qty, physical_qty: Number(it.physical_qty), notes: it.notes || undefined })) });
      alert("დათვლები შენახულია.");
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleComplete = async (applyAdjustments) => {
    if (!window.confirm(applyAdjustments ? "დაასრულეთ ინვენტარიზაცია და შეასწორეთ ინვენტარი?" : "დაასრულეთ ინვენტარიზაცია კორექტირების გარეშე?")) return;
    try { await api.post(`/stocktake/${id}/complete`, { approved_by: user.id, apply_adjustments: applyAdjustments }); navigate("/stocktake"); }
    catch (err) { alert(err.message); }
  };

  if (!take) return <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;

  const totalVariances = items.filter((it) => it.variance && it.variance !== 0).length;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/stocktake")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{take.reference}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{take.count_type === "Full" ? "სრული" : "ციკლური"} დათვლა &middot; {items.length} ნივთი &middot; <span className={totalVariances > 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>{totalVariances} სხვაობა</span></p>
          </div>
          <Badge status={take.status} dot />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 dark:border-dark-border">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ნივთი</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">თარო</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">სისტემა</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ფიზიკური</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">სხვაობა</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">შენიშვნა</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
              {items.map((it, idx) => (
                <tr key={it.id} className={it.variance && it.variance !== 0 ? "bg-amber-50/30 dark:bg-amber-950/15" : ""}>
                  <td className="px-5 py-3"><span className="font-semibold text-gray-800 dark:text-gray-200">{it.item_name}</span><span className="text-gray-400 dark:text-gray-500 text-xs ml-1.5">({it.item_code})</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{it.location_bin}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-600 dark:text-gray-400">{it.system_qty}</td>
                  <td className="px-5 py-3">
                    {take.status === "InProgress" ? (
                      <input type="number" step="any" min="0" className="input text-right w-24 ml-auto" value={it.physical_qty ?? ""} onChange={(e) => updateCount(idx, e.target.value)} placeholder="დათვლა" />
                    ) : (
                      <span className="font-mono text-right block">{it.physical_qty ?? "—"}</span>
                    )}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono font-bold ${it.variance < 0 ? "text-red-600 dark:text-red-400" : it.variance > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-300 dark:text-gray-600"}`}>
                    {it.variance != null ? (it.variance > 0 ? "+" : "") + it.variance : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {take.status === "InProgress" ? (
                      <input className="input w-32" value={it.notes || ""} onChange={(e) => updateNote(idx, e.target.value)} placeholder="შენიშვნა" />
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{it.notes || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {take.status === "InProgress" && (
          <div className="flex justify-between items-center p-5 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50">
            <button onClick={handleSaveCounts} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "ინახება..." : "დათვლების შენახვა"}</button>
            <div className="flex gap-2">
              <button onClick={() => handleComplete(false)} className="btn-secondary btn-sm">დასრულება (კორექტ. გარეშე)</button>
              <button onClick={() => handleComplete(true)} className="btn-success btn-sm"><CheckCircle size={14} /> დასრულება და კორექტირება</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
