import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { Plus, Star } from "lucide-react";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.get("/suppliers").then(setSuppliers).finally(() => setLoading(false)); }, []);

  const columns = [
    { key: "name", label: "მომწოდებელი", render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">{v}</span>
        {row.preferred ? <Star size={13} className="text-amber-400 fill-amber-400" /> : null}
      </div>
    )},
    { key: "contact_person", label: "საკონტაქტო" },
    { key: "phone", label: "ტელეფონი", render: (v) => <span className="font-mono text-xs text-gray-600">{v}</span> },
    { key: "email", label: "ელ-ფოსტა", render: (v) => <span className="text-brand-600">{v}</span> },
    { key: "lead_time_days", label: "მიწოდ. ვადა", render: (v) => <span className="font-mono">{v} დღე</span> },
    { key: "preferred", label: "სტატუსი", render: (v) => v ? <Badge status="პრიორიტეტული" color="green" dot /> : <Badge status="სტანდარტული" color="gray" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">მომწოდებლები</h1><p className="page-subtitle">{suppliers.length} აქტიური მომწოდებელი</p></div>
        <Link to="/suppliers/new" className="btn-primary"><Plus size={16} /> მომწოდებლის დამატება</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={suppliers} onRowClick={(row) => navigate(`/suppliers/${row.id}/edit`)} emptyMessage="მომწოდებლები არ არის დარეგისტრირებული." />
      )}
    </div>
  );
}
