import Link from "next/link";

import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="font-display text-2xl tracking-tight">
              Reset hasła
            </CardTitle>
            <CardDescription>
              Wpisz email — wyślemy link do ustawienia nowego hasła.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ForgotForm />
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground text-center text-xs underline-offset-4 hover:underline"
            >
              ← Wróć do logowania
            </Link>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
