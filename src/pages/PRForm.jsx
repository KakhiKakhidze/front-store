import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from "lucide-react";

export default function PRForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ item_id: "", qty_required: 1, estimated_unit_cost: 0, suggested_supplier_id: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/inventory").then(setItems); api.get("/suppliers").then(setSuppliers); }, []);

  const addLine = () => setLines((l) => [...l, { item_id: "", qty_required: 1, estimated_unit_cost: 0, suggested_supplier_id: "" }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, key, value) => {
    setLines((l) => l.map((line, idx) => {
      if (idx !== i) return line;
      const u = { ...line, [key]: value };
      if (key === "item_id") { const it = items.find((x) => x._id === value); if (it) u.estimated_unit_cost = it.unit_cost; }
      return u;
    }));
  };
  const total = lines.reduce((s, l) => s + (Number(l.qty_required) || 0) * (Number(l.estimated_unit_cost) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.post("/purchasing", { 
        created_by: user.id, 
        notes, 
        lines: lines.filter((l) => l.item_id).map((l) => ({ 
          item_id: l.item_id, 
          qty_required: Number(l.qty_required), 
          estimated_unit_cost: Number(l.estimated_unit_cost), 
          suggested_supplier_id: l.suggested_supplier_id || null 
        })) 
      });
      navigate("/purchasing");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate("/purchasing")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">ახალი შესყიდვის მოთხოვნა</h1>
        <p className="text-sm text-gray-400 mb-6">მოითხოვეთ შესყიდვის დამტკიცება</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3"><h3 className="label mb-0">შესასყიდი ნივთები</h3><button type="button" onClick={addLine} className="btn-ghost btn-sm"><Plus size={14} /> ხაზის დამატება</button></div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50/80 rounded-xl border border-gray-200">
                  <select className="input col-span-4 bg-white" value={line.item_id} onChange={(e) => updateLine(i, "item_id", e.target.value)} required><option value="">აირჩიეთ ნივთი</option>{items.map((it) => <option key={it._id} value={it._id}>{it.code} — {it.name}</option>)}</select>
                  <input type="number" min="1" step="any" className="input col-span-2 bg-white" placeholder="რაოდ." value={line.qty_required} onChange={(e) => updateLine(i, "qty_required", e.target.value)} required />
                  <input type="number" step="0.01" className="input col-span-2 bg-white" placeholder="ერთ. ფასი" value={line.estimated_unit_cost} onChange={(e) => updateLine(i, "estimated_unit_cost", e.target.value)} />
                  <select className="input col-span-3 bg-white" value={line.suggested_supplier_id} onChange={(e) => updateLine(i, "suggested_supplier_id", e.target.value)}><option value="">მომწოდებელი</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}{s.preferred ? " ★" : ""}</option>)}</select>
                  <div className="col-span-1 flex justify-center">{lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}</div>
                </div>
              ))}
            </div>
            <div className="text-right mt-3">
              <span className="text-sm text-gray-400">სავარაუდო ჯამი: </span>
              <span className="font-mono font-extrabold text-lg text-gray-900">${total.toFixed(2)}</span>
              {total > 5000 && <p className="flex items-center justify-end gap-1.5 text-xs text-amber-600 mt-1 font-medium"><AlertTriangle size={12} /> საჭიროებს ფინანსების / გენ. მენეჯერის დამტკიცებას</p>}
            </div>
          </div>
          <div><label className="label">შენიშვნები</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button type="button" onClick={() => navigate("/purchasing")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "იგზავნება..." : "PR-ის გაგზავნა"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
