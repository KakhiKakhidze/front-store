const variants = {
  green:  "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  red:    "bg-red-50 text-red-700 ring-red-500/20",
  yellow: "bg-amber-50 text-amber-700 ring-amber-500/20",
  blue:   "bg-blue-50 text-blue-700 ring-blue-500/20",
  gray:   "bg-gray-100 text-gray-600 ring-gray-500/10",
  purple: "bg-violet-50 text-violet-700 ring-violet-500/20",
  cyan:   "bg-cyan-50 text-cyan-700 ring-cyan-500/20",
};

const statusMap = {
  Draft: "gray", Pending: "yellow", Approved: "blue", Issued: "green",
  Received: "green", PartiallyReceived: "yellow", Completed: "green",
  Closed: "gray", Rejected: "red", Ordered: "purple", InProgress: "cyan",
  Disputed: "red", Partial: "yellow", Perishable: "yellow", Controlled: "red",
  Preferred: "green", Standard: "gray", Full: "blue", Cycle: "purple",
  Receipt: "green", Issue: "red", Return: "cyan", Adjustment: "purple",
  Transfer: "blue", Spoilage: "red",
  Published: "cyan", Evaluation: "purple", Awarded: "green", Cancelled: "red",
};

const dotColors = {
  green: "bg-emerald-500", red: "bg-red-500", yellow: "bg-amber-500",
  blue: "bg-blue-500", purple: "bg-violet-500", cyan: "bg-cyan-500", gray: "bg-gray-400",
};

export default function Badge({ status, color, dot }) {
  const variant = color || statusMap[status] || "gray";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${variants[variant]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant] || "bg-gray-400"}`} />}
      {status}
    </span>
  );
}
