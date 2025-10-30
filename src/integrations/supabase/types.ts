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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adherence_logs: {
        Row: {
          care_plan_id: string
          created_at: string
          exercises_completed: boolean | null
          id: string
          log_date: string
          medication_taken: boolean | null
          notes: string | null
          pain_level: number | null
          patient_id: string
        }
        Insert: {
          care_plan_id: string
          created_at?: string
          exercises_completed?: boolean | null
          id?: string
          log_date?: string
          medication_taken?: boolean | null
          notes?: string | null
          pain_level?: number | null
          patient_id: string
        }
        Update: {
          care_plan_id?: string
          created_at?: string
          exercises_completed?: boolean | null
          id?: string
          log_date?: string
          medication_taken?: boolean | null
          notes?: string | null
          pain_level?: number | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adherence_logs_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adherence_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          attachment_type: string | null
          created_at: string
          description: string | null
          episode_id: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string
          description?: string | null
          episode_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string
          description?: string | null
          episode_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes_of_care"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          duration_minutes: number
          episode_id: string | null
          id: string
          notes: string | null
          patient_id: string
          provider_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          duration_minutes?: number
          episode_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          provider_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          duration_minutes?: number
          episode_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes_of_care"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          dietary_restrictions: string[] | null
          episode_id: string
          exercises: Json | null
          follow_up_schedule: Json | null
          id: string
          instructions: string | null
          medications: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          dietary_restrictions?: string[] | null
          episode_id: string
          exercises?: Json | null
          follow_up_schedule?: Json | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          dietary_restrictions?: string[] | null
          episode_id?: string
          exercises?: Json | null
          follow_up_schedule?: Json | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes_of_care"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          accepted: boolean
          consent_text: string
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          locale: string | null
          patient_id: string
          provider_id: string | null
          signed_at: string | null
          version: string
        }
        Insert: {
          accepted?: boolean
          consent_text: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          locale?: string | null
          patient_id: string
          provider_id?: string | null
          signed_at?: string | null
          version: string
        }
        Update: {
          accepted?: boolean
          consent_text?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          locale?: string | null
          patient_id?: string
          provider_id?: string | null
          signed_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes_of_care: {
        Row: {
          created_at: string
          expected_recovery_weeks: number | null
          id: string
          notes: string | null
          patient_id: string
          specialist_id: string
          status: string
          surgery_date: string
          surgery_location: string | null
          surgery_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_recovery_weeks?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          specialist_id: string
          status?: string
          surgery_date: string
          surgery_location?: string | null
          surgery_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_recovery_weeks?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          specialist_id?: string
          status?: string
          surgery_date?: string
          surgery_location?: string | null
          surgery_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_of_care_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_of_care_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          medical_conditions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_conditions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_conditions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          locale: string | null
          mfa_enabled: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          locale?: string | null
          mfa_enabled?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          locale?: string | null
          mfa_enabled?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          bio: string | null
          consultation_fee: number | null
          created_at: string
          id: string
          languages: string[] | null
          license_country: string | null
          license_number: string | null
          specialty: string
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id?: string
          languages?: string[] | null
          license_country?: string | null
          license_number?: string | null
          specialty: string
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id?: string
          languages?: string[] | null
          license_country?: string | null
          license_number?: string | null
          specialty?: string
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      tele_visits: {
        Row: {
          created_at: string
          duration_minutes: number
          episode_id: string
          id: string
          meeting_url: string | null
          notes: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          episode_id: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          episode_id?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tele_visits_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes_of_care"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      get_patient_id_for_user: { Args: { _user_id: string }; Returns: string }
      get_provider_id_for_user: { Args: { _user_id: string }; Returns: string }
      has_active_consent: {
        Args: { _patient_id: string; _provider_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "specialist" | "local_provider" | "admin"
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
    Enums: {
      app_role: ["patient", "specialist", "local_provider", "admin"],
    },
  },
} as const
