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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          bio: string | null
          bodyweight_kg: number | null
          created_at: string
          display_name: string | null
          fatigue_level: number | null
          id: string
          level: number | null
          player_class: string | null
          rank: string | null
          updated_at: string
          user_id: string
          xp: number | null
        }
        Insert: {
          bio?: string | null
          bodyweight_kg?: number | null
          created_at?: string
          display_name?: string | null
          fatigue_level?: number | null
          id?: string
          level?: number | null
          player_class?: string | null
          rank?: string | null
          updated_at?: string
          user_id: string
          xp?: number | null
        }
        Update: {
          bio?: string | null
          bodyweight_kg?: number | null
          created_at?: string
          display_name?: string | null
          fatigue_level?: number | null
          id?: string
          level?: number | null
          player_class?: string | null
          rank?: string | null
          updated_at?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: []
      }
      training_goals: {
        Row: {
          created_at: string
          current_value: number | null
          deadline: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_value: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_preferences: {
        Row: {
          created_at: string
          focus_areas: string[] | null
          id: string
          preferred_days: string[] | null
          rest_day_notification: boolean | null
          session_duration_minutes: number | null
          updated_at: string
          user_id: string
          workout_frequency: number | null
        }
        Insert: {
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          preferred_days?: string[] | null
          rest_day_notification?: boolean | null
          session_duration_minutes?: number | null
          updated_at?: string
          user_id: string
          workout_frequency?: number | null
        }
        Update: {
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          preferred_days?: string[] | null
          rest_day_notification?: boolean | null
          session_duration_minutes?: number | null
          updated_at?: string
          user_id?: string
          workout_frequency?: number | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completion_time: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          is_edited: boolean | null
          notes: string | null
          session_date: string
          total_xp_earned: number | null
          updated_at: string
          user_id: string
          routine_id: string | null
          start_time: string | null
          end_time: string | null
        }
        Insert: {
          completion_time?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          is_edited?: boolean | null
          notes?: string | null
          session_date?: string
          total_xp_earned?: number | null
          updated_at?: string
          user_id: string
          routine_id?: string | null
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          completion_time?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          is_edited?: boolean | null
          notes?: string | null
          session_date?: string
          total_xp_earned?: number | null
          updated_at?: string
          user_id?: string
          routine_id?: string | null
          start_time?: string | null
          end_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_id_fkey"
            columns: ["routine_id"]
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      session_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_name: string
          exercise_type: string | null
          order_index: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_name: string
          exercise_type?: string | null
          order_index?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_name?: string
          exercise_type?: string | null
          order_index?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_sets: {
        Row: {
          id: string
          exercise_id: string
          set_number: number
          reps: number
          weight_kg: number | null
          duration_seconds: number | null
          distance_meters: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exercise_id: string
          set_number: number
          reps: number
          weight_kg?: number | null
          duration_seconds?: number | null
          distance_meters?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exercise_id?: string
          set_number?: number
          reps?: number
          weight_kg?: number | null
          duration_seconds?: number | null
          distance_meters?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      muscle_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      exercise_equipment: {
        Row: {
          exercise_id: string
          equipment_id: string
          created_at: string
        }
        Insert: {
          exercise_id: string
          equipment_id: string
          created_at?: string
        }
        Update: {
          exercise_id?: string
          equipment_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_muscle_groups: {
        Row: {
          exercise_id: string
          muscle_group_id: string
          created_at: string
        }
        Insert: {
          exercise_id: string
          muscle_group_id: string
          created_at?: string
        }
        Update: {
          exercise_id?: string
          muscle_group_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_groups_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscle_groups_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          id: string
          name: string
          description: string | null
          muscle_groups: string[]
          difficulty: string | null
          is_cardio: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          muscle_groups?: string[]
          difficulty?: string | null
          is_cardio?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          muscle_groups?: string[]
          difficulty?: string | null
          is_cardio?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          muscle_groups: string[]
          exercise_ids: string[]
          is_favorite: boolean | null
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          muscle_groups?: string[]
          exercise_ids?: string[]
          is_favorite?: boolean | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          muscle_groups?: string[]
          exercise_ids?: string[]
          is_favorite?: boolean | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          set_number: number
          weight_kg: number | null
          reps: number
          rest_time_seconds: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          set_number: number
          weight_kg?: number | null
          reps: number
          rest_time_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          set_number?: number
          weight_kg?: number | null
          reps?: number
          rest_time_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
