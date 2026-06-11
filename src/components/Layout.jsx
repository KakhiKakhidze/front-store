import { useState } from "react";
import Sidebar from "./Sidebar";
import StockAlerts from "./StockAlerts";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Menu, LogOut, ChevronDown, Sun, Moon } from "lucide-react";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();

  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex h-full overflow-hidden bg-surface-50 dark:bg-[#0b0c0f]">
      <Sidebar open={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-5 z-10 shadow-top-bar dark:bg-neutral-900 dark:border-neutral-800/80">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-slate-200 transition-colors"
            >
              <Menu size={17} />
            </button>
            <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-neutral-800" />
            <p className="hidden sm:block text-xs text-gray-400">
              {new Date().toLocaleDateString("ka-GE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-slate-200 transition-colors mr-1"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user?.role !== 'Supplier' && (
              <>
                <StockAlerts />
                <div className="h-4 w-px bg-gray-200 dark:bg-neutral-800" />
              </>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">{user?.full_name}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{user?.role}</p>
                </div>
                <ChevronDown size={13} className="text-gray-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-gray-200 shadow-float py-1 z-20 animate-scale-in origin-top-right dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{user?.full_name}</p>
                      <p className="text-xs text-gray-400">{user?.role}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut size={14} />
                      გასვლა
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="animate-fade-in max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
