import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile, getSessionUser } from "@/lib/auth";

import { NickForm } from "./nick-form";

export default async function OnboardingNickPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.display_name) redirect("/matches");

  const suggested = user.email?.split("@")[0]?.slice(0, 24);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="font-display text-2xl tracking-tight">
              Wybierz nick
            </CardTitle>
            <CardDescription>
              Ostatni krok przed pierwszym typem. Pod tą nazwą zobaczą Cię
              znajomi w tabeli.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NickForm defaultValue={suggested} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
