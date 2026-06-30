import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import LowStockBanner from "../components/LowStockBanner";
import {
  Package, AlertTriangle, FileText, ArrowUpRight,
  TrendingUp, TrendingDown, Clock, ChevronRight, Truck,
  ShoppingCart, CalendarClock, Zap, ArrowRight, Gavel,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ─── Animated counter ───────────────────────────── */
function useCounter(end, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (end == null) return;
    const target = Number(end);
    if (isNaN(target)) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration]);
  return val;
}

/* ─── Mini sparkline SVG (inline in stat cards) ──── */
function Sparkline({ data, color, height = 40, width = 100 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sp-${color})`} />
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Stat card with embedded sparkline ──────────── */
function StatCard({ label, value, sub, icon: Icon, color, bgLight, bgDark, sparkData, sparkColor, delay = 0 }) {
  return (
    <div
      className="card p-5 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${bgLight} $ opacity-50 transition-transform duration-500 group-hover:scale-125`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bgLight} $ mb-3`}>
            <Icon size={18} className={color} />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight font-mono">{value}</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="mt-6 opacity-80">
          <Sparkline data={sparkData} color={sparkColor} height={36} width={80} />
        </div>
      </div>
    </div>
  );
}

/* ─── Custom tooltip ─────────────────────────────── */
const tooltipLabels = { receipts: "მიღებები", issues: "გაცემები" };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-float px-3.5 py-2.5 text-xs">
      <p className="font-bold text-gray-600 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{tooltipLabels[p.dataKey] || p.dataKey}</span>
          <span className="ml-auto font-bold font-mono text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Movement type styling ──────────────────────── */
const mvStyle = {
  Receipt: { icon: TrendingUp, cls: "text-emerald-500 bg-emerald-50" },
  Issue: { icon: TrendingDown, cls: "text-red-500 bg-red-50" },
  Return: { icon: Package, cls: "text-blue-500 bg-blue-50" },
  Adjustment: { icon: Zap, cls: "text-violet-500 bg-violet-50" },
};

const DONUT_COLORS = ["#8b5cf6", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb923c", "#22c55e", "#14b8a6", "#06b6d4", "#6366f1"];

/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get("/dashboard").then(setData).finally(() => setLoading(false));
  }, []);

  const animItems = useCounter(data?.totalItems, 800);
  const animValue = useCounter(data?.totalValue, 1200);
  const animLow = useCounter(data?.lowStockCount, 600);
  const animHealth = useCounter(data?.stockHealthPct, 1500);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-56 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 h-80 skeleton rounded-2xl" />
          <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "დილა მშვიდობისა" : hour < 17 ? "შუადღე მშვიდობისა" : "საღამო მშვიდობისა";

  const trendReceipts = data.movementTrends.map((d) => d.receipts);
  const trendIssues = data.movementTrends.map((d) => d.issues);
  const donutData = data.categoryValues.filter((c) => c.value > 0);
  const totalCatValue = donutData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Low stock banner ──────────────────────── */}
      <LowStockBanner />

      {/* ─── Greeting ──────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">{greeting}, {user?.full_name?.split(" ")[0]}</h1>
          <p className="page-subtitle">აქ არის თქვენი საწყობის მიმოხილვა დღეისთვის.</p>
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">
          {new Date().toLocaleDateString("ka-GE", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ─── Stat Cards Row ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="სულ ნივთები" value={animItems} sub="აქტიური ინვენტარის ერთეულები"
          icon={Package} color="text-brand-600"
          bgLight="bg-brand-50" 
          sparkData={trendReceipts} sparkColor="#8b5cf6" delay={0}
        />
        {['GM', 'FinanceController'].includes(user?.role) && (
          <StatCard
            label="მარაგის ღირებულება" value={`$${animValue.toLocaleString()}`} sub="ინვენტარის მთლიანი ღირებულება"
            icon={TrendingUp} color="text-emerald-600"
            bgLight="bg-emerald-50" 
            sparkData={[...trendReceipts].reverse()} sparkColor="#22c55e" delay={60}
          />
        )}
        <StatCard
          label="დაბალი მარაგი" value={animLow} sub="შეკვეთის წერტილის ქვემოთ"
          icon={AlertTriangle} color="text-red-600"
          bgLight="bg-red-50" 
          sparkData={trendIssues} sparkColor="#ef4444" delay={120}
        />

        {/* Featured / Highlight Card */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-brand-500/20 animate-slide-up"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
        >
          <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-sm" />
          <div className="absolute right-6 top-4 h-16 w-16 rounded-full bg-white/5 blur-sm" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1">მარაგის ჯანმრთელობა</p>
            <p className="text-4xl font-black tracking-tight">{animHealth}%</p>
            <p className="text-xs text-white/70 mt-1">
              {data.stockHealthPct >= 80 ? "შესანიშნავი მდგომარეობა" : data.stockHealthPct >= 60 ? "ყურადღებას საჭიროებს" : "კრიტიკული — შეუკვეთეთ ახლავე"}
            </p>
            <Link to="/reports"
              className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold text-white/90 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors">
              ანგარიშების ნახვა <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Tender Stats Row ──────────────────────── */}
      {data.tenderStats && (
        <div className="card p-5 animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Gavel size={14} />
              </div>
              <h2 className="text-sm font-bold text-gray-900">ტენდერების მიმოხილვა</h2>
            </div>
            <Link to="/tender" className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1">
              ყველა ტენდერი <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "აქტიური ტენდ.", value: data.tenderStats.activeTenders, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "გამოქვეყნებული", value: data.tenderStats.publishedTenders, color: "text-cyan-600", bg: "bg-cyan-50" },
              { label: "შეფასებაში", value: data.tenderStats.pendingEvaluation, color: "text-violet-600", bg: "bg-violet-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
                <p className={`text-2xl font-extrabold font-mono ${color}`}>{value}</p>
                <p className="text-[10px] font-semibold text-gray-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {data.recentTenders?.length > 0 && (
            <div className="space-y-1">
              {data.recentTenders.slice(0, 3).map((t) => (
                <Link key={t.id || t._id} to={`/tender/${t.id || t._id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-gray-400 shrink-0">{t.tender_number}</span>
                    <span className="text-xs font-semibold text-gray-600 truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {t.winner_name && <span className="text-[10px] font-semibold text-emerald-600">★ {t.winner_name}</span>}
                    <Badge status={t.status} dot />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Charts Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Movement Trends - Area Chart */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">მოძრაობის ტენდენციები</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">მიღება vs გაცემა — ბოლო 7 დღე</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> მიღებები</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-400" /> გაცემები</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.movementTrends} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gReceipts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receipts" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gReceipts)" dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="issues" stroke="#f472b6" strokeWidth={2.5} fill="url(#gIssues)" dot={{ r: 3, fill: "#f472b6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut */}
        <div className="lg:col-span-2 card p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900">კატეგორიების განაწილება</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">ინვენტარის ღირებულების განაწილება</p>
          </div>

          <div className="flex-1 flex items-center justify-center -my-2">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} strokeWidth={0}
                    label={false}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                    <text x="50%" y="50%" dy={-2} textAnchor="middle" className="fill-gray-900" style={{ fontSize: 22, fontWeight: 800 }}>
                      {donutData.length}
                    </text>
                    <text x="50%" y="50%" dy={14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9, fontWeight: 600 }}>
                      კატეგორია
                    </text>
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto">
            {donutData.slice(0, 5).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-[11px]">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="text-gray-600 truncate flex-1">{cat.name}</span>
                <span className="font-mono font-semibold text-gray-900">
                  {totalCatValue > 0 ? Math.round((cat.value / totalCatValue) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                <Clock size={14} />
              </div>
              <h2 className="text-sm font-bold text-gray-900">ბოლო აქტივობა</h2>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">ბოლო 10</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {data.recentMovements.length === 0 ? (
              <p className="py-10 text-center text-xs text-gray-400">ბოლო მოძრაობები არ არის.</p>
            ) : data.recentMovements.map((mv, i) => {
              const s = mvStyle[mv.movement_type] || mvStyle.Adjustment;
              const Icon = s.icon;
              return (
                <div key={mv.id || mv._id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50 transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.cls}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{mv.item_name}</p>
                    <p className="text-[10px] text-gray-400">
                      {mv.performer_name} &middot; {mv.reference_type}-{mv.reference_id}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold font-mono ${mv.qty > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {mv.qty > 0 ? "+" : ""}{mv.qty}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {mv.date && new Date(mv.date).toLocaleTimeString("ka-GE", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock + Quick Actions */}
        <div className="space-y-5">
          {/* Low Stock Items */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle size={14} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">დაბალი მარაგის გაფრთხილებები</h2>
              </div>
              <Badge status={`${data.lowStockCount} ნივთი`} color={data.lowStockCount > 0 ? "red" : "green"} />
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
              {data.lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <Package size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">ყველა მარაგის დონე ჯანსაღია</p>
                </div>
              ) : data.lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id || item._id} className="flex items-center gap-3 px-6 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.code}</p>
                  </div>
                  <div className="w-20">
                    <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${Math.min((item.current_qty / (item.reorder_point * 2)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-red-600 w-8 text-right">{item.current_qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">სწრაფი მოქმედებები</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { to: "/receiving/new", label: "მიღება", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600", roles: ['GM', 'Storekeeper'] },
                { to: "/issuance/new", label: "გაცემა", icon: TrendingDown, bg: "bg-red-50", color: "text-red-600", roles: ['GM', 'Storekeeper', 'DeptHead'] },
                { to: "/purchasing/new", label: "შესყიდვა", icon: ShoppingCart, bg: "bg-violet-50", color: "text-violet-600", roles: ['GM', 'PurchasingOfficer', 'DeptHead'] },
                { to: "/po/new", label: "ახალი შეკვეთა", icon: Truck, bg: "bg-amber-50", color: "text-amber-600", roles: ['GM', 'PurchasingOfficer'] },
                { to: "/inventory/new", label: "ნივთის +", icon: Package, bg: "bg-blue-50", color: "text-blue-600", roles: ['GM', 'Storekeeper', 'PurchasingOfficer'] },
                { to: "/tender/new", label: "ახ. ტენდერი", icon: Gavel, bg: "bg-amber-50", color: "text-amber-600", roles: ['GM', 'PurchasingOfficer'] },
              ].filter(action => action.roles.includes(user?.role)).map(({ to, label, icon: Icon, bg, color }) => (
                <Link key={to} to={to}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 hover:bg-gray-50 transition-all group">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} transition-transform group-hover:scale-110`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
