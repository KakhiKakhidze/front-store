import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { Plus, PackagePlus } from "lucide-react";

export default function Receiving() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/receiving").then(setGrns).finally(() => setLoading(false)); }, []);

  const columns = [
    { key: "grn_number", label: "GRN #", render: (v) => <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-dark-hover dark:text-gray-400 px-2 py-0.5 rounded-md">{v}</span> },
    { key: "po_number", label: "შეკვეთა #", render: (v) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{v}</span> },
    { key: "supplier_name", label: "მომწოდებელი", render: (v) => <span className="font-semibold text-gray-900 dark:text-white">{v}</span> },
    { key: "receiver_name", label: "მიმღები" },
    { key: "date_received", label: "თარიღი", render: (v) => new Date(v).toLocaleDateString("ka-GE") },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">საქონლის მიღება</h1>
          <p className="page-subtitle">შესყიდვის შეკვეთების მიხედვით საქონლის მიღება</p>
        </div>
        <Link to="/receiving/new" className="btn-primary"><Plus size={16} /> ახალი GRN</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={grns} emptyMessage="მიღების ჩანაწერები ჯერ არ არსებობს." />
      )}
    </div>
  );
}
