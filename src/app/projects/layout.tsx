import { AppHeader } from "@/components/layout/AppHeader";
import { CatalogBackground } from "@/components/layout/CatalogBackground";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="catalog-page relative min-h-screen">
      <CatalogBackground />
      <AppHeader user={user} />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
