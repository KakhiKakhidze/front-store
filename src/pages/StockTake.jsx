import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { Plus, ClipboardCheck } from "lucide-react";

export default function StockTake() {
  const [takes, setTakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countType, setCountType] = useState("Full");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get("/stocktake").then(setTakes).finally(() => setLoading(false)); api.get("/auth/categories").then(setCategories); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await api.post("/stocktake", { count_type: countType, performed_by: user.id, category_id: countType === "Cycle" ? categoryId : undefined, notes });
      setShowNew(false); navigate(`/stocktake/${result.id}`);
    } catch (err) { alert(err.message); }
    finally { setCreating(false); }
  };

  const columns = [
    { key: "reference", label: "მითითება", render: (v) => <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-dark-hover dark:text-gray-400 px-2 py-0.5 rounded-md">{v}</span> },
    { key: "count_type", label: "ტიპი", render: (v) => <Badge status={v === "Full" ? "სრული" : "ციკლური"} color={v === "Full" ? "blue" : "purple"} /> },
    { key: "item_count", label: "ნივთები", render: (v) => <span className="font-mono">{v}</span> },
    { key: "variance_count", label: "სხვაობები", render: (v) => v > 0 ? <span className="font-mono font-bold text-red-600 dark:text-red-400">{v}</span> : <span className="font-mono text-gray-300 dark:text-gray-600">0</span> },
    { key: "performer_name", label: "შემსრულებელი" },
    { key: "date_started", label: "დაწყებული", render: (v) => new Date(v).toLocaleDateString("ka-GE") },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">ფიზიკური ინვენტარიზაცია</h1><p className="page-subtitle">ციკლური დათვლა და სრული ფიზიკური ინვენტარიზაცია</p></div>
        <button onClick={() => setShowNew(true)} className="btn-primary"><Plus size={16} /> ახალი ინვენტარიზაცია</button>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable columns={columns} data={takes} onRowClick={(row) => navigate(`/stocktake/${row.id}`)} emptyMessage="ინვენტარიზაციის ჩანაწერები არ არის." />
      )}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="ინვენტარიზაციის დაწყება">
        <div className="space-y-5">
          <div><label className="label">დათვლის ტიპი</label><select className="input" value={countType} onChange={(e) => setCountType(e.target.value)}><option value="Full">სრული ფიზიკური დათვლა</option><option value="Cycle">ციკლური დათვლა (კატეგორიით)</option></select></div>
          {countType === "Cycle" && <div><label className="label">კატეგორია</label><select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required><option value="">აირჩიეთ კატეგორია</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>}
          <div><label className="label">შენიშვნები</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-dark-border">
            <button onClick={() => setShowNew(false)} className="btn-secondary">გაუქმება</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary"><ClipboardCheck size={16} /> {creating ? "იქმნება..." : "დათვლის დაწყება"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
