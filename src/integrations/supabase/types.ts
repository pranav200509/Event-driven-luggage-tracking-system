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
      airports: {
        Row: {
          city: string
          code: string
          name: string
        }
        Insert: {
          city: string
          code: string
          name: string
        }
        Update: {
          city?: string
          code?: string
          name?: string
        }
        Relationships: []
      }
      baggage_records: {
        Row: {
          airport_code: string | null
          bag_type: Database["public"]["Enums"]["bag_type"]
          created_at: string
          current_location: string
          id: string
          pnr_code: string
          status: Database["public"]["Enums"]["baggage_status"]
          tag_number: string
          updated_at: string
          weight: number
        }
        Insert: {
          airport_code?: string | null
          bag_type?: Database["public"]["Enums"]["bag_type"]
          created_at?: string
          current_location: string
          id?: string
          pnr_code: string
          status?: Database["public"]["Enums"]["baggage_status"]
          tag_number: string
          updated_at?: string
          weight: number
        }
        Update: {
          airport_code?: string | null
          bag_type?: Database["public"]["Enums"]["bag_type"]
          created_at?: string
          current_location?: string
          id?: string
          pnr_code?: string
          status?: Database["public"]["Enums"]["baggage_status"]
          tag_number?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "baggage_records_current_location_fkey"
            columns: ["current_location"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "baggage_records_pnr_code_fkey"
            columns: ["pnr_code"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["pnr_code"]
          },
        ]
      }
      baggage_status_logs: {
        Row: {
          airport_code: string
          created_at: string
          id: string
          location: string
          method: string
          scanned_by: string | null
          status: Database["public"]["Enums"]["baggage_status"]
          tag_number: string
        }
        Insert: {
          airport_code: string
          created_at?: string
          id?: string
          location: string
          method?: string
          scanned_by?: string | null
          status: Database["public"]["Enums"]["baggage_status"]
          tag_number: string
        }
        Update: {
          airport_code?: string
          created_at?: string
          id?: string
          location?: string
          method?: string
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["baggage_status"]
          tag_number?: string
        }
        Relationships: []
      }
      pnr_records: {
        Row: {
          checkin_status: Database["public"]["Enums"]["checkin_status"]
          created_at: string
          destination_airport: string
          email: string
          flight_number: string
          id: string
          journey_date: string
          journey_time: string
          mobile_number: string
          passenger_name: string
          pnr_code: string
          seat_assignment: string | null
          source_airport: string
          updated_at: string
        }
        Insert: {
          checkin_status?: Database["public"]["Enums"]["checkin_status"]
          created_at?: string
          destination_airport: string
          email: string
          flight_number: string
          id?: string
          journey_date: string
          journey_time: string
          mobile_number: string
          passenger_name: string
          pnr_code: string
          seat_assignment?: string | null
          source_airport: string
          updated_at?: string
        }
        Update: {
          checkin_status?: Database["public"]["Enums"]["checkin_status"]
          created_at?: string
          destination_airport?: string
          email?: string
          flight_number?: string
          id?: string
          journey_date?: string
          journey_time?: string
          mobile_number?: string
          passenger_name?: string
          pnr_code?: string
          seat_assignment?: string | null
          source_airport?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_records_destination_airport_fkey"
            columns: ["destination_airport"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pnr_records_source_airport_fkey"
            columns: ["source_airport"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          airport_code: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          airport_code: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          airport_code?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_airport_code_fkey"
            columns: ["airport_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: {
          airport_code: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_at_airport: {
        Args: {
          _airport_code: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_bag_tag: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "checkin_staff" | "baggage_staff"
      bag_type: "cabin" | "oversized" | "fragile" | "normal"
      baggage_status:
        | "checked_in"
        | "screening"
        | "sorting"
        | "in_transit"
        | "loaded"
        | "arrived"
        | "collected"
        | "lost"
      checkin_status: "not_checked_in" | "checked_in"
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
      app_role: ["admin", "checkin_staff", "baggage_staff"],
      bag_type: ["cabin", "oversized", "fragile", "normal"],
      baggage_status: [
        "checked_in",
        "screening",
        "sorting",
        "in_transit",
        "loaded",
        "arrived",
        "collected",
        "lost",
      ],
      checkin_status: ["not_checked_in", "checked_in"],
    },
  },
} as const
