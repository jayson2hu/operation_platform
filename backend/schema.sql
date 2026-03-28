create extension if not exists "pgcrypto";

create type team_role as enum ('admin', 'editor', 'viewer');
create type channel_type as enum ('wechat_oa', 'xiaohongshu', 'douyin');
create type auth_status as enum ('connected', 'expired', 'revoked', 'pending');
create type publish_mode as enum ('api', 'manual_assisted', 'hybrid');
create type content_status as enum ('draft', 'ready', 'scheduled', 'published', 'archived');
create type validation_status as enum ('valid', 'warning', 'blocked');
create type publish_task_type as enum ('publish_now', 'scheduled_publish', 'analytics_sync');
create type publish_task_status as enum ('pending', 'processing', 'succeeded', 'failed', 'manual_action_required', 'cancelled');
create type media_role as enum ('source', 'reference', 'hero', 'cover', 'body', 'gallery');

create table teams (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  password_hash varchar(255),
  auth_provider varchar(32) not null default 'local',
  display_name varchar(120) not null,
  status varchar(32) not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role team_role not null,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_members_team_role on team_members(team_id, role);

create table channel_accounts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  channel_type channel_type not null,
  display_name varchar(120) not null,
  external_account_id varchar(255),
  auth_status auth_status not null default 'pending',
  publish_mode publish_mode not null,
  capability_flags jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_type, external_account_id)
);

create index idx_channel_accounts_team_channel on channel_accounts(team_id, channel_type);

create table channel_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope varchar(255),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_channel_auth_tokens_account on channel_auth_tokens(channel_account_id);
create index idx_channel_auth_tokens_expires_at on channel_auth_tokens(expires_at);

create table contents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  status content_status not null default 'draft',
  objective varchar(120),
  audience varchar(120),
  campaign_name varchar(120),
  source_title varchar(255) not null,
  source_summary text,
  source_cta text,
  keyword_set jsonb not null default '[]'::jsonb,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contents_team_status on contents(team_id, status);
create index idx_contents_team_created_at on contents(team_id, created_at desc);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  version_no integer not null,
  source_payload jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (content_id, version_no)
);

create index idx_content_versions_content_created_at on content_versions(content_id, created_at desc);

create table media (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  storage_key varchar(500) not null,
  mime_type varchar(120) not null,
  width integer,
  height integer,
  size_bytes bigint,
  checksum varchar(128),
  alt_text varchar(255),
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create unique index idx_media_checksum_unique on media(checksum) where checksum is not null;
create index idx_media_team_created_at on media(team_id, created_at desc);

create table media_variants (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references media(id) on delete cascade,
  variant_type varchar(64) not null,
  storage_key varchar(500) not null,
  width integer,
  height integer,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  unique (media_id, variant_type)
);

create table content_media_rel (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  role media_role not null,
  sort_order integer not null default 0
);

create index idx_content_media_rel_content on content_media_rel(content_id, sort_order);

create table content_channel_adaptations (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  channel_account_id uuid references channel_accounts(id) on delete set null,
  channel_type channel_type not null,
  title varchar(255),
  body text,
  structured_payload jsonb not null default '{}'::jsonb,
  validation_status validation_status not null default 'warning',
  validation_errors jsonb not null default '[]'::jsonb,
  publish_readiness varchar(32) not null default 'draft',
  last_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, channel_type, channel_account_id)
);

create index idx_adaptations_channel_validation on content_channel_adaptations(channel_type, validation_status);
create index idx_adaptations_content on content_channel_adaptations(content_id);

create table adaptation_media_rel (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references content_channel_adaptations(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  role media_role not null,
  sort_order integer not null default 0
);

create index idx_adaptation_media_rel_adaptation on adaptation_media_rel(adaptation_id, sort_order);

create table publish_tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  content_id uuid not null references contents(id) on delete cascade,
  adaptation_id uuid not null references content_channel_adaptations(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  task_type publish_task_type not null,
  scheduled_at timestamptz,
  status publish_task_status not null default 'pending',
  retry_count integer not null default 0,
  last_error text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_publish_tasks_status_scheduled on publish_tasks(status, scheduled_at);
create index idx_publish_tasks_channel_status on publish_tasks(channel_account_id, status);

create table publish_logs (
  id uuid primary key default gen_random_uuid(),
  publish_task_id uuid not null references publish_tasks(id) on delete cascade,
  attempt_no integer not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  external_post_id varchar(255),
  status varchar(32) not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_publish_logs_task_attempt on publish_logs(publish_task_id, attempt_no);
create index idx_publish_logs_external_post_id on publish_logs(external_post_id);

create table platform_posts (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  adaptation_id uuid not null references content_channel_adaptations(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  channel_type channel_type not null,
  external_post_id varchar(255),
  post_url varchar(1000),
  published_at timestamptz,
  status varchar(32) not null default 'published',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_account_id, external_post_id)
);

create index idx_platform_posts_channel_published_at on platform_posts(channel_type, published_at desc);

create table analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  platform_post_id uuid not null references platform_posts(id) on delete cascade,
  snapshot_at timestamptz not null,
  impressions integer,
  reads integer,
  views integer,
  likes integer,
  favorites integer,
  comments integer,
  shares integer,
  followers_delta integer,
  raw_payload jsonb not null default '{}'::jsonb,
  unique (platform_post_id, snapshot_at)
);

create index idx_analytics_snapshots_snapshot_at on analytics_snapshots(snapshot_at desc);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  actor_user_id uuid references users(id),
  entity_type varchar(64) not null,
  entity_id uuid,
  action varchar(64) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_events_team_created_at on audit_events(team_id, created_at desc);
create index idx_audit_events_entity on audit_events(entity_type, entity_id);
