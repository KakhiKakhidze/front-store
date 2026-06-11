import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { Plus, Search, SlidersHorizontal, AlertTriangle, FileSearch } from "lucide-react";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchItems = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (lowOnly) params.set("low_stock", "1");
    api.get(`/inventory?${params}`).then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { api.get("/auth/categories").then(setCategories); }, []);
  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [search, category, lowOnly]);

  const columns = [
    {
      key: "code", label: "კოდი",
      render: (v) => <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">{v}</span>,
    },
    { key: "name", label: "დასახელება", render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
    { key: "category_name", label: "კატეგორია" },
    {
      key: "current_qty", label: "რაოდენობა",
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className={`font-mono font-semibold ${v <= row.reorder_point ? "text-red-600" : "text-gray-900"}`}>{v}</span>
          <span className="text-[11px] text-gray-400">{row.unit_of_measure}</span>
          {v <= row.reorder_point && <AlertTriangle size={13} className="text-red-400" />}
        </div>
      ),
    },
    {
      key: "reorder_point", label: "შეკვეთის წრტ.",
      render: (v, row) => <span className="font-mono text-gray-400">{v} {row.unit_of_measure}</span>,
    },
    { key: "location_bin", label: "თარო", render: (v) => <span className="font-mono text-xs text-gray-600">{v}</span> },
    {
      key: "unit_cost", label: "ფასი",
      render: (v) => <span className="font-mono font-semibold">${v?.toFixed(2)}</span>,
    },
    {
      key: "flags", label: "ნიშნები",
      render: (_, row) => (
        <div className="flex gap-1">
          {row.is_perishable ? <Badge status="მალფუჭებადი" color="yellow" /> : null}
          {row.is_controlled ? <Badge status="კონტროლირებადი" color="red" /> : null}
        </div>
      ),
    },
    {
      key: "actions", label: "",
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate("/tender/new", { state: { fromAlert: row } });
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <FileSearch size={13} />
          ტენდერი
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ინვენტარი</h1>
          <p className="page-subtitle">{items.length} აქტიური ნივთი საწყობში</p>
        </div>
        <Link to="/inventory/new" className="btn-primary">
          <Plus size={16} /> ნივთის დამატება
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="მოძებნეთ ნივთი სახელით ან კოდით..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">ყველა კატეგორია</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="h-4 w-4 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs font-medium">მხოლოდ დაბალი მარაგი</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          onRowClick={(row) => navigate("/tender/new", { state: { fromAlert: row } })}
          emptyMessage="ინვენტარის ნივთები ფილტრებს არ შეესაბამება."
        />
      )}
    </div>
  );
}
