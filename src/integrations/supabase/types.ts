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
  public: {
    Tables: {
      comment_likes: {
        Row: {
          comment_id: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          comment_id: string
          id?: string
          user_id: string
          value: number
        }
        Update: {
          comment_id?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          movie_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          movie_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          movie_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          progress: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          progress?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          progress?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string | null
          id: string
          kind: string
          movie_id: string | null
          path: string
          url: string | null
          user_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          file_name: string
          file_size?: number
          file_type?: string | null
          id?: string
          kind?: string
          movie_id?: string | null
          path: string
          url?: string | null
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string | null
          id?: string
          kind?: string
          movie_id?: string | null
          path?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_likes: {
        Row: {
          id: string
          movie_id: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          movie_id: string
          user_id: string
          value: number
        }
        Update: {
          id?: string
          movie_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "movie_likes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          actors: string[]
          age_rating: string | null
          backdrop: string | null
          category: Database["public"]["Enums"]["movie_category"]
          coming_soon: boolean
          country: string | null
          created_at: string
          created_by: string | null
          description: string
          director: string | null
          featured: boolean
          genres: string[]
          id: string
          is_hidden: boolean
          is_pinned: boolean
          language: string | null
          movie_url: string | null
          original_title: string | null
          poster: string | null
          producer: string | null
          quality: Database["public"]["Enums"]["movie_quality"]
          rating: number
          release_year: number
          runtime_minutes: number
          slug: string
          subtitle_url: string | null
          tags: string[]
          thumbnail: string | null
          title: string
          top_rated: boolean
          trailer_url: string | null
          trending: boolean
          updated_at: string
          views: number
        }
        Insert: {
          actors?: string[]
          age_rating?: string | null
          backdrop?: string | null
          category?: Database["public"]["Enums"]["movie_category"]
          coming_soon?: boolean
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          director?: string | null
          featured?: boolean
          genres?: string[]
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          language?: string | null
          movie_url?: string | null
          original_title?: string | null
          poster?: string | null
          producer?: string | null
          quality?: Database["public"]["Enums"]["movie_quality"]
          rating?: number
          release_year?: number
          runtime_minutes?: number
          slug: string
          subtitle_url?: string | null
          tags?: string[]
          thumbnail?: string | null
          title: string
          top_rated?: boolean
          trailer_url?: string | null
          trending?: boolean
          updated_at?: string
          views?: number
        }
        Update: {
          actors?: string[]
          age_rating?: string | null
          backdrop?: string | null
          category?: Database["public"]["Enums"]["movie_category"]
          coming_soon?: boolean
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          director?: string | null
          featured?: boolean
          genres?: string[]
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          language?: string | null
          movie_url?: string | null
          original_title?: string | null
          poster?: string | null
          producer?: string | null
          quality?: Database["public"]["Enums"]["movie_quality"]
          rating?: number
          release_year?: number
          runtime_minutes?: number
          slug?: string
          subtitle_url?: string | null
          tags?: string[]
          thumbnail?: string | null
          title?: string
          top_rated?: boolean
          trailer_url?: string | null
          trending?: boolean
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login: string | null
          phone: string | null
          subscription_status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          phone?: string | null
          subscription_status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          subscription_status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          status: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          status?: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          status?: string
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          last_watched_at: string
          movie_id: string
          progress: number
          user_id: string
        }
        Insert: {
          id?: string
          last_watched_at?: string
          movie_id: string
          progress?: number
          user_id: string
        }
        Update: {
          id?: string
          last_watched_at?: string
          movie_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user"
      movie_category:
        | "Hollywood"
        | "Nollywood"
        | "Bollywood"
        | "Korean Drama"
        | "Chinese Drama"
        | "Anime"
        | "TV Series"
      movie_quality: "HD" | "FHD" | "4K"
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
      app_role: ["admin", "moderator", "user"],
      movie_category: [
        "Hollywood",
        "Nollywood",
        "Bollywood",
        "Korean Drama",
        "Chinese Drama",
        "Anime",
        "TV Series",
      ],
      movie_quality: ["HD", "FHD", "4K"],
    },
  },
} as const
