/* ── Project ─────────────────────────────────────────── */

export type ProjectStatus = "draft" | "processing" | "done";

export interface Project {
    id: string;
    title: string;
    status: ProjectStatus;
    videoUrl: string | null;
    templateId: string | null;
    hookText: string;
    ctaText: string;
    accentColor: string;
    createdAt: string;
    updatedAt: string;
}

/* ── Transcript ──────────────────────────────────────── */

export interface TranscriptWord {
    word: string;
    start: number; // seconds
    end: number;   // seconds
}

/* ── Template ────────────────────────────────────────── */

export interface CaptionStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
    highlightColor: string;
    position: "bottom" | "center";
}

export interface HookConfig {
    durationSec: number;
    background: string;
    textColor: string;
    fontSize: number;
}

export interface CtaConfig {
    durationSec: number;
    background: string;
    textColor: string;
    fontSize: number;
    buttonText: string;
}

export interface ZoomConfig {
    scale: number;
    durationSec: number;
    easing: "ease-in-out" | "spring";
}

export interface TemplateConfig {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    accentColor: string;
    hook: HookConfig;
    caption: CaptionStyle;
    zoom: ZoomConfig;
    cta: CtaConfig;
}

/* ── Render Job ──────────────────────────────────────── */

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

export interface RenderJob {
    id: string;
    projectId: string;
    status: RenderStatus;
    progress: number; // 0-100
    outputUrl: string | null;
    createdAt: string;
}
