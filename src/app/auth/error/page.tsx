import Link from "next/link";

import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="font-display text-destructive text-2xl tracking-tight">
              Coś poszło nie tak
            </CardTitle>
            <CardDescription>
              Magic link nie zadziałał. Najczęstsza przyczyna: link wygasł albo
              został już użyty.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message ? (
              <p className="text-muted-foreground bg-muted/40 rounded-md p-3 text-xs">
                Szczegół techniczny: {message}
              </p>
            ) : null}
            <Button asChild size="lg" className="h-11 w-full">
              <Link href="/login">Wyślij nowy link</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
