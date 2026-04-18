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
      alerts: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          level: Database["public"]["Enums"]["alert_level"]
          message: string | null
          project_id: string | null
          resolved_at: string | null
          type: Database["public"]["Enums"]["alert_type"]
          workspace_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["alert_level"]
          message?: string | null
          project_id?: string | null
          resolved_at?: string | null
          type: Database["public"]["Enums"]["alert_type"]
          workspace_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["alert_level"]
          message?: string | null
          project_id?: string | null
          resolved_at?: string | null
          type?: Database["public"]["Enums"]["alert_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_entries: {
        Row: {
          channel_reference: string | null
          content_item_id: string
          created_at: string
          id: string
          recommendation_reason: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["calendar_entry_status"]
          target_platform: Database["public"]["Enums"]["platform"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel_reference?: string | null
          content_item_id: string
          created_at?: string
          id?: string
          recommendation_reason?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["calendar_entry_status"]
          target_platform: Database["public"]["Enums"]["platform"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel_reference?: string | null
          content_item_id?: string
          created_at?: string
          id?: string
          recommendation_reason?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["calendar_entry_status"]
          target_platform?: Database["public"]["Enums"]["platform"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_entries_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          approved_prompt_at: string | null
          approved_text_at: string | null
          cover_image_asset_id: string | null
          created_at: string
          final_hashtags: string[] | null
          final_image_prompt: string
          final_post_idea: string
          final_text: string
          id: string
          notes: string | null
          project_id: string
          published_at: string | null
          scheduled_at: string | null
          source_draft_variant_id: string | null
          title_or_label: string
          updated_at: string
          workflow_status: Database["public"]["Enums"]["content_workflow_status"]
        }
        Insert: {
          approved_prompt_at?: string | null
          approved_text_at?: string | null
          cover_image_asset_id?: string | null
          created_at?: string
          final_hashtags?: string[] | null
          final_image_prompt: string
          final_post_idea: string
          final_text: string
          id?: string
          notes?: string | null
          project_id: string
          published_at?: string | null
          scheduled_at?: string | null
          source_draft_variant_id?: string | null
          title_or_label: string
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["content_workflow_status"]
        }
        Update: {
          approved_prompt_at?: string | null
          approved_text_at?: string | null
          cover_image_asset_id?: string | null
          created_at?: string
          final_hashtags?: string[] | null
          final_image_prompt?: string
          final_post_idea?: string
          final_text?: string
          id?: string
          notes?: string | null
          project_id?: string
          published_at?: string | null
          scheduled_at?: string | null
          source_draft_variant_id?: string | null
          title_or_label?: string
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["content_workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "content_items_cover_image_asset_id_fkey"
            columns: ["cover_image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_source_draft_variant_id_fkey"
            columns: ["source_draft_variant_id"]
            isOneToOne: false
            referencedRelation: "draft_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_screenshot_feedback: {
        Row: {
          artifact_id: string | null
          created_at: string
          feedback_reason: string | null
          feedback_scope: string
          feedback_value: string
          id: string
          pipeline_run_id: string
          screenshot_type: string | null
          semantic_class: string | null
          state_id: string | null
          updated_at: string
        }
        Insert: {
          artifact_id?: string | null
          created_at?: string
          feedback_reason?: string | null
          feedback_scope: string
          feedback_value: string
          id: string
          pipeline_run_id: string
          screenshot_type?: string | null
          semantic_class?: string | null
          state_id?: string | null
          updated_at?: string
        }
        Update: {
          artifact_id?: string | null
          created_at?: string
          feedback_reason?: string | null
          feedback_scope?: string
          feedback_value?: string
          id?: string
          pipeline_run_id?: string
          screenshot_type?: string | null
          semantic_class?: string | null
          state_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_screenshot_feedback_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_sets: {
        Row: {
          bundle_id: string
          created_at: string
          generation_notes: string | null
          id: string
          project_id: string
          source_context_hash: string | null
          target_format: Database["public"]["Enums"]["content_format"]
          target_platform: Database["public"]["Enums"]["platform"]
        }
        Insert: {
          bundle_id: string
          created_at?: string
          generation_notes?: string | null
          id?: string
          project_id: string
          source_context_hash?: string | null
          target_format: Database["public"]["Enums"]["content_format"]
          target_platform: Database["public"]["Enums"]["platform"]
        }
        Update: {
          bundle_id?: string
          created_at?: string
          generation_notes?: string | null
          id?: string
          project_id?: string
          source_context_hash?: string | null
          target_format?: Database["public"]["Enums"]["content_format"]
          target_platform?: Database["public"]["Enums"]["platform"]
        }
        Relationships: [
          {
            foreignKeyName: "draft_sets_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "resource_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_sets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_variants: {
        Row: {
          created_at: string
          draft_set_id: string
          hashtags: string[] | null
          id: string
          image_prompt: string
          post_idea: string
          preview_hints: Json | null
          score_json: Json | null
          selected_at: string | null
          status: Database["public"]["Enums"]["draft_status"]
          text_body: string
          visual_idea: string
        }
        Insert: {
          created_at?: string
          draft_set_id: string
          hashtags?: string[] | null
          id?: string
          image_prompt: string
          post_idea: string
          preview_hints?: Json | null
          score_json?: Json | null
          selected_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          text_body: string
          visual_idea: string
        }
        Update: {
          created_at?: string
          draft_set_id?: string
          hashtags?: string[] | null
          id?: string
          image_prompt?: string
          post_idea?: string
          preview_hints?: Json | null
          score_json?: Json | null
          selected_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          text_body?: string
          visual_idea?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_variants_draft_set_id_fkey"
            columns: ["draft_set_id"]
            isOneToOne: false
            referencedRelation: "draft_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      few_shot_examples: {
        Row: {
          active: boolean
          content_item_id: string
          created_at: string
          expires_at: string | null
          id: string
          project_id: string
          rank_score: number
          reason_summary: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          content_item_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id: string
          rank_score?: number
          reason_summary?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          content_item_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id?: string
          rank_score?: number
          reason_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "few_shot_examples_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "few_shot_examples_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string
          id: string
          linked_trend_id: string | null
          notes: string | null
          project_id: string
          source_type: Database["public"]["Enums"]["idea_source_type"]
          status: Database["public"]["Enums"]["idea_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_trend_id?: string | null
          notes?: string | null
          project_id: string
          source_type?: Database["public"]["Enums"]["idea_source_type"]
          status?: Database["public"]["Enums"]["idea_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_trend_id?: string | null
          notes?: string | null
          project_id?: string
          source_type?: Database["public"]["Enums"]["idea_source_type"]
          status?: Database["public"]["Enums"]["idea_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_linked_trend_id_fkey"
            columns: ["linked_trend_id"]
            isOneToOne: false
            referencedRelation: "trend_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_assets: {
        Row: {
          content_item_id: string
          created_at: string
          generation_state: Database["public"]["Enums"]["image_generation_state"]
          height: number | null
          id: string
          prompt_version: string | null
          storage_path: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          content_item_id: string
          created_at?: string
          generation_state?: Database["public"]["Enums"]["image_generation_state"]
          height?: number | null
          id?: string
          prompt_version?: string | null
          storage_path: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          content_item_id?: string
          created_at?: string
          generation_state?: Database["public"]["Enums"]["image_generation_state"]
          height?: number | null
          id?: string
          prompt_version?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_assets_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          credentials_encrypted: Json | null
          error_message: string | null
          id: string
          last_tested_at: string | null
          metadata: Json | null
          provider: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted?: Json | null
          error_message?: string | null
          id?: string
          last_tested_at?: string | null
          metadata?: Json | null
          provider: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          credentials_encrypted?: Json | null
          error_message?: string | null
          id?: string
          last_tested_at?: string | null
          metadata?: Json | null
          provider?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_snapshots: {
        Row: {
          clicks: number | null
          comments: number | null
          content_item_id: string
          created_at: string
          engagements: number
          id: string
          impressions: number
          platform: Database["public"]["Enums"]["platform"]
          raw_metrics_json: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          snapshot_date: string
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          content_item_id: string
          created_at?: string
          engagements?: number
          id?: string
          impressions?: number
          platform: Database["public"]["Enums"]["platform"]
          raw_metrics_json?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_date: string
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          content_item_id?: string
          created_at?: string
          engagements?: number
          id?: string
          impressions?: number
          platform?: Database["public"]["Enums"]["platform"]
          raw_metrics_json?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_snapshots_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          id: string
          label: string
          metadata_json: Json
          pipeline_run_id: string
          project_id: string
          source_type: string
          stage: string
          storage_ref: string | null
          updated_at: string
          uri: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          id: string
          label: string
          metadata_json?: Json
          pipeline_run_id: string
          project_id: string
          source_type: string
          stage: string
          storage_ref?: string | null
          updated_at?: string
          uri?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          id?: string
          label?: string
          metadata_json?: Json
          pipeline_run_id?: string
          project_id?: string
          source_type?: string
          stage?: string
          storage_ref?: string | null
          updated_at?: string
          uri?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_artifacts_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          created_at: string
          current_stage: string | null
          final_status: string
          id: string
          project_id: string
          request_payload_json: Json
          resource_url: string
          summary_json: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage?: string | null
          final_status: string
          id: string
          project_id: string
          request_payload_json?: Json
          resource_url: string
          summary_json?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage?: string | null
          final_status?: string
          id?: string
          project_id?: string
          request_payload_json?: Json
          resource_url?: string
          summary_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stage_results: {
        Row: {
          created_at: string
          errors_json: Json
          evidence_refs_json: Json
          id: string
          next_stage_input_json: Json
          normalized_output_json: Json
          pipeline_run_id: string
          raw_output_json: Json
          stage: string
          status: string
          warnings_json: Json
        }
        Insert: {
          created_at?: string
          errors_json?: Json
          evidence_refs_json?: Json
          id: string
          next_stage_input_json?: Json
          normalized_output_json?: Json
          pipeline_run_id: string
          raw_output_json?: Json
          stage: string
          status: string
          warnings_json?: Json
        }
        Update: {
          created_at?: string
          errors_json?: Json
          evidence_refs_json?: Json
          id?: string
          next_stage_input_json?: Json
          normalized_output_json?: Json
          pipeline_run_id?: string
          raw_output_json?: Json
          stage?: string
          status?: string
          warnings_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_results_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_anti_patterns: {
        Row: {
          active: boolean
          confidence: number
          created_at: string
          example_references: string[] | null
          explanation: string | null
          id: string
          label: string
          mitigation_advice: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          confidence?: number
          created_at?: string
          example_references?: string[] | null
          explanation?: string | null
          id?: string
          label: string
          mitigation_advice?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          confidence?: number
          created_at?: string
          example_references?: string[] | null
          explanation?: string | null
          id?: string
          label?: string
          mitigation_advice?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_anti_patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_context_memories: {
        Row: {
          context_version: number
          id: string
          project_id: string
          recent_learnings_summary: string | null
          summary_snapshot: string | null
          updated_at: string
        }
        Insert: {
          context_version?: number
          id?: string
          project_id: string
          recent_learnings_summary?: string | null
          summary_snapshot?: string | null
          updated_at?: string
        }
        Update: {
          context_version?: number
          id?: string
          project_id?: string
          recent_learnings_summary?: string | null
          summary_snapshot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_context_memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_profiles: {
        Row: {
          active_platforms: Database["public"]["Enums"]["platform"][]
          audience: string
          banned_phrases: string[] | null
          competitor_list: Json
          id: string
          messaging_rules: string | null
          positioning: string
          product_links: Json | null
          project_id: string
          tone_of_voice: string
          updated_at: string
          visual_guidelines: string | null
        }
        Insert: {
          active_platforms?: Database["public"]["Enums"]["platform"][]
          audience?: string
          banned_phrases?: string[] | null
          competitor_list?: Json
          id?: string
          messaging_rules?: string | null
          positioning?: string
          product_links?: Json | null
          project_id: string
          tone_of_voice?: string
          updated_at?: string
          visual_guidelines?: string | null
        }
        Update: {
          active_platforms?: Database["public"]["Enums"]["platform"][]
          audience?: string
          banned_phrases?: string[] | null
          competitor_list?: Json
          id?: string
          messaging_rules?: string | null
          positioning?: string
          product_links?: Json | null
          project_id?: string
          tone_of_voice?: string
          updated_at?: string
          visual_guidelines?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_store_url: string | null
          audience_summary: string
          category: string
          created_at: string
          description: string
          icon_url: string | null
          id: string
          landing_url: string | null
          name: string
          positioning_summary: string | null
          status: Database["public"]["Enums"]["project_status"]
          tone_summary: string
          updated_at: string
          visual_direction_notes: string | null
          workspace_id: string
        }
        Insert: {
          app_store_url?: string | null
          audience_summary?: string
          category: string
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          landing_url?: string | null
          name: string
          positioning_summary?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tone_summary?: string
          updated_at?: string
          visual_direction_notes?: string | null
          workspace_id: string
        }
        Update: {
          app_store_url?: string | null
          audience_summary?: string
          category?: string
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          landing_url?: string | null
          name?: string
          positioning_summary?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tone_summary?: string
          updated_at?: string
          visual_direction_notes?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_jobs: {
        Row: {
          attempt_count: number
          content_item_id: string
          created_at: string
          external_post_id: string | null
          failure_reason: string | null
          id: string
          last_attempt_at: string | null
          platform: Database["public"]["Enums"]["platform"]
          status: Database["public"]["Enums"]["publish_job_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          content_item_id: string
          created_at?: string
          external_post_id?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          platform: Database["public"]["Enums"]["platform"]
          status?: Database["public"]["Enums"]["publish_job_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          content_item_id?: string
          created_at?: string
          external_post_id?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          status?: Database["public"]["Enums"]["publish_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_jobs_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_bundles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          merged_context_json: Json | null
          parse_confidence_bucket: string | null
          project_id: string
          status: Database["public"]["Enums"]["bundle_status"]
          updated_at: string
          user_goal_note: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          merged_context_json?: Json | null
          parse_confidence_bucket?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["bundle_status"]
          updated_at?: string
          user_goal_note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          merged_context_json?: Json | null
          parse_confidence_bucket?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["bundle_status"]
          updated_at?: string
          user_goal_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_bundles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_items: {
        Row: {
          bundle_id: string
          competitor_flag: boolean
          created_at: string
          extracted_text: string | null
          id: string
          ingestion_status: Database["public"]["Enums"]["ingestion_status"]
          parse_metadata: Json | null
          raw_reference: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          trend_flag: boolean
          uploaded_file_path: string | null
        }
        Insert: {
          bundle_id: string
          competitor_flag?: boolean
          created_at?: string
          extracted_text?: string | null
          id?: string
          ingestion_status?: Database["public"]["Enums"]["ingestion_status"]
          parse_metadata?: Json | null
          raw_reference?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          trend_flag?: boolean
          uploaded_file_path?: string | null
        }
        Update: {
          bundle_id?: string
          competitor_flag?: boolean
          created_at?: string
          extracted_text?: string | null
          id?: string
          ingestion_status?: Database["public"]["Enums"]["ingestion_status"]
          parse_metadata?: Json | null
          raw_reference?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          trend_flag?: boolean
          uploaded_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "resource_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshot_post_feedback: {
        Row: {
          base_screenshot_ref: string | null
          created_at: string
          creative_angle: string | null
          feedback_reason: string | null
          feedback_target_level: string
          feedback_target_ref: string | null
          feedback_value: string
          generation_strategy: string | null
          id: string
          pipeline_run_id: string
          post_asset_id: string | null
          post_intent: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          base_screenshot_ref?: string | null
          created_at?: string
          creative_angle?: string | null
          feedback_reason?: string | null
          feedback_target_level?: string
          feedback_target_ref?: string | null
          feedback_value: string
          generation_strategy?: string | null
          id: string
          pipeline_run_id: string
          post_asset_id?: string | null
          post_intent?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          base_screenshot_ref?: string | null
          created_at?: string
          creative_angle?: string | null
          feedback_reason?: string | null
          feedback_target_level?: string
          feedback_target_ref?: string | null
          feedback_value?: string
          generation_strategy?: string | null
          id?: string
          pipeline_run_id?: string
          post_asset_id?: string | null
          post_intent?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_post_feedback_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_system_analytics: {
        Row: {
          applicable_format:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform: Database["public"]["Enums"]["platform"] | null
          bucket_key: string
          confidence: number
          id: string
          sample_count: number
          signal_type: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at: string
          value_summary: Json
        }
        Insert: {
          applicable_format?:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform?: Database["public"]["Enums"]["platform"] | null
          bucket_key: string
          confidence?: number
          id?: string
          sample_count?: number
          signal_type: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at?: string
          value_summary?: Json
        }
        Update: {
          applicable_format?:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform?: Database["public"]["Enums"]["platform"] | null
          bucket_key?: string
          confidence?: number
          id?: string
          sample_count?: number
          signal_type?: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at?: string
          value_summary?: Json
        }
        Relationships: []
      }
      trend_signals: {
        Row: {
          created_at: string
          detected_at: string
          id: string
          linked_resource: Json | null
          project_id: string
          relevance_score: number
          source_category: string
          suggested_angle: string | null
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          detected_at?: string
          id?: string
          linked_resource?: Json | null
          project_id: string
          relevance_score?: number
          source_category: string
          suggested_angle?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          detected_at?: string
          id?: string
          linked_resource?: Json | null
          project_id?: string
          relevance_score?: number
          source_category?: string
          suggested_angle?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_signals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invitation_sent_at: string | null
          role: Database["public"]["Enums"]["workspace_member_role"]
          status: Database["public"]["Enums"]["workspace_member_status"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          role?: Database["public"]["Enums"]["workspace_member_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          role?: Database["public"]["Enums"]["workspace_member_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_scheduling_signals: {
        Row: {
          applicable_format:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform: Database["public"]["Enums"]["platform"] | null
          bucket_key: string
          confidence: number
          id: string
          signal_type: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at: string
          value_summary: Json
          workspace_id: string
        }
        Insert: {
          applicable_format?:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform?: Database["public"]["Enums"]["platform"] | null
          bucket_key: string
          confidence?: number
          id?: string
          signal_type: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at?: string
          value_summary?: Json
          workspace_id: string
        }
        Update: {
          applicable_format?:
            | Database["public"]["Enums"]["content_format"]
            | null
          applicable_platform?: Database["public"]["Enums"]["platform"] | null
          bucket_key?: string
          confidence?: number
          id?: string
          signal_type?: Database["public"]["Enums"]["scheduling_signal_type"]
          updated_at?: string
          value_summary?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_scheduling_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          feature_flags: Json | null
          id: string
          plan_tier: string
          seat_count: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          feature_flags?: Json | null
          id?: string
          plan_tier?: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          feature_flags?: Json | null
          id?: string
          plan_tier?: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          default_brand_settings: Json | null
          id: string
          locale: string
          logo_url: string | null
          name: string
          notification_preferences: Json | null
          owner_user_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_brand_settings?: Json | null
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          notification_preferences?: Json | null
          owner_user_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_brand_settings?: Json | null
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          notification_preferences?: Json | null
          owner_user_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_workspace_id: {
        Args: { p_project_id: string }
        Returns: string
      }
      is_workspace_editor: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_level: "info" | "warning" | "critical"
      alert_type:
        | "high_relevance_trend"
        | "publish_failure"
        | "report_ready"
        | "schedule_gap"
        | "performance_drop"
        | "metrics_sync_error"
      bundle_status: "assembling" | "parsing" | "parsed" | "failed"
      calendar_entry_status:
        | "scheduled"
        | "published"
        | "failed"
        | "rescheduled"
      content_format:
        | "post_image"
        | "reel"
        | "carousel"
        | "story"
        | "longread"
        | "thread"
        | "linkedin_post"
        | "ad_creative"
        | "text_only"
      content_workflow_status:
        | "draft"
        | "in_review"
        | "scheduled"
        | "published"
        | "publish_failed"
      draft_status: "draft" | "selected" | "rejected" | "archived"
      idea_source_type: "manual" | "trend" | "competitor" | "analytics"
      idea_status: "active" | "converted" | "archived"
      image_generation_state:
        | "pending"
        | "generating"
        | "ready"
        | "failed"
        | "outdated"
      ingestion_status:
        | "pending"
        | "processing"
        | "success"
        | "partial"
        | "failed"
      platform:
        | "instagram"
        | "telegram"
        | "twitter_x"
        | "linkedin"
        | "facebook"
        | "tiktok"
        | "youtube"
      project_status: "active" | "archived"
      publish_job_status:
        | "pending"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "retry_pending"
      scheduling_signal_type:
        | "timing_pattern"
        | "cadence_pattern"
        | "format_pattern"
        | "resource_bundle_pattern"
        | "workflow_pattern"
        | "performance_shape_pattern"
        | "calendar_health_pattern"
        | "reliability_pattern"
      source_type:
        | "url"
        | "text"
        | "screenshot"
        | "image"
        | "video"
        | "pdf"
        | "app_store_url"
        | "competitor_post"
        | "manual_note"
      workspace_member_role: "owner" | "editor" | "viewer"
      workspace_member_status: "active" | "pending" | "removed"
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
      alert_level: ["info", "warning", "critical"],
      alert_type: [
        "high_relevance_trend",
        "publish_failure",
        "report_ready",
        "schedule_gap",
        "performance_drop",
        "metrics_sync_error",
      ],
      bundle_status: ["assembling", "parsing", "parsed", "failed"],
      calendar_entry_status: [
        "scheduled",
        "published",
        "failed",
        "rescheduled",
      ],
      content_format: [
        "post_image",
        "reel",
        "carousel",
        "story",
        "longread",
        "thread",
        "linkedin_post",
        "ad_creative",
        "text_only",
      ],
      content_workflow_status: [
        "draft",
        "in_review",
        "scheduled",
        "published",
        "publish_failed",
      ],
      draft_status: ["draft", "selected", "rejected", "archived"],
      idea_source_type: ["manual", "trend", "competitor", "analytics"],
      idea_status: ["active", "converted", "archived"],
      image_generation_state: [
        "pending",
        "generating",
        "ready",
        "failed",
        "outdated",
      ],
      ingestion_status: [
        "pending",
        "processing",
        "success",
        "partial",
        "failed",
      ],
      platform: [
        "instagram",
        "telegram",
        "twitter_x",
        "linkedin",
        "facebook",
        "tiktok",
        "youtube",
      ],
      project_status: ["active", "archived"],
      publish_job_status: [
        "pending",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "retry_pending",
      ],
      scheduling_signal_type: [
        "timing_pattern",
        "cadence_pattern",
        "format_pattern",
        "resource_bundle_pattern",
        "workflow_pattern",
        "performance_shape_pattern",
        "calendar_health_pattern",
        "reliability_pattern",
      ],
      source_type: [
        "url",
        "text",
        "screenshot",
        "image",
        "video",
        "pdf",
        "app_store_url",
        "competitor_post",
        "manual_note",
      ],
      workspace_member_role: ["owner", "editor", "viewer"],
      workspace_member_status: ["active", "pending", "removed"],
    },
  },
} as const

// ============================================================
// CONVENIENCE ROW TYPES
// ============================================================

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMembership = Database['public']['Tables']['workspace_memberships']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectProfile = Database['public']['Tables']['project_profiles']['Row']
export type ProjectContextMemory = Database['public']['Tables']['project_context_memories']['Row']
export type ResourceBundle = Database['public']['Tables']['resource_bundles']['Row']
export type ResourceItem = Database['public']['Tables']['resource_items']['Row']
export type DraftSet = Database['public']['Tables']['draft_sets']['Row']
export type DraftVariant = Database['public']['Tables']['draft_variants']['Row']
export type ContentItem = Database['public']['Tables']['content_items']['Row']
export type ImageAsset = Database['public']['Tables']['image_assets']['Row']
export type Idea = Database['public']['Tables']['ideas']['Row']
export type CalendarEntry = Database['public']['Tables']['calendar_entries']['Row']
export type PublishJob = Database['public']['Tables']['publish_jobs']['Row']
export type MetricsSnapshot = Database['public']['Tables']['metrics_snapshots']['Row']
export type FewShotExample = Database['public']['Tables']['few_shot_examples']['Row']
export type ProjectAntiPattern = Database['public']['Tables']['project_anti_patterns']['Row']
export type TrendSignal = Database['public']['Tables']['trend_signals']['Row']
export type SharedSystemAnalytics = Database['public']['Tables']['shared_system_analytics']['Row']
export type WorkspaceSchedulingSignal = Database['public']['Tables']['workspace_scheduling_signals']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type WorkspaceSubscription = Database['public']['Tables']['workspace_subscriptions']['Row']
