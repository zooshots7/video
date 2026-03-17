import type { DbTemplate, DbTranscriptWord } from "@video-editor/shared";
import type {
    CaptionStyle,
    CtaConfig,
    HookConfig,
    TemplateConfig,
    TranscriptWord,
    ZoomConfig,
} from "@video-editor/shared";
import type { ProjectAssetInput, VideoCompositionProps } from "@video-editor/video";
import { TEMPLATES } from "@video-editor/shared";
import { framesFromMs } from "@video-editor/timeline-schema";

export function mapDbTranscriptWords(
    rows: Pick<DbTranscriptWord, "word" | "start_sec" | "end_sec" | "sort_order">[]
): TranscriptWord[] {
    return [...rows]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => ({
            word: row.word,
            start: row.start_sec,
            end: row.end_sec,
        }));
}

export function mapDbTemplateToTemplateConfig(
    template: DbTemplate | null | undefined
): TemplateConfig {
    if (!template) {
        return TEMPLATES[0];
    }

    return {
        id: template.slug,
        name: template.name,
        description: template.description ?? "",
        accentColor: template.accent_color,
        hook: template.hook_config as unknown as HookConfig,
        caption: template.caption_config as unknown as CaptionStyle,
        zoom: template.zoom_config as unknown as ZoomConfig,
        cta: template.cta_config as unknown as CtaConfig,
    };
}

export function deriveRenderDurationSeconds({
    projectDurationSec,
    transcriptWords,
    fallbackPaddingSec = 2,
    minimumDurationSec = 1,
}: {
    projectDurationSec: number | null | undefined;
    transcriptWords: TranscriptWord[];
    fallbackPaddingSec?: number;
    minimumDurationSec?: number;
}): number {
    const transcriptEndSec = transcriptWords.reduce(
        (max, word) => Math.max(max, word.end),
        0
    );

    const derivedDuration = Math.max(
        projectDurationSec ?? 0,
        transcriptEndSec + fallbackPaddingSec,
        minimumDurationSec
    );

    return Math.max(minimumDurationSec, Math.ceil(derivedDuration));
}

export function buildVideoCompositionProps({
    sourceVideoUrl,
    transcriptWords,
    templateConfig,
    hookText,
    ctaText,
    zoomTimestamps,
    projectAssets = [],
    projectDurationSec,
    fps = 30,
}: {
    sourceVideoUrl: string;
    transcriptWords: TranscriptWord[];
    templateConfig: TemplateConfig;
    hookText: string;
    ctaText: string;
    zoomTimestamps: number[];
    projectAssets?: ProjectAssetInput[];
    projectDurationSec?: number | null;
    fps?: number;
}): VideoCompositionProps {
    const durationSec = deriveRenderDurationSeconds({
        projectDurationSec,
        transcriptWords,
    });

    return {
        sourceVideoUrl,
        transcriptWords,
        templateConfig,
        hookText,
        ctaText,
        zoomTimestamps,
        durationInFrames: framesFromMs(durationSec * 1000, fps),
        fps,
        projectAssets,
    };
}
