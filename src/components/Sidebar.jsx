import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  BarChart3, Truck, FileSearch, Users, Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/",          label: "მთავარი",      icon: LayoutDashboard, roles: ['GM', 'Storekeeper', 'PurchasingOfficer', 'FinanceController', 'DeptHead'] },
  { to: "/tender",    label: "ტენდერები",    icon: FileSearch,      roles: ['GM', 'PurchasingOfficer', 'FinanceController'] },
  { to: "/special-offers", label: "სპეც. შეთავაზებები", icon: Sparkles, roles: ['GM', 'PurchasingOfficer'] },
  { to: "/tender-portal", label: "ტენდერები", icon: FileSearch,      roles: ['Supplier'] },
  { to: "/my-products", label: "ჩემი პროდუქტები", icon: Package,    roles: ['Supplier'] },
  { to: "/my-offers", label: "ჩემი შეთავაზებები", icon: Sparkles,    roles: ['Supplier'] },
  { to: "/suppliers", label: "მომწოდებლები", icon: Truck,           roles: ['GM', 'PurchasingOfficer'] },
  { to: "/inventory", label: "ნომენკლატურა", icon: Package,         roles: ['GM', 'Storekeeper', 'PurchasingOfficer'] },
  { to: "/purchasing",label: "მოთხოვნები",  icon: Users,           roles: ['GM', 'PurchasingOfficer', 'DeptHead'] },
  { to: "/po",        label: "შეკვეთები",    icon: FileText,        roles: ['GM', 'PurchasingOfficer', 'FinanceController'] },
  { to: "/reports",   label: "ანგარიშები",   icon: BarChart3,       roles: ['GM', 'FinanceController'] },
  { to: "/receiving", label: "მიღება",      icon: Truck,           roles: ['GM', 'Storekeeper'] },
  { to: "/issuance",  label: "გაცემა",      icon: Package,         roles: ['GM', 'Storekeeper', 'DeptHead'] },
  { to: "/stocktake", label: "ინვენტარიზაცია", icon: FileText,        roles: ['GM', 'Storekeeper'] },
];

export default function Sidebar({ open }) {
  const { user } = useAuth();
  const role = user?.role || "";

  const filteredLinks = links.filter(l => l.roles.includes(role));

  return (
    <div className={`${open ? "w-60" : "w-0"} shrink-0 transition-all duration-300 ease-out overflow-hidden`}>
      <aside className="flex flex-col w-60 h-full bg-sidebar border-r border-sidebar-lighter">

        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-lighter">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <FileSearch size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-tight">eTender</p>
            <p className="text-[10px] text-slate-400 leading-tight">შესყიდვების სისტემა</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-2 mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            მენიუ
          </p>
          {filteredLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium
                 transition-all duration-150 ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-400 hover:bg-sidebar-light hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-lighter">
          <p className="text-[10px] text-slate-600 text-center">eTender © 2026</p>
        </div>
      </aside>
    </div>
  );
}
