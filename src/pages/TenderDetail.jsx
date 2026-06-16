import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Countdown from "../components/Countdown";
import {
  ArrowLeft, Send, Lock, BarChart2, Trophy, XCircle,
  Plus, Trash2, CheckCircle, EyeOff, Edit2, RefreshCw,
  FileSpreadsheet, Download, Award
} from "lucide-react";
import {
  exportWinnerDeclaration,
  exportBidComparison,
  exportTenderItemsList,
} from "../utils/tenderExcel";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bid entry modal state
  const [bidModal, setBidModal] = useState(false);
  const [bidSupplier, setBidSupplier] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [bidLines, setBidLines] = useState([]);
  const [bidSaving, setBidSaving] = useState(false);
  const [bidError, setBidError] = useState("");

  // Award modal
  const [awardModal, setAwardModal] = useState(false);
  const [awardSupplier, setAwardSupplier] = useState("");
  const [awardSaving, setAwardSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/tender/${id}`).then(setTender).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Status transitions ───────────────────────────────────────────────────────
  const transition = async (action, extra = {}) => {
    try {
      const result = await api.post(`/tender/${id}/${action}`, { actioned_by: user.id, ...extra });
      if (result.po_number) alert(`ტენდერი დასრულდა! PO შეიქმნა: ${result.po_number}`);
      load();
    } catch (err) { alert(err.message); }
  };

  // ── Open bid entry modal ─────────────────────────────────────────────────────
  const openBidModal = (supplier) => {
    // Pre-fill lines from tender items
    const lines = tender.items.map((it) => ({
      tender_item_id: it.id,
      item_code: it.item_code,
      item_name: it.item_name,
      unit_of_measure: it.unit_of_measure,
      qty_required: it.qty_required,
      unit_price: "",
      qty_offered: it.qty_required,
      notes: "",
    }));
    // If bid already exists for this supplier, prefill prices
    const existing = tender.bids.find((b) => b.supplier_id === supplier.supplier_id);
    if (existing) {
      lines.forEach((l) => {
        const el = existing.lines.find((el) => el.tender_item_id === l.tender_item_id);
        if (el) { l.unit_price = el.unit_price; l.qty_offered = el.qty_offered; l.notes = el.notes || ""; }
      });
      setBidNotes(existing.notes || "");
    } else {
      setBidNotes("");
    }
    setBidLines(lines);
    setBidSupplier(supplier);
    setBidError("");
    setBidModal(true);
  };

  const updateBidLine = (i, key, val) =>
    setBidLines((l) => l.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));

  const bidTotal = bidLines.reduce((s, l) => s + (Number(l.unit_price) || 0) * (Number(l.qty_offered) || 0), 0);

  const submitBid = async () => {
    setBidError("");
    if (bidLines.some((l) => !l.unit_price)) return setBidError("შეიყვანეთ ყველა ერთეულის ფასი");
    setBidSaving(true);
    try {
      await api.post(`/tender/${id}/bids`, {
        supplier_id: bidSupplier.supplier_id,
        notes: bidNotes,
        lines: bidLines.map((l) => ({
          tender_item_id: l.tender_item_id,
          unit_price: Number(l.unit_price),
          qty_offered: Number(l.qty_offered),
          notes: l.notes,
        })),
      });
      setBidModal(false);
      load();
    } catch (err) { setBidError(err.message); } finally { setBidSaving(false); }
  };

  // ── Award ────────────────────────────────────────────────────────────────────
  const submitAward = async () => {
    if (!awardSupplier) return alert("შეარჩიეთ გამარჯვებული მომწოდებელი");
    setAwardSaving(true);
    try {
      await api.post(`/tender/${id}/award`, {
        awarded_by: user.id,
        winner_supplier_id: Number(awardSupplier),
      });
      setAwardModal(false);
      load();
    } catch (err) { alert(err.message); } finally { setAwardSaving(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isPO = user?.role === "PurchasingOfficer";
  const isGM = user?.role === "GM";
  const isFC = user?.role === "FinanceController";

  const canPublish = isPO && tender?.status === "Draft";
  const canClose = isPO && tender?.status === "Published";
  const canEvaluate = isPO && tender?.status === "Closed";
  const canEnterBid = (isPO || isFC) && ["Published", "Closed", "Evaluation"].includes(tender?.status);
  const canFinanceApprove = (isFC || isGM) && tender?.status === "Evaluation" && !tender?.finance_approved_by;
  const canAward = (isGM || isPO) && tender?.status === "Evaluation";
  const canCancel = !["Awarded", "Cancelled"].includes(tender?.status);
  const age = tender ? Date.now() - new Date(tender.createdAt).getTime() : 0;
  const isWithinOneHour = age < 60 * 60 * 1000;
  const canEdit = (isPO || isGM) && (["Draft", "Published"].includes(tender?.status) || isWithinOneHour);
  const canRenew = (isPO || isGM) && ["Awarded", "Cancelled", "Closed", "Evaluation"].includes(tender?.status);

  const deadlinePassed = tender && new Date(tender.deadline) < new Date();

  const lowestBid = tender?.bids?.length
    ? tender.bids.reduce((min, b) => (b.total_amount < min.total_amount ? b : min), tender.bids[0])
    : null;

  // Sorted bids (cheapest first) for ranking
  const rankedBids = tender?.bids?.length
    ? [...tender.bids].sort((a, b) => a.total_amount - b.total_amount)
    : [];
  const rankByBidId = new Map(rankedBids.map((b, idx) => [b.id, idx + 1]));

  // Bid stats
  const bidStats = tender?.bids?.length
    ? (() => {
        const totals = tender.bids.map((b) => b.total_amount);
        const lowest = Math.min(...totals);
        const highest = Math.max(...totals);
        const avg = totals.reduce((s, n) => s + n, 0) / totals.length;
        const savingsAbs = highest - lowest;
        const savingsPct = highest > 0 ? (savingsAbs / highest) * 100 : 0;
        return { lowest, highest, avg, savingsAbs, savingsPct, count: tender.bids.length };
      })()
    : null;

  // Per-supplier line-win counts (how many items each supplier won on price)
  const lineWinsBySupplier = new Map();
  if (tender?.bids?.length && tender?.items?.length) {
    tender.items.forEach((it) => {
      const prices = tender.bids
        .map((b) => ({ supplier_id: b.supplier_id, price: b.lines.find((l) => l.tender_item_id === it.id)?.unit_price }))
        .filter((p) => p.price !== undefined && p.price !== null);
      if (!prices.length) return;
      const minPrice = Math.min(...prices.map((p) => Number(p.price)));
      prices.forEach(({ supplier_id, price }) => {
        if (Number(price) === minPrice) {
          lineWinsBySupplier.set(supplier_id, (lineWinsBySupplier.get(supplier_id) || 0) + 1);
        }
      });
    });
  }

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>;
  if (!tender) return <p className="text-gray-600">ტენდერი ვერ მოიძებნა.</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/tender")} className="btn-ghost btn-sm"><ArrowLeft size={14} /> უკან</button>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
                {tender.tender_number}
              </span>
              <Badge status={tender.status} dot />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{tender.title}</h1>
            {tender.description && <p className="text-sm text-gray-600 mt-1">{tender.description}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {canPublish && (
              <button onClick={() => transition("publish")} className="btn-primary btn-sm">
                <Send size={14} /> გამოქვეყნება
              </button>
            )}
            {canClose && (
              <button onClick={() => transition("close")} className="btn-warning btn-sm">
                <Lock size={14} /> დახურვა
              </button>
            )}
            {canEvaluate && (
              <button onClick={() => transition("evaluate")} className="btn-secondary btn-sm">
                <BarChart2 size={14} /> შეფასება
              </button>
            )}
            {canFinanceApprove && (
              <button onClick={() => transition("finance-approve", { approved_by: user.id })} className="btn-success btn-sm">
                <CheckCircle size={14} /> ფინ. დამტკიცება
              </button>
            )}
            {canAward && (
              <button onClick={() => { setAwardSupplier(""); setAwardModal(true); }} className="btn-primary btn-sm">
                <Trophy size={14} /> გამარჯვებულის გამოვლენა
              </button>
            )}
            {canEdit && (
              <button onClick={() => navigate(`/tender/${id}/edit`)} className="btn-secondary btn-sm">
                <Edit2 size={14} /> რედაქტირება
              </button>
            )}
            {canRenew && (
              <button onClick={() => navigate("/tender/new", { state: { renewFrom: tender } })} className="btn-success btn-sm">
                <RefreshCw size={14} /> განახლება
              </button>
            )}
            {canCancel && (
              <button onClick={() => { if (confirm("ნამდვილად გსურთ ტენდერის გაუქმება?")) transition("cancel"); }} className="btn-danger btn-sm">
                <XCircle size={14} /> გაუქმება
              </button>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 p-4 bg-gray-50 rounded-xl text-sm">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">შემქმნელი</span>
            <p className="font-medium text-gray-600 mt-0.5">{tender.creator_name}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ბოლო ვადა</span>
            <p className="font-semibold mt-0.5">
              <Countdown target={tender.deadline} />
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(tender.deadline).toLocaleString("ka-GE")}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ფინ. დამტკიცება</span>
            <p className="font-medium text-gray-600 mt-0.5">
              {tender.finance_approver_name || <span className="text-gray-400">—</span>}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">გამარჯვებული</span>
            <p className="font-semibold text-emerald-600 mt-0.5">
              {tender.winner_name || <span className="font-normal text-gray-400">—</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Bid statistics — shown when there are bids */}
      {bidStats && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">ბიდის სტატისტიკა</h2>
            <span className="text-xs text-gray-400">{bidStats.count} შეთავაზება</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">ყველაზე დაბალი</p>
              <p className="text-lg font-extrabold text-emerald-700 font-mono">{fmt(bidStats.lowest)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">საშუალო</p>
              <p className="text-lg font-extrabold text-gray-700 font-mono">{fmt(bidStats.avg)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ყველაზე მაღალი</p>
              <p className="text-lg font-extrabold text-gray-700 font-mono">{fmt(bidStats.highest)}</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70">დანაზოგი</p>
              <p className="text-lg font-extrabold text-violet-700 font-mono">{fmt(bidStats.savingsAbs)}</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70">% მაქს.-დან</p>
              <p className="text-lg font-extrabold text-violet-700 font-mono">{bidStats.savingsPct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Excel exports */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Excel ექსპორტი</p>
              <p className="text-xs text-gray-500">ჩამოტვირთეთ ტენდერის დოკუმენტები XLSX ფორმატში</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportTenderItemsList(tender)}
              className="btn-secondary btn-sm"
              title="სატენდერო ნივთების სია — გასაგზავნად მომწოდებლებთან"
            >
              <Download size={14} /> ნივთების სია
            </button>
            {tender.bids.length > 0 && (
              <button
                onClick={() => exportBidComparison(tender)}
                className="btn-secondary btn-sm"
                title="შეთავაზებების შედარება — შეფასებისთვის"
              >
                <BarChart2 size={14} /> შეთავაზებების შედარება
              </button>
            )}
            {tender.status === "Awarded" && tender.winner_name && (
              <button
                onClick={() => exportWinnerDeclaration(tender)}
                className="btn-success btn-sm"
                title="გამარჯვებულის გამოცხადების აქტი — ოფიციალური დოკუმენტი"
              >
                <Award size={14} /> გამარჯვებულის აქტი
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tender items */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">სატენდერო ნივთები</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">ნივთი</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">საჭ. რაოდ.</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">შენიშვნა</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tender.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{it.item_code} — {it.item_name}</td>
                  <td className="px-4 py-3 text-right font-mono">{it.qty_required} {it.unit_of_measure}</td>
                  <td className="px-4 py-3 text-gray-600">{it.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invited suppliers & bid entry */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">მოწვეული მომწოდებლები</h2>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <EyeOff size={11} /> თითოეული შეთავაზება დახშულია — მონაწილეები ვერ ხედავენ ერთმანეთის ფასებს
            </p>
          </div>
        </div>
        {tender.invited_suppliers.length === 0 ? (
          <p className="text-sm text-gray-400 italic">მოწვეული მომწოდებლები არ არის</p>
        ) : (
          <div className="space-y-2">
            {tender.invited_suppliers.map((s) => {
              const hasBid = tender.bids.some((b) => b.supplier_id === s.supplier_id);
              const bid = tender.bids.find((b) => b.supplier_id === s.supplier_id);
              const isLowest = lowestBid && bid?.id === lowestBid.id;
              const rank = bid ? rankByBidId.get(bid.id) : null;
              const lineWins = lineWinsBySupplier.get(s.supplier_id) || 0;
              const overLowest = bid && lowestBid ? bid.total_amount - lowestBid.total_amount : 0;
              const overLowestPct = bid && lowestBid && lowestBid.total_amount > 0
                ? (overLowest / lowestBid.total_amount) * 100
                : 0;
              return (
                <div key={s.id} className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
                  isLowest ? "border-emerald-300 bg-emerald-50" :
                  hasBid ? "border-blue-100 bg-blue-50/50" :
                  "border-gray-200 bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {rank && (
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                        rank === 1 ? "bg-emerald-500 text-white" :
                        rank === 2 ? "bg-gray-300 text-gray-800" :
                        rank === 3 ? "bg-amber-400 text-amber-900" :
                        "bg-gray-200 text-gray-600"
                      }`} title={`ადგილი #${rank}`}>
                        {rank}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                        {s.supplier_name}
                        {isLowest && <span className="text-emerald-600 text-xs font-bold">★ ყველაზე იაფი</span>}
                        {hasBid && lineWins > 0 && (
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded">
                            {lineWins} პოზ. მოიგო
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.contact_person || ""}
                        {s.phone ? ` · ${s.phone}` : ""}
                        {s.email ? ` · ${s.email}` : ""}
                      </p>
                      {hasBid && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          შეტანილია {new Date(bid.submitted_at).toLocaleString("ka-GE")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasBid && (
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-gray-700 block">{fmt(bid.total_amount)}</span>
                        {!isLowest && overLowest > 0 && (
                          <span className="text-[11px] text-red-500 font-semibold font-mono">
                            +{fmt(overLowest)} ({overLowestPct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}
                    {!hasBid && <span className="text-xs text-gray-400 italic">შეთავაზება არ არის</span>}
                    {canEnterBid && (
                      <button onClick={() => openBidModal(s)} className="btn-secondary btn-sm">
                        <Plus size={13} /> {hasBid ? "რედაქტირება" : "შეთავაზება"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bids comparison — visible to admin as soon as any bid exists */}
      {tender.bids.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
            შეთავაზებების შედარება
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">ნივთი</th>
                  {rankedBids.map((b, idx) => (
                    <th key={b.id} className={`px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider ${
                      lowestBid?.id === b.id ? "text-emerald-500" : "text-gray-400"
                    }`}>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                            idx === 0 ? "bg-emerald-500 text-white" :
                            idx === 1 ? "bg-gray-300 text-gray-800" :
                            idx === 2 ? "bg-amber-400 text-amber-900" :
                            "bg-gray-200 text-gray-600"
                          }`}>{idx + 1}</span>
                          {b.supplier_name}
                        </span>
                        <span className="text-[9px] font-normal text-gray-400 normal-case">
                          {new Date(b.submitted_at).toLocaleDateString("ka-GE")}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tender.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {it.item_code} — {it.item_name}
                      <span className="ml-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">({it.unit_of_measure})</span>
                    </td>
                    {rankedBids.map((b) => {
                      const line = b.lines.find((l) => l.tender_item_id === it.id);
                      const itemPrices = rankedBids.map((bid) => bid.lines.find((l) => l.tender_item_id === it.id)?.unit_price).filter(Boolean);
                      const minPrice = Math.min(...itemPrices);
                      const isMin = line && Number(line.unit_price) === minPrice;
                      return (
                        <td key={b.id} className={`px-4 py-3 text-right font-mono ${isMin ? "text-emerald-600 font-bold" : "text-gray-600"}`}>
                          {line
                            ? <span>
                                {isMin && <span className="mr-1">★</span>}
                                {fmt(line.unit_price)}/{it.unit_of_measure} × {line.qty_offered} {it.unit_of_measure}
                              </span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200">
                  <td className="px-4 py-3 font-bold text-gray-600">ჯამი</td>
                  {rankedBids.map((b) => (
                    <td key={b.id} className={`px-4 py-3 text-right font-mono font-extrabold ${lowestBid?.id === b.id ? "text-emerald-600" : "text-gray-600"}`}>
                      {fmt(b.total_amount)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50/40">
                  <td className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">% დაბლიდან</td>
                  {rankedBids.map((b) => {
                    const variance = lowestBid && lowestBid.total_amount > 0
                      ? ((b.total_amount - lowestBid.total_amount) / lowestBid.total_amount) * 100
                      : 0;
                    return (
                      <td key={b.id} className={`px-4 py-2 text-right text-[11px] font-mono ${
                        lowestBid?.id === b.id ? "text-emerald-600 font-bold" : "text-red-500"
                      }`}>
                        {lowestBid?.id === b.id ? "—" : `+${variance.toFixed(1)}%`}
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-gray-50/40">
                  <td className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">მოგებული პოზიციები</td>
                  {rankedBids.map((b) => (
                    <td key={b.id} className="px-4 py-2 text-right text-[11px] font-mono text-violet-700 font-semibold">
                      {lineWinsBySupplier.get(b.supplier_id) || 0} / {tender.items.length}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bid Entry Modal */}
      <Modal open={bidModal} onClose={() => setBidModal(false)} title={`შეთავაზება: ${bidSupplier?.supplier_name || ""}`} wide>
        {bidSupplier && (
          <div className="space-y-4">
            {bidError && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-sm">
                {bidError}
              </div>
            )}
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
              <EyeOff size={13} /> ეს შეთავაზება <strong>დახშულია</strong> — სხვა მომწოდებლები ვერ ნახავენ
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-gray-400">ნივთი</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-gray-400">საჭ. რაოდ.</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-gray-400">შეთ. რაოდ.</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-gray-400">ერთ. ფასი</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-gray-400">ჯამი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bidLines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">{l.item_code} — {l.item_name}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600">{l.qty_required} {l.unit_of_measure}</td>
                      <td className="px-3 py-2">
                        <div className="inline-flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                          <input type="number" min="0.01" step="any" className="text-right w-20 px-2 py-1.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0" value={l.qty_offered}
                            onChange={(e) => updateBidLine(i, "qty_offered", e.target.value)} />
                          <span className="px-2 flex items-center text-[11px] font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                            {l.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="inline-flex items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-200">
                          <input type="number" min="0" step="0.01" className="text-right w-24 px-2 py-1.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0" placeholder="0.00" value={l.unit_price}
                            onChange={(e) => updateBidLine(i, "unit_price", e.target.value)} required />
                          <span className="px-2 flex items-center text-[11px] font-semibold text-gray-500 bg-gray-50 border-l border-gray-200">
                            /{l.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-gray-600">
                        {fmt((Number(l.unit_price) || 0) * (Number(l.qty_offered) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={4} className="px-3 py-3 text-right font-bold text-gray-600">სულ:</td>
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-gray-900">{fmt(bidTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div>
              <label className="label">შენიშვნები</label>
              <textarea className="input" rows={2} value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button onClick={() => setBidModal(false)} className="btn-secondary btn-sm">გაუქმება</button>
              <button onClick={submitBid} disabled={bidSaving} className="btn-primary btn-sm">
                <CheckCircle size={14} /> {bidSaving ? "ინახება..." : "შეთავაზების შენახვა"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Award Modal */}
      <Modal open={awardModal} onClose={() => setAwardModal(false)} title="გამარჯვებულის გამოვლენა">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            შეარჩიეთ გამარჯვებული მომწოდებელი. სისტემა ავტომატურად შექმნის შესყიდვის შეკვეთას (PO).
          </p>
          <div className="space-y-2">
            {tender.bids.map((b) => {
              const isLowest = lowestBid?.id === b.id;
              return (
                <label key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  String(awardSupplier) === String(b.supplier_id)
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 hover:border-gray-200"
                }`}>
                  <input type="radio" name="winner" value={b.supplier_id} checked={String(awardSupplier) === String(b.supplier_id)}
                    onChange={(e) => setAwardSupplier(e.target.value)} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {b.supplier_name}
                      {isLowest && <span className="ml-2 text-emerald-600 text-xs font-bold">★ ყველაზე იაფი</span>}
                    </p>
                    <p className="font-mono text-sm text-gray-600">{fmt(b.total_amount)}</p>
                  </div>
                </label>
              );
            })}
            {tender.bids.length === 0 && <p className="text-sm text-gray-400 italic">შეთავაზებები ჯერ არ არის</p>}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button onClick={() => setAwardModal(false)} className="btn-secondary btn-sm">გაუქმება</button>
            <button onClick={submitAward} disabled={awardSaving || !awardSupplier} className="btn-primary btn-sm">
              <Trophy size={14} /> {awardSaving ? "ფორმდება..." : "გამოვლენა და PO-ს შექმნა"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
