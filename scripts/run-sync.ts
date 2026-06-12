// Ręczne uruchomienie synca OpenFootball (poza cronem):
//   pnpm dlx tsx --env-file=.env.local scripts/run-sync.ts
import { syncOpenFootball } from "../src/lib/openfootball/sync";

async function main() {
  const result = await syncOpenFootball();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exit(1);
}

void main();
