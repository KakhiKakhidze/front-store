import { Package } from "lucide-react";

export default function DataTable({ columns, data, onRowClick, emptyMessage = "მონაცემები არ მოიძებნა" }) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 mb-3">
          <Package size={22} />
        </div>
        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`${
                  onRowClick ? "cursor-pointer hover:bg-brand-50/50 active:bg-brand-50" : ""
                } transition-colors duration-100`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50/40">
        <p className="text-[11px] text-gray-400">{data.length} ჩანაწერი</p>
      </div>
    </div>
  );
}
