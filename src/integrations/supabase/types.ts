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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          payload: Json | null
          store_id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          store_id: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          store_id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      client_error_logs: {
        Row: {
          created_at: string
          error_message: string
          id: string
          metadata: Json | null
          stack_trace: string | null
          store_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          store_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          store_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_error_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string | null
          number: string
          postal_code: string
          state: string
          street: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string | null
          number: string
          postal_code: string
          state: string
          street: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string | null
          number?: string
          postal_code?: string
          state?: string
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_sessions: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          revoked: boolean
          token_hash: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          revoked?: boolean
          token_hash: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          revoked?: boolean
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          password_hash: string
          phone: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          password_hash: string
          phone?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          phone?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          auto_base_fee_cents: number | null
          auto_min_fee_cents: number | null
          auto_multiplier: number | null
          auto_price_per_km_cents: number | null
          auto_price_per_min_cents: number | null
          base_fee_cents: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_distance_km: number | null
          name: string
          pricing_type: string | null
          store_id: string
        }
        Insert: {
          auto_base_fee_cents?: number | null
          auto_min_fee_cents?: number | null
          auto_multiplier?: number | null
          auto_price_per_km_cents?: number | null
          auto_price_per_min_cents?: number | null
          base_fee_cents?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_distance_km?: number | null
          name: string
          pricing_type?: string | null
          store_id: string
        }
        Update: {
          auto_base_fee_cents?: number | null
          auto_min_fee_cents?: number | null
          auto_multiplier?: number | null
          auto_price_per_km_cents?: number | null
          auto_price_per_min_cents?: number | null
          base_fee_cents?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_distance_km?: number | null
          name?: string
          pricing_type?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      distance_pricing: {
        Row: {
          created_at: string | null
          delivery_zone_id: string
          id: string
          max_distance_km: number
          min_distance_km: number
          price_cents: number
        }
        Insert: {
          created_at?: string | null
          delivery_zone_id: string
          id?: string
          max_distance_km: number
          min_distance_km: number
          price_cents: number
        }
        Update: {
          created_at?: string | null
          delivery_zone_id?: string
          id?: string
          max_distance_km?: number
          min_distance_km?: number
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "distance_pricing_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          email: string
          id: string
          reason: string
          resend_email_id: string | null
          resend_event: string | null
          suppressed_at: string
        }
        Insert: {
          email: string
          id?: string
          reason: string
          resend_email_id?: string | null
          resend_event?: string | null
          suppressed_at?: string
        }
        Update: {
          email?: string
          id?: string
          reason?: string
          resend_email_id?: string | null
          resend_event?: string | null
          suppressed_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          fbclid: string | null
          id: string
          name: string
          plan_name: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          fbclid?: string | null
          id?: string
          name: string
          plan_name: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string | null
          fbclid?: string | null
          id?: string
          name?: string
          plan_name?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          order_id: string | null
          recipient_type: string
          status: string
          store_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_type: string
          status?: string
          store_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_type?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_tracking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_cents: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          store_id: string
          unit_price_cents: number
          variant_label: string | null
          variant_option_ids: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_cents: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          store_id: string
          unit_price_cents: number
          variant_label?: string | null
          variant_option_ids?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total_cents?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          store_id?: string
          unit_price_cents?: number
          variant_label?: string | null
          variant_option_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_tracking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          created_at: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_date: string | null
          delivery_distance_km: number | null
          delivery_type: string
          delivery_zone_id: string | null
          delivery_zone_name: string | null
          external_payment_id: string | null
          id: string
          invoice_key: string | null
          melhorenvio_order_id: string | null
          national_shipping_cep: string | null
          notes: string | null
          order_number: string
          payment_expires_at: string | null
          payment_provider: string | null
          payment_status: string
          pix_name: string | null
          qr_code_base64: string | null
          qr_code_data: string | null
          shipping_company: string | null
          shipping_delivery_time_days: number | null
          shipping_fee_cents: number
          shipping_region_id: string | null
          shipping_region_name: string | null
          shipping_service_id: number | null
          shipping_service_name: string | null
          status: string
          store_id: string
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_distance_km?: number | null
          delivery_type: string
          delivery_zone_id?: string | null
          delivery_zone_name?: string | null
          external_payment_id?: string | null
          id?: string
          invoice_key?: string | null
          melhorenvio_order_id?: string | null
          national_shipping_cep?: string | null
          notes?: string | null
          order_number: string
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_status?: string
          pix_name?: string | null
          qr_code_base64?: string | null
          qr_code_data?: string | null
          shipping_company?: string | null
          shipping_delivery_time_days?: number | null
          shipping_fee_cents?: number
          shipping_region_id?: string | null
          shipping_region_name?: string | null
          shipping_service_id?: number | null
          shipping_service_name?: string | null
          status?: string
          store_id: string
          subtotal_cents: number
          total_cents: number
          tracking_code?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_distance_km?: number | null
          delivery_type?: string
          delivery_zone_id?: string | null
          delivery_zone_name?: string | null
          external_payment_id?: string | null
          id?: string
          invoice_key?: string | null
          melhorenvio_order_id?: string | null
          national_shipping_cep?: string | null
          notes?: string | null
          order_number?: string
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_status?: string
          pix_name?: string | null
          qr_code_base64?: string | null
          qr_code_data?: string | null
          shipping_company?: string | null
          shipping_delivery_time_days?: number | null
          shipping_fee_cents?: number
          shipping_region_id?: string | null
          shipping_region_name?: string | null
          shipping_service_id?: number | null
          shipping_service_name?: string | null
          status?: string
          store_id?: string
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_region_id_fkey"
            columns: ["shipping_region_id"]
            isOneToOne: false
            referencedRelation: "shipping_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_groups: {
        Row: {
          created_at: string | null
          group_name: string
          id: string
          product_id: string
          sort_order: number
          store_id: string
        }
        Insert: {
          created_at?: string | null
          group_name: string
          id?: string
          product_id: string
          sort_order?: number
          store_id: string
        }
        Update: {
          created_at?: string | null
          group_name?: string
          id?: string
          product_id?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_groups_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_options: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          sort_order: number
          stock_qty: number | null
          store_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          sort_order?: number
          stock_qty?: number | null
          store_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          sort_order?: number
          stock_qty?: number | null
          store_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_variant_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          height_cm: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          length_cm: number | null
          name: string
          price_cents: number
          slug: string
          sort_order: number | null
          stock_qty: number | null
          store_id: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name: string
          price_cents: number
          slug: string
          sort_order?: number | null
          stock_qty?: number | null
          store_id: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number | null
          stock_qty?: number | null
          store_id?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_super_admin: boolean
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
        }
        Relationships: []
      }
      shipping_regions: {
        Row: {
          created_at: string
          fee_cents: number
          id: string
          is_active: boolean
          name: string
          slug: string
          store_id: string
        }
        Insert: {
          created_at?: string
          fee_cents?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          store_id: string
        }
        Update: {
          created_at?: string
          fee_cents?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_regions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          id: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_counters: {
        Row: {
          last_number: number
          store_id: string
        }
        Insert: {
          last_number?: number
          store_id: string
        }
        Update: {
          last_number?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_order_counters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_secrets: {
        Row: {
          created_at: string
          id: string
          melhorenvio_token: string | null
          mp_access_token: string | null
          mp_access_token_secret_id: string | null
          mp_refresh_token: string | null
          mp_refresh_token_secret_id: string | null
          mp_token_expires_at: string | null
          mp_user_id: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          melhorenvio_token?: string | null
          mp_access_token?: string | null
          mp_access_token_secret_id?: string | null
          mp_refresh_token?: string | null
          mp_refresh_token_secret_id?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          melhorenvio_token?: string | null
          mp_access_token?: string | null
          mp_access_token_secret_id?: string | null
          mp_refresh_token?: string | null
          mp_refresh_token_secret_id?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_secrets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          last_seen_at: string
          session_token: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_seen_at?: string
          session_token: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_seen_at?: string
          session_token?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          banner_url: string | null
          category_style: string | null
          contact_message_template: string | null
          created_at: string
          default_package_height_cm: number | null
          default_package_length_cm: number | null
          default_package_weight_kg: number | null
          default_package_width_cm: number | null
          enabled_shipping_services: Json | null
          favicon_url: string | null
          id: string
          label_collect: boolean | null
          label_own_hand: boolean
          label_receipt: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          melhorenvio_insurance: boolean | null
          melhorenvio_sandbox: boolean
          message: string | null
          national_shipping_enabled: boolean | null
          notif_client_order_delivered: boolean
          notif_client_order_ready: boolean
          notif_client_payment_confirmed: boolean
          notif_email_new_order: boolean
          notif_email_payment_confirmed: boolean
          notif_email_status_change: boolean
          notif_push_new_order: boolean
          notif_push_payment_confirmed: boolean
          notif_push_status_change: boolean
          notif_webhook_enabled: boolean
          notif_webhook_url: string | null
          notification_email: string | null
          notification_from_email: string | null
          notification_from_name: string | null
          notification_preferences: Json | null
          opening_hours: string | null
          payment_provider: string
          pix_key: string | null
          primary_color: string | null
          requires_payment_proof: boolean
          secondary_color: string | null
          sender_address: string | null
          sender_address_number: string | null
          sender_city: string | null
          sender_complement: string | null
          sender_document: string | null
          sender_email: string | null
          sender_name: string | null
          sender_neighborhood: string | null
          sender_phone: string | null
          sender_postal_code: string | null
          sender_state: string | null
          shipping_markup_percent: number | null
          shipping_mode: string
          show_banner: boolean
          show_category_images: boolean | null
          show_out_of_stock: boolean | null
          show_revenue_to_staff: boolean
          silent_hours_enabled: boolean | null
          silent_hours_end: string | null
          silent_hours_start: string | null
          sound_enabled: boolean | null
          sound_volume: string | null
          store_id: string
          store_name: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          banner_url?: string | null
          category_style?: string | null
          contact_message_template?: string | null
          created_at?: string
          default_package_height_cm?: number | null
          default_package_length_cm?: number | null
          default_package_weight_kg?: number | null
          default_package_width_cm?: number | null
          enabled_shipping_services?: Json | null
          favicon_url?: string | null
          id?: string
          label_collect?: boolean | null
          label_own_hand?: boolean
          label_receipt?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          melhorenvio_insurance?: boolean | null
          melhorenvio_sandbox?: boolean
          message?: string | null
          national_shipping_enabled?: boolean | null
          notif_client_order_delivered?: boolean
          notif_client_order_ready?: boolean
          notif_client_payment_confirmed?: boolean
          notif_email_new_order?: boolean
          notif_email_payment_confirmed?: boolean
          notif_email_status_change?: boolean
          notif_push_new_order?: boolean
          notif_push_payment_confirmed?: boolean
          notif_push_status_change?: boolean
          notif_webhook_enabled?: boolean
          notif_webhook_url?: string | null
          notification_email?: string | null
          notification_from_email?: string | null
          notification_from_name?: string | null
          notification_preferences?: Json | null
          opening_hours?: string | null
          payment_provider?: string
          pix_key?: string | null
          primary_color?: string | null
          requires_payment_proof?: boolean
          secondary_color?: string | null
          sender_address?: string | null
          sender_address_number?: string | null
          sender_city?: string | null
          sender_complement?: string | null
          sender_document?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_neighborhood?: string | null
          sender_phone?: string | null
          sender_postal_code?: string | null
          sender_state?: string | null
          shipping_markup_percent?: number | null
          shipping_mode?: string
          show_banner?: boolean
          show_category_images?: boolean | null
          show_out_of_stock?: boolean | null
          show_revenue_to_staff?: boolean
          silent_hours_enabled?: boolean | null
          silent_hours_end?: string | null
          silent_hours_start?: string | null
          sound_enabled?: boolean | null
          sound_volume?: string | null
          store_id: string
          store_name?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          banner_url?: string | null
          category_style?: string | null
          contact_message_template?: string | null
          created_at?: string
          default_package_height_cm?: number | null
          default_package_length_cm?: number | null
          default_package_weight_kg?: number | null
          default_package_width_cm?: number | null
          enabled_shipping_services?: Json | null
          favicon_url?: string | null
          id?: string
          label_collect?: boolean | null
          label_own_hand?: boolean
          label_receipt?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          melhorenvio_insurance?: boolean | null
          melhorenvio_sandbox?: boolean
          message?: string | null
          national_shipping_enabled?: boolean | null
          notif_client_order_delivered?: boolean
          notif_client_order_ready?: boolean
          notif_client_payment_confirmed?: boolean
          notif_email_new_order?: boolean
          notif_email_payment_confirmed?: boolean
          notif_email_status_change?: boolean
          notif_push_new_order?: boolean
          notif_push_payment_confirmed?: boolean
          notif_push_status_change?: boolean
          notif_webhook_enabled?: boolean
          notif_webhook_url?: string | null
          notification_email?: string | null
          notification_from_email?: string | null
          notification_from_name?: string | null
          notification_preferences?: Json | null
          opening_hours?: string | null
          payment_provider?: string
          pix_key?: string | null
          primary_color?: string | null
          requires_payment_proof?: boolean
          secondary_color?: string | null
          sender_address?: string | null
          sender_address_number?: string | null
          sender_city?: string | null
          sender_complement?: string | null
          sender_document?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_neighborhood?: string | null
          sender_phone?: string | null
          sender_postal_code?: string | null
          sender_state?: string | null
          shipping_markup_percent?: number | null
          shipping_mode?: string
          show_banner?: boolean
          show_category_images?: boolean | null
          show_out_of_stock?: boolean | null
          show_revenue_to_staff?: boolean
          silent_hours_enabled?: boolean | null
          silent_hours_end?: string | null
          silent_hours_start?: string | null
          sound_enabled?: boolean | null
          sound_volume?: string | null
          store_id?: string
          store_name?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          event_type: string | null
          external_id: string | null
          id: string
          order_id: string | null
          processed: boolean
          provider: string
          raw_status: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          order_id?: string | null
          processed?: boolean
          provider?: string
          raw_status?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          order_id?: string | null
          processed?: boolean
          provider?: string
          raw_status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_tracking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orders_tracking_view: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_date: string | null
          delivery_type: string | null
          external_payment_id: string | null
          id: string | null
          invoice_key: string | null
          melhorenvio_order_id: string | null
          national_shipping_cep: string | null
          notes: string | null
          order_number: string | null
          payment_expires_at: string | null
          payment_provider: string | null
          payment_status: string | null
          pix_name: string | null
          qr_code_base64: string | null
          qr_code_data: string | null
          shipping_company: string | null
          shipping_delivery_time_days: number | null
          shipping_fee_cents: number | null
          shipping_region_name: string | null
          shipping_service_name: string | null
          status: string | null
          store_id: string | null
          subtotal_cents: number | null
          total_cents: number | null
          tracking_code: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: never
          address_neighborhood?: never
          address_number?: never
          address_state?: string | null
          address_street?: never
          created_at?: string | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          delivery_date?: string | null
          delivery_type?: string | null
          external_payment_id?: string | null
          id?: string | null
          invoice_key?: string | null
          melhorenvio_order_id?: string | null
          national_shipping_cep?: string | null
          notes?: string | null
          order_number?: string | null
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          pix_name?: string | null
          qr_code_base64?: string | null
          qr_code_data?: string | null
          shipping_company?: string | null
          shipping_delivery_time_days?: number | null
          shipping_fee_cents?: number | null
          shipping_region_name?: string | null
          shipping_service_name?: string | null
          status?: string | null
          store_id?: string | null
          subtotal_cents?: number | null
          total_cents?: number | null
          tracking_code?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: never
          address_neighborhood?: never
          address_number?: never
          address_state?: string | null
          address_street?: never
          created_at?: string | null
          customer_email?: never
          customer_name?: never
          customer_phone?: never
          delivery_date?: string | null
          delivery_type?: string | null
          external_payment_id?: string | null
          id?: string | null
          invoice_key?: string | null
          melhorenvio_order_id?: string | null
          national_shipping_cep?: string | null
          notes?: string | null
          order_number?: string | null
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          pix_name?: string | null
          qr_code_base64?: string | null
          qr_code_data?: string | null
          shipping_company?: string | null
          shipping_delivery_time_days?: number | null
          shipping_fee_cents?: number | null
          shipping_region_name?: string | null
          shipping_service_name?: string | null
          status?: string | null
          store_id?: string | null
          subtotal_cents?: number | null
          total_cents?: number | null
          tracking_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_session_limit: {
        Args: { p_session_token: string; p_store_id: string }
        Returns: boolean
      }
      create_public_order: {
        Args: {
          p_address_city?: string
          p_address_complement?: string
          p_address_neighborhood?: string
          p_address_number?: string
          p_address_state?: string
          p_address_street?: string
          p_customer_document?: string
          p_customer_email?: string
          p_customer_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_date: string
          p_delivery_distance_km?: number
          p_delivery_type: string
          p_delivery_zone_id?: string
          p_delivery_zone_name?: string
          p_items: Json
          p_national_shipping_cep?: string
          p_notes: string
          p_pix_name?: string
          p_region_slug?: string
          p_shipping_company?: string
          p_shipping_delivery_time_days?: number
          p_shipping_fee_override?: number
          p_shipping_service_id?: number
          p_shipping_service_name?: string
          p_store_slug: string
        }
        Returns: Json
      }
      is_store_admin_for: { Args: { p_store_id: string }; Returns: boolean }
      is_store_member: { Args: { p_store_id: string }; Returns: boolean }
      is_super_admin: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

