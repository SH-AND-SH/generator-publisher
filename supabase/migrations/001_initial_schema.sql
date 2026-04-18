-- ============================================================
-- Generator / Publisher — Full Database Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable required extensions

create extension if not exists "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================

create type workspace_member_role as enum ('owner', 'editor', 'viewer');
create type workspace_member_status as enum ('active', 'pending', 'removed');
create type project_status as enum ('active', 'archived');
create type source_type as enum ('url', 'text', 'screenshot', 'image', 'video', 'pdf', 'app_store_url', 'competitor_post', 'manual_note');
create type ingestion_status as enum ('pending', 'processing', 'success', 'partial', 'failed');
create type bundle_status as enum ('assembling', 'parsing', 'parsed', 'failed');
create type draft_status as enum ('draft', 'selected', 'rejected', 'archived');
create type content_workflow_status as enum ('draft', 'in_review', 'scheduled', 'published', 'publish_failed');
create type image_generation_state as enum ('pending', 'generating', 'ready', 'failed', 'outdated');
create type publish_job_status as enum ('pending', 'scheduled', 'publishing', 'published', 'failed', 'retry_pending');
create type platform as enum ('instagram', 'telegram', 'twitter_x', 'linkedin', 'facebook', 'tiktok', 'youtube');
create type content_format as enum ('post_image', 'reel', 'carousel', 'story', 'longread', 'thread', 'linkedin_post', 'ad_creative', 'text_only');
create type idea_source_type as enum ('manual', 'trend', 'competitor', 'analytics');
create type idea_status as enum ('active', 'converted', 'archived');
create type alert_level as enum ('info', 'warning', 'critical');
create type alert_type as enum ('high_relevance_trend', 'publish_failure', 'report_ready', 'schedule_gap', 'performance_drop', 'metrics_sync_error');
create type calendar_entry_status as enum ('scheduled', 'published', 'failed', 'rescheduled');
create type scheduling_signal_type as enum (
  'timing_pattern', 'cadence_pattern', 'format_pattern',
  'resource_bundle_pattern', 'workflow_pattern', 'performance_shape_pattern',
  'calendar_health_pattern', 'reliability_pattern'
);

-- ============================================================
-- WORKSPACES
-- ============================================================

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  logo_url text,
  default_brand_settings jsonb,
  notification_preferences jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_member_role not null default 'editor',
  status workspace_member_status not null default 'active',
  invitation_sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  audience_summary text not null default '',
  tone_summary text not null default '',
  status project_status not null default 'active',
  icon_url text,
  positioning_summary text,
  app_store_url text,
  landing_url text,
  visual_direction_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  audience text not null default '',
  positioning text not null default '',
  tone_of_voice text not null default '',
  active_platforms platform[] not null default '{}',
  competitor_list jsonb not null default '[]',
  messaging_rules text,
  banned_phrases text[],
  visual_guidelines text,
  product_links jsonb default '{}',
  updated_at timestamptz not null default now()
);

create table project_context_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  context_version integer not null default 1,
  summary_snapshot text,
  recent_learnings_summary text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESOURCE BUNDLES
-- ============================================================

create table resource_bundles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete set null,
  status bundle_status not null default 'assembling',
  merged_context_json jsonb,
  user_goal_note text,
  parse_confidence_bucket text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resource_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references resource_bundles(id) on delete cascade,
  source_type source_type not null,
  raw_reference text,
  ingestion_status ingestion_status not null default 'pending',
  uploaded_file_path text,
  extracted_text text,
  parse_metadata jsonb,
  competitor_flag boolean not null default false,
  trend_flag boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DRAFTS & CONTENT
-- ============================================================

create table draft_sets (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references resource_bundles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  target_platform platform not null,
  target_format content_format not null,
  generation_notes text,
  source_context_hash text,
  created_at timestamptz not null default now()
);

create table draft_variants (
  id uuid primary key default gen_random_uuid(),
  draft_set_id uuid not null references draft_sets(id) on delete cascade,
  text_body text not null,
  post_idea text not null,
  visual_idea text not null,
  image_prompt text not null,
  score_json jsonb,
  status draft_status not null default 'draft',
  hashtags text[],
  preview_hints jsonb,
  selected_at timestamptz,
  created_at timestamptz not null default now()
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_draft_variant_id uuid references draft_variants(id) on delete set null,
  title_or_label text not null,
  final_text text not null,
  final_post_idea text not null,
  final_image_prompt text not null,
  final_hashtags text[],
  workflow_status content_workflow_status not null default 'draft',
  approved_text_at timestamptz,
  approved_prompt_at timestamptz,
  cover_image_asset_id uuid,
  notes text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table image_assets (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  storage_path text not null,
  generation_state image_generation_state not null default 'pending',
  prompt_version text,
  width integer,
  height integer,
  thumbnail_path text,
  created_at timestamptz not null default now()
);

-- Add FK for cover_image after image_assets is created
alter table content_items
  add constraint content_items_cover_image_asset_id_fkey
  foreign key (cover_image_asset_id) references image_assets(id) on delete set null;

-- ============================================================
-- IDEAS
-- ============================================================

create table ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  source_type idea_source_type not null default 'manual',
  status idea_status not null default 'active',
  notes text,
  tags text[],
  linked_trend_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CALENDAR & PUBLISHING
-- ============================================================

create table calendar_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  target_platform platform not null,
  scheduled_for timestamptz not null,
  status calendar_entry_status not null default 'scheduled',
  recommendation_reason text,
  channel_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table publish_jobs (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  platform platform not null,
  status publish_job_status not null default 'pending',
  attempt_count integer not null default 0,
  external_post_id text,
  failure_reason text,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- METRICS
-- ============================================================

create table metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  platform platform not null,
  snapshot_date date not null,
  impressions bigint not null default 0,
  engagements bigint not null default 0,
  clicks bigint,
  saves bigint,
  shares bigint,
  comments bigint,
  reach bigint,
  raw_metrics_json jsonb,
  created_at timestamptz not null default now(),
  unique(content_item_id, platform, snapshot_date)
);

-- ============================================================
-- PROJECT INTELLIGENCE
-- ============================================================

create table few_shot_examples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  rank_score numeric not null default 0,
  active boolean not null default true,
  reason_summary text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_anti_patterns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  confidence numeric not null default 0,
  active boolean not null default true,
  explanation text,
  example_references uuid[],
  mitigation_advice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table trend_signals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  source_category text not null,
  relevance_score numeric not null default 0,
  summary text,
  suggested_angle text,
  linked_resource jsonb,
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Add FK for ideas linked_trend_id now that trend_signals exists
alter table ideas
  add constraint ideas_linked_trend_id_fkey
  foreign key (linked_trend_id) references trend_signals(id) on delete set null;

-- ============================================================
-- SHARED SYSTEM ANALYTICS (cross-workspace anonymized signals)
-- ============================================================

create table shared_system_analytics (
  id uuid primary key default gen_random_uuid(),
  signal_type scheduling_signal_type not null,
  bucket_key text not null,
  value_summary jsonb not null default '{}',
  sample_count integer not null default 0,
  confidence numeric not null default 0,
  applicable_platform platform,
  applicable_format content_format,
  updated_at timestamptz not null default now(),
  unique(signal_type, bucket_key, applicable_platform, applicable_format)
);

-- Workspace-level planning signals (derived from shared system analytics + local patterns)
create table workspace_scheduling_signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  signal_type scheduling_signal_type not null,
  bucket_key text not null,
  value_summary jsonb not null default '{}',
  confidence numeric not null default 0,
  applicable_platform platform,
  applicable_format content_format,
  updated_at timestamptz not null default now(),
  unique(workspace_id, signal_type, bucket_key)
);

-- ============================================================
-- ALERTS
-- ============================================================

create table alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  level alert_level not null default 'info',
  type alert_type not null,
  message text,
  action_url text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INTEGRATIONS
-- ============================================================

create table integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  credentials_encrypted jsonb,
  metadata jsonb default '{}',
  last_tested_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider)
);

-- ============================================================
-- BILLING SCAFFOLD (disabled in V1)
-- ============================================================

create table workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text not null default 'free',
  seat_count integer not null default 1,
  status text not null default 'inactive',
  feature_flags jsonb default '{}',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Workspace lookups
create index idx_workspace_memberships_user_id on workspace_memberships(user_id);
create index idx_workspace_memberships_workspace_id on workspace_memberships(workspace_id);

-- Project lookups
create index idx_projects_workspace_id on projects(workspace_id);
create index idx_projects_status on projects(status);

-- Resource bundles
create index idx_resource_bundles_project_id on resource_bundles(project_id);
create index idx_resource_items_bundle_id on resource_items(bundle_id);

-- Draft flow
create index idx_draft_sets_bundle_id on draft_sets(bundle_id);
create index idx_draft_sets_project_id on draft_sets(project_id);
create index idx_draft_variants_draft_set_id on draft_variants(draft_set_id);

-- Content items
create index idx_content_items_project_id on content_items(project_id);
create index idx_content_items_workflow_status on content_items(workflow_status);
create index idx_content_items_scheduled_at on content_items(scheduled_at);

-- Calendar
create index idx_calendar_entries_workspace_id on calendar_entries(workspace_id);
create index idx_calendar_entries_scheduled_for on calendar_entries(scheduled_for);
create index idx_calendar_entries_content_item_id on calendar_entries(content_item_id);

-- Metrics
create index idx_metrics_snapshots_content_item_id on metrics_snapshots(content_item_id);
create index idx_metrics_snapshots_snapshot_date on metrics_snapshots(snapshot_date);

-- Publish jobs
create index idx_publish_jobs_content_item_id on publish_jobs(content_item_id);
create index idx_publish_jobs_status on publish_jobs(status);

-- Intelligence
create index idx_few_shot_examples_project_id on few_shot_examples(project_id);
create index idx_few_shot_examples_active on few_shot_examples(project_id, active);
create index idx_project_anti_patterns_project_id on project_anti_patterns(project_id);
create index idx_trend_signals_project_id on trend_signals(project_id);
create index idx_trend_signals_relevance on trend_signals(project_id, relevance_score desc);

-- Shared analytics
create index idx_shared_system_analytics_signal_type on shared_system_analytics(signal_type, bucket_key);
create index idx_workspace_scheduling_signals_workspace on workspace_scheduling_signals(workspace_id);

-- Alerts
create index idx_alerts_workspace_id on alerts(workspace_id);
create index idx_alerts_resolved on alerts(workspace_id, resolved_at) where resolved_at is null;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at_column();

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

create trigger trg_project_profiles_updated_at
  before update on project_profiles
  for each row execute function update_updated_at_column();

create trigger trg_resource_bundles_updated_at
  before update on resource_bundles
  for each row execute function update_updated_at_column();

create trigger trg_content_items_updated_at
  before update on content_items
  for each row execute function update_updated_at_column();

create trigger trg_calendar_entries_updated_at
  before update on calendar_entries
  for each row execute function update_updated_at_column();

create trigger trg_publish_jobs_updated_at
  before update on publish_jobs
  for each row execute function update_updated_at_column();

create trigger trg_integrations_updated_at
  before update on integrations
  for each row execute function update_updated_at_column();

create trigger trg_workspace_subscriptions_updated_at
  before update on workspace_subscriptions
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table workspaces enable row level security;
alter table workspace_memberships enable row level security;
alter table projects enable row level security;
alter table project_profiles enable row level security;
alter table project_context_memories enable row level security;
alter table resource_bundles enable row level security;
alter table resource_items enable row level security;
alter table draft_sets enable row level security;
alter table draft_variants enable row level security;
alter table content_items enable row level security;
alter table image_assets enable row level security;
alter table ideas enable row level security;
alter table calendar_entries enable row level security;
alter table publish_jobs enable row level security;
alter table metrics_snapshots enable row level security;
alter table few_shot_examples enable row level security;
alter table project_anti_patterns enable row level security;
alter table trend_signals enable row level security;
alter table workspace_scheduling_signals enable row level security;
alter table shared_system_analytics enable row level security;
alter table alerts enable row level security;
alter table integrations enable row level security;
alter table workspace_subscriptions enable row level security;

-- Helper: check if current user is member of a workspace
create or replace function is_workspace_member(p_workspace_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from workspace_memberships
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

-- Helper: check if current user has editor or owner role
create or replace function is_workspace_editor(p_workspace_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from workspace_memberships
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'editor')
  );
$$;

-- Helper: get workspace_id for a project
create or replace function get_project_workspace_id(p_project_id uuid)
returns uuid language sql security definer as $$
  select workspace_id from projects where id = p_project_id;
$$;

-- ---- workspaces ----
create policy "workspace_select" on workspaces
  for select using (is_workspace_member(id));

create policy "workspace_insert" on workspaces
  for insert with check (auth.uid() = owner_user_id);

create policy "workspace_update" on workspaces
  for update using (
    exists (
      select 1 from workspace_memberships
      where workspace_id = id and user_id = auth.uid() and role = 'owner' and status = 'active'
    )
  );

-- ---- workspace_memberships ----
create policy "membership_select" on workspace_memberships
  for select using (is_workspace_member(workspace_id));

create policy "membership_insert" on workspace_memberships
  for insert with check (
    exists (
      select 1 from workspace_memberships
      where workspace_id = workspace_memberships.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
        and status = 'active'
    )
    or auth.uid() = user_id -- allow self-join via invite
  );

create policy "membership_update" on workspace_memberships
  for update using (is_workspace_editor(workspace_id));

-- ---- projects ----
create policy "project_select" on projects
  for select using (is_workspace_member(workspace_id));

create policy "project_insert" on projects
  for insert with check (is_workspace_editor(workspace_id));

create policy "project_update" on projects
  for update using (is_workspace_editor(workspace_id));

-- ---- project_profiles ----
create policy "project_profile_select" on project_profiles
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "project_profile_insert" on project_profiles
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

create policy "project_profile_update" on project_profiles
  for update using (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- project_context_memories ----
create policy "project_context_memory_select" on project_context_memories
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "project_context_memory_update" on project_context_memories
  for update using (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- resource_bundles ----
create policy "bundle_select" on resource_bundles
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "bundle_insert" on resource_bundles
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

create policy "bundle_update" on resource_bundles
  for update using (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- resource_items ----
create policy "resource_item_select" on resource_items
  for select using (
    is_workspace_member(get_project_workspace_id(
      (select project_id from resource_bundles where id = bundle_id)
    ))
  );

create policy "resource_item_insert" on resource_items
  for insert with check (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from resource_bundles where id = bundle_id)
    ))
  );

-- ---- draft_sets ----
create policy "draft_set_select" on draft_sets
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "draft_set_insert" on draft_sets
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- draft_variants ----
create policy "draft_variant_select" on draft_variants
  for select using (
    is_workspace_member(get_project_workspace_id(
      (select project_id from draft_sets where id = draft_set_id)
    ))
  );

create policy "draft_variant_insert" on draft_variants
  for insert with check (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from draft_sets where id = draft_set_id)
    ))
  );

create policy "draft_variant_update" on draft_variants
  for update using (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from draft_sets where id = draft_set_id)
    ))
  );

-- ---- content_items ----
create policy "content_item_select" on content_items
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "content_item_insert" on content_items
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

create policy "content_item_update" on content_items
  for update using (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- image_assets ----
create policy "image_asset_select" on image_assets
  for select using (
    is_workspace_member(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

create policy "image_asset_insert" on image_assets
  for insert with check (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

-- ---- ideas ----
create policy "idea_select" on ideas
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "idea_insert" on ideas
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

create policy "idea_update" on ideas
  for update using (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- calendar_entries ----
create policy "calendar_entry_select" on calendar_entries
  for select using (is_workspace_member(workspace_id));

create policy "calendar_entry_insert" on calendar_entries
  for insert with check (is_workspace_editor(workspace_id));

create policy "calendar_entry_update" on calendar_entries
  for update using (is_workspace_editor(workspace_id));

-- ---- publish_jobs ----
create policy "publish_job_select" on publish_jobs
  for select using (
    is_workspace_member(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

create policy "publish_job_insert" on publish_jobs
  for insert with check (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

create policy "publish_job_update" on publish_jobs
  for update using (
    is_workspace_editor(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

-- ---- metrics_snapshots ----
create policy "metrics_snapshot_select" on metrics_snapshots
  for select using (
    is_workspace_member(get_project_workspace_id(
      (select project_id from content_items where id = content_item_id)
    ))
  );

-- metrics inserted by service role (background jobs)

-- ---- few_shot_examples ----
create policy "few_shot_select" on few_shot_examples
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

-- ---- project_anti_patterns ----
create policy "anti_pattern_select" on project_anti_patterns
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

-- ---- trend_signals ----
create policy "trend_signal_select" on trend_signals
  for select using (is_workspace_member(get_project_workspace_id(project_id)));

create policy "trend_signal_insert" on trend_signals
  for insert with check (is_workspace_editor(get_project_workspace_id(project_id)));

-- ---- workspace_scheduling_signals ----
create policy "ws_scheduling_signal_select" on workspace_scheduling_signals
  for select using (is_workspace_member(workspace_id));

-- ---- shared_system_analytics ----
-- readable by all authenticated users (anonymized data)
create policy "shared_analytics_select" on shared_system_analytics
  for select using (auth.uid() is not null);

-- ---- alerts ----
create policy "alert_select" on alerts
  for select using (is_workspace_member(workspace_id));

-- ---- integrations ----
create policy "integration_select" on integrations
  for select using (is_workspace_member(workspace_id));

create policy "integration_insert" on integrations
  for insert with check (is_workspace_editor(workspace_id));

create policy "integration_update" on integrations
  for update using (is_workspace_editor(workspace_id));

-- ---- workspace_subscriptions ----
create policy "subscription_select" on workspace_subscriptions
  for select using (is_workspace_member(workspace_id));

-- ============================================================
-- AUTO-INIT TRIGGERS
-- Create project_profile and project_context_memory on project create
-- ============================================================

create or replace function init_project_context()
returns trigger language plpgsql security definer as $$
begin
  insert into project_profiles (project_id)
    values (new.id);
  insert into project_context_memories (project_id)
    values (new.id);
  return new;
end;
$$;

create trigger trg_init_project_context
  after insert on projects
  for each row execute function init_project_context();

-- Auto-add owner to workspace memberships
create or replace function add_workspace_owner()
returns trigger language plpgsql security definer as $$
begin
  insert into workspace_memberships (workspace_id, user_id, role, status)
    values (new.id, new.owner_user_id, 'owner', 'active');
  return new;
end;
$$;

create trigger trg_add_workspace_owner
  after insert on workspaces
  for each row execute function add_workspace_owner();
