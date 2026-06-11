import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { Plus, Gavel, Trophy, Clock, AlertTriangle, DollarSign } from "lucide-react";

const STATUS_OPTIONS = ["All", "Draft", "Published", "Closed", "Evaluation", "Awarded", "Cancelled"];
const ACTIVE_STATUSES = ["Draft", "Published", "Closed", "Evaluation"];

export default function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/tender").then(setTenders).finally(() => setLoading(false));
  }, []);

  const visible = filter === "All" ? tenders : tenders.filter((t) => t.status === filter);

  const isDeadlinePassed = (deadline) => new Date(deadline) < new Date();

  const stats = useMemo(() => {
    const active = tenders.filter((t) => ACTIVE_STATUSES.includes(t.status)).length;
    const awarded = tenders.filter((t) => t.status === "Awarded");
    const totalAwardedValue = awarded.reduce((sum, t) => {
      const winnerBid = (t.bids || []).find(
        (b) => String(b.supplier) === String(t.winner_supplier?._id || t.winner_supplier)
      );
      return sum + (winnerBid?.total_amount || 0);
    }, 0);
    const expiringSoon = tenders.filter((t) => {
      if (!ACTIVE_STATUSES.includes(t.status)) return false;
      const ms = new Date(t.deadline) - new Date();
      return ms > 0 && ms < 86400000 * 2; // < 2 days
    }).length;
    const overdue = tenders.filter(
      (t) => t.status === "Published" && isDeadlinePassed(t.deadline)
    ).length;
    return { active, awardedCount: awarded.length, totalAwardedValue, expiringSoon, overdue };
  }, [tenders]);

  const columns = [
    {
      key: "tender_number",
      label: "ტენდ. #",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
          {v}
        </span>
      ),
    },
    {
      key: "title",
      label: "სათაური",
      render: (v) => <span className="font-semibold text-gray-900">{v}</span>,
    },
    { key: "creator_name", label: "შემქმნელი" },
    {
      key: "deadline",
      label: "ვადა",
      render: (v) => (
        <span className={isDeadlinePassed(v) ? "text-red-500 font-semibold" : "text-gray-600"}>
          {new Date(v).toLocaleDateString("ka-GE")}
        </span>
      ),
    },
    {
      key: "winner_name",
      label: "გამარჯვებული",
      render: (v) => v ? <span className="font-semibold text-emerald-600">{v}</span> : <span className="text-gray-400">—</span>,
    },
    { key: "status", label: "სტატუსი", render: (v) => <Badge status={v} dot /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ტენდერები</h1>
          <p className="page-subtitle">მართეთ სატენდერო პროცედურები და მიღებული შეთავაზებები</p>
        </div>
        <Link to="/tender/new" className="btn-primary">
          <Plus size={16} /> ახალი ტენდერი
        </Link>
      </div>

      {/* Stats summary */}
      {!loading && tenders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">აქტიური</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.active}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Trophy size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">გამოცხადებული</p>
              <p className="text-2xl font-extrabold text-gray-900">{stats.awardedCount}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ჯამ. ღირებულება</p>
              <p className="text-2xl font-extrabold text-gray-900">${stats.totalAwardedValue.toFixed(0)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stats.overdue > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {stats.overdue > 0 ? "ვადაგასული" : "მალე იხურება"}
              </p>
              <p className="text-2xl font-extrabold text-gray-900">
                {stats.overdue > 0 ? stats.overdue : stats.expiringSoon}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "All" ? "ყველა" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          onRowClick={(t) => navigate(`/tender/${t.id}`)}
          emptyMessage="ტენდერები ჯერ არ არსებობს."
          emptyIcon={<Gavel size={32} className="text-gray-400 mb-2" />}
        />
      )}
    </div>
  );
}
