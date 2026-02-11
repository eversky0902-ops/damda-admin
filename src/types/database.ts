export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ad_banners: {
        Row: {
          advertiser_name: string
          created_at: string | null
          end_date: string | null
          id: string
          image_url: string
          is_visible: boolean | null
          link_url: string
          sort_order: number | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          advertiser_name: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          is_visible?: boolean | null
          link_url: string
          sort_order?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          advertiser_name?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_visible?: boolean | null
          link_url?: string
          sort_order?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_login_at: string | null
          login_id: string
          name: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_id: string
          name: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_id?: string
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          image_url: string
          is_visible: boolean
          link_url: string | null
          sort_order: number
          start_date: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          image_url: string
          is_visible?: boolean
          link_url?: string | null
          sort_order?: number
          start_date?: string | null
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string
          is_visible?: boolean
          link_url?: string | null
          sort_order?: number
          start_date?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_owner_documents: {
        Row: {
          business_owner_id: string
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          business_owner_id: string
          created_at?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          business_owner_id?: string
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_owner_documents_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      business_owners: {
        Row: {
          address: string
          address_detail: string | null
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          business_number: string
          commission_rate: number
          contact_name: string
          contact_phone: string
          created_at: string
          email: string
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          representative: string
          status: string
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          address: string
          address_detail?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          business_number: string
          commission_rate?: number
          contact_name: string
          contact_phone: string
          created_at?: string
          email: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          representative: string
          status?: string
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          address?: string
          address_detail?: string | null
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          business_number?: string
          commission_rate?: number
          contact_name?: string
          contact_phone?: string
          created_at?: string
          email?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          representative?: string
          status?: string
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: []
      }
      carts: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          options: Json | null
          product_id: string
          reserved_date: string | null
          reserved_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          options?: Json | null
          product_id: string
          reserved_date?: string | null
          reserved_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          options?: Json | null
          product_id?: string
          reserved_date?: string | null
          reserved_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string
          depth: number
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          depth: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          depth?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_histories: {
        Row: {
          business_owner_id: string
          changed_by: string | null
          created_at: string
          effective_date: string
          id: string
          new_rate: number
          previous_rate: number
          reason: string | null
        }
        Insert: {
          business_owner_id: string
          changed_by?: string | null
          created_at?: string
          effective_date: string
          id?: string
          new_rate: number
          previous_rate: number
          reason?: string | null
        }
        Update: {
          business_owner_id?: string
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_rate?: number
          previous_rate?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_histories_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_histories_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      daycare_documents: {
        Row: {
          created_at: string | null
          daycare_id: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daycare_id: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daycare_id?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daycare_documents_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      daycare_memos: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          daycare_id: string
          id: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          daycare_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          daycare_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daycare_memos_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daycare_memos_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      daycares: {
        Row: {
          address: string
          address_detail: string | null
          approved_at: string | null
          business_number: string | null
          capacity: number | null
          contact_name: string
          contact_phone: string
          created_at: string
          email: string
          id: string
          license_file: string
          license_number: string
          name: string
          rejection_reason: string | null
          representative: string | null
          revision_file: string | null
          revision_reason: string | null
          revision_requested_at: string | null
          revision_response: string | null
          revision_submitted_at: string | null
          status: string
          tel: string | null
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          address: string
          address_detail?: string | null
          approved_at?: string | null
          business_number?: string | null
          capacity?: number | null
          contact_name: string
          contact_phone: string
          created_at?: string
          email: string
          id: string
          license_file: string
          license_number: string
          name: string
          rejection_reason?: string | null
          representative?: string | null
          revision_file?: string | null
          revision_reason?: string | null
          revision_requested_at?: string | null
          revision_response?: string | null
          revision_submitted_at?: string | null
          status?: string
          tel?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          address?: string
          address_detail?: string | null
          approved_at?: string | null
          business_number?: string | null
          capacity?: number | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          email?: string
          id?: string
          license_file?: string
          license_number?: string
          name?: string
          rejection_reason?: string | null
          representative?: string | null
          revision_file?: string | null
          revision_reason?: string | null
          revision_requested_at?: string | null
          revision_response?: string | null
          revision_submitted_at?: string | null
          status?: string
          tel?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_visible: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          category: string
          content: string
          created_at: string
          daycare_id: string
          id: string
          status: string
          title: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          category: string
          content: string
          created_at?: string
          daycare_id: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          category?: string
          content?: string
          created_at?: string
          daycare_id?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_visible: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_visible?: boolean
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_visible?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          is_visible: boolean
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          is_visible?: boolean
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          is_visible?: boolean
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          aligo_response: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          message_content: string | null
          notification_type: string
          recipient_id: string | null
          recipient_phone: string
          recipient_type: string
          reference_id: string | null
          reference_type: string | null
          sent_at: string | null
          status: string
          template_code: string
          variables: Json | null
        }
        Insert: {
          aligo_response?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          notification_type: string
          recipient_id?: string | null
          recipient_phone: string
          recipient_type: string
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string
          template_code: string
          variables?: Json | null
        }
        Update: {
          aligo_response?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          recipient_id?: string | null
          recipient_phone?: string
          recipient_type?: string
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string
          template_code?: string
          variables?: Json | null
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          address: string | null
          address_detail: string | null
          business_number: string
          contact_name: string
          contact_phone: string
          created_at: string
          description: string | null
          email: string
          id: string
          memo: string | null
          name: string
          program_types: string | null
          rejection_reason: string | null
          representative: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          address_detail?: string | null
          business_number: string
          contact_name: string
          contact_phone: string
          created_at?: string
          description?: string | null
          email: string
          id?: string
          memo?: string | null
          name: string
          program_types?: string | null
          rejection_reason?: string | null
          representative: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          address_detail?: string | null
          business_number?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          memo?: string | null
          name?: string
          program_types?: string | null
          rejection_reason?: string | null
          representative?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_inquiries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string
          pg_provider: string
          pg_tid: string | null
          raw_data: Json | null
          receipt_url: string | null
          reservation_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method: string
          pg_provider: string
          pg_tid?: string | null
          raw_data?: Json | null
          receipt_url?: string | null
          reservation_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string
          pg_provider?: string
          pg_tid?: string | null
          raw_data?: Json | null
          receipt_url?: string | null
          reservation_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          content: string | null
          created_at: string
          end_date: string
          height: number | null
          id: string
          image_url: string | null
          is_visible: boolean
          link_url: string | null
          position: string
          start_date: string
          title: string
          updated_at: string
          width: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          end_date: string
          height?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          link_url?: string | null
          position?: string
          start_date: string
          title: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          end_date?: string
          height?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          link_url?: string | null
          position?: string
          start_date?: string
          title?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          name: string
          price: number
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          name: string
          price: number
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          name?: string
          price?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_unavailable_dates: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          is_recurring: boolean
          product_id: string
          reason: string | null
          unavailable_date: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_recurring?: boolean
          product_id: string
          reason?: string | null
          unavailable_date: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_recurring?: boolean
          product_id?: string
          reason?: string | null
          unavailable_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_unavailable_dates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          address: string | null
          address_detail: string | null
          available_time_slots: Json | null
          business_owner_id: string
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_sold_out: boolean
          is_visible: boolean
          latitude: number | null
          longitude: number | null
          max_participants: number
          min_participants: number
          name: string
          original_price: number
          region: string | null
          sale_price: number
          summary: string | null
          thumbnail: string
          updated_at: string
          view_count: number
        }
        Insert: {
          address?: string | null
          address_detail?: string | null
          available_time_slots?: Json | null
          business_owner_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_sold_out?: boolean
          is_visible?: boolean
          latitude?: number | null
          longitude?: number | null
          max_participants: number
          min_participants?: number
          name: string
          original_price: number
          region?: string | null
          sale_price: number
          summary?: string | null
          thumbnail: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          address?: string | null
          address_detail?: string | null
          available_time_slots?: Json | null
          business_owner_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_sold_out?: boolean
          is_visible?: boolean
          latitude?: number | null
          longitude?: number | null
          max_participants?: number
          min_participants?: number
          name?: string
          original_price?: number
          region?: string | null
          sale_price?: number
          summary?: string | null
          thumbnail?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_views: {
        Row: {
          daycare_id: string
          id: string
          product_id: string
          viewed_at: string
        }
        Insert: {
          daycare_id: string
          id?: string
          product_id: string
          viewed_at?: string
        }
        Update: {
          daycare_id?: string
          id?: string
          product_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_views_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_memo: string | null
          created_at: string
          id: string
          original_amount: number
          payment_id: string
          processed_by: string | null
          reason: string | null
          refund_amount: number
          refunded_at: string | null
          reservation_id: string
          status: string
        }
        Insert: {
          admin_memo?: string | null
          created_at?: string
          id?: string
          original_amount: number
          payment_id: string
          processed_by?: string | null
          reason?: string | null
          refund_amount: number
          refunded_at?: string | null
          reservation_id: string
          status?: string
        }
        Update: {
          admin_memo?: string | null
          created_at?: string
          id?: string
          original_amount?: number
          payment_id?: string
          processed_by?: string | null
          reason?: string | null
          refund_amount?: number
          refunded_at?: string | null
          reservation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          depth: number
          full_name: string
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          depth: number
          full_name: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          depth?: number
          full_name?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_holds: {
        Row: {
          created_at: string
          daycare_id: string
          expires_at: string
          id: string
          product_id: string
          reserved_date: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          expires_at?: string
          id?: string
          product_id: string
          reserved_date: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          expires_at?: string
          id?: string
          product_id?: string
          reserved_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_holds_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_holds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_options: {
        Row: {
          created_at: string
          id: string
          product_option_id: string
          quantity: number
          reservation_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_option_id: string
          quantity: number
          reservation_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_option_id?: string
          quantity?: number
          reservation_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_options_product_option_id_fkey"
            columns: ["product_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_options_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_owner_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          daycare_id: string
          id: string
          memo: string | null
          participant_count: number
          product_id: string
          reservation_number: string
          reserved_date: string
          reserved_time: string | null
          reserver_email: string | null
          reserver_name: string | null
          reserver_phone: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_owner_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          daycare_id: string
          id?: string
          memo?: string | null
          participant_count: number
          product_id: string
          reservation_number: string
          reserved_date: string
          reserved_time?: string | null
          reserver_email?: string | null
          reserver_name?: string | null
          reserver_phone?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          business_owner_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          daycare_id?: string
          id?: string
          memo?: string | null
          participant_count?: number
          product_id?: string
          reservation_number?: string
          reserved_date?: string
          reserved_time?: string | null
          reserver_email?: string | null
          reserver_name?: string | null
          reserver_phone?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          daycare_id: string
          id: string
          is_featured: boolean
          is_visible: boolean
          product_id: string
          rating: number
          reservation_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          daycare_id: string
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          product_id: string
          rating: number
          reservation_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          daycare_id?: string
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          product_id?: string
          rating?: number
          reservation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          business_owner_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          refund_amount: number
          settled_at: string | null
          settlement_amount: number
          settlement_period_end: string
          settlement_period_start: string
          status: string
          total_sales: number
        }
        Insert: {
          business_owner_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          refund_amount?: number
          settled_at?: string | null
          settlement_amount: number
          settlement_period_end: string
          settlement_period_start: string
          status?: string
          total_sales: number
        }
        Update: {
          business_owner_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          refund_amount?: number
          settled_at?: string | null
          settlement_amount?: number
          settlement_period_end?: string
          settlement_period_start?: string
          status?: string
          total_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlements_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_daycare_id_fkey"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_complete_reservations: { Args: Record<PropertyKey, never>; Returns: number }
      check_reservation_available: {
        Args: { p_product_id: string; p_reserved_date: string }
        Returns: Json
      }
      cleanup_expired_holds: { Args: Record<PropertyKey, never>; Returns: undefined }
      get_unavailable_dates: {
        Args: { p_product_id: string }
        Returns: string[]
      }
      get_user_role: { Args: Record<PropertyKey, never>; Returns: string }
      is_business_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_daycare: { Args: Record<PropertyKey, never>; Returns: boolean }
      send_alimtalk_http: { Args: { p_body: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
