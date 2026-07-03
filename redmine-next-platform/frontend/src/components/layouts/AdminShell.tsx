"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  activeMatch: string;
};

type AdminShellProps = {
  title: string;
  subtitle: string;
  breadcrumb: string;
  actionLabel?: string;
  children: React.ReactNode;
  navItems: readonly NavItem[];
};

export function AdminShell({ title, subtitle, breadcrumb, actionLabel = "New issue", children, navItems }: AdminShellProps) {
  const pathname = usePathname();

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

          <div className="mt-4 hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400 xl:block">
            Use <span className="text-slate-200">Cmd+K</span> to search issues, pages, and settings.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md lg:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                <span>WDM Org</span>
                <span className="text-slate-500">/</span>
                <span>Ecom Core API</span>
              </div>

              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                <span className="truncate">Search...</span>
                <kbd className="ml-auto rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] text-slate-300">Cmd+K</kbd>
              </div>

              <div className="ml-auto flex items-center gap-2 text-sm text-slate-300">
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:inline-flex">Notifications</span>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-200">
                    SC
                  </span>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-sm text-slate-100">Sarah Chen</p>
                    <p className="text-xs text-emerald-300">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-4 lg:px-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{breadcrumb}</p>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
                    <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                  </div>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60">
                    {actionLabel}
                  </button>
                </div>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
