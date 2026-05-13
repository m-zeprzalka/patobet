/**
 * Typy bazy ręcznie zsynchronizowane ze schematem w supabase/migrations/0001_init.sql.
 * Gdy schemat się zmieni, możemy zregenerować przez:
 *   pnpm dlx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type PredictionChoice = "home" | "draw" | "away";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          api_id: number | null;
          name: string;
          code: string;
          flag_url: string | null;
          group_letter: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_id?: number | null;
          name: string;
          code: string;
          flag_url?: string | null;
          group_letter?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          api_id: number | null;
          home_team_id: string;
          away_team_id: string;
          kickoff_at: string;
          stage: MatchStage;
          group_letter: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          winner_team_id: string | null;
          settled_at: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_id?: number | null;
          home_team_id: string;
          away_team_id: string;
          kickoff_at: string;
          stage: MatchStage;
          group_letter?: string | null;
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          winner_team_id?: string | null;
          settled_at?: string | null;
          last_synced_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          prediction: PredictionChoice;
          points_awarded: number | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          prediction: PredictionChoice;
          points_awarded?: number | null;
          submitted_at?: string;
        };
        Update: {
          prediction?: PredictionChoice;
          points_awarded?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          total_points: number;
          predictions_settled: number;
          predictions_made: number;
          correct_predictions: number;
          accuracy_pct: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      settle_match: {
        Args: { p_match_id: string };
        Returns: undefined;
      };
      admin_set_match_result: {
        Args: {
          p_match_id: string;
          p_home_score: number;
          p_away_score: number;
          p_winner_team_id: string | null;
        };
        Returns: undefined;
      };
      admin_grant: {
        Args: { p_display_name: string };
        Returns: undefined;
      };
    };
    Enums: {
      match_stage: MatchStage;
      match_status: MatchStatus;
      prediction_choice: PredictionChoice;
    };
    CompositeTypes: Record<string, never>;
  };
};
