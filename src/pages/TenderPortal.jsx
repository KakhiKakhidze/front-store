import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Countdown from "../components/Countdown";
import { 
  Trophy, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  EyeOff,
  TrendingDown
} from "lucide-react";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function TenderPortal() {
  const { user } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  
  // Bid State
  const [bidModal, setBidModal] = useState(false);
  const [bidLines, setBidLines] = useState([]);
  const [bidNotes, setBidNotes] = useState("");
  const [bidSaving, setBidSaving] = useState(false);
  const [bidError, setBidError] = useState("");

  const load = useCallback(async () => {
    if (!user?.supplier_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/tender/portal?supplier_id=${user.supplier_id}`);
      setTenders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.supplier_id]);

  useEffect(() => {
    load();
  }, [load]);

  const openBidModal = (t) => {
    setSelectedTender(t);
    // In a real app, we'd fetch the existing bid for this specific supplier if it exists
    // For now, we'll initialize with tender items
    setBidLines(t.items.map(it => ({
      tender_item_id: it.id,
      item_code: it.item_code,
      item_name: it.item_name,
      unit_of_measure: it.unit_of_measure,
      qty_required: it.qty_required,
      unit_price: "",
      qty_offered: it.qty_required,
      notes: ""
    })));
    setBidNotes("");
    setBidError("");
    setBidModal(true);
  };

  const updateBidLine = (i, key, val) =>
    setBidLines(l => l.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));

  const bidTotal = bidLines.reduce((s, l) => s + (Number(l.unit_price) || 0) * (Number(l.qty_offered) || 0), 0);

  const submitBid = async () => {
    setBidError("");
    if (bidLines.some(l => !l.unit_price)) return setBidError("შეიყვანეთ ყველა ერთეულის ფასი");
    setBidSaving(true);
    try {
      await api.post(`/tender/${selectedTender.id}/bids`, {
        supplier_id: user.supplier_id,
        notes: bidNotes,
        lines: bidLines.map(l => ({
          tender_item_id: l.tender_item_id,
          unit_price: Number(l.unit_price),
          qty_offered: Number(l.qty_offered),
          notes: l.notes
        }))
      });
      setBidModal(false);
      load();
    } catch (err) {
      setBidError(err.message);
    } finally {
      setBidSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 skeleton" />)}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">მომწოდებლის პორტალი</h1>
          <p className="text-gray-500 mt-1">აქტიური ტენდერები და თქვენი შეთავაზებები</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tenders.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-500 font-medium">ამჟამად აქტიური ტენდერები არ არის</p>
          </div>
        ) : (
          tenders.map(t => (
            <div key={t.id} className="card p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all duration-300 group border-l-4 border-l-brand-500">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {t.tender_number}
                  </span>
                  <Badge status="Published" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{t.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span>ბოლო ვადა: <Countdown target={t.deadline} className="text-xs" /></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>{t.items.length} დასახელების ნივთი</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 min-w-[200px] border-l border-gray-100 pl-6">
                <div className="text-center w-full p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-brand-50/30 transition-colors">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">მინიმალური შეთავაზება</p>
                  <p className="text-xl font-mono font-black text-emerald-600 flex items-center justify-center gap-2">
                    <TrendingDown size={18} />
                    {t.lowest_bid ? fmt(t.lowest_bid) : "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">ანონიმური</p>
                </div>
                
                <button 
                  onClick={() => openBidModal(t)}
                  className="btn-primary w-full shadow-lg shadow-brand-500/20"
                >
                  <ExternalLink size={16} /> მონაწილეობა
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bid Modal */}
      <Modal 
        open={bidModal} 
        onClose={() => setBidModal(false)} 
        title={`შეთავაზების წარდგენა: ${selectedTender?.tender_number}`} 
        wide
      >
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mt-1">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">მინიმალური შეთავაზება ამ დროისთვის: {selectedTender?.lowest_bid ? fmt(selectedTender.lowest_bid) : "ჯერ არ არის"}</p>
              <p className="text-xs text-emerald-700 mt-1">თქვენი შეთავაზება უნდა იყოს კონკურენტული. შეთავაზებები ხედავს მხოლოდ ადმინისტრატორი.</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
              <EyeOff size={14} /> სატენდერო ნივთები
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-bold text-gray-500">ნივთი</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500">საჭ. რაოდენობა</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500">ერთეულის ფასი</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500">ჯამი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bidLines.map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{l.item_name}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{l.item_code}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-600">
                        {l.qty_required} {l.unit_of_measure}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-stretch rounded-xl border border-gray-200 bg-gray-100/50 overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-200">
                          <span className="px-2 flex items-center text-gray-400">$</span>
                          <input
                            type="number"
                            className="text-right w-24 px-2 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                            step="0.01"
                            value={l.unit_price}
                            onChange={(e) => updateBidLine(i, "unit_price", e.target.value)}
                            placeholder="0.00"
                          />
                          <span className="px-2 flex items-center text-[11px] font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                            /{l.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-gray-900">
                        {fmt((Number(l.unit_price) || 0) * l.qty_required)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/50">
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-500 uppercase tracking-wider">საერთო შეთავაზება:</td>
                    <td className="px-4 py-4 text-right font-mono font-black text-2xl text-emerald-600">{fmt(bidTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">შენიშვნები (სურვილისამებრ)</label>
            <textarea 
              className="input min-h-[100px] resize-none" 
              placeholder="დამატებითი ინფორმაცია თქვენი შეთავაზების შესახებ..."
              value={bidNotes}
              onChange={(e) => setBidNotes(e.target.value)}
            />
          </div>

          {bidError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">{bidError}</div>}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setBidModal(false)} className="btn-ghost">გაუქმება</button>
            <button 
              onClick={submitBid} 
              disabled={bidSaving} 
              className="btn-primary min-w-[160px] shadow-xl shadow-brand-500/30"
            >
              {bidSaving ? "იგზავნება..." : "წარდგენა"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
