export type DashboardProjectStatus = "draft" | "processing" | "done" | "failed";

export interface DashboardProject {
  id: string;
  title: string;
  status: DashboardProjectStatus;
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
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

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

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

export interface RenderJob {
  id: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  outputUrl: string | null;
  createdAt: string;
}
