export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          rule_key: string
          rule_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id: string
          rule_key: string
          rule_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          rule_key?: string
          rule_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          chapter_id: string
          created_at: string
          description: string
          id: string
          position: number
          props: Json
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string
          id: string
          position?: number
          props?: Json
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string
          id?: string
          position?: number
          props?: Json
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_completions: {
        Row: {
          activity_id: string
          activity_type: string | null
          attempts: number
          chapter_id: string
          completed_at: string | null
          score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          activity_type?: string | null
          attempts?: number
          chapter_id: string
          completed_at?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          activity_type?: string | null
          attempts?: number
          chapter_id?: string
          completed_at?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_credit_sessions: {
        Row: {
          closed_at: string | null
          consumed_seconds: number | null
          expires_at: string
          id: string
          max_seconds: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          consumed_seconds?: number | null
          expires_at: string
          id?: string
          max_seconds: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          consumed_seconds?: number | null
          expires_at?: string
          id?: string
          max_seconds?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      chapter_completions: {
        Row: {
          chapter_id: string
          completed_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chapter_objectives: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          position: number
          text: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          position?: number
          text: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_objectives_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          color: string
          content: string
          created_at: string
          icon: string
          id: string
          module_id: string
          number: number
          position: number
          published: boolean
          slug: string
          subtitle: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          icon?: string
          id: string
          module_id: string
          number: number
          position?: number
          published?: boolean
          slug: string
          subtitle?: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          icon?: string
          id?: string
          module_id?: string
          number?: number
          position?: number
          published?: boolean
          slug?: string
          subtitle?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sessions: {
        Row: {
          activities_completed: number
          goal_met: boolean
          minutes_studied: number
          session_date: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activities_completed?: number
          goal_met?: boolean
          minutes_studied?: number
          session_date: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activities_completed?: number
          goal_met?: boolean
          minutes_studied?: number
          session_date?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      engagement_activity_awards: {
        Row: {
          activity_id: string
          awarded_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          activity_id: string
          awarded_at?: string
          user_id: string
          xp_awarded: number
        }
        Update: {
          activity_id?: string
          awarded_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      english_assistant_prompt_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          model: string
          prompt: string
          response: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          model: string
          prompt: string
          response?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          model?: string
          prompt?: string
          response?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_embeddings: {
        Row: {
          content: string
          content_hash: string
          created_at: string
          embedding: string
          id: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string
          embedding: string
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
      learner_memory: {
        Row: {
          content: string
          created_at: string
          id: string
          memory_key: string
          source: string
          strategy_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          memory_key: string
          source: string
          strategy_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memory_key?: string
          source?: string
          strategy_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          locale: string
          published_at: string | null
          slug: string
          title: string
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          locale?: string
          published_at?: string | null
          slug: string
          title: string
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          locale?: string
          published_at?: string | null
          slug?: string
          title?: string
          type?: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          number: number
          position: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id: string
          number: number
          position?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          number?: number
          position?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_completed_at: string | null
          assessment_confirmed_level: string | null
          assessment_recommended_level: string | null
          assessment_source: string | null
          assessment_version: string | null
          avatar_url: string | null
          created_at: string
          daily_goal_minutes: number | null
          full_name: string | null
          id: string
          level: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          onboarding_step: number
          preferred_mode: string
          updated_at: string
          username: string | null
        }
        Insert: {
          assessment_completed_at?: string | null
          assessment_confirmed_level?: string | null
          assessment_recommended_level?: string | null
          assessment_source?: string | null
          assessment_version?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number | null
          full_name?: string | null
          id: string
          level?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          preferred_mode?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          assessment_completed_at?: string | null
          assessment_confirmed_level?: string | null
          assessment_recommended_level?: string | null
          assessment_source?: string | null
          assessment_version?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number | null
          full_name?: string | null
          id?: string
          level?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          preferred_mode?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      srs_items: {
        Row: {
          content: Json
          content_ref: string
          created_at: string
          due_at: string
          ease_factor: number
          id: string
          interval_days: number
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          content_ref: string
          created_at?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          content_ref?: string
          created_at?: string
          due_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_session_summaries: {
        Row: {
          correlation_id: string
          created_at: string
          expires_at: string
          id: string
          last_activity_id: string | null
          state: string
          strategy_version: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correlation_id: string
          created_at?: string
          expires_at?: string
          id?: string
          last_activity_id?: string | null
          state: string
          strategy_version?: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correlation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_activity_id?: string | null
          state?: string
          strategy_version?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted_at: string
          consent_method: string
          document_version: string
          id: string
          legal_document_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          consent_method?: string
          document_version?: string
          id?: string
          legal_document_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          consent_method?: string
          document_version?: string
          id?: string
          legal_document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_legal_document_id_fkey"
            columns: ["legal_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement: {
        Row: {
          created_at: string
          current_streak: number
          last_study_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_study_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_study_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          last_activity_id: string | null
          last_chapter_id: string | null
          last_module_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_activity_id?: string | null
          last_chapter_id?: string | null
          last_module_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_activity_id?: string | null
          last_chapter_id?: string | null
          last_module_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage_credits: {
        Row: {
          assistant_messages_used: number
          audio_seconds_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_messages_used?: number
          audio_seconds_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_messages_used?: number
          audio_seconds_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_search_puzzles: {
        Row: {
          cols: number
          created_at: string
          grid: Json
          id: number
          rows: number
          theme: string
          word_positions: Json
        }
        Insert: {
          cols: number
          created_at?: string
          grid: Json
          id: number
          rows: number
          theme: string
          word_positions: Json
        }
        Update: {
          cols?: number
          created_at?: string
          grid?: Json
          id?: number
          rows?: number
          theme?: string
          word_positions?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_assistant_credit: { Args: never; Returns: Json }
      finish_audio_credit_session: {
        Args: { p_seconds: number; p_session_id: string }
        Returns: Json
      }
      get_usage_credits: { Args: never; Returns: Json }
      match_knowledge: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      record_engagement_session: {
        Args: {
          p_activity_id: string
          p_local_date: string
          p_minutes: number
          p_score: number
          p_xp: number
        }
        Returns: Json
      }
      start_audio_credit_session: { Args: never; Returns: Json }
    }
    Enums: {
      activity_type:
        | "svg-scene"
        | "flashcard"
        | "word-match"
        | "sentence-builder"
        | "quiz"
        | "word-scramble"
        | "listening"
        | "dictation"
        | "pronunciation"
        | "drag-drop"
      legal_document_type: "terms" | "privacy" | "cookies"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "svg-scene",
        "flashcard",
        "word-match",
        "sentence-builder",
        "quiz",
        "word-scramble",
        "listening",
        "dictation",
        "pronunciation",
        "drag-drop",
      ],
      legal_document_type: ["terms", "privacy", "cookies"],
    },
  },
} as const

