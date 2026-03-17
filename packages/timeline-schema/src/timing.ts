import type { Clip, Project, Track } from "./index";

const TRACK_RENDER_PRIORITY: Record<Track["type"], number> = {
    video_main: 0,
    video_overlay: 1,
    effect: 2,
    text: 3,
    audio: 4,
};

export function framesFromMs(durationMs: number, fps: number): number {
    return Math.round((durationMs / 1000) * fps);
}

export function msFromFrames(frames: number, fps: number): number {
    return (frames / fps) * 1000;
}

export function getClipEndMs(clip: Pick<Clip, "startAtMs" | "durationMs">): number {
    return clip.startAtMs + clip.durationMs;
}

export function getTrackDurationMs(track: Track): number {
    return track.clips.reduce((maxEndMs, clip) => {
        return Math.max(maxEndMs, getClipEndMs(clip));
    }, 0);
}

export function getProjectDurationMs(project: Project): number {
    const trackDurationMs = project.tracks.reduce((maxEndMs, track) => {
        return Math.max(maxEndMs, getTrackDurationMs(track));
    }, 0);

    return Math.max(project.settings.durationMs, trackDurationMs);
}

export function getProjectDurationInFrames(project: Project): number {
    return framesFromMs(getProjectDurationMs(project), project.settings.fps);
}

export function getTrackRenderPriority(track: Pick<Track, "type" | "name">): number {
    const basePriority = TRACK_RENDER_PRIORITY[track.type] ?? 999;
    const overlayPriority =
        track.type === "audio" && track.name.toLowerCase().includes("sfx") ? 1 : 0;

    return basePriority + overlayPriority;
}
