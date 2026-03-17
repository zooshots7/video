/**
 * Supabase Database type definitions.
 *
 * These types mirror the database schema and provide
 * type safety for all Supabase queries.
 *
 * In production, generate automatically with:
 *   npx supabase gen types typescript --project-id <id> > database.types.ts
 */

export interface Database {
    public: {
        Tables: {
            templates: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    thumbnail_url: string | null;
                    accent_color: string;
                    hook_config: Record<string, unknown>;
                    caption_config: Record<string, unknown>;
                    zoom_config: Record<string, unknown>;
                    cta_config: Record<string, unknown>;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    thumbnail_url?: string | null;
                    accent_color?: string;
                    hook_config?: Record<string, unknown>;
                    caption_config?: Record<string, unknown>;
                    zoom_config?: Record<string, unknown>;
                    cta_config?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    thumbnail_url?: string | null;
                    accent_color?: string;
                    hook_config?: Record<string, unknown>;
                    caption_config?: Record<string, unknown>;
                    zoom_config?: Record<string, unknown>;
                    cta_config?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            video_templates: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    thumbnail_url: string | null;
                    preview_url: string | null;
                    template_id: string | null;
                    duration_sec: number;
                    composition: Record<string, unknown>;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    thumbnail_url?: string | null;
                    preview_url?: string | null;
                    template_id?: string | null;
                    duration_sec?: number;
                    composition?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    thumbnail_url?: string | null;
                    preview_url?: string | null;
                    template_id?: string | null;
                    duration_sec?: number;
                    composition?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            asset_categories: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    asset_type: "vfx" | "sfx" | "broll" | "music";
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    asset_type: "vfx" | "sfx" | "broll" | "music";
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    asset_type?: "vfx" | "sfx" | "broll" | "music";
                    sort_order?: number;
                };
            };
            vfx_presets: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    category_id: string | null;
                    thumbnail_url: string | null;
                    preview_url: string | null;
                    vfx_type: string;
                    config: Record<string, unknown>;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    category_id?: string | null;
                    thumbnail_url?: string | null;
                    preview_url?: string | null;
                    vfx_type: string;
                    config?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    category_id?: string | null;
                    thumbnail_url?: string | null;
                    preview_url?: string | null;
                    vfx_type?: string;
                    config?: Record<string, unknown>;
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            sfx_clips: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    category_id: string | null;
                    file_url: string;
                    duration_ms: number;
                    waveform_url: string | null;
                    sfx_type: string;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    category_id?: string | null;
                    file_url: string;
                    duration_ms: number;
                    waveform_url?: string | null;
                    sfx_type: string;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    category_id?: string | null;
                    file_url?: string;
                    duration_ms?: number;
                    waveform_url?: string | null;
                    sfx_type?: string;
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            broll_clips: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    category_id: string | null;
                    file_url: string;
                    thumbnail_url: string | null;
                    duration_ms: number;
                    resolution: string | null;
                    aspect_ratio: string | null;
                    keywords: string[];
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    category_id?: string | null;
                    file_url: string;
                    thumbnail_url?: string | null;
                    duration_ms: number;
                    resolution?: string | null;
                    aspect_ratio?: string | null;
                    keywords?: string[];
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    category_id?: string | null;
                    file_url?: string;
                    thumbnail_url?: string | null;
                    duration_ms?: number;
                    resolution?: string | null;
                    aspect_ratio?: string | null;
                    keywords?: string[];
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            music_tracks: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    artist: string | null;
                    description: string | null;
                    category_id: string | null;
                    file_url: string;
                    thumbnail_url: string | null;
                    duration_ms: number;
                    bpm: number | null;
                    mood: string | null;
                    genre: string | null;
                    waveform_url: string | null;
                    is_premium: boolean;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    artist?: string | null;
                    description?: string | null;
                    category_id?: string | null;
                    file_url: string;
                    thumbnail_url?: string | null;
                    duration_ms: number;
                    bpm?: number | null;
                    mood?: string | null;
                    genre?: string | null;
                    waveform_url?: string | null;
                    is_premium?: boolean;
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                    artist?: string | null;
                    description?: string | null;
                    category_id?: string | null;
                    file_url?: string;
                    thumbnail_url?: string | null;
                    duration_ms?: number;
                    bpm?: number | null;
                    mood?: string | null;
                    genre?: string | null;
                    waveform_url?: string | null;
                    is_premium?: boolean;
                    sort_order?: number;
                };
            };
            asset_tags: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                };
                Relationships: [];
                Update: {
                    slug?: string;
                    name?: string;
                };
            };
            asset_tag_map: {
                Row: {
                    id: string;
                    tag_id: string;
                    asset_type: string;
                    asset_id: string;
                };
                Insert: {
                    id?: string;
                    tag_id: string;
                    asset_type: string;
                    asset_id: string;
                };
                Relationships: [];
                Update: {
                    tag_id?: string;
                    asset_type?: string;
                    asset_id?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    title: string;
                    status: "draft" | "processing" | "done" | "failed";
                    video_url: string | null;
                    template_id: string | null;
                    video_template_id: string | null;
                    hook_text: string;
                    cta_text: string;
                    accent_color: string;
                    duration_sec: number | null;
                    metadata: Record<string, unknown>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    status?: "draft" | "processing" | "done" | "failed";
                    video_url?: string | null;
                    template_id?: string | null;
                    video_template_id?: string | null;
                    hook_text?: string;
                    cta_text?: string;
                    accent_color?: string;
                    duration_sec?: number | null;
                    metadata?: Record<string, unknown>;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
                Update: {
                    title?: string;
                    status?: "draft" | "processing" | "done" | "failed";
                    video_url?: string | null;
                    template_id?: string | null;
                    video_template_id?: string | null;
                    hook_text?: string;
                    cta_text?: string;
                    accent_color?: string;
                    duration_sec?: number | null;
                    metadata?: Record<string, unknown>;
                };
            };
            transcripts: {
                Row: {
                    id: string;
                    project_id: string;
                    full_text: string | null;
                    language: string;
                    source: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    full_text?: string | null;
                    language?: string;
                    source?: string;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "transcripts_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: true;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    }
                ];
                Update: {
                    project_id?: string;
                    full_text?: string | null;
                    language?: string;
                    source?: string;
                };
            };
            transcript_words: {
                Row: {
                    id: string;
                    transcript_id: string;
                    word: string;
                    start_sec: number;
                    end_sec: number;
                    confidence: number;
                    is_highlight: boolean;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    transcript_id: string;
                    word: string;
                    start_sec: number;
                    end_sec: number;
                    confidence?: number;
                    is_highlight?: boolean;
                    sort_order?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "transcript_words_transcript_id_fkey";
                        columns: ["transcript_id"];
                        isOneToOne: false;
                        referencedRelation: "transcripts";
                        referencedColumns: ["id"];
                    }
                ];
                Update: {
                    transcript_id?: string;
                    word?: string;
                    start_sec?: number;
                    end_sec?: number;
                    confidence?: number;
                    is_highlight?: boolean;
                    sort_order?: number;
                };
            };
            project_assets: {
                Row: {
                    id: string;
                    project_id: string;
                    asset_type: "vfx" | "sfx" | "broll" | "music";
                    asset_id: string;
                    start_sec: number | null;
                    end_sec: number | null;
                    config: Record<string, unknown>;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    asset_type: "vfx" | "sfx" | "broll" | "music";
                    asset_id: string;
                    start_sec?: number | null;
                    end_sec?: number | null;
                    config?: Record<string, unknown>;
                    sort_order?: number;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    project_id?: string;
                    asset_type?: "vfx" | "sfx" | "broll" | "music";
                    asset_id?: string;
                    start_sec?: number | null;
                    end_sec?: number | null;
                    config?: Record<string, unknown>;
                    sort_order?: number;
                };
            };
            render_jobs: {
                Row: {
                    id: string;
                    project_id: string;
                    status: "queued" | "rendering" | "done" | "failed";
                    progress: number;
                    output_url: string | null;
                    error_message: string | null;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    status?: "queued" | "rendering" | "done" | "failed";
                    progress?: number;
                    output_url?: string | null;
                    error_message?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                };
                Relationships: [];
                Update: {
                    project_id?: string;
                    status?: "queued" | "rendering" | "done" | "failed";
                    progress?: number;
                    output_url?: string | null;
                    error_message?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                };
            };
            project_timeline: {
                Row: {
                    project_id: string;
                    timeline_json: Record<string, unknown>;
                    updated_at: string;
                };
                Insert: {
                    project_id: string;
                    timeline_json: Record<string, unknown>;
                    updated_at?: string;
                };
                Relationships: [];
                Update: {
                    timeline_json?: Record<string, unknown>;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

/** Convenience row type aliases */
export type DbTemplate = Database["public"]["Tables"]["templates"]["Row"];
export type DbVideoTemplate = Database["public"]["Tables"]["video_templates"]["Row"];
export type DbVfxPreset = Database["public"]["Tables"]["vfx_presets"]["Row"];
export type DbSfxClip = Database["public"]["Tables"]["sfx_clips"]["Row"];
export type DbBrollClip = Database["public"]["Tables"]["broll_clips"]["Row"];
export type DbMusicTrack = Database["public"]["Tables"]["music_tracks"]["Row"];
export type DbProject = Database["public"]["Tables"]["projects"]["Row"];
export type DbTranscript = Database["public"]["Tables"]["transcripts"]["Row"];
export type DbTranscriptWord = Database["public"]["Tables"]["transcript_words"]["Row"];
export type DbRenderJob = Database["public"]["Tables"]["render_jobs"]["Row"];
export type DbProjectAsset = Database["public"]["Tables"]["project_assets"]["Row"];
export type DbProjectTimeline = Database["public"]["Tables"]["project_timeline"]["Row"];
export type DbAssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
export type DbAssetTag = Database["public"]["Tables"]["asset_tags"]["Row"];
