import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function POForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplier_id, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ item_id: "", qty_ordered: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/inventory").then(setItems); api.get("/suppliers").then(setSuppliers); }, []);

  const addLine = () => setLines((l) => [...l, { item_id: "", qty_ordered: 1, unit_price: 0 }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, key, value) => {
    setLines((l) => l.map((line, idx) => {
      if (idx !== i) return line;
      const u = { ...line, [key]: value };
      if (key === "item_id") { const it = items.find((x) => x._id === value); if (it) u.unit_price = it.unit_cost; }
      return u;
    }));
  };
  const total = lines.reduce((s, l) => s + (Number(l.qty_ordered) || 0) * (Number(l.unit_price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.post("/po", { 
        supplier_id: supplier_id, 
        created_by: user.id, 
        notes, 
        lines: lines.filter((l) => l.item_id).map((l) => ({ 
          item_id: l.item_id, 
          qty_ordered: Number(l.qty_ordered), 
          unit_price: Number(l.unit_price) 
        })) 
      });
      navigate("/po");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate("/po")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">ახალი შესყიდვის შეკვეთა</h1>
        <p className="text-sm text-gray-400 mb-6">შექმენით შეკვეთა მომწოდებლისთვის</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="label">მომწოდებელი</label><select className="input" value={supplier_id} onChange={(e) => setSupplierId(e.target.value)} required><option value="">აირჩიეთ მომწოდებელი</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}{s.preferred ? " ★" : ""}</option>)}</select></div>
          <div>
            <div className="flex items-center justify-between mb-3"><h3 className="label mb-0">შეკვეთის ხაზები</h3><button type="button" onClick={addLine} className="btn-ghost btn-sm"><Plus size={14} /> ხაზის დამატება</button></div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50/80 rounded-xl border border-gray-200">
                  <select className="input col-span-5 bg-white" value={line.item_id} onChange={(e) => updateLine(i, "item_id", e.target.value)} required><option value="">აირჩიეთ ნივთი</option>{items.map((it) => <option key={it._id} value={it._id}>{it.code} — {it.name}</option>)}</select>
                  <input type="number" min="1" step="any" className="input col-span-2 bg-white" placeholder="რაოდ." value={line.qty_ordered} onChange={(e) => updateLine(i, "qty_ordered", e.target.value)} required />
                  <input type="number" step="0.01" className="input col-span-2 bg-white" placeholder="ფასი" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} required />
                  <div className="col-span-2 text-right font-mono text-sm font-semibold text-gray-600">${((Number(line.qty_ordered) || 0) * (Number(line.unit_price) || 0)).toFixed(2)}</div>
                  <div className="col-span-1 flex justify-center">{lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}</div>
                </div>
              ))}
            </div>
            <div className="text-right mt-3"><span className="text-sm text-gray-400">შეკვეთის ჯამი: </span><span className="font-mono font-extrabold text-lg text-gray-900">${total.toFixed(2)}</span></div>
          </div>
          <div><label className="label">შენიშვნები</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button type="button" onClick={() => navigate("/po")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "იქმნება..." : "შეკვეთის შექმნა"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
