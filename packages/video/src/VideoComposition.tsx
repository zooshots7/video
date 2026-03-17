import React from "react";
import {
    AbsoluteFill,
    Audio,
    Img,
    Sequence,
    Video,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import {
    getClipAssetUrl,
    resolveClipAsset,
    sortTracksForRender,
    framesFromMs,
    type EditorProject,
    type EffectClip,
    type MediaClip,
    type TextClip,
} from "@video-editor/timeline-schema";
import type { EditorProjectCompositionProps } from "./types";
import {
    getActiveZoomScale,
    mediaStyle,
    resolveEffectConfig,
    resolveEffectKind,
} from "./composition-plan";

export const VideoComposition: React.FC<EditorProjectCompositionProps> = ({
    project,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const visibleTracks = sortTracksForRender(
        project.tracks.filter((track) => !track.hidden)
    );

    const zoomScale = getActiveZoomScale(project, frame, fps);

    return (
        <AbsoluteFill
            style={{
                backgroundColor: project.settings.backgroundColor,
                overflow: "hidden",
            }}
        >
            <AbsoluteFill
                style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "center center",
                }}
            >
                {visibleTracks.map((track) => (
                    <TrackLayer
                        key={track.id}
                        project={project}
                        track={track}
                        fps={fps}
                        width={width}
                        height={height}
                    />
                ))}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

function TrackLayer({
    project,
    track,
    fps,
    width,
    height,
}: {
    project: EditorProject;
    track: EditorProject["tracks"][number];
    fps: number;
    width: number;
    height: number;
}) {
    return (
        <AbsoluteFill>
            {track.clips.map((clip) => {
                const startFrame = framesFromMs(clip.startAtMs, fps);
                const durationInFrames = Math.max(
                    1,
                    framesFromMs(clip.durationMs, fps)
                );

                return (
                    <Sequence
                        key={clip.id}
                        from={startFrame}
                        durationInFrames={durationInFrames}
                        layout="none"
                    >
                        {renderClip({ project, clip, fps, width, height })}
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
}

function renderClip({
    project,
    clip,
    fps,
    width,
    height,
}: {
    project: EditorProject;
    clip: EditorProject["tracks"][number]["clips"][number];
    fps: number;
    width: number;
    height: number;
}) {
    if (clip.type === "text") {
        return <TextClipView clip={clip} width={width} />;
    }

    if (clip.type === "effect") {
        return (
            <EffectClipView
                project={project}
                clip={clip}
                width={width}
                fps={fps}
            />
        );
    }

    const assetUrl = getClipAssetUrl(project, clip);
    const mediaClip = clip as MediaClip;

    if (!assetUrl) {
        return (
            <MissingAssetPlaceholder
                label={clip.type}
                width={width}
                height={height}
            />
        );
    }

    const sourceStartFrame = Math.max(
        0,
        framesFromMs(mediaClip.sourceStartMs ?? 0, fps)
    );
    const style = mediaStyle(mediaClip, width, height);

    if (clip.type === "video") {
        return (
            <Video
                src={assetUrl}
                startFrom={sourceStartFrame}
                volume={mediaClip.volume ?? 1}
                style={style}
            />
        );
    }

    if (clip.type === "audio") {
        return (
            <Audio
                src={assetUrl}
                startFrom={sourceStartFrame}
                volume={mediaClip.volume ?? 1}
            />
        );
    }

    return <Img src={assetUrl} style={style} />;
}

function TextClipView({
    clip,
    width,
}: {
    clip: TextClip;
    width: number;
}) {
    const hasBackground = Boolean(clip.style.backgroundColor);
    const isCaptionLike = clip.style.textAlign === "center";

    return (
        <div
            style={{
                position: "absolute",
                left: clip.transform.x,
                top: clip.transform.y,
                transform: "translate(-50%, -50%)",
                padding: hasBackground ? "14px 20px" : 0,
                borderRadius: hasBackground ? 16 : 0,
                backgroundColor: clip.style.backgroundColor ?? "transparent",
                maxWidth: width * 0.84,
                textAlign: clip.style.textAlign,
                fontFamily: `${clip.style.fontFamily}, system-ui, sans-serif`,
                fontSize: clip.style.fontSize,
                fontWeight: clip.style.fontWeight,
                color: clip.style.color,
                lineHeight: 1.15,
                textShadow: isCaptionLike
                    ? "0 8px 24px rgba(0,0,0,0.45)"
                    : "none",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))",
            }}
        >
            {clip.content}
        </div>
    );
}

function EffectClipView({
    project,
    clip,
    width,
    fps,
}: {
    project: EditorProject;
    clip: EffectClip;
    width: number;
    fps: number;
}) {
    const asset = resolveClipAsset(project, clip);
    const config = resolveEffectConfig(asset, clip);
    const kind = resolveEffectKind(asset, config);

    if (kind === "zoom") {
        return null;
    }

    if (kind === "hook" || kind === "hook-card") {
        return (
            <CardEffect
                clip={clip}
                width={width}
                fps={fps}
                title={String(config.title ?? asset?.name ?? "Hook")}
                subtitle={String(config.subtitle ?? "")}
                background={String(config.background ?? "#050505")}
                accentColor={String(config.color ?? "#ffffff")}
                buttonText={String(config.buttonText ?? "")}
                mode="hook"
            />
        );
    }

    if (kind === "cta" || kind === "end-card") {
        return (
            <CardEffect
                clip={clip}
                width={width}
                fps={fps}
                title={String(config.title ?? asset?.name ?? "CTA")}
                subtitle={String(config.subtitle ?? "")}
                background={String(config.background ?? "#050505")}
                accentColor={String(config.color ?? "#ffffff")}
                buttonText={String(config.buttonText ?? "Follow for more")}
                mode="cta"
            />
        );
    }

    if (kind === "flash" || kind === "rgb-split" || kind === "glitch") {
        return (
            <AbsoluteFill
                style={{
                    backgroundColor:
                        kind === "flash"
                            ? String(config.color ?? "#ffffff")
                            : "#ff0044",
                    opacity: Number(config.opacity ?? 0.16),
                    mixBlendMode: kind === "flash" ? "screen" : "normal",
                }}
            />
        );
    }

    if (kind === "vignette") {
        return (
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
                    opacity: Number(config.intensity ?? 0.75),
                }}
            />
        );
    }

    return null;
}

function CardEffect({
    clip,
    width,
    fps,
    title,
    subtitle,
    background,
    accentColor,
    buttonText,
    mode,
}: {
    clip: EffectClip;
    width: number;
    fps: number;
    title: string;
    subtitle: string;
    background: string;
    accentColor: string;
    buttonText: string;
    mode: "hook" | "cta";
}) {
    const frame = useCurrentFrame();
    const durationFrames = Math.max(1, framesFromMs(clip.durationMs, fps));
    const fadeFrames = Math.max(
        1,
        Math.min(Math.round(fps * 0.25), Math.floor(durationFrames / 2))
    );
    const entranceFrames = Math.max(
        1,
        Math.min(mode === "hook" ? Math.round(fps * 0.35) : Math.round(fps * 0.4), Math.floor(durationFrames / 2))
    );
    const slideFrames = Math.max(
        1,
        Math.min(mode === "hook" ? Math.round(fps * 0.35) : Math.round(fps * 0.45), Math.floor(durationFrames / 2))
    );
    const shortClip = durationFrames <= fadeFrames * 2;
    const opacity = shortClip
        ? 1
        : interpolate(
              frame,
              [
                  0,
                  fadeFrames,
                  Math.max(fadeFrames, durationFrames - fadeFrames),
                  durationFrames,
              ],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
    const scale = shortClip
        ? 1
        : mode === "hook"
            ? interpolate(
                  frame,
                  [0, entranceFrames],
                  [0.92, 1],
                  { extrapolateRight: "clamp" }
              )
            : interpolate(
                  frame,
                  [0, entranceFrames],
                  [0.94, 1],
                  { extrapolateRight: "clamp" }
              );
    const slideY = shortClip
        ? 0
        : mode === "hook"
            ? interpolate(
                  frame,
                  [0, slideFrames],
                  [24, 0],
                  { extrapolateRight: "clamp" }
              )
            : interpolate(
                  frame,
                  [0, slideFrames],
                  [32, 0],
                  { extrapolateRight: "clamp" }
              );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: background,
                justifyContent: "center",
                alignItems: "center",
                opacity,
            }}
        >
            <div
                style={{
                    transform: `translateY(${slideY}px) scale(${scale})`,
                    width: "100%",
                    maxWidth: Math.min(width * 0.82, 980),
                    padding: "0 64px",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        color: accentColor,
                        fontSize: mode === "hook" ? 80 : 68,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 800,
                        lineHeight: 1.08,
                        textShadow: "0 12px 34px rgba(0,0,0,0.5)",
                        marginBottom: subtitle ? 24 : 0,
                    }}
                >
                    {title}
                </div>
                {subtitle ? (
                    <div
                        style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 28,
                            lineHeight: 1.35,
                            fontFamily: "Inter, system-ui, sans-serif",
                            marginBottom: 28,
                        }}
                    >
                        {subtitle}
                    </div>
                ) : null}
                {buttonText ? (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "18px 36px",
                            borderRadius: 18,
                            backgroundColor: "rgba(255,255,255,0.14)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
                            color: "#fff",
                            fontSize: 34,
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontWeight: 700,
                        }}
                    >
                        {buttonText}
                    </div>
                ) : null}
            </div>
        </AbsoluteFill>
    );
}

function MissingAssetPlaceholder({
    label,
    width,
    height,
}: {
    label: string;
    width: number;
    height: number;
}) {
    return (
        <AbsoluteFill
            style={{
                width,
                height,
                backgroundColor: "#101010",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 24,
            }}
        >
            {label} asset missing
        </AbsoluteFill>
    );
}
