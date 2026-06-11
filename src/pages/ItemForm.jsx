import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ArrowLeft, Save } from "lucide-react";

export default function ItemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "", name: "", category_id: "", unit_of_measure: "pcs",
    location_bin: "", current_qty: 0, min_stock_level: 0,
    reorder_point: 0, reorder_qty: 0, unit_cost: 0,
    is_perishable: false, is_controlled: false,
  });

  useEffect(() => {
    api.get("/inventory/categories").then(setCategories);
    if (isEdit) {
      api.get(`/inventory/${id}`).then((item) =>
        setForm({ 
          ...item, 
          category_id: item.category?._id || item.category, // Handle both populated and non-populated
          is_perishable: Boolean(item.is_perishable), 
          is_controlled: Boolean(item.is_controlled) 
        })
      );
    }
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) await api.put(`/inventory/${id}`, form);
      else await api.post("/inventory", form);
      navigate("/inventory");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate("/inventory")} className="btn-ghost btn-sm">
        <ArrowLeft size={14} /> ინვენტარში დაბრუნება
      </button>

      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{isEdit ? "ნივთის რედაქტირება" : "ახალი ნივთის დამატება"}</h1>
        <p className="text-sm text-gray-400 mb-6">{isEdit ? "განაახლეთ ინვენტარის ნივთის დეტალები" : "დაარეგისტრირეთ ახალი ნივთი საწყობში"}</p>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 animate-slide-up">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">ნივთის კოდი</label><input className="input" value={form.code} onChange={(e) => set("code", e.target.value)} required placeholder="მაგ., FD-009" /></div>
            <div><label className="label">დასახელება</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="მაგ., ბასმათის ბრინჯი" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">კატეგორია</label>
              <select className="input" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} required>
                <option value="">აირჩიეთ კატეგორია</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ზომის ერთეული</label>
              <select className="input" value={form.unit_of_measure} onChange={(e) => set("unit_of_measure", e.target.value)}>
                {["kg", "ltr", "pcs", "box", "btl", "tin", "tray", "ream", "pack", "set"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div><label className="label">თარო / შენახვის ადგილი</label><input className="input" value={form.location_bin} onChange={(e) => set("location_bin", e.target.value)} placeholder="მაგ., A-01" /></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {!isEdit && <div><label className="label">საწყისი რაოდ.</label><input className="input" type="number" step="any" value={form.current_qty} onChange={(e) => set("current_qty", Number(e.target.value))} /></div>}
            <div><label className="label">მინ. მარაგის დონე</label><input className="input" type="number" step="any" value={form.min_stock_level} onChange={(e) => set("min_stock_level", Number(e.target.value))} /></div>
            <div><label className="label">შეკვეთის წერტილი</label><input className="input" type="number" step="any" value={form.reorder_point} onChange={(e) => set("reorder_point", Number(e.target.value))} /></div>
            <div><label className="label">შეკვეთის რაოდ.</label><input className="input" type="number" step="any" value={form.reorder_qty} onChange={(e) => set("reorder_qty", Number(e.target.value))} /></div>
          </div>
          <div><label className="label">ერთეულის ფასი ($)</label><input className="input" type="number" step="0.01" value={form.unit_cost} onChange={(e) => set("unit_cost", Number(e.target.value))} /></div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.is_perishable} onChange={(e) => set("is_perishable", e.target.checked)} className="h-4 w-4 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-gray-600 font-medium">მალფუჭებადი ნივთი</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.is_controlled} onChange={(e) => set("is_controlled", e.target.checked)} className="h-4 w-4 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-gray-600 font-medium">კონტროლირებადი ნივთი</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button type="button" onClick={() => navigate("/inventory")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? "ინახება..." : isEdit ? "განახლება" : "დამატება"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
