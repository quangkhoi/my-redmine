import { AdminShell } from "@/components/layouts/AdminShell";
import { adminNavigation } from "@/config/navigation";
import { SearchProvider } from "@/contexts/SearchContext";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SearchProvider>
    <AdminShell navItems={adminNavigation}>
      {children}
    </AdminShell>
    </SearchProvider>
  );
}
