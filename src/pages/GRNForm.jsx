import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save } from "lucide-react";

export default function GRNForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/po").then((data) => setPOs(data.filter((p) => p.status === "Approved" || p.status === "PartiallyReceived")));
  }, []);

  const handlePOSelect = async (poId) => {
    if (!poId) { setSelectedPO(null); setLines([]); return; }
    const po = await api.get(`/po/${poId}`);
    setSelectedPO(po);
    setLines(
      po.lines.filter((l) => l.qty_received < l.qty_ordered).map((l) => ({
        item_id: l.item_id, po_line_id: l.id,
        item_name: `${l.item_code} - ${l.item_name}`, unit: l.unit_of_measure,
        ordered: l.qty_ordered, already_received: l.qty_received,
        qty_received: l.qty_ordered - l.qty_received, unit_price: l.unit_price,
        batch_number: "", expiry_date: "", storage_condition: "",
      }))
    );
  };

  const updateLine = (idx, key, value) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await api.post("/receiving", {
        po_id: selectedPO.id, received_by: user.id, notes,
        lines: lines.map((l) => ({
          item_id: l.item_id, po_line_id: l.po_line_id,
          qty_received: Number(l.qty_received), unit_price: Number(l.unit_price),
          batch_number: l.batch_number || undefined, expiry_date: l.expiry_date || undefined,
          storage_condition: l.storage_condition || undefined,
        })),
      });
      navigate("/receiving");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate("/receiving")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">ახალი მიღების აქტი</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">მიიღეთ საქონელი დამტკიცებული შესყიდვის შეკვეთის მიხედვით</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">აირჩიეთ შესყიდვის შეკვეთა</label>
            <select className="input" value={selectedPO?.id || ""} onChange={(e) => handlePOSelect(e.target.value)} required>
              <option value="">აირჩიეთ დამტკიცებული შეკვეთა...</option>
              {pos.map((po) => <option key={po.id} value={po.id}>{po.po_number} — {po.supplier_name} (${po.total_amount?.toFixed(2)})</option>)}
            </select>
          </div>
          {lines.length > 0 && (
            <div>
              <h3 className="label mb-3">მისაღები ნივთები</h3>
              <div className="overflow-x-auto border border-gray-100 dark:border-dark-border rounded-xl">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ნივთი</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">შეკვეთილი</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">უკვე მიღებული</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">მისაღები</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ფასი</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">პარტია</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ვადა</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{line.item_name}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">{line.ordered} {line.unit}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-400 dark:text-gray-500">{line.already_received}</td>
                        <td className="px-4 py-3"><input type="number" step="any" min="0" max={line.ordered - line.already_received} className="input text-right w-24 ml-auto" value={line.qty_received} onChange={(e) => updateLine(i, "qty_received", e.target.value)} /></td>
                        <td className="px-4 py-3"><input type="number" step="0.01" className="input text-right w-24 ml-auto" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} /></td>
                        <td className="px-4 py-3"><input className="input w-28" placeholder="პარტია #" value={line.batch_number} onChange={(e) => updateLine(i, "batch_number", e.target.value)} /></td>
                        <td className="px-4 py-3"><input type="date" className="input w-36" value={line.expiry_date} onChange={(e) => updateLine(i, "expiry_date", e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div><label className="label">შენიშვნები</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="მიწოდების შენიშვნები..." /></div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-dark-border">
            <button type="button" onClick={() => navigate("/receiving")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving || !selectedPO} className="btn-success"><Save size={16} /> {saving ? "მუშავდება..." : "საქონლის მიღება"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
