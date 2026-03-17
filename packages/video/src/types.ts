import type { EditorProject } from "@video-editor/timeline-schema";
import type { TemplateConfig, TranscriptWord } from "@video-editor/shared";

export type EditorProjectCompositionProps = {
    project: EditorProject;
};

/**
 * Legacy prop bag retained for compatibility with older adapter code.
 * The canonical composition now receives `{ project }` only.
 */
export interface VideoCompositionProps {
    sourceVideoUrl: string;
    transcriptWords: TranscriptWord[];
    templateConfig: TemplateConfig;
    hookText: string;
    ctaText: string;
    zoomTimestamps: number[];
    durationInFrames: number;
    fps: number;
    projectAssets?: ProjectAssetInput[];
}

export interface ProjectAssetInput {
    assetType: "vfx" | "sfx" | "broll" | "music";
    fileUrl?: string;
    name: string;
    config?: Record<string, unknown>;
    startSec?: number;
    endSec?: number;
    durationMs?: number;
}
