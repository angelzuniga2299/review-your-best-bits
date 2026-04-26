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
      app_settings: {
        Row: {
          business_address: string
          business_info: string
          business_name: string
          close_time: string
          id: boolean
          open_days: number[]
          open_time: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          business_address?: string
          business_info?: string
          business_name?: string
          close_time?: string
          id?: boolean
          open_days?: number[]
          open_time?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          business_address?: string
          business_info?: string
          business_name?: string
          close_time?: string
          id?: boolean
          open_days?: number[]
          open_time?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          public_id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          public_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          public_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_filters: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          currency: string
          delivery_time: string | null
          description: string | null
          discount_pct: number
          id: string
          image_url: string | null
          is_new: boolean
          is_on_sale: boolean
          name: string
          por_encargo: boolean
          price: number
          sort_order: number
          stock: number
          updated_at: string
          warranty: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          delivery_time?: string | null
          description?: string | null
          discount_pct?: number
          id?: string
          image_url?: string | null
          is_new?: boolean
          is_on_sale?: boolean
          name: string
          por_encargo?: boolean
          price?: number
          sort_order?: number
          stock?: number
          updated_at?: string
          warranty?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          delivery_time?: string | null
          description?: string | null
          discount_pct?: number
          id?: string
          image_url?: string | null
          is_new?: boolean
          is_on_sale?: boolean
          name?: string
          por_encargo?: boolean
          price?: number
          sort_order?: number
          stock?: number
          updated_at?: string
          warranty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "product_filters"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_admin: boolean
          user_id: string
        }[]
      }
      promote_to_admin: { Args: { _target: string }; Returns: undefined }
      revoke_admin: { Args: { _target: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
