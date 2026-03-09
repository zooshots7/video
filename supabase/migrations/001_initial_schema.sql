-- ============================================================
-- Video Editor — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Extensions

-- ============================================================
-- 1. TEMPLATES  (editing style presets)
-- ============================================================
create table public.templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  thumbnail_url text,
  accent_color  text not null default '#6366F1',
  hook_config   jsonb not null default '{}',
  caption_config jsonb not null default '{}',
  zoom_config   jsonb not null default '{}',
  cta_config    jsonb not null default '{}',
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. VIDEO TEMPLATES  (pre-made composition blueprints)
-- ============================================================
create table public.video_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  thumbnail_url text,
  preview_url   text,
  template_id   uuid references public.templates(id),
  duration_sec  int not null default 30,
  composition   jsonb not null default '{}',
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 3. ASSET CATEGORIES
-- ============================================================
create table public.asset_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  asset_type    text not null check (asset_type in ('vfx','sfx','broll','music')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 4. VFX PRESETS
-- ============================================================
create table public.vfx_presets (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  category_id   uuid references public.asset_categories(id),
  thumbnail_url text,
  preview_url   text,
  vfx_type      text not null check (vfx_type in (
                  'overlay','transition','filter','zoom','lower_third',
                  'text_effect','particle','frame'
                )),
  config        jsonb not null default '{}',
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 5. SFX CLIPS
-- ============================================================
create table public.sfx_clips (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  category_id   uuid references public.asset_categories(id),
  file_url      text not null,
  duration_ms   int not null,
  waveform_url  text,
  sfx_type      text not null check (sfx_type in (
                  'whoosh','pop','ding','click','transition',
                  'impact','rise','ambient','notification'
                )),
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 6. B-ROLL CLIPS
-- ============================================================
create table public.broll_clips (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  category_id   uuid references public.asset_categories(id),
  file_url      text not null,
  thumbnail_url text,
  duration_ms   int not null,
  resolution    text default '1080x1920',
  aspect_ratio  text default '9:16',
  keywords      text[] default '{}',
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 7. MUSIC TRACKS
-- ============================================================
create table public.music_tracks (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  artist        text,
  description   text,
  category_id   uuid references public.asset_categories(id),
  file_url      text not null,
  thumbnail_url text,
  duration_ms   int not null,
  bpm           int,
  mood          text check (mood in (
                  'energetic','chill','dramatic','upbeat',
                  'inspiring','dark','playful','corporate'
                )),
  genre         text,
  waveform_url  text,
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 8. ASSET TAGS
-- ============================================================
create table public.asset_tags (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null
);

create table public.asset_tag_map (
  id            uuid primary key default gen_random_uuid(),
  tag_id        uuid not null references public.asset_tags(id) on delete cascade,
  asset_type    text not null check (asset_type in ('vfx','sfx','broll','music','template','video_template')),
  asset_id      uuid not null,
  unique (tag_id, asset_type, asset_id)
);

create index idx_tag_map_asset on public.asset_tag_map(asset_type, asset_id);

-- ============================================================
-- 9. PROJECTS
-- ============================================================
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  status         text not null default 'draft' check (status in ('draft','processing','done','failed')),
  video_url      text,
  template_id    uuid references public.templates(id),
  video_template_id uuid references public.video_templates(id),
  hook_text      text not null default '',
  cta_text       text not null default '',
  accent_color   text not null default '#6366F1',
  duration_sec   numeric,
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 10. TRANSCRIPTS & WORDS
-- ============================================================
create table public.transcripts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid unique not null references public.projects(id) on delete cascade,
  full_text     text,
  language      text not null default 'en',
  source        text default 'manual' check (source in ('manual','whisper','deepgram','assembly')),
  created_at    timestamptz not null default now()
);

create table public.transcript_words (
  id            uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  word          text not null,
  start_sec     numeric not null,
  end_sec       numeric not null,
  confidence    numeric default 1.0,
  is_highlight  boolean not null default false,
  sort_order    int not null default 0
);

create index idx_tw_transcript on public.transcript_words(transcript_id, sort_order);

-- ============================================================
-- 11. PROJECT ASSETS
-- ============================================================
create table public.project_assets (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  asset_type    text not null check (asset_type in ('vfx','sfx','broll','music')),
  asset_id      uuid not null,
  start_sec     numeric,
  end_sec       numeric,
  config        jsonb not null default '{}',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_pa_project on public.project_assets(project_id);

-- ============================================================
-- 12. RENDER JOBS
-- ============================================================
create table public.render_jobs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  status        text not null default 'queued' check (status in ('queued','rendering','done','failed')),
  progress      int not null default 0 check (progress between 0 and 100),
  output_url    text,
  error_message text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_rj_project on public.render_jobs(project_id);

-- ============================================================
-- 13. UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger trg_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

create trigger trg_video_templates_updated_at
  before update on public.video_templates
  for each row execute function public.set_updated_at();

-- ============================================================
-- 14. ROW LEVEL SECURITY  (permissive for MVP)
-- ============================================================
alter table public.projects enable row level security;
create policy "Allow all for now" on public.projects for all using (true) with check (true);

alter table public.templates enable row level security;
create policy "Public read" on public.templates for select using (true);

alter table public.video_templates enable row level security;
create policy "Public read" on public.video_templates for select using (true);

alter table public.vfx_presets enable row level security;
create policy "Public read" on public.vfx_presets for select using (true);

alter table public.sfx_clips enable row level security;
create policy "Public read" on public.sfx_clips for select using (true);

alter table public.broll_clips enable row level security;
create policy "Public read" on public.broll_clips for select using (true);

alter table public.music_tracks enable row level security;
create policy "Public read" on public.music_tracks for select using (true);

alter table public.transcripts enable row level security;
create policy "Allow all for now" on public.transcripts for all using (true) with check (true);

alter table public.transcript_words enable row level security;
create policy "Allow all for now" on public.transcript_words for all using (true) with check (true);

alter table public.render_jobs enable row level security;
create policy "Allow all for now" on public.render_jobs for all using (true) with check (true);

alter table public.project_assets enable row level security;
create policy "Allow all for now" on public.project_assets for all using (true) with check (true);

alter table public.asset_tags enable row level security;
create policy "Public read" on public.asset_tags for select using (true);

alter table public.asset_tag_map enable row level security;
create policy "Public read" on public.asset_tag_map for select using (true);

alter table public.asset_categories enable row level security;
create policy "Public read" on public.asset_categories for select using (true);
