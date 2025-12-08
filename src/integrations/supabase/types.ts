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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          ip_address: unknown
          new_admin_status: boolean
          old_admin_status: boolean
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_admin_status: boolean
          old_admin_status: boolean
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_admin_status?: boolean
          old_admin_status?: boolean
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
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
          logo_url: string | null
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
          logo_url?: string | null
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
          logo_url?: string | null
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
          clerk_user_id: string | null
          company_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clerk_user_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clerk_user_id?: string | null
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
      data_access_audit_log: {
        Row: {
          access_type: string
          accessed_record_id: string | null
          accessed_table: string
          created_at: string | null
          id: string
          ip_address: unknown
          sensitive_fields: string[] | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_record_id?: string | null
          accessed_table: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_fields?: string[] | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_record_id?: string | null
          accessed_table?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          sensitive_fields?: string[] | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          completion_date: string | null
          created_at: string | null
          download_count: number | null
          employee_id: string
          error_message: string | null
          expires_at: string
          export_format: string
          export_scope: string
          file_path: string | null
          file_size: number | null
          id: string
          include_historical: boolean | null
          request_date: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          download_count?: number | null
          employee_id: string
          error_message?: string | null
          expires_at: string
          export_format: string
          export_scope: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          include_historical?: boolean | null
          request_date?: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          download_count?: number | null
          employee_id?: string
          error_message?: string | null
          expires_at?: string
          export_format?: string
          export_scope?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          include_historical?: boolean | null
          request_date?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_date: string | null
          id: string
          policy_id: string | null
          records_identified: number
          records_processed: number
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_date?: string | null
          id?: string
          policy_id?: string | null
          records_identified?: number
          records_processed?: number
          scheduled_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_date?: string | null
          id?: string
          policy_id?: string | null
          records_identified?: number
          records_processed?: number
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_jobs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "data_retention_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          legal_hold_override: boolean
          policy_type: string
          retention_period_months: number
          updated_at: string | null
        }
        Insert: {
          auto_delete?: boolean
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          legal_hold_override?: boolean
          policy_type: string
          retention_period_months: number
          updated_at?: string | null
        }
        Update: {
          auto_delete?: boolean
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          legal_hold_override?: boolean
          policy_type?: string
          retention_period_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          invitation_sent_at: string | null
          last_name: string
          leave_date: string | null
          monthly_salary: number | null
          national_insurance_number: string | null
          nhs_pension_employee_rate: number | null
          nhs_pension_member: boolean | null
          nhs_pension_tier: number | null
          nic_code: string | null
          payroll_id: string | null
          portal_access_enabled: boolean | null
          postcode: string | null
          previous_year_pensionable_pay: number | null
          rate_2: number | null
          rate_3: number | null
          rate_4: number | null
          sickness_scheme_id: string | null
          status: string | null
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
          invitation_sent_at?: string | null
          last_name: string
          leave_date?: string | null
          monthly_salary?: number | null
          national_insurance_number?: string | null
          nhs_pension_employee_rate?: number | null
          nhs_pension_member?: boolean | null
          nhs_pension_tier?: number | null
          nic_code?: string | null
          payroll_id?: string | null
          portal_access_enabled?: boolean | null
          postcode?: string | null
          previous_year_pensionable_pay?: number | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          sickness_scheme_id?: string | null
          status?: string | null
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
          invitation_sent_at?: string | null
          last_name?: string
          leave_date?: string | null
          monthly_salary?: number | null
          national_insurance_number?: string | null
          nhs_pension_employee_rate?: number | null
          nhs_pension_member?: boolean | null
          nhs_pension_tier?: number | null
          nic_code?: string | null
          payroll_id?: string | null
          portal_access_enabled?: boolean | null
          postcode?: string | null
          previous_year_pensionable_pay?: number | null
          rate_2?: number | null
          rate_3?: number | null
          rate_4?: number | null
          sickness_scheme_id?: string | null
          status?: string | null
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
      erasure_requests: {
        Row: {
          affected_tables: string[] | null
          completion_date: string | null
          created_at: string | null
          employee_id: string
          erasure_method: string
          id: string
          legal_basis: string | null
          notes: string | null
          reason: string
          records_processed: number | null
          request_date: string
          requester_id: string
          retention_override: boolean | null
          status: string
          total_records: number | null
          updated_at: string | null
          verification_hash: string | null
        }
        Insert: {
          affected_tables?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          employee_id: string
          erasure_method: string
          id?: string
          legal_basis?: string | null
          notes?: string | null
          reason: string
          records_processed?: number | null
          request_date?: string
          requester_id: string
          retention_override?: boolean | null
          status?: string
          total_records?: number | null
          updated_at?: string | null
          verification_hash?: string | null
        }
        Update: {
          affected_tables?: string[] | null
          completion_date?: string | null
          created_at?: string | null
          employee_id?: string
          erasure_method?: string
          id?: string
          legal_basis?: string | null
          notes?: string | null
          reason?: string
          records_processed?: number | null
          request_date?: string
          requester_id?: string
          retention_override?: boolean | null
          status?: string
          total_records?: number | null
          updated_at?: string | null
          verification_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erasure_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hmrc_submissions: {
        Row: {
          company_id: string
          created_at: string | null
          credits: number | null
          id: string
          payments: number | null
          response_message: string | null
          status: string
          submission_type: string
          submitted_at: string | null
          tax_period: number
          tax_year: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          credits?: number | null
          id?: string
          payments?: number | null
          response_message?: string | null
          status?: string
          submission_type: string
          submitted_at?: string | null
          tax_period: number
          tax_year: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          credits?: number | null
          id?: string
          payments?: number | null
          response_message?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string | null
          tax_period?: number
          tax_year?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hmrc_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_metadata: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          is_accepted: boolean
          role: string
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          is_accepted?: boolean
          role?: string
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          is_accepted?: boolean
          role?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_metadata_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_resend_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          invitation_id: string
          ip_address: unknown
          resend_method: string | null
          resent_at: string
          resent_by: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_id: string
          ip_address?: unknown
          resend_method?: string | null
          resent_at?: string
          resent_by: string
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_id?: string
          ip_address?: unknown
          resend_method?: string | null
          resent_at?: string
          resent_by?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_resend_log_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitation_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          is_accepted?: boolean | null
          issued_at?: string
          issued_by?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_holds: {
        Row: {
          created_at: string | null
          created_by: string
          employee_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          reason: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_holds_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          is_2fa_enabled: boolean
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_2fa_enabled?: boolean
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_2fa_enabled?: boolean
          is_admin?: boolean
        }
        Relationships: []
      }
      sickness_audit_log: {
        Row: {
          audit_type: string
          calculated_total_days: number
          created_at: string
          difference: number
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          record_id: string
          resolved: boolean | null
          resolved_at: string | null
          start_date: string
          stored_total_days: number
        }
        Insert: {
          audit_type: string
          calculated_total_days: number
          created_at?: string
          difference: number
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          record_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          start_date: string
          stored_total_days: number
        }
        Update: {
          audit_type?: string
          calculated_total_days?: number
          created_at?: string
          difference?: number
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          record_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          start_date?: string
          stored_total_days?: number
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
      accept_invitation: {
        Args: { _invite_code: string; _user_id: string }
        Returns: Json
      }
      calculate_working_days: {
        Args: { employee_id: string; end_date: string; start_date: string }
        Returns: number
      }
      create_employee_with_system_user: {
        Args: {
          creator_user_id: string
          employee_data: Json
          target_company_id: string
        }
        Returns: string
      }
      create_invitation:
        | {
            Args: {
              _email: string
              _expires_at?: string
              _invite_code: string
              _role?: string
              _user_id: string
            }
            Returns: {
              accepted_at: string | null
              company_id: string | null
              email: string
              expires_at: string
              id: string
              invite_code: string
              is_accepted: boolean | null
              issued_at: string
              issued_by: string
              role: string | null
            }
            SetofOptions: {
              from: "*"
              to: "invitations"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _company_id: string
              _email: string
              _expires_at?: string
              _invite_code: string
              _role?: string
              _user_id: string
            }
            Returns: {
              accepted_at: string | null
              company_id: string | null
              email: string
              expires_at: string
              id: string
              invite_code: string
              is_accepted: boolean | null
              issued_at: string
              issued_by: string
              role: string | null
            }
            SetofOptions: {
              from: "*"
              to: "invitations"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      current_clerk_id: { Args: never; Returns: string }
      delete_invitation: {
        Args: { _id: string; _user_id: string }
        Returns: boolean
      }
      demote_admin_user: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: Json
      }
      get_current_user_admin_status: { Args: never; Returns: boolean }
      get_current_user_email: { Args: never; Returns: string }
      get_current_user_is_admin: { Args: never; Returns: boolean }
      get_employee_safe_data: {
        Args: { employee_id: string }
        Returns: {
          company_id: string
          department: string
          email: string
          first_name: string
          hire_date: string
          hours_per_week: number
          id: string
          last_name: string
          status: string
        }[]
      }
      get_employee_sensitive_data: {
        Args: { employee_id: string }
        Returns: {
          address1: string
          address2: string
          address3: string
          address4: string
          date_of_birth: string
          hourly_rate: number
          national_insurance_number: string
          nhs_pension_employee_rate: number
          nhs_pension_tier: number
          nic_code: string
          payroll_id: string
          postcode: string
          previous_year_pensionable_pay: number
          rate_2: number
          rate_3: number
          rate_4: number
          student_loan_plan: number
          tax_code: string
        }[]
      }
      get_invitation_metadata: {
        Args: { _company_id?: string; _user_id: string }
        Returns: {
          accepted_at: string | null
          company_id: string
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          is_accepted: boolean
          role: string
          token: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "invitation_metadata"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_invitations:
        | {
            Args: { _user_id: string }
            Returns: {
              accepted_at: string | null
              company_id: string | null
              email: string
              expires_at: string
              id: string
              invite_code: string
              is_accepted: boolean | null
              issued_at: string
              issued_by: string
              role: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "invitations"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: { _company_id?: string; _user_id: string }
            Returns: {
              accepted_at: string | null
              company_id: string | null
              email: string
              expires_at: string
              id: string
              invite_code: string
              is_accepted: boolean | null
              issued_at: string
              issued_by: string
              role: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "invitations"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      get_user_companies: {
        Args: { _user_id: string }
        Returns: {
          id: string
          name: string
          role: string
        }[]
      }
      get_user_company_role: {
        Args: { company_id: string; user_id: string }
        Returns: string
      }
      get_user_is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      log_sensitive_data_access: {
        Args: {
          access_type: string
          record_id: string
          sensitive_fields?: string[]
          table_name: string
        }
        Returns: undefined
      }
      promote_user_to_admin: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: Json
      }
      role_meets: {
        Args: { actual_role: string; min_role: string }
        Returns: boolean
      }
      run_sickness_integrity_check: {
        Args: never
        Returns: {
          calculated_days: number
          difference: number
          employee_id: string
          end_date: string
          record_id: string
          start_date: string
          stored_days: number
        }[]
      }
      sync_timesheet_entries_payroll_ids: { Args: never; Returns: number }
      user_has_company_access: {
        Args: { _company_id: string; _required_role?: string; _user_id: string }
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
