import { AppHeader } from "@/components/layouts/app-header";
import { SiteFooter } from "@/components/layouts/site-footer";
import { requireUserWithProfile } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUserWithProfile();

  return (
    <>
      <AppHeader
        displayName={profile.display_name ?? ""}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.is_admin}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
