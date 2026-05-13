import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy (dawniej middleware). Odświeża sesję Supabase
 * przy każdym requeście i przekierowuje na /login gdy user niezalogowany.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization:
     * - _next/static, _next/image
     * - favicon, icons, images z public
     * - api/cron (zabezpieczone osobno przez CRON_SECRET)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
