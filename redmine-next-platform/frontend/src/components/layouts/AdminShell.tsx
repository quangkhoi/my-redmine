"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearch } from "@/contexts/SearchContext";

type NavItem = {
  label: string;
  href: string;
  activeMatch: string;
};

type AdminShellProps = {
  children: React.ReactNode;
  navItems: readonly NavItem[];
};

export function AdminShell({ children, navItems }: AdminShellProps) {
  const pathname = usePathname();
  const { searchTerm, setSearchTerm } = useSearch();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1c1c24_0%,#09090b_42%,#050507_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur xl:w-64 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight">WDM</p>
              <p className="text-xs text-slate-400">Redmine Platform</p>
            </div>
            <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky-400/60 lg:hidden">
              Menu
            </button>
          </div>

          <nav className="mt-4 hidden gap-1 lg:flex lg:flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                  pathname === item.activeMatch || (item.activeMatch !== "/" && pathname.startsWith(item.activeMatch))
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md lg:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="text-slate-500 hover:text-slate-300">
                    ✕
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-4 lg:px-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
