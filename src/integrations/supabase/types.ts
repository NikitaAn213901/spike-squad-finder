export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          description: string
          icon: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number
          away_team_id: string
          created_at: string
          home_score: number
          home_team_id: string
          id: string
          mvp_user_id: string | null
          organizer_id: string
          played_at: string
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string | null
        }
        Insert: {
          away_score?: number
          away_team_id: string
          created_at?: string
          home_score?: number
          home_team_id: string
          id?: string
          mvp_user_id?: string | null
          organizer_id: string
          played_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string
          created_at?: string
          home_score?: number
          home_team_id?: string
          id?: string
          mvp_user_id?: string | null
          organizer_id?: string
          played_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          city: string
          competitive_rating: number
          created_at: string
          full_name: string
          id: string
          mvp_count: number
          phone: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          skill: Database["public"]["Enums"]["skill_level"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string
          competitive_rating?: number
          created_at?: string
          full_name?: string
          id: string
          mvp_count?: number
          phone?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          skill?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string
          competitive_rating?: number
          created_at?: string
          full_name?: string
          id?: string
          mvp_count?: number
          phone?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          skill?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["invite_status"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          full_name: string
          id: string
          team_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          team_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string
          city: string
          created_at: string
          description: string | null
          id: string
          level: Database["public"]["Enums"]["skill_level"]
          logo_url: string | null
          losses: number
          matches_played: number
          name: string
          rating: number
          updated_at: string
          wins: number
        }
        Insert: {
          captain_id: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          logo_url?: string | null
          losses?: number
          matches_played?: number
          name: string
          rating?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          captain_id?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          logo_url?: string | null
          losses?: number
          matches_played?: number
          name?: string
          rating?: number
          updated_at?: string
          wins?: number
        }
        Relationships: []
      }
      tournament_teams: {
        Row: {
          captain_id: string
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["team_status"]
          tournament_id: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["team_status"]
          tournament_id: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["team_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          max_teams: number | null
          organizer_id: string
          registration: Database["public"]["Enums"]["registration_status"]
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          max_teams?: number | null
          organizer_id: string
          registration?: Database["public"]["Enums"]["registration_status"]
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          max_teams?: number | null
          organizer_id?: string
          registration?: Database["public"]["Enums"]["registration_status"]
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      training_signups: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          comment: string | null
          created_at: string
          id: string
          organizer_score: number | null
          status: Database["public"]["Enums"]["signup_status"]
          training_id: string
          user_id: string
          waitlisted: boolean
        }
        Insert: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          comment?: string | null
          created_at?: string
          id?: string
          organizer_score?: number | null
          status?: Database["public"]["Enums"]["signup_status"]
          training_id: string
          user_id: string
          waitlisted?: boolean
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          comment?: string | null
          created_at?: string
          id?: string
          organizer_score?: number | null
          status?: Database["public"]["Enums"]["signup_status"]
          training_id?: string
          user_id?: string
          waitlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "training_signups_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          city: string
          created_at: string
          description: string | null
          duration_minutes: number
          format: string
          id: string
          is_cancelled: boolean
          is_closed: boolean
          level: Database["public"]["Enums"]["training_level"]
          location: string
          organizer_id: string
          positions_needed: Json
          price: string | null
          price_amount: number
          slots_total: number
          starts_at: string
          title: string
          venue: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          format?: string
          id?: string
          is_cancelled?: boolean
          is_closed?: boolean
          level?: Database["public"]["Enums"]["training_level"]
          location: string
          organizer_id: string
          positions_needed?: Json
          price?: string | null
          price_amount?: number
          slots_total?: number
          starts_at: string
          title: string
          venue?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          format?: string
          id?: string
          is_cancelled?: boolean
          is_closed?: boolean
          level?: Database["public"]["Enums"]["training_level"]
          location?: string
          organizer_id?: string
          positions_needed?: Json
          price?: string | null
          price_amount?: number
          slots_total?: number
          starts_at?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      player_stats: {
        Row: {
          attendance_pct: number | null
          games_booked: number | null
          games_played: number | null
          no_shows: number | null
          reputation: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalc_achievements: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "player" | "organizer"
      attendance_status:
        | "pending"
        | "attended"
        | "no_show"
        | "cancelled"
        | "late"
      invite_status: "pending" | "accepted" | "declined"
      match_status: "scheduled" | "confirmed"
      player_position: "setter" | "outside" | "opposite" | "middle" | "libero"
      registration_status: "open" | "closed" | "finished"
      signup_status: "pending" | "confirmed" | "rejected"
      skill_level: "novice" | "amateur" | "intermediate" | "advanced" | "strong"
      team_member_role: "captain" | "player"
      team_status: "pending" | "confirmed"
      training_level: "beginner" | "intermediate" | "advanced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["player", "organizer"],
      attendance_status: [
        "pending",
        "attended",
        "no_show",
        "cancelled",
        "late",
      ],
      invite_status: ["pending", "accepted", "declined"],
      match_status: ["scheduled", "confirmed"],
      player_position: ["setter", "outside", "opposite", "middle", "libero"],
      registration_status: ["open", "closed", "finished"],
      signup_status: ["pending", "confirmed", "rejected"],
      skill_level: ["novice", "amateur", "intermediate", "advanced", "strong"],
      team_member_role: ["captain", "player"],
      team_status: ["pending", "confirmed"],
      training_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
