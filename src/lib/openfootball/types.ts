/**
 * Schemat plików JSON z openfootball/worldcup.json (public domain).
 * Pokrywa tylko pola których używamy.
 */

export interface OfTeam {
  name: string;
  name_normalised?: string;
  continent: string;
  flag_icon: string;
  flag_unicode: string;
  fifa_code: string;
  group: string;
  confed: string;
}

export interface OfScore {
  ft?: [number, number]; // full time
  ht?: [number, number]; // half time
  et?: [number, number]; // extra time
  pen?: [number, number]; // penalty shootout
}

export interface OfMatch {
  round: string;
  date: string; // "2026-06-11"
  time: string; // "13:00 UTC-6" lub "19:00"
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  score?: OfScore;
  goals1?: unknown[];
  goals2?: unknown[];
}

export interface OfWorldCup {
  name: string;
  matches: OfMatch[];
}
