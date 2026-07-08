"use client";

import { useMemo } from "react";
import { normalizeSearchTerm } from "@/lib/search";

export function SearchHighlight({ text, term }: { text: string; term: string }) {
  const parts = useMemo(() => {
    if (!term) return [{ text, highlight: false }];
    const normalized = normalizeSearchTerm(term);
    const lower = text.toLowerCase();
    const result: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;

    let idx = lower.indexOf(normalized, lastIndex);
    while (idx !== -1) {
      if (idx > lastIndex) {
        result.push({ text: text.slice(lastIndex, idx), highlight: false });
      }
      result.push({ text: text.slice(idx, idx + normalized.length), highlight: true });
      lastIndex = idx + normalized.length;
      idx = lower.indexOf(normalized, lastIndex);
    }
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), highlight: false });
    }
    return result.length > 0 ? result : [{ text, highlight: false }];
  }, [text, term]);

  if (!term) return <>{text}</>;

  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark key={i} className="rounded bg-amber-400/30 text-amber-200 px-0.5">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}
