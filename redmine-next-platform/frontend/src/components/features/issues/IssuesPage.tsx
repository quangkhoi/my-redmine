"use client";

const issues = [
  { id: "#401", subject: "Fix API auth", status: "In Progress", priority: "High", assignee: "AP", updated: "2h ago" },
  { id: "#402", subject: "Update UI", status: "Review", priority: "Medium", assignee: "SC", updated: "5h ago" },
  { id: "#403", subject: "DB migration", status: "Open", priority: "Low", assignee: "Unassigned", updated: "1d ago" },
  { id: "#404", subject: "Triage login bug", status: "New", priority: "High", assignee: "JR", updated: "3d ago" },
];

export function IssuesPage() {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Projects / Issues</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Issues</h1>
            <p className="mt-1 text-sm text-slate-400">A working route for issue navigation and review.</p>
          </div>
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60">
            Create issue
          </button>
        </div>
      </div>

      <section className="grid gap-3 xl:grid-cols-[1.5fr_0.85fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Issue list</h2>
              <p className="mt-1 text-sm text-slate-400">Temporary data shown until the issues API is connected.</p>
            </div>
            <div className="flex gap-2 text-xs text-slate-300">
              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Filter</button>
              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Sort</button>
              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Export</button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <div className="hidden grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr_0.8fr] gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
              <span>ID</span>
              <span>Subject</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Assignee</span>
              <span>Updated</span>
            </div>
            <div className="divide-y divide-white/10">
              {issues.map((row) => (
                <div key={row.id} className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr_0.8fr] md:items-center">
                  <div className="text-sky-300">{row.id}</div>
                  <div className="text-white">{row.subject}</div>
                  <div>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{row.status}</span>
                  </div>
                  <div className="text-slate-300">{row.priority}</div>
                  <div className="text-slate-300">{row.assignee}</div>
                  <div className="text-slate-400">{row.updated}</div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold tracking-tight">Issue summary</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Open</dt>
                <dd className="text-white">142</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">In progress</dt>
                <dd className="text-white">38</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Awaiting review</dt>
                <dd className="text-white">19</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold tracking-tight">Next actions</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">Review blocked issues.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">Assign backlog items.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">Close stale duplicates.</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}
