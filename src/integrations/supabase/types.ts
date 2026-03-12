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
          format: string | null
          id: string
          is_selected: boolean
          key_insight: string | null
          project_id: string
          promise: string | null
          title: string
          transition_to_course: string | null
        }
        Insert: {
          created_at?: string
          format?: string | null
          id?: string
          is_selected?: boolean
          key_insight?: string | null
          project_id: string
          promise?: string | null
          title: string
          transition_to_course?: string | null
        }
        Update: {
          created_at?: string
          format?: string | null
          id?: string
          is_selected?: boolean
          key_insight?: string | null
          project_id?: string
          promise?: string | null
          title?: string
          transition_to_course?: string | null
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
          title: string
        }
        Insert: {
          audience_description?: string | null
          audience_doc_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          audience_description?: string | null
          audience_doc_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
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
      projects: {
        Row: {
          created_at: string
          created_by: string
          id: string
          offer_id: string | null
          selected_lead_magnet_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          offer_id?: string | null
          selected_lead_magnet_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          offer_id?: string | null
          selected_lead_magnet_id?: string | null
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
        ]
      }
      prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
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
      ],
    },
  },
} as const
