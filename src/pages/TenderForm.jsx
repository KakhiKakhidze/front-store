import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";

export default function TenderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const fromPR = location.state?.fromPR;
  const fromAlert = location.state?.fromAlert;
  const renewFrom = location.state?.renewFrom;

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [tenderItems, setTenderItems] = useState([{ item_id: "", qty_required: 1, notes: "" }]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/inventory"),
      api.get("/suppliers"),
    ]).then(([inv, supps]) => {
      setItems(inv);
      setSuppliers(supps.filter((s) => s.active));
    });

    if (id) {
      api.get(`/tender/${id}`).then((t) => {
        setTitle(t.title);
        setDescription(t.description || "");
        if (t.deadline) {
          setDeadline(new Date(t.deadline).toISOString().slice(0, 16));
        }
        setNotes(t.notes || "");
        setTenderItems(t.items.map((it) => ({ 
          item_id: String(it.item_id), 
          qty_required: it.qty_required, 
          notes: it.notes || "" 
        })));
        setSelectedSuppliers(t.invited_suppliers.map(s => String(s.supplier_id)));
      }).finally(() => setLoading(false));
    } else if (renewFrom) {
      setTitle(`განახლებული: ${renewFrom.title}`);
      setDescription(renewFrom.description || "");
      setNotes(`განახლებული ტენდერიდან ${renewFrom.tender_number}`);
      setTenderItems(renewFrom.items.map((it) => ({ 
        item_id: String(it.item_id), 
        qty_required: it.qty_required, 
        notes: it.notes || "" 
      })));
      setSelectedSuppliers(renewFrom.invited_suppliers.map(s => String(s.supplier_id)));
    } else if (fromPR) {
      setTitle(`PR ${fromPR.pr_number} — ტენდერი`);
      setNotes(`PR ${fromPR.pr_number}-დან გადაყვანილი`);
      setTenderItems(fromPR.lines.map((l) => ({ item_id: String(l.item_id), qty_required: l.qty_required, notes: "" })));
    } else if (fromAlert) {
      setTitle(`${fromAlert.name} — შეკვეთის ტენდერი`);
      setNotes(`მარაგი დაბალია: ${fromAlert.current_qty} ${fromAlert.unit_of_measure}`);
      setTenderItems([{ item_id: String(fromAlert.id), qty_required: 1, notes: "" }]);
    }
  }, [id, renewFrom, fromPR, fromAlert]);

  const addItem = () => setTenderItems((l) => [...l, { item_id: "", qty_required: 1, notes: "" }]);
  const removeItem = (i) => setTenderItems((l) => l.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) =>
    setTenderItems((l) => l.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  const toggleSupplier = (id) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validItems = tenderItems.filter((it) => it.item_id);
    if (!validItems.length) return setError("მინიმუმ ერთი ნივთი შეიყვანეთ");
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        deadline,
        notes,
        created_by: user.id,
        items: validItems.map((it) => ({
          item_id: it.item_id,
          qty_required: Number(it.qty_required),
          notes: it.notes || null,
        })),
        supplier_ids: selectedSuppliers,
      };

      if (id) {
        await api.put(`/tender/${id}`, payload);
        alert(`ტენდერი განახლდა`);
        navigate(`/tender/${id}`);
      } else {
        const { tender_number } = await api.post("/tender", payload);
        alert(`ტენდერი შეიქმნა: ${tender_number}`);
        navigate("/tender");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-2xl" />;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate(id ? `/tender/${id}` : "/tender")} className="btn-ghost btn-sm">
        <ArrowLeft size={14} /> უკან
      </button>

      <div className="card p-6 lg:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {id ? "ტენდერის რედაქტირება" : renewFrom ? "ტენდერის განახლება" : "ახალი ტენდერი"}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {id ? "შეცვალეთ ტენდერის პარამეტრები" : "შეავსეთ ტენდერის პარამეტრები, ნივთები და მოწვეული მომწოდებლები"}
        </p>

        {renewFrom && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-sm text-emerald-700 flex items-center gap-2">
               <RefreshCw size={14} /> ტენდერი <strong>{renewFrom.tender_number}</strong>-დან დაკოპირებული — შეგიძლიათ შეცვალოთ და შეინახოთ როგორც ახალი
            </div>
        )}

        {fromPR && (
          <div className="mb-5 rounded-xl bg-amber-50 border border-amber-100 p-3.5 text-sm text-amber-700">
            PR <strong>{fromPR.pr_number}</strong>-დან გადაყვანილი — ნივთები წინასწარ შევსებულია
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 animate-slide-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">სათაური</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="ტენდერის სათაური" />
            </div>
            <div className="md:col-span-2">
              <label className="label">აღწერა</label>
              <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="დეტალური აღწერა (არასავალდებულო)" />
            </div>
            <div>
              <label className="label">წარდგენის ბოლო ვადა</label>
              <input type="datetime-local" className="input" min={id ? "" : minDateStr} value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>
            <div>
              <label className="label">შენიშვნები</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="დამატებითი შენიშვნები" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="label mb-0">სატენდერო ნივთები</h3>
              <button type="button" onClick={addItem} className="btn-ghost btn-sm">
                <Plus size={14} /> ნივთის დამატება
              </button>
            </div>
            <div className="space-y-2">
              {tenderItems.map((it, i) => {
                const selectedItem = items.find((x) => x._id === it.item_id);
                const uom = selectedItem?.unit_of_measure;
                return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50/80 rounded-xl border border-gray-200">
                  <select
                    className="input col-span-5 bg-white"
                    value={it.item_id}
                    onChange={(e) => updateItem(i, "item_id", e.target.value)}
                    required
                  >
                    <option value="">აირჩიეთ ნივთი</option>
                    {items.map((x) => <option key={x._id} value={x._id}>{x.code} — {x.name} ({x.unit_of_measure})</option>)}
                  </select>
                  <div className="col-span-3 flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                    <input
                      type="number" min="0.01" step="any"
                      className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                      placeholder="რაოდ."
                      value={it.qty_required}
                      onChange={(e) => updateItem(i, "qty_required", e.target.value)}
                      required
                    />
                    <span className="px-2.5 flex items-center text-xs font-semibold text-gray-500 bg-gray-50 border-l border-gray-200 min-w-[44px] justify-center">
                      {uom || "—"}
                    </span>
                  </div>
                  <input
                    className="input col-span-3 bg-white"
                    placeholder="შენიშვნა"
                    value={it.notes}
                    onChange={(e) => updateItem(i, "notes", e.target.value)}
                  />
                  <div className="col-span-1 flex justify-center">
                    {tenderItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="label mb-3">მოწვეული მომწოდებლები</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {suppliers.map((s) => {
                const checked = selectedSuppliers.includes(s._id);
                return (
                  <label
                    key={s._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? "border-brand-400 bg-brand-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSupplier(s._id)}
                      className="rounded"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      {s.preferred === 1 && <p className="text-[10px] text-amber-500">★ პრიორიტეტული</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button type="button" onClick={() => navigate(id ? `/tender/${id}` : "/tender")} className="btn-secondary">გაუქმება</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? "ინახება..." : id ? "განახლება" : "ტენდერის შექმნა"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
