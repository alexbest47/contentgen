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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      case_classifications: {
        Row: {
          classification_json: Json
          created_at: string
          file_id: string
          file_name: string
          id: string
          job_id: string
          source_url: string | null
        }
        Insert: {
          classification_json: Json
          created_at?: string
          file_id: string
          file_name: string
          id?: string
          job_id: string
          source_url?: string | null
        }
        Update: {
          classification_json?: Json
          created_at?: string
          file_id?: string
          file_name?: string
          id?: string
          job_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_classifications_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "case_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_classifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "case_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      case_files: {
        Row: {
          created_at: string
          download_url: string | null
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          job_id: string
          resource_id: string | null
          status: string
          status_updated_at: string | null
          transcript_json: Json | null
          transcript_text: string | null
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          job_id: string
          resource_id?: string | null
          status?: string
          status_updated_at?: string | null
          transcript_json?: Json | null
          transcript_text?: string | null
        }
        Update: {
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          job_id?: string
          resource_id?: string | null
          status?: string
          status_updated_at?: string | null
          transcript_json?: Json | null
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "case_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      case_jobs: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          folder_url: string
          id: string
          name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          folder_url: string
          id?: string
          name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          folder_url?: string
          id?: string
          name?: string | null
          status?: string
        }
        Relationships: []
      }
      color_schemes: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          preview_colors: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
          preview_colors?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          preview_colors?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      content_pieces: {
        Row: {
          category: string
          content: string
          created_at: string
          generation_run_id: string | null
          id: string
          project_id: string
        }
        Insert: {
          category: string
          content?: string
          created_at?: string
          generation_run_id?: string | null
          id?: string
          project_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          generation_run_id?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          audience_tags: string[] | null
          card_prompt: string | null
          created_at: string
          created_by: string
          description: string | null
          doc_url: string | null
          generation_progress: Json | null
          id: string
          image_url: string | null
          name: string
          offer_id: string | null
          program_id: string
          prompt_id: string | null
          quiz_json: Json | null
          status: string
          thank_you_json: Json | null
        }
        Insert: {
          audience_tags?: string[] | null
          card_prompt?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          doc_url?: string | null
          generation_progress?: Json | null
          id?: string
          image_url?: string | null
          name: string
          offer_id?: string | null
          program_id: string
          prompt_id?: string | null
          quiz_json?: Json | null
          status?: string
          thank_you_json?: Json | null
        }
        Update: {
          audience_tags?: string[] | null
          card_prompt?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          doc_url?: string | null
          generation_progress?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          offer_id?: string | null
          program_id?: string
          prompt_id?: string | null
          quiz_json?: Json | null
          status?: string
          thank_you_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_letter_blocks: {
        Row: {
          banner_image_prompt: string
          banner_image_url: string
          block_type: string
          config: Json
          created_at: string
          generated_html: string
          id: string
          letter_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          banner_image_prompt?: string
          banner_image_url?: string
          block_type: string
          config?: Json
          created_at?: string
          generated_html?: string
          id?: string
          letter_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          banner_image_prompt?: string
          banner_image_url?: string
          block_type?: string
          config?: Json
          created_at?: string
          generated_html?: string
          id?: string
          letter_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_letter_blocks_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "email_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      email_letters: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string
          extra_offer_ids: string[]
          generated_html: string
          id: string
          image_placeholders: Json
          letter_theme_description: string
          letter_theme_title: string
          offer_id: string | null
          offer_type: string
          preheader: string
          program_id: string | null
          selected_color_scheme_id: string | null
          status: string
          subject: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by: string
          extra_offer_ids?: string[]
          generated_html?: string
          id?: string
          image_placeholders?: Json
          letter_theme_description?: string
          letter_theme_title?: string
          offer_id?: string | null
          offer_type?: string
          preheader?: string
          program_id?: string | null
          selected_color_scheme_id?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string
          extra_offer_ids?: string[]
          generated_html?: string
          id?: string
          image_placeholders?: Json
          letter_theme_description?: string
          letter_theme_title?: string
          offer_id?: string | null
          offer_type?: string
          preheader?: string
          program_id?: string | null
          selected_color_scheme_id?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_letters_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_letters_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_letters_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "paid_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_letters_selected_color_scheme_id_fkey"
            columns: ["selected_color_scheme_id"]
            isOneToOne: false
            referencedRelation: "color_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_letters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          blocks: Json
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          blocks?: Json
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      generation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          project_id: string
          prompt_id: string | null
          status: string
          type: Database["public"]["Enums"]["prompt_category"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          project_id: string
          prompt_id?: string | null
          status?: string
          type: Database["public"]["Enums"]["prompt_category"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          project_id?: string
          prompt_id?: string | null
          status?: string
          type?: Database["public"]["Enums"]["prompt_category"]
        }
        Relationships: [
          {
            foreignKeyName: "generation_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_runs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnets: {
        Row: {
          created_at: string
          cta_text: string | null
          id: string
          instant_value: string | null
          is_selected: boolean
          project_id: string
          save_reason: string | null
          target_segment: string | null
          title: string
          transition_to_course: string | null
          visual_content: string | null
          visual_format: string | null
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          id?: string
          instant_value?: string | null
          is_selected?: boolean
          project_id: string
          save_reason?: string | null
          target_segment?: string | null
          title: string
          transition_to_course?: string | null
          visual_content?: string | null
          visual_format?: string | null
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          id?: string
          instant_value?: string | null
          is_selected?: boolean
          project_id?: string
          save_reason?: string | null
          target_segment?: string | null
          title?: string
          transition_to_course?: string | null
          visual_content?: string | null
          visual_format?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_magnets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      objections: {
        Row: {
          created_at: string
          created_by: string
          id: string
          objection_text: string
          program_id: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          objection_text: string
          program_id: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          objection_text?: string
          program_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "objections_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "paid_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_tags: {
        Row: {
          id: string
          offer_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          tag_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_tags_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          doc_url: string | null
          id: string
          image_url: string | null
          is_archived: boolean
          offer_type: Database["public"]["Enums"]["offer_type"]
          program_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          doc_url?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          offer_type: Database["public"]["Enums"]["offer_type"]
          program_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          doc_url?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          offer_type?: Database["public"]["Enums"]["offer_type"]
          program_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "paid_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_programs: {
        Row: {
          audience_description: string | null
          audience_doc_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          program_doc_url: string | null
          title: string
        }
        Insert: {
          audience_description?: string | null
          audience_doc_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          program_doc_url?: string | null
          title: string
        }
        Update: {
          audience_description?: string | null
          audience_doc_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          program_doc_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      program_tags: {
        Row: {
          id: string
          program_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          program_id: string
          tag_id: string
        }
        Update: {
          id?: string
          program_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_tags_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "paid_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          content_type: string
          created_at: string
          created_by: string
          id: string
          offer_id: string | null
          selected_case_id: string | null
          selected_color_scheme_id: string | null
          selected_lead_magnet_id: string | null
          selected_objection_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          created_by: string
          id?: string
          offer_id?: string | null
          selected_case_id?: string | null
          selected_color_scheme_id?: string | null
          selected_lead_magnet_id?: string | null
          selected_objection_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string
          id?: string
          offer_id?: string | null
          selected_case_id?: string | null
          selected_color_scheme_id?: string | null
          selected_lead_magnet_id?: string | null
          selected_objection_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_selected_lead_magnet"
            columns: ["selected_lead_magnet_id"]
            isOneToOne: false
            referencedRelation: "lead_magnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_selected_case_id_fkey"
            columns: ["selected_case_id"]
            isOneToOne: false
            referencedRelation: "case_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_selected_color_scheme_id_fkey"
            columns: ["selected_color_scheme_id"]
            isOneToOne: false
            referencedRelation: "color_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_selected_objection_id_fkey"
            columns: ["selected_objection_id"]
            isOneToOne: false
            referencedRelation: "objections"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_global_variables: {
        Row: {
          id: string
          key: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          label?: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
          channel: string | null
          content_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          model: string
          name: string
          offer_type: string | null
          output_format_hint: string | null
          provider: string
          slug: string
          step_order: number
          sub_type: string | null
          system_prompt: string
          updated_at: string
          user_prompt_template: string
        }
        Insert: {
          category: Database["public"]["Enums"]["prompt_category"]
          channel?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          model?: string
          name: string
          offer_type?: string | null
          output_format_hint?: string | null
          provider?: string
          slug: string
          step_order?: number
          sub_type?: string | null
          system_prompt?: string
          updated_at?: string
          user_prompt_template?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"]
          channel?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          model?: string
          name?: string
          offer_type?: string | null
          output_format_hint?: string | null
          provider?: string
          slug?: string
          step_order?: number
          sub_type?: string | null
          system_prompt?: string
          updated_at?: string
          user_prompt_template?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      topic_tree: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          parent_id: string | null
          sort_order: number
          tags: string[]
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          parent_id?: string | null
          sort_order?: number
          tags?: string[]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          parent_id?: string | null
          sort_order?: number
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_tree_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "topic_tree"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      offer_type:
        | "mini_course"
        | "diagnostic"
        | "webinar"
        | "pre_list"
        | "new_stream"
        | "spot_available"
        | "sale"
        | "discount"
        | "download_pdf"
      project_status:
        | "draft"
        | "generating_leads"
        | "leads_ready"
        | "lead_selected"
        | "generating_content"
        | "completed"
        | "error"
      prompt_category:
        | "lead_magnets"
        | "slide_structure"
        | "text_instagram"
        | "text_vk"
        | "text_telegram"
        | "text_email"
        | "test_generation"
        | "image_carousel"
        | "image_post"
        | "image_email"
        | "reference_materials"
        | "expert_content"
        | "provocative_content"
        | "list_content"
        | "case_analysis"
        | "testimonial_content"
        | "myth_busting"
        | "objection_handling"
        | "email_builder"
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
      app_role: ["admin", "user"],
      offer_type: [
        "mini_course",
        "diagnostic",
        "webinar",
        "pre_list",
        "new_stream",
        "spot_available",
        "sale",
        "discount",
        "download_pdf",
      ],
      project_status: [
        "draft",
        "generating_leads",
        "leads_ready",
        "lead_selected",
        "generating_content",
        "completed",
        "error",
      ],
      prompt_category: [
        "lead_magnets",
        "slide_structure",
        "text_instagram",
        "text_vk",
        "text_telegram",
        "text_email",
        "test_generation",
        "image_carousel",
        "image_post",
        "image_email",
        "reference_materials",
        "expert_content",
        "provocative_content",
        "list_content",
        "case_analysis",
        "testimonial_content",
        "myth_busting",
        "objection_handling",
        "email_builder",
      ],
    },
  },
} as const
