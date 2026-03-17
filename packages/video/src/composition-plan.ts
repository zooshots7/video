import type { CSSProperties } from "react";
import { interpolate, spring } from "remotion";
import {
    ensureDefaultTracks,
    framesFromMs,
    getClipAssetUrl,
    resolveClipAsset,
    sortTracksForRender,
    type EditorProject,
    type EffectClip,
    type MediaClip,
    type TextClip,
} from "@video-editor/timeline-schema";

export type EffectConfig = Record<string, unknown> & {
    kind?: string;
    type?: string;
    scale?: number;
    zoomScale?: number;
    durationSec?: number;
    easing?: "spring" | "ease-in-out";
    background?: string;
    color?: string;
    opacity?: number;
    intensity?: number;
    buttonText?: string;
    title?: string;
    subtitle?: string;
};

const FX_EPSILON = 0.0001;

export type CompositionPlanItem =
    | {
          kind: "video" | "image";
          id: string;
          trackType: EditorProject["tracks"][number]["type"];
          trackName: string;
          from: number;
          durationInFrames: number;
          src: string | null;
          startFrom: number;
          volume: number;
          style: CSSProperties;
      }
    | {
          kind: "audio";
          id: string;
          trackType: "audio";
          trackName: string;
          from: number;
          durationInFrames: number;
          src: string | null;
          startFrom: number;
          volume: number;
      }
    | {
          kind: "text";
          id: string;
          trackType: "text";
          trackName: string;
          from: number;
          durationInFrames: number;
          content: string;
          style: TextClip["style"];
          transform: TextClip["transform"];
      }
    | {
          kind: "effect";
          id: string;
          trackType: "effect";
          trackName: string;
          from: number;
          durationInFrames: number;
          effectKind: string;
          config: EffectConfig;
          assetName: string | null;
      };

export interface CompositionPlan {
    backgroundColor: string;
    fps: number;
    width: number;
    height: number;
    items: CompositionPlanItem[];
}

export function mediaStyle(
    clip: MediaClip,
    width: number,
    height: number
): CSSProperties {
    const transform = clip.transform;

    return {
        position: "absolute",
        left: transform?.x ?? width / 2,
        top: transform?.y ?? height / 2,
        transform: `translate(-50%, -50%) scale(${transform?.scaleX ?? 1}, ${
            transform?.scaleY ?? 1
        }) rotate(${transform?.rotation ?? 0}deg)`,
        transformOrigin: `${(transform?.anchorX ?? 0.5) * 100}% ${(transform?.anchorY ?? 0.5) * 100}%`,
        width: "100%",
        height: "100%",
        objectFit: "cover",
    };
}

export function resolveEffectConfig(
    asset: ReturnType<typeof resolveClipAsset>,
    clip: EffectClip
): EffectConfig {
    return {
        ...((asset?.metadata?.config ?? {}) as Record<string, unknown>),
        ...(clip.config ?? {}),
    } as EffectConfig;
}

export function resolveEffectKind(
    asset: ReturnType<typeof resolveClipAsset>,
    config: EffectConfig
) {
    const raw =
        String(config.kind ?? config.type ?? asset?.name ?? "")
            .toLowerCase()
            .trim() || "";

    if (!raw) return "unknown";
    if (raw.includes("zoom") || raw.includes("punch")) return "zoom";
    if (raw.includes("hook")) return "hook";
    if (raw.includes("cta") || raw.includes("end")) return "cta";
    if (raw.includes("flash")) return "flash";
    if (raw.includes("vignette")) return "vignette";
    if (raw.includes("glitch") || raw.includes("rgb-split")) return "glitch";

    return raw;
}

export function buildCompositionPlan(args: {
    project: EditorProject;
    fps?: number;
    width?: number;
    height?: number;
}): CompositionPlan {
    const normalizedProject = ensureDefaultTracks({
        ...args.project,
        assets: args.project.assets ?? {},
        tracks: args.project.tracks ?? [],
    });
    const fps = args.fps ?? normalizedProject.settings.fps;
    const width = args.width ?? normalizedProject.settings.width;
    const height = args.height ?? normalizedProject.settings.height;
    const items: CompositionPlanItem[] = [];
    const visibleTracks = sortTracksForRender(
        normalizedProject.tracks.filter((track) => !track.hidden)
    );

    for (const track of visibleTracks) {
        for (const clip of track.clips) {
            const from = framesFromMs(clip.startAtMs, fps);
            const durationInFrames = Math.max(1, framesFromMs(clip.durationMs, fps));

            if (clip.type === "text") {
                items.push({
                    kind: "text",
                    id: clip.id,
                    trackType: "text",
                    trackName: track.name,
                    from,
                    durationInFrames,
                    content: clip.content,
                    style: clip.style,
                    transform: clip.transform,
                });
                continue;
            }

            if (clip.type === "effect") {
                const asset = resolveClipAsset(normalizedProject, clip);
                const config = resolveEffectConfig(asset, clip);
                items.push({
                    kind: "effect",
                    id: clip.id,
                    trackType: "effect",
                    trackName: track.name,
                    from,
                    durationInFrames,
                    effectKind: resolveEffectKind(asset, config),
                    config,
                    assetName: asset?.name ?? null,
                });
                continue;
            }

            const assetUrl = getClipAssetUrl(normalizedProject, clip);
            const mediaClip = clip as MediaClip;
            const startFrom = Math.max(
                0,
                framesFromMs(mediaClip.sourceStartMs ?? 0, fps)
            );

            if (clip.type === "audio") {
                items.push({
                    kind: "audio",
                    id: clip.id,
                    trackType: "audio",
                    trackName: track.name,
                    from,
                    durationInFrames,
                    src: assetUrl,
                    startFrom,
                    volume: mediaClip.volume ?? 1,
                });
                continue;
            }

            items.push({
                kind: clip.type === "video" ? "video" : "image",
                id: clip.id,
                trackType: track.type,
                trackName: track.name,
                from,
                durationInFrames,
                src: assetUrl,
                startFrom,
                volume: mediaClip.volume ?? 1,
                style: mediaStyle(mediaClip, width, height),
            });
        }
    }

    return {
        backgroundColor: normalizedProject.settings.backgroundColor,
        fps,
        width,
        height,
        items,
    };
}

export function getActiveFrameState(plan: CompositionPlan, frame: number) {
    const activeItems = plan.items.filter(
        (item) => frame >= item.from && frame < item.from + item.durationInFrames
    );
    const effects = activeItems.filter(
        (item): item is Extract<CompositionPlanItem, { kind: "effect" }> =>
            item.kind === "effect"
    );
    let zoomScale = 1;

    for (const effect of effects) {
        if (effect.effectKind !== "zoom") {
            continue;
        }

        const targetScale = Math.max(
            1,
            Number(effect.config.scale ?? effect.config.zoomScale ?? 1.12)
        );
        const localFrame = frame - effect.from;
        const halfDuration = Math.max(1, Math.floor(effect.durationInFrames / 2));

        if (effect.config.easing === "spring") {
            const enter = spring({
                frame: localFrame,
                fps: plan.fps,
                durationInFrames: halfDuration,
            });

            if (localFrame <= halfDuration) {
                zoomScale = interpolate(enter, [0, 1], [1, targetScale]);
            } else {
                const exit = spring({
                    frame: localFrame - halfDuration,
                    fps: plan.fps,
                    durationInFrames: halfDuration,
                });
                zoomScale = interpolate(exit, [0, 1], [targetScale, 1]);
            }
        } else {
            const progress = interpolate(
                localFrame,
                [0, halfDuration, effect.durationInFrames],
                [0, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            zoomScale =
                progress <= 0.5
                    ? interpolate(progress, [0, 0.5], [1, targetScale], {
                          extrapolateRight: "clamp",
                      })
                    : interpolate(progress, [0.5, 1], [targetScale, 1], {
                          extrapolateLeft: "clamp",
                      });
        }
    }

    return {
        zoomScale: Math.abs(zoomScale - 1) < FX_EPSILON ? 1 : zoomScale,
        audio: activeItems.filter(
            (item): item is Extract<CompositionPlanItem, { kind: "audio" }> =>
                item.kind === "audio"
        ),
        captions: activeItems.filter(
            (item): item is Extract<CompositionPlanItem, { kind: "text" }> =>
                item.kind === "text"
        ),
        effects,
        visuals: activeItems.filter(
            (
                item
            ): item is Exclude<CompositionPlanItem, { kind: "audio" }> =>
                item.kind !== "audio"
        ),
    };
}

export function getActiveZoomScale(
    project: EditorProject,
    frame: number,
    fps: number
) {
    const plan = buildCompositionPlan({ project, fps });
    return getActiveFrameState(plan, frame).zoomScale;
}
