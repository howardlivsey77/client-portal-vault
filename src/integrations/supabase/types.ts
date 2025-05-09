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
      employees: {
        Row: {
          address1: string | null
          address2: string | null
          address3: string | null
          address4: string | null
          created_at: string
          date_of_birth: string | null
          department: string
          email: string | null
          first_name: string
          gender: string | null
          hire_date: string
          hourly_rate: number | null
          hours_per_week: number | null
          id: string
          last_name: string
          payroll_id: string | null
          postcode: string | null
          rate_2: number | null
          rate_3: number | null
          rate_4: number | null
          updated_at: string
          user_id: string
          work_pattern: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          created_at?: string
          date_of_birth?: string | null
          department: string
          email?: string | null
          first_name: string
          gender?: string | null
          hire_date?: string
          hourly_rate?: number | null
          hours_per_week?: number | null
          id?: string
          last_name: string
          payroll_id?: string | null
          postcode?: string | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          updated_at?: string
          user_id: string
          work_pattern?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string
          email?: string | null
          first_name?: string
          gender?: string | null
          hire_date?: string
          hourly_rate?: number | null
          hours_per_week?: number | null
          id?: string
          last_name?: string
          payroll_id?: string | null
          postcode?: string | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          updated_at?: string
          user_id?: string
          work_pattern?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invite_code: string
          is_accepted: boolean | null
          issued_at: string
          issued_by: string
          role: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at: string
          id?: string
          invite_code: string
          is_accepted?: boolean | null
          issued_at?: string
          issued_by: string
          role?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          is_accepted?: boolean | null
          issued_at?: string
          issued_by?: string
          role?: string | null
        }
        Relationships: []
      }
      payroll_employee_details: {
        Row: {
          created_at: string
          employee_id: string | null
          employee_name: string | null
          entries: number
          extra_hours: number
          id: string
          payroll_id: string | null
          payroll_period_id: string
          rate_type: string | null
          rate_value: number | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          entries: number
          extra_hours: number
          id?: string
          payroll_id?: string | null
          payroll_period_id: string
          rate_type?: string | null
          rate_value?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          entries?: number
          extra_hours?: number
          id?: string
          payroll_id?: string | null
          payroll_period_id?: string
          rate_type?: string | null
          rate_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_details_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          date_from: string
          date_to: string
          employee_count: number
          financial_year: number
          id: string
          period_name: string | null
          period_number: number
          total_entries: number
          total_extra_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_from: string
          date_to: string
          employee_count: number
          financial_year: number
          id?: string
          period_name?: string | null
          period_number: number
          total_entries: number
          total_extra_hours: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_from?: string
          date_to?: string
          employee_count?: number
          financial_year?: number
          id?: string
          period_name?: string | null
          period_number?: number
          total_entries?: number
          total_extra_hours?: number
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
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          folder_id: string | null
          id: string
          is_recurring: boolean | null
          last_generated_date: string | null
          priority: string
          recurrence_interval: number | null
          recurrence_pattern: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          folder_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_generated_date?: string | null
          priority?: string
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          folder_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_generated_date?: string | null
          priority?: string
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          payroll_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          payroll_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          payroll_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_patterns: {
        Row: {
          created_at: string
          day: string
          employee_id: string
          end_time: string | null
          id: string
          is_working: boolean
          payroll_id: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: string
          employee_id: string
          end_time?: string | null
          id?: string
          is_working?: boolean
          payroll_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          is_working?: boolean
          payroll_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_patterns_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      sync_timesheet_entries_payroll_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
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
