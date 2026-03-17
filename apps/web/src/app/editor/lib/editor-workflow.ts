import { v4 as uuidv4 } from "uuid";
import type {
    Asset,
    Clip,
    EffectClip,
    MediaClip,
    Project,
    TextClip,
    Track,
} from "@video-editor/timeline-schema";
import {
    createBlankProject,
    createDefaultTracks as createCanonicalDefaultTracks,
    ensureDefaultTracks as ensureCanonicalDefaultTracks,
} from "@video-editor/timeline-schema";

import type { TranscriptWord } from "@video-editor/shared";
import type {
    DbBrollClip,
    DbMusicTrack,
    DbSfxClip,
    DbVfxPreset,
} from "@video-editor/shared";

export type EditorWorkflowStep =
    | "source"
    | "captions"
    | "resources"
    | "timeline"
    | "render";

export type SourceMediaStatus = "empty" | "ready" | "loading" | "error";

export interface MediaMetadata {
    durationMs: number;
    width: number | null;
    height: number | null;
    hasAudio: boolean | "unknown";
}

export interface SourceSummary extends MediaMetadata {
    name: string;
    url: string;
    mimeType?: string;
}

export interface CaptionGroup {
    id: string;
    text: string;
    startAtMs: number;
    durationMs: number;
    words: TranscriptWord[];
}

export interface RenderSummary {
    status: "idle" | "queued" | "rendering" | "done" | "failed";
    jobId: string | null;
    outputUrl: string | null;
    message: string | null;
    progress: number;
}

export interface RecentRenderJob {
    id: string;
    projectId: string;
    status: Exclude<RenderSummary["status"], "idle">;
    progress: number;
    outputUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

type UploadAsset = Extract<Asset, { type: "video" | "audio" | "image" }>;
export type LibraryAssetKind = "vfx" | "sfx" | "broll" | "music";
export type LibraryAssetRow = DbVfxPreset | DbSfxClip | DbBrollClip | DbMusicTrack;

export const WORKFLOW_STEPS: Array<{
    id: EditorWorkflowStep;
    title: string;
    blurb: string;
}> = [
    {
        id: "source",
        title: "Source media",
        blurb: "Load the raw video and confirm the clip metadata.",
    },
    {
        id: "captions",
        title: "Transcript + captions",
        blurb: "Transcribe the source and turn words into editable captions.",
    },
    {
        id: "resources",
        title: "Resources",
        blurb: "Browse b-roll, music, SFX, and VFX, then drop them onto the timeline.",
    },
    {
        id: "timeline",
        title: "Timeline polish",
        blurb: "Trim, move, split, and fine-tune clip timing.",
    },
    {
        id: "render",
        title: "Render",
        blurb: "Save the project and queue the final export.",
    },
];

export const EDITOR_DEFAULTS = {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 15_000,
    backgroundColor: "#050505",
};

export function createIdleRenderSummary(): RenderSummary {
    return {
        status: "idle",
        jobId: null,
        outputUrl: null,
        message: null,
        progress: 0,
    };
}

export function normalizeRecentRenderJobs(jobs: RecentRenderJob[]): RecentRenderJob[] {
    return [...jobs].sort((left, right) => {
        const leftStamp = Date.parse(left.createdAt);
        const rightStamp = Date.parse(right.createdAt);
        return (Number.isFinite(rightStamp) ? rightStamp : 0) - (Number.isFinite(leftStamp) ? leftStamp : 0);
    });
}

export function mergeRecentRenderJobs(
    current: RecentRenderJob[],
    incoming: RecentRenderJob[]
): RecentRenderJob[] {
    const merged = new Map<string, RecentRenderJob>();

    for (const job of current) {
        merged.set(job.id, job);
    }

    for (const job of incoming) {
        merged.set(job.id, job);
    }

    return normalizeRecentRenderJobs([...merged.values()]);
}

export function getPreferredRenderJob(jobs: RecentRenderJob[]): RecentRenderJob | null {
    return (
        jobs.find((job) => job.status === "queued" || job.status === "rendering") ??
        jobs[0] ??
        null
    );
}

export function renderJobToSummary(job: RecentRenderJob | null): RenderSummary {
    if (!job) {
        return createIdleRenderSummary();
    }

    return {
        status: job.status,
        jobId: job.id,
        outputUrl: job.outputUrl,
        progress: Number(job.progress ?? 0),
        message:
            job.status === "done"
                ? "Render finished. Your final output is ready."
                : job.status === "failed"
                    ? job.errorMessage ?? "The render job failed."
                    : `Render ${job.status} at ${Number(job.progress ?? 0)}%`,
    };
}

export function createBlankEditorProject(projectId: string, name = "Untitled edit"): Project {
    return createBlankProject({
        id: projectId,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: { ...EDITOR_DEFAULTS },
        assets: {},
        tracks: createCanonicalDefaultTracks(),
    });
}

export function normalizeEditorProject(project: Project): Project {
    return ensureCanonicalDefaultTracks({
        ...project,
        assets: project.assets ?? {},
        tracks: project.tracks ?? [],
    });
}

export function createAssetFromUpload(params: {
    id?: string;
    name: string;
    type: "video" | "audio" | "image";
    url: string;
    durationMs: number;
    metadata?: Asset["metadata"];
}): UploadAsset {
    return {
        id: params.id ?? uuidv4(),
        type: params.type,
        url: params.url,
        name: params.name,
        durationMs: Math.max(0, Math.round(params.durationMs)),
        metadata: params.metadata,
    };
}

export function trackTypeForLibraryKind(kind: LibraryAssetKind): Track["type"] {
    if (kind === "vfx") return "effect";
    if (kind === "sfx" || kind === "music") return "audio";
    return "video_overlay";
}

export function createAssetFromLibraryRow(kind: LibraryAssetKind, row: LibraryAssetRow): Asset {
    if (kind === "vfx") {
        const preset = row as DbVfxPreset;
        const previewUrl = preset.preview_url ?? preset.thumbnail_url ?? undefined;
        return {
            id: preset.id,
            type: "effect",
            ...(previewUrl ? { url: previewUrl } : {}),
            name: preset.name,
            durationMs: 500,
            metadata: {
                libraryType: kind,
                sourceUrl: previewUrl,
                config: preset.config,
            },
        };
    }

    if (kind === "sfx") {
        const clip = row as DbSfxClip;
        return {
            id: clip.id,
            type: "audio",
            url: clip.file_url,
            name: clip.name,
            durationMs: clip.duration_ms,
            metadata: {
                libraryType: kind,
                sourceUrl: clip.file_url,
                config: { sfxType: clip.sfx_type },
            },
        };
    }

    if (kind === "music") {
        const track = row as DbMusicTrack;
        return {
            id: track.id,
            type: "audio",
            url: track.file_url,
            name: track.name,
            durationMs: track.duration_ms,
            metadata: {
                libraryType: kind,
                sourceUrl: track.file_url,
                config: {
                    bpm: track.bpm,
                    mood: track.mood,
                    genre: track.genre,
                    artist: track.artist,
                },
            },
        };
    }

    const broll = row as DbBrollClip;
    return {
        id: broll.id,
        type: "video",
        url: broll.file_url,
        name: broll.name,
        durationMs: broll.duration_ms,
        metadata: {
            libraryType: kind,
            sourceUrl: broll.file_url,
            config: {
                resolution: broll.resolution,
                aspectRatio: broll.aspect_ratio,
                keywords: broll.keywords,
            },
        },
    };
}

export function insertAssetIntoProject(params: {
    project: Project;
    asset: Asset;
    startAtMs: number;
    durationMs?: number;
    trackType?: Track["type"];
    trackName?: string;
    effectConfig?: Record<string, unknown>;
}) {
    const resourceType =
        (params.asset.metadata?.libraryType as LibraryAssetKind | undefined) ??
        (params.asset.type === "effect"
            ? "vfx"
            : params.asset.type === "audio"
              ? "music"
              : "broll");

    const nextProject = insertResourceClip(
        params.project,
        params.asset,
        resourceType,
        params.startAtMs,
        {
            durationMs: params.durationMs,
            config: params.effectConfig,
        },
    );
    const track =
        params.trackName && params.trackType
            ? nextProject.tracks.find(
                  (candidate) =>
                      candidate.type === params.trackType &&
                      candidate.name.toLowerCase() === params.trackName!.toLowerCase(),
              ) ?? null
            : nextProject.tracks.find(
                  (candidate) =>
                      candidate.type === trackTypeForLibraryKind(resourceType) &&
                      candidate.clips.some((clip) => "assetId" in clip && clip.assetId === params.asset.id),
              ) ?? null;
    const clip =
        track?.clips.find((candidate) => "assetId" in candidate && candidate.assetId === params.asset.id) ?? null;

    return {
        project: nextProject,
        trackId: track?.id ?? null,
        clip,
    };
}

export function getTrackByName(project: Project, type: Track["type"], name: string): Track | null {
    return project.tracks.find((track) => track.type === type && track.name === name) ?? null;
}

export function getMainVideoTrack(project: Project): Track {
    const track = getTrackByName(project, "video_main", "Main Video");
    if (track) return track;
    return project.tracks.find((t) => t.type === "video_main") ?? project.tracks[0];
}

export function getCaptionTrack(project: Project): Track {
    const track = getTrackByName(project, "text", "Captions");
    if (track) return track;
    return project.tracks.find((t) => t.type === "text") ?? project.tracks[0];
}

export function getTrackForResourceType(project: Project, assetType: "vfx" | "sfx" | "broll" | "music") {
    if (assetType === "broll") {
        return getTrackByName(project, "video_overlay", "B-roll") ?? project.tracks.find((t) => t.type === "video_overlay") ?? project.tracks[0];
    }
    if (assetType === "music") {
        return getTrackByName(project, "audio", "Music") ?? project.tracks.find((t) => t.type === "audio") ?? project.tracks[0];
    }
    if (assetType === "sfx") {
        return getTrackByName(project, "audio", "SFX") ?? project.tracks.find((t) => t.type === "audio") ?? project.tracks[0];
    }
    return getTrackByName(project, "effect", "Effects") ?? project.tracks.find((t) => t.type === "effect") ?? project.tracks[0];
}

export function resolveAssetUrl(project: Project, clip: Clip): string | null {
    if ("assetId" in clip) {
        const asset = project.assets[clip.assetId];
        if (asset?.url) return asset.url;
    }
    return null;
}

export function upsertAsset(project: Project, asset: Asset): Project {
    return {
        ...project,
        assets: {
            ...project.assets,
            [asset.id]: asset,
        },
        updatedAt: new Date().toISOString(),
    };
}

export function replaceMainSourceClip(
    project: Project,
    clip: MediaClip,
    asset: Asset
): Project {
    const next = ensureCanonicalDefaultTracks(upsertAsset(project, asset));
    const mainTrack = getMainVideoTrack(next);
    const nextTracks = next.tracks.map((track) => {
        if (track.id !== mainTrack.id) return track;
        return {
            ...track,
            clips: [clip],
        };
    });

    const nextDuration = Math.max(next.settings.durationMs, clip.durationMs);

    return {
        ...next,
        settings: {
            ...next.settings,
            durationMs: nextDuration,
        },
        tracks: nextTracks,
        updatedAt: new Date().toISOString(),
    };
}

export function insertResourceClip(
    project: Project,
    asset: Asset,
    resourceType: "vfx" | "sfx" | "broll" | "music",
    startAtMs: number,
    options?: { durationMs?: number; config?: Record<string, unknown> }
): Project {
    const next = ensureCanonicalDefaultTracks(upsertAsset(project, asset));
    const track = getTrackForResourceType(next, resourceType);
    const durationMs =
        options?.durationMs ??
        (resourceType === "broll" || resourceType === "music" ? asset.durationMs : Math.min(1500, asset.durationMs || 1500));

    const clip: Clip =
        resourceType === "vfx"
            ? ({
                  id: uuidv4(),
                  type: "effect",
                  assetId: asset.id,
                  startAtMs,
                  durationMs: Math.max(500, durationMs),
                  config: {
                      ...(asset.metadata?.config ?? {}),
                      ...(options?.config ?? {}),
                  },
              } satisfies EffectClip)
            : ({
                  id: uuidv4(),
                  type: resourceType === "broll" ? "video" : "audio",
                  assetId: asset.id,
                  startAtMs,
                  durationMs: Math.max(500, durationMs),
                  sourceStartMs: 0,
                  volume: resourceType === "music" ? 0.35 : resourceType === "sfx" ? 0.8 : 1,
                  transform: resourceType === "broll"
                      ? {
                            x: next.settings.width / 2,
                            y: next.settings.height / 2,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0,
                            anchorX: 0.5,
                            anchorY: 0.5,
                        }
                      : undefined,
              } as MediaClip);

    return {
        ...next,
        tracks: next.tracks.map((candidate) =>
            candidate.id === track.id
                ? {
                      ...candidate,
                      clips: [...candidate.clips, clip].sort(
                          (left, right) =>
                              left.startAtMs - right.startAtMs || left.id.localeCompare(right.id),
                      ),
                  }
                : candidate
        ),
        settings: {
            ...next.settings,
            durationMs: Math.max(next.settings.durationMs, startAtMs + durationMs),
        },
        updatedAt: new Date().toISOString(),
    };
}

export function buildCaptionGroups(words: TranscriptWord[]): CaptionGroup[] {
    const groups: CaptionGroup[] = [];
    let buffer: TranscriptWord[] = [];

    const flush = () => {
        if (!buffer.length) return;
        const first = buffer[0];
        const last = buffer[buffer.length - 1];
        groups.push({
            id: uuidv4(),
            text: buffer.map((word) => word.word).join(" "),
            startAtMs: Math.max(0, Math.round(first.start * 1000)),
            durationMs: Math.max(600, Math.round((last.end - first.start) * 1000)),
            words: [...buffer],
        });
        buffer = [];
    };

    for (const word of words) {
        if (!buffer.length) {
            buffer.push(word);
            continue;
        }

        const first = buffer[0];
        const last = buffer[buffer.length - 1];
        const gap = word.start - last.end;
        const duration = word.end - first.start;

        if (buffer.length >= 4 || gap > 0.45 || duration > 2.2) {
            flush();
        }

        buffer.push(word);
    }

    flush();
    return groups;
}

export function captionGroupsToClips(
    groups: CaptionGroup[],
    project: Project
): TextClip[] {
    return groups.map((group) => ({
        id: group.id,
        type: "text",
        startAtMs: group.startAtMs,
        durationMs: group.durationMs,
        content: group.text,
        transform: {
            x: project.settings.width / 2,
            y: Math.round(project.settings.height * 0.78),
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            anchorX: 0.5,
            anchorY: 0.5,
        },
        style: {
            fontFamily: "Inter",
            fontSize: 42,
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.45)",
            textAlign: "center",
            fontWeight: 700,
        },
    }));
}

export function appendClipsToTrack(project: Project, trackId: string, clips: Clip[]): Project {
    return {
        ...project,
        tracks: project.tracks.map((track) =>
            track.id === trackId
                ? {
                      ...track,
                      clips: [...track.clips, ...clips].sort(
                          (left, right) =>
                              left.startAtMs - right.startAtMs || left.id.localeCompare(right.id),
                      ),
                  }
                : track
        ),
        updatedAt: new Date().toISOString(),
    };
}

export function clearTrack(project: Project, trackId: string): Project {
    return {
        ...project,
        tracks: project.tracks.map((track) =>
            track.id === trackId ? { ...track, clips: [] } : track
        ),
        updatedAt: new Date().toISOString(),
    };
}

export function projectHasTrackClips(project: Project, type: Track["type"], name: string): boolean {
    return Boolean(getTrackByName(project, type, name)?.clips.length);
}

export function summarizeProject(project: Project) {
    const sourceAsset =
        Object.values(project.assets).find((asset) => asset.type === "video") ??
        Object.values(project.assets).find((asset) => asset.type === "image") ??
        null;

    const mainVideoTrack = project.tracks.find((track) => track.type === "video_main");
    const captionTrack = project.tracks.find((track) => track.type === "text");
    const audioClips = project.tracks.filter((track) => track.type === "audio").flatMap((track) => track.clips);
    const resourceClips = project.tracks
        .filter((track) => track.type === "video_overlay" || track.type === "effect" || track.type === "audio")
        .flatMap((track) => track.clips);

    return {
        sourceAsset,
        hasSourceClip: Boolean(mainVideoTrack?.clips.length),
        captions: captionTrack?.clips.length ?? 0,
        resources: resourceClips.length,
        audioClips: audioClips.length,
        durationMs: project.settings.durationMs,
    };
}
