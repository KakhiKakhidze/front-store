import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  Package, Plus, Edit2, Trash2, Save, Search, Tag,
  ToggleLeft, ToggleRight, Sparkles
} from "lucide-react";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function MyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (!user?.supplier_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/supplier-products/mine?supplier_id=${user.supplier_id}`);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.supplier_id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = products;
    if (!showInactive) list = list.filter((p) => p.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, showInactive]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active).length;
    const inactive = products.length - active;
    const avgPrice = active > 0
      ? products.filter((p) => p.active).reduce((s, p) => s + (p.default_unit_price || 0), 0) / active
      : 0;
    return { total: products.length, active, inactive, avgPrice };
  }, [products]);

  const openNew = () => {
    setEditing(null);
    setCode(""); setName(""); setUnit(""); setPrice(""); setCategory(""); setDescription("");
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setCode(p.code);
    setName(p.name);
    setUnit(p.unit_of_measure);
    setPrice(String(p.default_unit_price || ""));
    setCategory(p.category || "");
    setDescription(p.description || "");
    setFormError("");
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!code.trim() || !name.trim() || !unit.trim()) {
      return setFormError("შეავსეთ კოდი, სახელი და ერთეული");
    }
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: user.supplier_id,
        code,
        name,
        unit_of_measure: unit,
        default_unit_price: Number(price || 0),
        category,
        description,
      };
      if (editing) {
        await api.put(`/supplier-products/${editing.id}`, payload);
      } else {
        await api.post("/supplier-products", payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/supplier-products/${p.id}`, {
        supplier_id: user.supplier_id,
        active: !p.active,
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (p) => {
    if (!confirm(`წავშალოთ "${p.name}" კატალოგიდან? (პროდუქტი დაარქივდება, ისტორია შენარჩუნდება)`)) return;
    try {
      await api.del(`/supplier-products/${p.id}?supplier_id=${user.supplier_id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package size={22} className="text-brand-500" />
            ჩემი პროდუქტების კატალოგი
          </h1>
          <p className="page-subtitle">თქვენი პერსონალური პროდუქტების სია — ამისგან ხდება სპეციალური შეთავაზებების შექმნა</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> პროდუქტის დამატება
        </button>
      </div>

      {/* Stats */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600"><Package size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">სულ პროდუქტი</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><ToggleRight size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">აქტიური</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.active}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500"><ToggleLeft size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">დაარქივებული</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600"><Tag size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">საშ. ფასი</p>
              <p className="text-2xl font-extrabold text-gray-900">{fmt(stats.avgPrice)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + filters */}
      {!loading && products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200 flex-1 min-w-[260px] max-w-md">
            <span className="px-3 flex items-center text-gray-400"><Search size={14} /></span>
            <input
              className="flex-1 px-2 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
              placeholder="ძებნა კოდით, სახელით ან კატეგორიით"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded h-4 w-4 text-brand-600"
            />
            ჩათვლით დაარქივებული
          </label>
        </div>
      )}

      {/* Products list */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton" />)}</div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-500 font-medium mb-3">თქვენ ჯერ არ გაქვთ პროდუქტი კატალოგში</p>
          <p className="text-xs text-gray-400 mb-4">დაამატეთ პროდუქტი, რომ შემდეგ შეძლოთ მისი შეთავაზება</p>
          <button onClick={openNew} className="btn-primary"><Plus size={14} /> პირველი პროდუქტის დამატება</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">ფილტრის შესაბამისი პროდუქტი ვერ მოიძებნა</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">კოდი</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">დასახელება</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">კატეგორია</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ერთეული</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ნაგულისხმევი ფასი</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">სტატუსი</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">მოქმედებები</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{p.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.description && <p className="text-[11px] text-gray-400 mt-0.5">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{p.unit_of_measure}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-700">
                    {p.default_unit_price ? `${fmt(p.default_unit_price)}/${p.unit_of_measure}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        p.active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                      title="სტატუსის გადართვა"
                    >
                      {p.active ? <><ToggleRight size={11} /> აქტიური</> : <><ToggleLeft size={11} /> დაარქივებული</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="რედაქტირება">
                        <Edit2 size={14} />
                      </button>
                      {p.active && (
                        <button onClick={() => remove(p)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="დაარქივება">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `პროდუქტის რედაქტირება: ${editing.code}` : "ახალი პროდუქტი"} wide>
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-sm">{formError}</div>
          )}

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800 flex items-start gap-2">
            <Sparkles size={16} className="mt-0.5" />
            <p>ეს არის თქვენი პერსონალური კატალოგი. მხოლოდ თქვენ ხედავთ ცვლილებებს, ხოლო სპეც. შეთავაზებების დროს ადმინიც ხედავს კონკრეტულ პროდუქტს.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">კოდი / SKU *</label>
              <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="GFS-001" required />
            </div>
            <div className="col-span-2">
              <label className="label">დასახელება *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="მაგ: ბრინჯი ბასმათი 25კგ" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">ერთეული *</label>
              <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, pcs, ltr, box..." required />
            </div>
            <div>
              <label className="label">ნაგულისხმევი ფასი</label>
              <div className="flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                <span className="px-2.5 flex items-center text-gray-400 bg-gray-50 border-r border-gray-200">$</span>
                <input
                  type="number" min="0" step="0.01"
                  className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {unit && (
                  <span className="px-2.5 flex items-center text-xs font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                    /{unit}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="label">კატეგორია</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Dry Food, Beverages..." />
            </div>
          </div>

          <div>
            <label className="label">აღწერა</label>
            <textarea
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="დამატებითი ინფორმაცია (ბრენდი, ხარისხი, წარმოების ქვეყანა...)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary btn-sm">გაუქმება</button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm">
              <Save size={14} /> {submitting ? "ინახება..." : editing ? "შენახვა" : "დამატება"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
