import type { TranscriptWord, TemplateConfig } from "@video-editor/shared";

export interface VideoCompositionProps {
    sourceVideoUrl: string;
    transcriptWords: TranscriptWord[];
    templateConfig: TemplateConfig;
    hookText: string;
    ctaText: string;
    zoomTimestamps: number[];
    durationInFrames: number;
    fps: number;
}
