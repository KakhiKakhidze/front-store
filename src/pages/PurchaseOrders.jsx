import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { Plus, CheckCircle, Gavel } from "lucide-react";

export default function PurchaseOrders() {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();

  const fetchPOs = () => { api.get("/po").then(setPOs).finally(() => setLoading(false)); };
  useEffect(() => { fetchPOs(); }, []);

  const handleView = async (po) => { setSelected(await api.get(`/po/${po.id}`)); };
  const handleApprove = async () => { try { await api.post(`/po/${selected.id}/approve`, { approved_by: user.id }); setSelected(null); fetchPOs(); } catch (err) { alert(err.message); } };
  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  const columns = [
    { key: "po_number", label: "PO #", render: (v) => <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">{v}</span> },
    { key: "supplier_name", label: "მომწოდებელი", render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
    { key: "total_amount", label: "ჯამი", render: (v) => <span className="font-mono font-semibold">{fmt(v)}</span> },
    { key: "date_created", label: "თარიღი", render: (v) => new Date(v).toLocaleDateString("ka-GE") },
    { key: "creator_name", label: "შემქმნელი" },
    { key: "tender_number", label: "ტენდერი", render: (v, row) => v
      ? <Link to={`/tender/${row.tender_id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full hover:underline"><Gavel size={10} />{v}</Link>
      : <span className="text-gray-400">—</span> },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">შესყიდვის შეკვეთები</h1><p className="page-subtitle">მომწოდებლებისთვის შესყიდვის შეკვეთების მართვა</p></div>
        <Link to="/po/new" className="btn-primary"><Plus size={16} /> ახალი შეკვეთა</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={pos} onRowClick={handleView} emptyMessage="შესყიდვის შეკვეთები ჯერ არ არსებობს." />
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`PO: ${selected?.po_number}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
              <div><span className="text-gray-400 text-xs font-semibold uppercase">მომწოდებელი</span><p className="font-semibold text-gray-900 mt-0.5">{selected.supplier_name}</p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase">სტატუსი</span><p className="mt-0.5"><Badge status={selected.status} dot /></p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase">ჯამი</span><p className="font-mono font-bold text-gray-900 mt-0.5">{fmt(selected.total_amount)}</p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase">შექმნის თარიღი</span><p className="text-gray-600 mt-0.5">{new Date(selected.date_created).toLocaleDateString("ka-GE")}</p></div>
              {selected.tender_number && (
                <div className="col-span-2"><span className="text-gray-400 text-xs font-semibold uppercase">ტენდერი</span>
                  <p className="mt-0.5"><Link to={`/tender/${selected.tender_id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:underline"><Gavel size={13} />{selected.tender_number}</Link></p>
                </div>
              )}
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">ნივთი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">შეკვეთილი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">მიღებული</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ერთ. ფასი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">ხაზის ჯამი</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.lines?.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{l.item_code} — {l.item_name}</td>
                      <td className="px-4 py-3 text-right font-mono">{l.qty_ordered} {l.unit_of_measure}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{l.qty_received}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(l.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(l.qty_ordered * l.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected.status === "Draft" && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button onClick={handleApprove} className="btn-success btn-sm"><CheckCircle size={14} /> შეკვეთის დამტკიცება</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
