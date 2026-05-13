import { APP } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="text-muted-foreground text-center mx-auto flex w-full max-w-screen-xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} {APP.name}. Aplikacja{" "}
          {APP.tournament.name}.
        </p>
        <p className="text-muted-foreground/80">
          Sportowe Świry
        </p>
      </div>
    </footer>
  );
}
