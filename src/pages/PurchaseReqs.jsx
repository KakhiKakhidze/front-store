import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { Plus, Zap, CheckCircle, XCircle, AlertTriangle, Gavel } from "lucide-react";

export default function PurchaseReqs() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPrs = () => { api.get("/purchasing").then(setPrs).finally(() => setLoading(false)); };
  useEffect(() => { fetchPrs(); }, []);

  const handleAutoGenerate = async () => {
    try {
      const result = await api.post("/purchasing/auto-generate", { created_by: user.id });
      if (result.message) alert(result.message);
      else { alert(`შეიქმნა ${result.pr_number} ${result.items_count} ნივთით ($${result.total_estimated.toFixed(2)})`); fetchPrs(); }
    } catch (err) { alert(err.message); }
  };

  const handleView = async (pr) => { setSelected(await api.get(`/purchasing/${pr.id}`)); };
  const handleApprove = async () => { try { await api.post(`/purchasing/${selected.id}/approve`, { approved_by: user.id }); setSelected(null); fetchPrs(); } catch (err) { alert(err.message); } };
  const handleReject = async () => { const reason = prompt("უარყოფის მიზეზი:"); if (!reason) return; await api.post(`/purchasing/${selected.id}/reject`, { approved_by: user.id, reason }); setSelected(null); fetchPrs(); };
  const handleConvertToTender = () => {
    if (!selected) return;
    const itemIds = selected.lines?.map((l) => l.item_id).filter(Boolean);
    navigate("/tender/new", { state: { fromPR: selected } });
    setSelected(null);
  };
  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  const columns = [
    { key: "pr_number", label: "PR #", render: (v) => <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">{v}</span> },
    { key: "creator_name", label: "შემქმნელი", render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
    { key: "total_estimated", label: "სავარ. ჯამი", render: (v) => <span className="font-mono font-semibold">{fmt(v)}</span> },
    { key: "date_created", label: "თარიღი", render: (v) => new Date(v).toLocaleDateString("ka-GE") },
    { key: "approver_name", label: "დამამტკიცებელი", render: (v) => v || <span className="text-gray-400">—</span> },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">შესყიდვის მოთხოვნები</h1><p className="page-subtitle">შექმენით და დაამტკიცეთ შესყიდვის მოთხოვნები</p></div>
        <div className="flex gap-2">
          <button onClick={handleAutoGenerate} className="btn-warning btn-sm"><Zap size={14} /> ავტო-გენერაცია</button>
          <Link to="/purchasing/new" className="btn-primary"><Plus size={16} /> ახალი PR</Link>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={prs} onRowClick={handleView} emptyMessage="შესყიდვის მოთხოვნები ჯერ არ არსებობს." />
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`PR: ${selected?.pr_number}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
              <div><span className="text-gray-400 text-xs font-semibold uppercase">შემქმნელი</span><p className="font-medium text-gray-600 mt-0.5">{selected.creator_name}</p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase">სტატუსი</span><p className="mt-0.5"><Badge status={selected.status} dot /></p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase">სავარაუდო ჯამი</span><p className="font-mono font-bold text-gray-900 mt-0.5">{fmt(selected.total_estimated)}</p></div>
              {selected.total_estimated > 5000 && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-xs font-medium">
                  <AlertTriangle size={14} /> საჭიროებს ფინანსების / გენ. მენეჯერის დამტკიცებას
                </div>
              )}
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">ნივთი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">რაოდ.</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ერთ. ფასი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ჯამი</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">მომწოდებელი</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.lines?.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{l.item_code} — {l.item_name}</td>
                      <td className="px-4 py-3 text-right font-mono">{l.qty_required} {l.unit_of_measure}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(l.estimated_unit_cost)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(l.qty_required * l.estimated_unit_cost)}</td>
                      <td className="px-4 py-3 text-gray-600">{l.supplier_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{selected.notes}</p>}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 flex-wrap">
              <button onClick={handleConvertToTender} className="btn-warning btn-sm mr-auto">
                <Gavel size={14} /> ტენდერად გადაყვანა
              </button>
              {selected.status === "Pending" && (
                <>
                  <button onClick={handleReject} className="btn-danger btn-sm"><XCircle size={14} /> უარყოფა</button>
                  <button onClick={handleApprove} className="btn-success btn-sm"><CheckCircle size={14} /> დამტკიცება</button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
