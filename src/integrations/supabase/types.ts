export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      departments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          folder_id: string | null
          id: string
          mime_type: string
          title: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          folder_id?: string | null
          id?: string
          mime_type: string
          title: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          folder_id?: string | null
          id?: string
          mime_type?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sickness_entitlement_usage: {
        Row: {
          company_id: string
          created_at: string
          current_rule_id: string | null
          current_service_months: number | null
          employee_id: string
          entitlement_period_end: string
          entitlement_period_start: string
          full_pay_entitled_days: number | null
          full_pay_used_days: number | null
          half_pay_entitled_days: number | null
          half_pay_used_days: number | null
          id: string
          opening_balance_date: string | null
          opening_balance_full_pay: number | null
          opening_balance_half_pay: number | null
          opening_balance_notes: string | null
          sickness_scheme_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_rule_id?: string | null
          current_service_months?: number | null
          employee_id: string
          entitlement_period_end: string
          entitlement_period_start: string
          full_pay_entitled_days?: number | null
          full_pay_used_days?: number | null
          half_pay_entitled_days?: number | null
          half_pay_used_days?: number | null
          id?: string
          opening_balance_date?: string | null
          opening_balance_full_pay?: number | null
          opening_balance_half_pay?: number | null
          opening_balance_notes?: string | null
          sickness_scheme_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_rule_id?: string | null
          current_service_months?: number | null
          employee_id?: string
          entitlement_period_end?: string
          entitlement_period_start?: string
          full_pay_entitled_days?: number | null
          full_pay_used_days?: number | null
          half_pay_entitled_days?: number | null
          half_pay_used_days?: number | null
          id?: string
          opening_balance_date?: string | null
          opening_balance_full_pay?: number | null
          opening_balance_half_pay?: number | null
          opening_balance_notes?: string | null
          sickness_scheme_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entitlement_usage_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entitlement_usage_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entitlement_usage_scheme"
            columns: ["sickness_scheme_id"]
            isOneToOne: false
            referencedRelation: "sickness_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sickness_historical_balances: {
        Row: {
          balance_date: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string
          full_pay_days_used: number | null
          half_pay_days_used: number | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          balance_date: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id: string
          full_pay_days_used?: number | null
          half_pay_days_used?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          balance_date?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string
          full_pay_days_used?: number | null
          half_pay_days_used?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_historical_balances_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_historical_balances_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sickness_records: {
        Row: {
          certification_required_from_day: number | null
          company_id: string
          created_at: string
          created_by: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_certified: boolean | null
          notes: string | null
          reason: string | null
          start_date: string
          total_days: number
          updated_at: string
        }
        Insert: {
          certification_required_from_day?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_certified?: boolean | null
          notes?: string | null
          reason?: string | null
          start_date: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          certification_required_from_day?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_certified?: boolean | null
          notes?: string | null
          reason?: string | null
          start_date?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sickness_records_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sickness_records_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          national_insurance_number: string | null
          nhs_pension_employee_rate: number | null
          nhs_pension_member: boolean | null
          nhs_pension_tier: number | null
          nic_code: string | null
          payroll_id: string | null
          postcode: string | null
          previous_year_pensionable_pay: number | null
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
          national_insurance_number?: string | null
          nhs_pension_employee_rate?: number | null
          nhs_pension_member?: boolean | null
          nhs_pension_tier?: number | null
          nic_code?: string | null
          payroll_id?: string | null
          postcode?: string | null
          previous_year_pensionable_pay?: number | null
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
          national_insurance_number?: string | null
          nhs_pension_employee_rate?: number | null
          nhs_pension_member?: boolean | null
          nhs_pension_tier?: number | null
          nic_code?: string | null
          payroll_id?: string | null
          postcode?: string | null
          previous_year_pensionable_pay?: number | null
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
      nhs_pension_bands: {
        Row: {
          annual_pensionable_pay_from: number
          annual_pensionable_pay_to: number | null
          created_at: string
          effective_from: string
          effective_to: string | null
          employee_contribution_rate: number
          employer_contribution_rate: number
          id: string
          is_current: boolean
          tax_year: string
          tier_number: number
          updated_at: string
        }
        Insert: {
          annual_pensionable_pay_from: number
          annual_pensionable_pay_to?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          employee_contribution_rate: number
          employer_contribution_rate?: number
          id?: string
          is_current?: boolean
          tax_year: string
          tier_number: number
          updated_at?: string
        }
        Update: {
          annual_pensionable_pay_from?: number
          annual_pensionable_pay_to?: number | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          employee_contribution_rate?: number
          employer_contribution_rate?: number
          id?: string
          is_current?: boolean
          tax_year?: string
          tier_number?: number
          updated_at?: string
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
          company_id: string | null
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
          nhs_pension_employee_rate: number | null
          nhs_pension_employee_this_period: number | null
          nhs_pension_employee_ytd: number | null
          nhs_pension_employer_rate: number | null
          nhs_pension_employer_this_period: number | null
          nhs_pension_employer_ytd: number | null
          nhs_pension_tier: number | null
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
          company_id?: string | null
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
          nhs_pension_employee_rate?: number | null
          nhs_pension_employee_this_period?: number | null
          nhs_pension_employee_ytd?: number | null
          nhs_pension_employer_rate?: number | null
          nhs_pension_employer_this_period?: number | null
          nhs_pension_employer_ytd?: number | null
          nhs_pension_tier?: number | null
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
          company_id?: string | null
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
          nhs_pension_employee_rate?: number | null
          nhs_pension_employee_this_period?: number | null
          nhs_pension_employee_ytd?: number | null
          nhs_pension_employer_rate?: number | null
          nhs_pension_employer_this_period?: number | null
          nhs_pension_employer_ytd?: number | null
          nhs_pension_tier?: number | null
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
            foreignKeyName: "payroll_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      sickness_schemes: {
        Row: {
          company_id: string | null
          created_at: string
          eligibility_rules: Json | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          eligibility_rules?: Json | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          eligibility_rules?: Json | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sickness_schemes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      create_invitation: {
        Args: {
          _user_id: string
          _email: string
          _invite_code: string
          _expires_at?: string
          _role?: string
        }
        Returns: {
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
      }
      delete_invitation: {
        Args: { _user_id: string; _id: string }
        Returns: boolean
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_invitations: {
        Args: { _user_id: string }
        Returns: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invite_code: string
          is_accepted: boolean | null
          issued_at: string
          issued_by: string
          role: string | null
        }[]
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
