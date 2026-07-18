export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ActivityType =
  | 'svg-scene'
  | 'flashcard'
  | 'word-match'
  | 'sentence-builder'
  | 'quiz'
  | 'word-scramble'
  | 'listening'
  | 'dictation'
  | 'pronunciation'
  | 'drag-drop'

export type LegalDocumentType = 'terms' | 'privacy' | 'cookies'

export interface Database {
  public: {
    Tables: {
      chapter_completions: {
        Row: {
          user_id: string
          chapter_id: string
          completed_at: string
        }
        Insert: {
          user_id: string
          chapter_id: string
          completed_at?: string
        }
        Update: {
          user_id?: string
          chapter_id?: string
          completed_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          user_id: string
          last_module_id: string | null
          last_chapter_id: string | null
          last_activity_id: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          last_module_id?: string | null
          last_chapter_id?: string | null
          last_activity_id?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          last_module_id?: string | null
          last_chapter_id?: string | null
          last_activity_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_completions: {
        Row: {
          user_id: string
          activity_id: string
          chapter_id: string
          activity_type: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          score: number | null
          attempts: number
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          activity_id: string
          chapter_id: string
          activity_type?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          score?: number | null
          attempts?: number
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          activity_id?: string
          chapter_id?: string
          activity_type?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          score?: number | null
          attempts?: number
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          onboarding_completed_at: string | null
          onboarding_status: 'pending' | 'completed' | 'skipped'
          onboarding_step: number
          daily_goal_minutes: number | null
          preferred_mode: 'voice' | 'text'
          level: 'beginner' | 'intermediate' | 'advanced' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: 'pending' | 'completed' | 'skipped'
          onboarding_step?: number
          daily_goal_minutes?: number | null
          preferred_mode?: 'voice' | 'text'
          level?: 'beginner' | 'intermediate' | 'advanced' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: 'pending' | 'completed' | 'skipped'
          onboarding_step?: number
          daily_goal_minutes?: number | null
          preferred_mode?: 'voice' | 'text'
          level?: 'beginner' | 'intermediate' | 'advanced' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          slug: string
          number: number
          title: string
          description: string
          icon: string
          color: string
          position: number
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          slug: string
          number: number
          title: string
          description?: string
          icon?: string
          color?: string
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          number?: number
          title?: string
          description?: string
          icon?: string
          color?: string
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          module_id: string
          slug: string
          number: number
          title: string
          subtitle: string
          icon: string
          color: string
          content: string
          xp_reward: number
          position: number
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          module_id: string
          slug: string
          number: number
          title: string
          subtitle?: string
          icon?: string
          color?: string
          content?: string
          xp_reward?: number
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          slug?: string
          number?: number
          title?: string
          subtitle?: string
          icon?: string
          color?: string
          content?: string
          xp_reward?: number
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapter_objectives: {
        Row: {
          id: string
          chapter_id: string
          position: number
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          position?: number
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          position?: number
          text?: string
          created_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          chapter_id: string
          type: ActivityType
          title: string
          description: string
          position: number
          props: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          chapter_id: string
          type: ActivityType
          title: string
          description?: string
          position?: number
          props?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          type?: ActivityType
          title?: string
          description?: string
          position?: number
          props?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      word_search_puzzles: {
        Row: {
          id: number
          theme: string
          rows: number
          cols: number
          grid: Json
          word_positions: Json
          created_at: string
        }
        Insert: {
          id: number
          theme: string
          rows: number
          cols: number
          grid: Json
          word_positions: Json
          created_at?: string
        }
        Update: {
          id?: number
          theme?: string
          rows?: number
          cols?: number
          grid?: Json
          word_positions?: Json
          created_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          id: string
          slug: string
          type: LegalDocumentType
          title: string
          content: string
          version: string
          locale: string
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          type: LegalDocumentType
          title: string
          content: string
          version?: string
          locale?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          type?: LegalDocumentType
          title?: string
          content?: string
          version?: string
          locale?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          id: string
          user_id: string
          legal_document_id: string
          accepted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          legal_document_id: string
          accepted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          legal_document_id?: string
          accepted_at?: string
        }
        Relationships: []
      }
      knowledge_embeddings: {
        Row: {
          id: string
          content: string
          metadata: Json
          content_hash: string
          embedding: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          metadata?: Json
          content_hash: string
          embedding: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          metadata?: Json
          content_hash?: string
          embedding?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          event_name: string
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_name: string
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_name?: string
          properties?: Json
          created_at?: string
        }
        Relationships: []
      }
      srs_items: {
        Row: {
          id: string
          user_id: string
          content_ref: string
          content: Json
          ease_factor: number
          interval_days: number
          repetitions: number
          due_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_ref: string
          content: Json
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_ref?: string
          content?: Json
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_engagement: {
        Row: {
          user_id: string
          total_xp: number
          current_streak: number
          longest_streak: number
          last_study_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_sessions: {
        Row: {
          user_id: string
          session_date: string
          minutes_studied: number
          xp_earned: number
          activities_completed: number
          goal_met: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          session_date: string
          minutes_studied?: number
          xp_earned?: number
          activities_completed?: number
          goal_met?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          session_date?: string
          minutes_studied?: number
          xp_earned?: number
          activities_completed?: number
          goal_met?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          category: string
          xp_reward: number
          rule_key: string
          rule_value: number
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          icon?: string
          category?: string
          xp_reward?: number
          rule_key: string
          rule_value?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          category?: string
          xp_reward?: number
          rule_key?: string
          rule_value?: number
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
        Relationships: []
      }
      engagement_activity_awards: {
        Row: {
          user_id: string
          activity_id: string
          xp_awarded: number
          awarded_at: string
        }
        Insert: {
          user_id: string
          activity_id: string
          xp_awarded: number
          awarded_at?: string
        }
        Update: {
          user_id?: string
          activity_id?: string
          xp_awarded?: number
          awarded_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: Array<{
          id: string
          content: string
          metadata: Json
          similarity: number
        }>
      }
      record_engagement_session: {
        Args: {
          p_activity_id: string
          p_xp: number
          p_minutes: number
          p_local_date: string
          p_score: number
        }
        Returns: Json
      }
    }
    Enums: {
      activity_type: ActivityType
      legal_document_type: LegalDocumentType
    }
    CompositeTypes: Record<string, never>
  }
}
