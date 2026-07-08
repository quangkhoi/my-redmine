export function normalizeSearchTerm(value: string): string {
  return value.toLowerCase().trim();
}

export function buildSearchText(...fields: (string | number | null | undefined)[]): string {
  return fields.map(f => String(f ?? "")).join(" ").toLowerCase();
}

export function matchesSearch(searchText: string, term: string): boolean {
  if (!term) return true;
  return searchText.includes(normalizeSearchTerm(term));
}

export function filterBySearch<T>(items: T[], term: string, toSearchText: (item: T) => string): T[] {
  if (!term) return items;
  const normalized = normalizeSearchTerm(term);
  return items.filter(item => toSearchText(item).includes(normalized));
}
