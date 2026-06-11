import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function SRFForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [department_id, setDeptId] = useState(user.department_id || "");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ item_id: "", qty_requested: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/auth/departments").then(setDepartments); api.get("/inventory").then(setItems); }, []);

  const addLine = () => setLines((l) => [...l, { item_id: "", qty_requested: 1 }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, key, value) => setLines((l) => l.map((line, idx) => (idx === i ? { ...line, [key]: value } : line)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await api.post("/issuance", {
        department_id: department_id, requested_by: user.id, notes,
        lines: lines.filter((l) => l.item_id).map((l) => ({ item_id: l.item_id, qty_requested: Number(l.qty_requested) })),
      });
      navigate("/issuance");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate("/issuance")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">ახალი საწყობის მოთხოვნა</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">მოითხოვეთ ნივთები საწყობიდან</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">მოთხოვნის განყოფილება</label><select className="input" value={department_id} onChange={(e) => setDeptId(e.target.value)} required><option value="">აირჩიეთ განყოფილება</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">მომთხოვნი</label><input className="input" value={user.full_name} disabled /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="label mb-0">მოთხოვნილი ნივთები</h3>
              <button type="button" onClick={addLine} className="btn-ghost btn-sm"><Plus size={14} /> ნივთის დამატება</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const sel = items.find((it) => it.id === line.item_id);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-dark-hover/80 rounded-xl border border-gray-100 dark:border-dark-border">
                    <select className="input flex-1 bg-white dark:bg-dark-input" value={line.item_id} onChange={(e) => updateLine(i, "item_id", e.target.value)} required>
                      <option value="">აირჩიეთ ნივთი</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.code} — {it.name} (ხელმისაწვდ.: {it.current_qty} {it.unit_of_measure})</option>)}
                    </select>
                    <input type="number" min="0.1" step="any" className="input w-28 bg-white dark:bg-dark-input" placeholder="რაოდ." value={line.qty_requested} onChange={(e) => updateLine(i, "qty_requested", e.target.value)} required />
                    {sel && <span className="text-xs text-gray-400 dark:text-gray-500 w-10 shrink-0">{sel.unit_of_measure}</span>}
                    {lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                  </div>
                );
              })}
            </div>
          </div>
          <div><label className="label">შენიშვნები</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="მოთხოვნის მიზანი..." /></div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-dark-border">
            <button type="button" onClick={() => navigate("/issuance")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "იგზავნება..." : "მოთხოვნის გაგზავნა"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
