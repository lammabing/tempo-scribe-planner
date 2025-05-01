
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: string
          start_time: string
          end_time: string
          all_day: boolean
          color: string
          location: string | null
          status: string
          deadline: string | null
          completed: boolean | null
          recurrence: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type: string
          start_time: string
          end_time: string
          all_day: boolean
          color: string
          location?: string | null
          status: string
          deadline?: string | null
          completed?: boolean | null
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: string
          start_time?: string
          end_time?: string
          all_day?: boolean
          color?: string
          location?: string | null
          status?: string
          deadline?: string | null
          completed?: boolean | null
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          created_at: string
          last_login: string
          preferences: Json | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          last_login: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          last_login?: string
          preferences?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
