import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { Plus, CheckCircle, XCircle, PackageMinus } from "lucide-react";

export default function Issuance() {
  const [srfs, setSrfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { user } = useAuth();

  const fetchSrfs = () => { api.get("/issuance").then(setSrfs).finally(() => setLoading(false)); };
  useEffect(() => { fetchSrfs(); }, []);

  const handleView = async (srf) => {
    setDetailLoading(true);
    const detail = await api.get(`/issuance/${srf.id}`);
    setSelected(detail);
    setDetailLoading(false);
  };

  const handleApprove = async () => {
    try { await api.post(`/issuance/${selected.id}/approve`, { authorized_by: user.id }); setSelected(null); fetchSrfs(); }
    catch (err) { alert(err.message); }
  };

  const handleIssue = async () => {
    try { await api.post(`/issuance/${selected.id}/issue`, { issued_by: user.id }); setSelected(null); fetchSrfs(); }
    catch (err) { alert(err.message); }
  };

  const handleReject = async () => {
    const reason = prompt("უარყოფის მიზეზი:");
    if (!reason) return;
    await api.post(`/issuance/${selected.id}/reject`, { authorized_by: user.id, reason });
    setSelected(null); fetchSrfs();
  };

  const columns = [
    { key: "srf_number", label: "SRF #", render: (v) => <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md dark:bg-dark-hover dark:text-gray-400">{v}</span> },
    { key: "department_name", label: "განყოფილება", render: (v) => <span className="font-semibold text-gray-900 dark:text-white">{v}</span> },
    { key: "requester_name", label: "მოითხოვა" },
    { key: "authorizer_name", label: "დაამტკიცა", render: (v) => v || <span className="text-gray-300 dark:text-gray-600">მოლოდინში</span> },
    { key: "date_requested", label: "თარიღი", render: (v) => new Date(v).toLocaleDateString("ka-GE") },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">საქონლის გაცემა</h1><p className="page-subtitle">საწყობის მოთხოვნის ფორმები (SRF)</p></div>
        <Link to="/issuance/new" className="btn-primary"><Plus size={16} /> ახალი SRF</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={srfs} onRowClick={handleView} emptyMessage="საწყობის მოთხოვნები ჯერ არ არსებობს." />
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`SRF: ${selected?.srf_number}`} wide>
        {detailLoading ? (
          <div className="flex justify-center py-8"><div className="h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm dark:bg-dark-hover">
              <div><span className="text-gray-400 text-xs font-semibold uppercase dark:text-gray-500">განყოფილება</span><p className="font-semibold text-gray-900 mt-0.5 dark:text-white">{selected.department_name}</p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase dark:text-gray-500">სტატუსი</span><p className="mt-0.5"><Badge status={selected.status} dot /></p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase dark:text-gray-500">მოითხოვა</span><p className="font-medium text-gray-700 mt-0.5 dark:text-gray-300">{selected.requester_name}</p></div>
              <div><span className="text-gray-400 text-xs font-semibold uppercase dark:text-gray-500">დაამტკიცა</span><p className="font-medium text-gray-700 mt-0.5 dark:text-gray-300">{selected.authorizer_name || "—"}</p></div>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-xl dark:border-dark-border">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50 dark:border-dark-border dark:bg-dark-hover/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ნივთი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">მოთხოვნილი</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">გაცემული</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">მარაგში</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ღირებულება</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                  {selected.lines?.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{l.item_name}</span>
                        <span className="text-gray-400 ml-1.5 text-xs dark:text-gray-500">({l.item_code})</span>
                        {l.is_controlled ? <Badge status="კონტროლირებადი" color="red" /> : null}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{l.qty_requested} {l.unit_of_measure}</td>
                      <td className="px-4 py-3 text-right font-mono">{l.qty_issued}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">{l.current_qty}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">${(l.qty_requested * l.unit_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 dark:text-gray-400 dark:bg-dark-hover">{selected.notes}</p>}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-dark-border">
              {selected.status === "Pending" && (
                <>
                  <button onClick={handleReject} className="btn-danger btn-sm"><XCircle size={14} /> უარყოფა</button>
                  <button onClick={handleApprove} className="btn-success btn-sm"><CheckCircle size={14} /> დამტკიცება</button>
                </>
              )}
              {selected.status === "Approved" && (
                <button onClick={handleIssue} className="btn-primary btn-sm"><PackageMinus size={14} /> საქონლის გაცემა</button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
