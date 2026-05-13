/**
 * Mapowanie FIFA 3-literowych kodów na metadane drużyn:
 * - iso: ISO 3166-1 alpha-2 (dla flagcdn.com)
 * - pl: polska nazwa drużyny (jeśli się różni od angielskiej)
 *
 * Pokrywa wszystkie 48 drużyn MŚ 2026 + kilka rezerwowych z playoffów.
 * Gdy fifa_code nie ma w mapie → fallback do pierwszych 2 liter (iso)
 * i englishowej nazwy (pl).
 */
interface Meta {
  iso: string;
  pl: string;
}

const MAP: Record<string, Meta> = {
  MEX: { iso: "mx", pl: "Meksyk" },
  RSA: { iso: "za", pl: "RPA" },
  KOR: { iso: "kr", pl: "Korea Płd." },
  CZE: { iso: "cz", pl: "Czechy" },
  CAN: { iso: "ca", pl: "Kanada" },
  BIH: { iso: "ba", pl: "Bośnia i Hercegowina" },
  QAT: { iso: "qa", pl: "Katar" },
  SUI: { iso: "ch", pl: "Szwajcaria" },
  USA: { iso: "us", pl: "USA" },
  PAR: { iso: "py", pl: "Paragwaj" },
  IRN: { iso: "ir", pl: "Iran" },
  UZB: { iso: "uz", pl: "Uzbekistan" },
  BRA: { iso: "br", pl: "Brazylia" },
  MAR: { iso: "ma", pl: "Maroko" },
  CRO: { iso: "hr", pl: "Chorwacja" },
  JPN: { iso: "jp", pl: "Japonia" },
  POR: { iso: "pt", pl: "Portugalia" },
  URU: { iso: "uy", pl: "Urugwaj" },
  JOR: { iso: "jo", pl: "Jordania" },
  CMR: { iso: "cm", pl: "Kamerun" },
  FRA: { iso: "fr", pl: "Francja" },
  SEN: { iso: "sn", pl: "Senegal" },
  AUS: { iso: "au", pl: "Australia" },
  ALG: { iso: "dz", pl: "Algieria" },
  ARG: { iso: "ar", pl: "Argentyna" },
  COL: { iso: "co", pl: "Kolumbia" },
  TUN: { iso: "tn", pl: "Tunezja" },
  NZL: { iso: "nz", pl: "Nowa Zelandia" },
  ESP: { iso: "es", pl: "Hiszpania" },
  EGY: { iso: "eg", pl: "Egipt" },
  PAN: { iso: "pa", pl: "Panama" },
  JAM: { iso: "jm", pl: "Jamajka" },
  ENG: { iso: "gb-eng", pl: "Anglia" },
  BEL: { iso: "be", pl: "Belgia" },
  IRQ: { iso: "iq", pl: "Irak" },
  ANG: { iso: "ao", pl: "Angola" },
  ITA: { iso: "it", pl: "Włochy" },
  GER: { iso: "de", pl: "Niemcy" },
  ECU: { iso: "ec", pl: "Ekwador" },
  CRC: { iso: "cr", pl: "Kostaryka" },
  NED: { iso: "nl", pl: "Holandia" },
  SCO: { iso: "gb-sct", pl: "Szkocja" },
  GHA: { iso: "gh", pl: "Ghana" },
  HAI: { iso: "ht", pl: "Haiti" },
  POL: { iso: "pl", pl: "Polska" },
  AUT: { iso: "at", pl: "Austria" },
  NGA: { iso: "ng", pl: "Nigeria" },
  KSA: { iso: "sa", pl: "Arabia Saudyjska" },
  WAL: { iso: "gb-wls", pl: "Walia" },
  DEN: { iso: "dk", pl: "Dania" },
  SWE: { iso: "se", pl: "Szwecja" },
  NOR: { iso: "no", pl: "Norwegia" },
  SRB: { iso: "rs", pl: "Serbia" },
  TUR: { iso: "tr", pl: "Turcja" },
  UKR: { iso: "ua", pl: "Ukraina" },
  CHI: { iso: "cl", pl: "Chile" },
  PER: { iso: "pe", pl: "Peru" },
  VEN: { iso: "ve", pl: "Wenezuela" },
  BOL: { iso: "bo", pl: "Boliwia" },
  CIV: { iso: "ci", pl: "Wybrzeże Kości Słoniowej" },
  CGO: { iso: "cg", pl: "Kongo" },
  BFA: { iso: "bf", pl: "Burkina Faso" },
  MLI: { iso: "ml", pl: "Mali" },
  GAB: { iso: "ga", pl: "Gabon" },
};

export function fifaToFlagUrl(fifaCode: string): string {
  const meta = MAP[fifaCode.toUpperCase()];
  const iso = meta?.iso ?? fifaCode.slice(0, 2).toLowerCase();
  return `https://flagcdn.com/w320/${iso}.png`;
}

export function fifaToPolishName(
  fifaCode: string,
  fallback: string,
): string {
  return MAP[fifaCode.toUpperCase()]?.pl ?? fallback;
}
