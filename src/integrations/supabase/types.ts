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
      companies: {
        Row: {
          accounts_office_number: string | null
          address_line1: string | null
          address_line2: string | null
          address_line3: string | null
          address_line4: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          paye_ref: string | null
          post_code: string | null
          trading_as: string | null
          updated_at: string
        }
        Insert: {
          accounts_office_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_line3?: string | null
          address_line4?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          paye_ref?: string | null
          post_code?: string | null
          trading_as?: string | null
          updated_at?: string
        }
        Update: {
          accounts_office_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_line3?: string | null
          address_line4?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          paye_ref?: string | null
          post_code?: string | null
          trading_as?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_access: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address1: string | null
          address2: string | null
          address3: string | null
          address4: string | null
          company_id: string | null
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
          nic_code: string | null
          payroll_id: string | null
          postcode: string | null
          rate_2: number | null
          rate_3: number | null
          rate_4: number | null
          sickness_scheme_id: string | null
          student_loan_plan: number | null
          tax_code: string | null
          updated_at: string
          user_id: string
          week_one_month_one: boolean | null
          work_pattern: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          company_id?: string | null
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
          nic_code?: string | null
          payroll_id?: string | null
          postcode?: string | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          sickness_scheme_id?: string | null
          student_loan_plan?: number | null
          tax_code?: string | null
          updated_at?: string
          user_id: string
          week_one_month_one?: boolean | null
          work_pattern?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          company_id?: string | null
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
          nic_code?: string | null
          payroll_id?: string | null
          postcode?: string | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          sickness_scheme_id?: string | null
          student_loan_plan?: number | null
          tax_code?: string | null
          updated_at?: string
          user_id?: string
          week_one_month_one?: boolean | null
          work_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      nic_bands: {
        Row: {
          contribution_type: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean
          name: string
          ni_class: string
          rate: number
          region: string
          tax_year: string
          threshold_from: number
          threshold_to: number | null
          updated_at: string
        }
        Insert: {
          contribution_type?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          name: string
          ni_class?: string
          rate: number
          region?: string
          tax_year: string
          threshold_from: number
          threshold_to?: number | null
          updated_at?: string
        }
        Update: {
          contribution_type?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          name?: string
          ni_class?: string
          rate?: number
          region?: string
          tax_year?: string
          threshold_from?: number
          threshold_to?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll_constants: {
        Row: {
          category: string
          created_at: string
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean
          key: string
          region: string
          updated_at: string
          user_id: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          key: string
          region?: string
          updated_at?: string
          user_id?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          key?: string
          region?: string
          updated_at?: string
          user_id?: string | null
          value_numeric?: number | null
          value_text?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "payroll_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_results: {
        Row: {
          created_at: string | null
          earnings_above_st_this_period: number
          earnings_above_uel_this_period: number
          earnings_at_lel_this_period: number
          earnings_lel_to_pt_this_period: number
          earnings_pt_to_uel_this_period: number
          employee_id: string
          employee_pension_this_period: number
          employer_pension_this_period: number
          free_pay_this_period: number
          gross_pay_this_period: number
          gross_pay_ytd: number | null
          id: string
          income_tax_this_period: number
          income_tax_ytd: number | null
          net_pay_this_period: number
          nic_employee_this_period: number
          nic_employee_ytd: number | null
          nic_employer_this_period: number
          nic_letter: string
          pay_liable_to_nic_this_period: number
          payroll_period: string
          student_loan_plan: number | null
          student_loan_this_period: number
          tax_code: string
          tax_period: number | null
          tax_year: string | null
          taxable_pay_this_period: number
          taxable_pay_ytd: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          earnings_above_st_this_period: number
          earnings_above_uel_this_period: number
          earnings_at_lel_this_period: number
          earnings_lel_to_pt_this_period: number
          earnings_pt_to_uel_this_period: number
          employee_id: string
          employee_pension_this_period: number
          employer_pension_this_period: number
          free_pay_this_period: number
          gross_pay_this_period: number
          gross_pay_ytd?: number | null
          id?: string
          income_tax_this_period: number
          income_tax_ytd?: number | null
          net_pay_this_period: number
          nic_employee_this_period: number
          nic_employee_ytd?: number | null
          nic_employer_this_period: number
          nic_letter: string
          pay_liable_to_nic_this_period: number
          payroll_period: string
          student_loan_plan?: number | null
          student_loan_this_period: number
          tax_code: string
          tax_period?: number | null
          tax_year?: string | null
          taxable_pay_this_period: number
          taxable_pay_ytd?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          earnings_above_st_this_period?: number
          earnings_above_uel_this_period?: number
          earnings_at_lel_this_period?: number
          earnings_lel_to_pt_this_period?: number
          earnings_pt_to_uel_this_period?: number
          employee_id?: string
          employee_pension_this_period?: number
          employer_pension_this_period?: number
          free_pay_this_period?: number
          gross_pay_this_period?: number
          gross_pay_ytd?: number | null
          id?: string
          income_tax_this_period?: number
          income_tax_ytd?: number | null
          net_pay_this_period?: number
          nic_employee_this_period?: number
          nic_employee_ytd?: number | null
          nic_employer_this_period?: number
          nic_letter?: string
          pay_liable_to_nic_this_period?: number
          payroll_period?: string
          student_loan_plan?: number | null
          student_loan_this_period?: number
          tax_code?: string
          tax_period?: number | null
          tax_year?: string | null
          taxable_pay_this_period?: number
          taxable_pay_ytd?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_bands: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean
          name: string
          rate: number
          region: string
          tax_year: string
          threshold_from: number
          threshold_to: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          name: string
          rate: number
          region?: string
          tax_year: string
          threshold_from: number
          threshold_to?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          name?: string
          rate?: number
          region?: string
          tax_year?: string
          threshold_from?: number
          threshold_to?: number | null
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
      get_user_companies: {
        Args: { _user_id: string }
        Returns: {
          id: string
          name: string
          role: string
        }[]
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
      user_has_company_access: {
        Args: { _user_id: string; _company_id: string; _required_role?: string }
        Returns: boolean
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
