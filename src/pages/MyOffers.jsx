import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import {
  Sparkles, Plus, Edit2, X, CheckCircle, Tag, Clock,
  TrendingUp, Send, Package
} from "lucide-react";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function MyOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [productId, setProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!user?.supplier_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [mineRes, productsRes] = await Promise.all([
        api.get(`/special-offers/mine?supplier_id=${user.supplier_id}`),
        api.get(`/supplier-products/mine?supplier_id=${user.supplier_id}`),
      ]);
      setOffers(mineRes);
      setProducts(productsRes.filter((p) => p.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.supplier_id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const pending = offers.filter((o) => o.status === "Pending").length;
    const accepted = offers.filter((o) => o.status === "Accepted").length;
    const acceptedValue = offers
      .filter((o) => o.status === "Accepted")
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    const rejected = offers.filter((o) => o.status === "Rejected").length;
    return { pending, accepted, acceptedValue, rejected };
  }, [offers]);

  const openNew = () => {
    setEditing(null);
    setProductId("");
    setUnitPrice("");
    setQty("");
    const d = new Date(Date.now() + 14 * 86400000);
    setValidUntil(d.toISOString().slice(0, 16));
    setNotes("");
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (offer) => {
    setEditing(offer);
    setProductId(offer.supplier_product_id);
    setUnitPrice(String(offer.unit_price));
    setQty(String(offer.qty_offered));
    setValidUntil(new Date(offer.valid_until).toISOString().slice(0, 16));
    setNotes(offer.notes || "");
    setFormError("");
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!productId || !unitPrice || !qty || !validUntil) {
      return setFormError("შეავსეთ ყველა სავალდებულო ველი");
    }
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: user.supplier_id,
        supplier_product_id: productId,
        unit_price: Number(unitPrice),
        qty_offered: Number(qty),
        valid_until: new Date(validUntil).toISOString(),
        notes,
      };
      if (editing) {
        await api.put(`/special-offers/${editing.id}`, payload);
      } else {
        await api.post("/special-offers", payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async (offer) => {
    if (!confirm(`გავაუქმოთ შეთავაზება ${offer.offer_number}?`)) return;
    try {
      await api.post(`/special-offers/${offer.id}/withdraw`, { supplier_id: user.supplier_id });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const previewTotal = (Number(unitPrice) || 0) * (Number(qty) || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" />
            ჩემი სპეციალური შეთავაზებები
          </h1>
          <p className="page-subtitle">წარადგინეთ სპონტანური შეთავაზება ტენდერის გარეშე</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> ახალი შეთავაზება
        </button>
      </div>

      {/* Stats */}
      {!loading && offers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">დასამუშავებელი</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.pending}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">მიღებული</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">გაყიდული</p>
              <p className="text-2xl font-extrabold text-gray-900">${stats.acceptedValue.toFixed(0)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><X size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">უარყოფილი</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      )}

      {/* Offers list */}
      {loading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-32 skeleton" />)}</div>
      ) : offers.length === 0 ? (
        <div className="card p-12 text-center">
          <Sparkles className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-500 font-medium mb-3">თქვენ ჯერ არ წარგიდგენიათ შეთავაზება</p>
          <button onClick={openNew} className="btn-primary"><Plus size={14} /> პირველი შეთავაზების წარდგენა</button>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => {
            const isPending = o.status === "Pending";
            return (
              <div key={o.id} className={`card p-5 border-l-4 ${
                isPending ? "border-l-amber-400" :
                o.status === "Accepted" ? "border-l-emerald-400" :
                o.status === "Rejected" ? "border-l-red-400" :
                "border-l-gray-300"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{o.offer_number}</span>
                      <Badge status={o.status} dot />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{o.item_code} — {o.item_name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Tag size={13} /> <strong className="font-mono">{fmt(o.unit_price)}/{o.unit_of_measure}</strong></span>
                      <span>×</span>
                      <span className="font-mono"><strong>{o.qty_offered}</strong> {o.unit_of_measure}</span>
                      <span>=</span>
                      <span className="font-mono font-extrabold text-gray-900">{fmt(o.total_amount)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      მოქმედებს: {new Date(o.valid_until).toLocaleString("ka-GE")} · წარდგენილია: {new Date(o.created_at).toLocaleString("ka-GE")}
                    </p>
                    {o.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2">
                        <strong className="text-gray-700">შენიშვნა:</strong> {o.notes}
                      </p>
                    )}
                    {o.status === "Rejected" && o.rejection_reason && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                        <strong>უარყოფის მიზეზი:</strong> {o.rejection_reason}
                      </p>
                    )}
                    {o.status === "Accepted" && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                        <strong>★ მიღებული</strong> · {o.reviewer_name || "ადმინისტრატორი"}-ის მიერ {new Date(o.date_reviewed).toLocaleDateString("ka-GE")}
                      </p>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <button onClick={() => openEdit(o)} className="btn-secondary btn-sm">
                        <Edit2 size={13} /> რედაქტირება
                      </button>
                      <button onClick={() => withdraw(o)} className="btn-ghost btn-sm">
                        <X size={13} /> გაუქმება
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `შეთავაზების რედაქტირება ${editing.offer_number}` : "ახალი სპეციალური შეთავაზება"} wide>
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-sm">{formError}</div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 flex items-start gap-2">
            <Sparkles size={16} className="mt-0.5" />
            <p>თქვენი შეთავაზება იქნება ხილული ადმინისტრატორისთვის. მიღების შემთხვევაში სისტემა ავტომატურად შექმნის PO-ს.</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>პროდუქტი თქვენი კატალოგიდან *</span>
              <Link to="/my-products" className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1">
                <Package size={11} /> კატალოგის მართვა
              </Link>
            </label>
            {products.length === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-3 text-sm flex items-start gap-2">
                <Package size={16} className="mt-0.5 shrink-0" />
                <p>თქვენ ჯერ არ გაქვთ პროდუქტი კატალოგში. <Link to="/my-products" className="font-bold underline">დაამატეთ პროდუქტი</Link> შეთავაზების შესაქმნელად.</p>
              </div>
            ) : (
              <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)} required disabled={!!editing}>
                <option value="">აირჩიეთ პროდუქტი</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name} ({p.unit_of_measure})
                    {p.default_unit_price > 0 ? ` · ნაგულისხმევი ${fmt(p.default_unit_price)}` : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedProduct?.default_unit_price > 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                ნაგულისხმევი ფასი: <span className="font-mono">{fmt(selectedProduct.default_unit_price)}/{selectedProduct.unit_of_measure}</span>
                {!editing && !unitPrice && (
                  <button
                    type="button"
                    onClick={() => setUnitPrice(String(selectedProduct.default_unit_price))}
                    className="ml-2 text-brand-600 underline"
                  >
                    გამოყენება
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ერთეულის ფასი *</label>
              <div className="flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                <span className="px-2.5 flex items-center text-gray-400 bg-gray-50 border-r border-gray-200">$</span>
                <input
                  type="number" min="0" step="0.01"
                  className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
                {selectedProduct && (
                  <span className="px-2.5 flex items-center text-xs font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                    /{selectedProduct.unit_of_measure}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="label">ხელმისაწვდომი რაოდენობა *</label>
              <div className="flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                <input
                  type="number" min="0.01" step="any"
                  className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                  placeholder="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
                {selectedProduct && (
                  <span className="px-2.5 flex items-center text-xs font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                    {selectedProduct.unit_of_measure}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="label">მოქმედი ვადა *</label>
            <input
              type="datetime-local"
              className="input"
              value={validUntil}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">ფასი დარჩება ძალაში მითითებულ თარიღამდე</p>
          </div>

          <div>
            <label className="label">შენიშვნები</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="დამატებითი ინფორმაცია (მინიმალური ქირა, მიწოდების პირობები...)"
            />
          </div>

          {previewTotal > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">საერთო შეთავაზება:</span>
              <span className="text-2xl font-mono font-black text-emerald-700">{fmt(previewTotal)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary btn-sm">გაუქმება</button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm">
              <Send size={14} /> {submitting ? "იგზავნება..." : editing ? "შენახვა" : "წარდგენა"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
