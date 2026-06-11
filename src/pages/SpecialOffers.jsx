import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import {
  Sparkles, CheckCircle, XCircle, Clock, AlertTriangle,
  Filter, FileText, Phone, Mail, User as UserIcon, Tag
} from "lucide-react";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const STATUSES = ["All", "Pending", "Accepted", "Rejected", "Withdrawn", "Expired"];

export default function SpecialOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/special-offers");
      setOffers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (filter === "All") return offers;
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const stats = useMemo(() => {
    const pending = offers.filter((o) => o.status === "Pending").length;
    const accepted = offers.filter((o) => o.status === "Accepted").length;
    const acceptedValue = offers
      .filter((o) => o.status === "Accepted")
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    const expiringSoon = offers.filter((o) => {
      if (o.status !== "Pending") return false;
      const ms = new Date(o.valid_until) - new Date();
      return ms > 0 && ms < 86400000 * 2;
    }).length;
    return { pending, accepted, acceptedValue, expiringSoon };
  }, [offers]);

  const accept = async (offer) => {
    if (!confirm(`მიიღოთ ${offer.supplier_name}-ის შეთავაზება? სისტემა შექმნის PO-ს ${fmt(offer.total_amount)}-ზე.`)) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/special-offers/${offer.id}/accept`, { reviewed_by: user.id });
      alert(`შეთავაზება მიღებულია. PO შეიქმნა: ${res.po_number}`);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    setSubmitting(true);
    try {
      await api.post(`/special-offers/${rejectModal.id}/reject`, {
        reviewed_by: user.id,
        rejection_reason: rejectReason,
      });
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const savingsVsBaseline = (offer) => {
    if (!offer.item_unit_cost) return null;
    const diff = offer.item_unit_cost - offer.unit_price;
    if (diff <= 0) return null;
    const pct = (diff / offer.item_unit_cost) * 100;
    return { abs: diff * offer.qty_offered, pct };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" />
            სპეციალური შეთავაზებები მომწოდებლებისგან
          </h1>
          <p className="page-subtitle">მომწოდებლების სპონტანური შეთავაზებები ტენდერის გარეშე</p>
        </div>
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
            <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">მიღებული ღირებულება</p>
              <p className="text-2xl font-extrabold text-gray-900">${stats.acceptedValue.toFixed(0)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">მალე იწურება</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter size={14} className="text-gray-400" />
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "All" ? "ყველა" : s} {s !== "All" && offers.filter((o) => o.status === s).length > 0 && (
              <span className="ml-1 opacity-70">({offers.filter((o) => o.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Offers list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton" />)}</div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <Sparkles className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-500 font-medium">
            {filter === "All" ? "შეთავაზებები არ არის" : `"${filter}" სტატუსში შეთავაზებები არ არის`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => {
            const isPending = o.status === "Pending";
            const isExpired = new Date(o.valid_until) < new Date() && o.status === "Pending";
            const savings = savingsVsBaseline(o);
            const validHours = (new Date(o.valid_until) - new Date()) / 3600000;
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
                      {savings && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                          ★ დანაზოგი {fmt(savings.abs)} ({savings.pct.toFixed(1)}%)
                        </span>
                      )}
                      {isPending && validHours < 48 && validHours > 0 && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                          იწურება {validHours < 24 ? `${Math.round(validHours)}სთ` : `${Math.round(validHours / 24)}დღ`}-ში
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{o.item_code} — {o.item_name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Tag size={13} /> <strong className="font-mono">{fmt(o.unit_price)}/{o.unit_of_measure}</strong></span>
                      <span>×</span>
                      <span className="font-mono"><strong>{o.qty_offered}</strong> {o.unit_of_measure}</span>
                      <span>=</span>
                      <span className="font-mono font-extrabold text-gray-900">{fmt(o.total_amount)}</span>
                    </div>
                    {o.item_unit_cost && (
                      <p className="text-[11px] text-gray-400">
                        ჩვენი მითითებული ერთ. ფასი: <span className="font-mono">{fmt(o.item_unit_cost)}/{o.unit_of_measure}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
                      <span className="flex items-center gap-1"><UserIcon size={12} /> <strong className="text-gray-700">{o.supplier_name}</strong></span>
                      {o.supplier_contact && <span>{o.supplier_contact}</span>}
                      {o.supplier_phone && <span className="flex items-center gap-1"><Phone size={12} />{o.supplier_phone}</span>}
                      {o.supplier_email && <span className="flex items-center gap-1"><Mail size={12} />{o.supplier_email}</span>}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      მოქმედებს: {new Date(o.valid_until).toLocaleString("ka-GE")} · შემოვიდა: {new Date(o.created_at).toLocaleString("ka-GE")}
                    </p>
                    {o.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 mt-1">
                        <strong className="text-gray-700">შენიშვნა:</strong> {o.notes}
                      </p>
                    )}
                    {o.status === "Rejected" && o.rejection_reason && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mt-1">
                        <strong>უარყოფის მიზეზი:</strong> {o.rejection_reason}
                      </p>
                    )}
                    {o.status === "Accepted" && o.po_id && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-1">
                        <strong>★ მიღებული</strong> · {o.reviewer_name} · {new Date(o.date_reviewed).toLocaleDateString("ka-GE")}
                      </p>
                    )}
                  </div>

                  {isPending && !isExpired && (
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <button onClick={() => accept(o)} disabled={submitting} className="btn-success btn-sm">
                        <CheckCircle size={14} /> მიღება & PO
                      </button>
                      <button
                        onClick={() => { setRejectModal(o); setRejectReason(""); }}
                        disabled={submitting}
                        className="btn-danger btn-sm"
                      >
                        <XCircle size={14} /> უარყოფა
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title={`შეთავაზების უარყოფა: ${rejectModal?.offer_number || ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            მიუთითეთ უარყოფის მიზეზი (არასავალდებულო) — ეს ჩაწერდება ისტორიაში და შეიძლება გაუზიარდეს მომწოდებელს.
          </p>
          <textarea
            className="input"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="მაგ: ფასი მაღალია, ალტერნატივა უკვე შერჩეული..."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button onClick={() => setRejectModal(null)} className="btn-secondary btn-sm">გაუქმება</button>
            <button onClick={submitReject} disabled={submitting} className="btn-danger btn-sm">
              <XCircle size={14} /> უარყოფა
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
