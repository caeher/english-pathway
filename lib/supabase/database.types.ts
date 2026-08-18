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
        Relationships: []
      }
      activity_completions: {
        Row: {
          activity_id: string
          activity_type: string | null
          attempts: number
          chapter_id: string
          completed_at: string | null
          last_attempt_at: string | null
          passed: boolean
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
          last_attempt_at?: string | null
          passed?: boolean
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
          last_attempt_at?: string | null
          passed?: boolean
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      audio_credit_sessions: {
        Row: {
          closed_at: string | null
          consumed_seconds: number | null
          expires_at: string
          id: string
          last_heartbeat_at: string | null
          max_seconds: number
          quota_period_id: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          consumed_seconds?: number | null
          expires_at: string
          id?: string
          last_heartbeat_at?: string | null
          max_seconds: number
          quota_period_id?: string | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          consumed_seconds?: number | null
          expires_at?: string
          id?: string
          last_heartbeat_at?: string | null
          max_seconds?: number
          quota_period_id?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_credit_sessions_quota_period_id_fkey"
            columns: ["quota_period_id"]
            isOneToOne: false
            referencedRelation: "voice_usage_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_credit_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "chapter_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "daily_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "engagement_activity_awards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_activity_sessions: {
        Row: {
          activity_id: string
          completed_at: string
          session_date: string
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          session_date: string
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_activity_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      english_assistant_conversations: {
        Row: {
          activity_context: Json | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_context?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_context?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      english_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "english_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "english_assistant_prompt_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "learner_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          native_language: string | null
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
          native_language?: string | null
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
          native_language?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          preferred_mode?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          count: number
          expires_at: string
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          expires_at: string
          window_start: string
        }
        Update: {
          bucket_key?: string
          count?: number
          expires_at?: string
          window_start?: string
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
        Relationships: [
          {
            foreignKeyName: "tutor_session_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "user_engagement_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_usage_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_voice_entitlements: {
        Row: {
          created_at: string
          expires_at: string | null
          override_allowance_seconds: number | null
          override_is_unlimited: boolean | null
          plan_key: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          override_allowance_seconds?: number | null
          override_is_unlimited?: boolean | null
          plan_key: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          override_allowance_seconds?: number | null
          override_is_unlimited?: boolean | null
          plan_key?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_voice_entitlements_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "voice_quota_plans"
            referencedColumns: ["plan_key"]
          },
          {
            foreignKeyName: "user_voice_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_quota_plans: {
        Row: {
          allowance_seconds: number | null
          created_at: string
          is_unlimited: boolean
          max_session_seconds: number
          name: string
          plan_key: string
          renewal_policy: string
        }
        Insert: {
          allowance_seconds?: number | null
          created_at?: string
          is_unlimited?: boolean
          max_session_seconds?: number
          name: string
          plan_key: string
          renewal_policy: string
        }
        Update: {
          allowance_seconds?: number | null
          created_at?: string
          is_unlimited?: boolean
          max_session_seconds?: number
          name?: string
          plan_key?: string
          renewal_policy?: string
        }
        Relationships: []
      }
      voice_usage_periods: {
        Row: {
          allocated_seconds: number | null
          consumed_seconds: number
          created_at: string
          id: string
          is_unlimited: boolean
          period_end: string | null
          period_start: string
          plan_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_seconds?: number | null
          consumed_seconds?: number
          created_at?: string
          id?: string
          is_unlimited?: boolean
          period_end?: string | null
          period_start: string
          plan_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_seconds?: number | null
          consumed_seconds?: number
          created_at?: string
          id?: string
          is_unlimited?: boolean
          period_end?: string | null
          period_start?: string
          plan_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_usage_periods_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "voice_quota_plans"
            referencedColumns: ["plan_key"]
          },
          {
            foreignKeyName: "voice_usage_periods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      consume_assistant_credit:
        | { Args: never; Returns: Json }
        | { Args: { p_user_id?: string }; Returns: Json }
      consume_rate_limit: {
        Args: { p_bucket_key: string; p_limit: number; p_window_ms: number }
        Returns: Json
      }
      finish_audio_credit_session:
        | { Args: { p_seconds: number; p_session_id: string }; Returns: Json }
        | {
            Args: {
              p_seconds: number
              p_session_id: string
              p_user_id?: string
            }
            Returns: Json
          }
      get_usage_credits:
        | { Args: never; Returns: Json }
        | { Args: { p_user_id?: string }; Returns: Json }
      heartbeat_audio_credit_session: {
        Args: {
          p_session_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      match_knowledge: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      purge_old_analytics_events: {
        Args: { retention_days?: number }
        Returns: number
      }
      record_engagement_session:
        | {
            Args: {
              p_activity_id: string
              p_local_date: string
              p_minutes: number
              p_score: number
              p_xp: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_activity_id: string
              p_local_date: string
              p_minutes: number
              p_score: number
              p_user_id?: string
              p_xp: number
            }
            Returns: Json
          }
      resolve_or_create_voice_period: {
        Args: {
          p_for_update?: boolean
          p_user_id: string
        }
        Returns: {
          allocated_seconds: number | null
          consumed_seconds: number
          is_unlimited: boolean
          max_session_seconds: number
          period_end: string | null
          period_id: string
          period_start: string
          plan_key: string
          plan_name: string
          renewal_policy: string
        }[]
      }
      start_audio_credit_session:
        | { Args: never; Returns: Json }
        | { Args: { p_user_id?: string }; Returns: Json }
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
