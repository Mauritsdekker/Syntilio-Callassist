export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_suggestions: {
        Row: {
          created_at: string
          id: string
          is_dismissed: boolean | null
          priority: string
          session_id: string | null
          suggestion_text: string
          suggestion_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          priority: string
          session_id?: string | null
          suggestion_text: string
          suggestion_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          priority?: string
          session_id?: string | null
          suggestion_text?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          patient_name: string
          patient_phone: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          patient_name: string
          patient_phone?: string | null
          start_time?: string
          status?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          patient_name?: string
          patient_phone?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      call_transcripts: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          session_id: string | null
          speaker: string
          text_content: string
          timestamp_offset: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          session_id?: string | null
          speaker: string
          text_content: string
          timestamp_offset: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          session_id?: string | null
          speaker?: string
          text_content?: string
          timestamp_offset?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[] | null
          care_notes: string[] | null
          created_at: string
          date_of_birth: string | null
          emergency_contacts: Json | null
          id: string
          last_contact_date: string | null
          medical_conditions: string[] | null
          medications: Json | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          care_notes?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contacts?: Json | null
          id?: string
          last_contact_date?: string | null
          medical_conditions?: string[] | null
          medications?: Json | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          care_notes?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contacts?: Json | null
          id?: string
          last_contact_date?: string | null
          medical_conditions?: string[] | null
          medications?: Json | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gladia_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          gladia_session_id: string
          gladia_ws_url: string
          status: string | null
          end_time: string | null
          transcript: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          gladia_session_id: string
          gladia_ws_url: string
          status?: string | null
          end_time?: string | null
          transcript?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          gladia_session_id?: string
          gladia_ws_url?: string
          status?: string | null
          end_time?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gladia_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
