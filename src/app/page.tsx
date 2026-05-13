import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import { APP } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          {/* Stadium-lights radial highlight — wstrzemięźliwy, jeden mocny moment */}
          <div
            aria-hidden
            className="bg-energy/15 dark:bg-energy/25 pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-start gap-10 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-36">
            <span className="border-border/80 bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="bg-energy h-1.5 w-1.5 rounded-full" aria-hidden />
              {APP.tournament.name} · 11 czerwca – 19 lipca 2026
            </span>

            <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              Typuj mecze MŚ
              <br />
              <span className="text-muted-foreground">z przyjaciółmi</span>{" "}
              <span className="text-energy">.</span>
            </h1>

            <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              Wpisujesz typ <strong className="text-foreground">1</strong>,{" "}
              <strong className="text-foreground">X</strong> albo{" "}
              <strong className="text-foreground">2</strong> przed gwizdkiem.
              Trafienie to 3 punkty. Wygrywa ten, kto umie czytać grę, a nie ten,
              kto najgłośniej krzyczy na grupowym czacie.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 w-full px-6 text-base sm:w-auto"
              >
                <Link href="/login">Zaloguj się</Link>
              </Button>
              <p className="text-muted-foreground text-xs sm:max-w-[18ch]">
                Prosty system rejestracji
              </p>
            </div>

            <dl className="border-border/60 mt-2 grid w-full grid-cols-2 gap-x-6 gap-y-6 border-t pt-8 sm:max-w-2xl sm:grid-cols-3">
              <Stat label="Typ" value="1 / X / 2" />
              <Stat label="Trafienie" value="3 pkt" hint="po 90 min lub awansie" />
              <Stat label="Deadline" value="kickoff" hint="potem zablokowane" />
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {value}
      </dd>
      {hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </div>
  );
}
