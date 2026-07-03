import { AdminShell } from "@/components/layouts/AdminShell";
import { adminNavigation } from "@/config/navigation";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminShell
      title="WDM Redmine Platform"
      subtitle="Foundation for operations, reporting, wiki knowledge, and future back-office tools."
      breadcrumb="WDM Redmine / Admin"
      navItems={adminNavigation}
    >
      {children}
    </AdminShell>
  );
}
