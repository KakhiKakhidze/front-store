import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ArrowLeft, Save, Star } from "lucide-react";

export default function SupplierForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "", lead_time_days: 3, preferred: false });

  useEffect(() => { if (isEdit) api.get(`/suppliers/${id}`).then((s) => setForm({ ...s, preferred: Boolean(s.preferred) })); }, [id]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try { if (isEdit) await api.put(`/suppliers/${id}`, form); else await api.post("/suppliers", form); navigate("/suppliers"); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button onClick={() => navigate("/suppliers")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{isEdit ? "მომწოდებლის რედაქტირება" : "მომწოდებლის დამატება"}</h1>
        <p className="text-sm text-gray-400 mb-6">{isEdit ? "განაახლეთ მომწოდებლის ინფორმაცია" : "დაარეგისტრირეთ ახალი მომწოდებელი"}</p>
        {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="label">მომწოდებლის სახელი</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">საკონტაქტო პირი</label><input className="input" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} /></div>
            <div><label className="label">ტელეფონი</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div><label className="label">ელ-ფოსტა</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className="label">მისამართი</label><textarea className="input" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">მიწოდების ვადა (დღე)</label><input className="input" type="number" min="1" value={form.lead_time_days} onChange={(e) => set("lead_time_days", Number(e.target.value))} /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.preferred} onChange={(e) => set("preferred", e.target.checked)} className="h-4 w-4 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500" />
                <Star size={14} className={form.preferred ? "text-amber-400 fill-amber-400" : "text-gray-400"} />
                <span className="font-medium text-gray-600">პრიორიტეტული მომწოდებელი</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button type="button" onClick={() => navigate("/suppliers")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "ინახება..." : "შენახვა"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
