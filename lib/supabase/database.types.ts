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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          onboarding_completed_at: string | null
          daily_goal_minutes: number | null
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
          daily_goal_minutes?: number | null
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
          daily_goal_minutes?: number | null
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
    }
    Enums: {
      activity_type: ActivityType
      legal_document_type: LegalDocumentType
    }
    CompositeTypes: Record<string, never>
  }
}
