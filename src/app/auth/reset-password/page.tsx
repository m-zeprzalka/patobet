import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="font-display text-2xl tracking-tight">
              Ustaw nowe hasło
            </CardTitle>
            <CardDescription>
              Wpisz nowe hasło. Po zapisaniu od razu zalogujesz się do
              aplikacji.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetForm />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
