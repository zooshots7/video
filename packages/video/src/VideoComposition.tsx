import React from "react";
import { AbsoluteFill, Video, Audio, Sequence, useVideoConfig } from "remotion";
import type { VideoCompositionProps, ProjectAssetInput } from "./types";
import { HookCard } from "./components/HookCard";
import { Captions } from "./components/Captions";
import { CTAEndCard } from "./components/CTAEndCard";
import { PunchInZoomLayer } from "./components/PunchInZoomLayer";

/* ── VFX Overlays ─────────────────────── */

const FlashOverlay: React.FC<{ color: string; opacity: number }> = ({
    color,
    opacity,
}) => (
    <AbsoluteFill
        style={{
            backgroundColor: color,
            opacity,
            mixBlendMode: "screen",
        }}
    />
);

const VignetteOverlay: React.FC<{ intensity: number }> = ({ intensity }) => (
    <AbsoluteFill
        style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
        }}
    />
);

const ShakeLayer: React.FC<{
    children: React.ReactNode;
    amplitude: number;
}> = ({ children, amplitude }) => {
    const frame = React.useMemo(() => Math.random() * 100, []);
    const offsetX = Math.sin(frame * 0.5) * amplitude;
    const offsetY = Math.cos(frame * 0.7) * amplitude;
    return (
        <AbsoluteFill
            style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/* ── Main Composition ─────────────────── */

export const VideoComposition: React.FC<VideoCompositionProps> = ({
    sourceVideoUrl,
    transcriptWords,
    templateConfig,
    hookText,
    ctaText,
    zoomTimestamps,
    durationInFrames,
    projectAssets = [],
}) => {
    const { fps } = useVideoConfig();

    // Separate assets by type
    const sfxAssets = projectAssets.filter((a) => a.assetType === "sfx");
    const musicAssets = projectAssets.filter((a) => a.assetType === "music");
    const vfxAssets = projectAssets.filter((a) => a.assetType === "vfx");
    const brollAssets = projectAssets.filter((a) => a.assetType === "broll");

    return (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
            {/* Video layer with punch-in zoom */}
            <PunchInZoomLayer
                zoomTimestamps={zoomTimestamps}
                config={templateConfig.zoom}
            >
                <AbsoluteFill>
                    <Video
                        src={sourceVideoUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </AbsoluteFill>
            </PunchInZoomLayer>

            {/* B-Roll Overlays */}
            {brollAssets.map((broll, i) => {
                if (!broll.fileUrl) return null;
                const startFrame = Math.round((broll.startSec ?? 0) * fps);
                const endFrame = broll.endSec ? Math.round(broll.endSec * fps) : durationInFrames;
                const durationFrames = endFrame - startFrame;

                return (
                    <Sequence
                        key={`broll-${i}`}
                        from={startFrame}
                        durationInFrames={durationFrames}
                    >
                        <AbsoluteFill style={{ zIndex: 10 }}>
                            <Video
                                src={broll.fileUrl}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </AbsoluteFill>
                    </Sequence>
                );
            })}

            {/* VFX Overlays */}
            {(templateConfig.vfxEnabled !== false) && vfxAssets.map((vfx, i) => {
                const config = (vfx.config ?? {}) as Record<string, any>;
                const startFrame = Math.round((vfx.startSec ?? 0) * fps);
                const durationFrames = Math.round(
                    ((vfx.durationMs ?? 500) / 1000) * fps
                );

                if (config.type === "rgb-split" || vfx.name?.toLowerCase().includes("glitch")) {
                    return (
                        <Sequence
                            key={`vfx-${i}`}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <FlashOverlay color="#FF0044" opacity={0.15} />
                        </Sequence>
                    );
                }
                if (vfx.name?.toLowerCase().includes("flash")) {
                    return (
                        <Sequence
                            key={`vfx-${i}`}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <FlashOverlay
                                color={config.color ?? "#FFFFFF"}
                                opacity={config.opacity ?? 0.9}
                            />
                        </Sequence>
                    );
                }
                if (vfx.name?.toLowerCase().includes("vignette")) {
                    return (
                        <Sequence
                            key={`vfx-${i}`}
                            from={startFrame}
                            durationInFrames={durationInFrames}
                        >
                            <VignetteOverlay intensity={config.intensity ?? 0.6} />
                        </Sequence>
                    );
                }
                return null;
            })}

            {/* Captions with active word highlighting */}
            <Captions
                words={transcriptWords}
                captionStyle={templateConfig.caption}
            />

            {/* Hook card overlay (first N seconds) */}
            <HookCard hookText={hookText} config={templateConfig.hook} />

            {/* CTA end card (last N seconds) */}
            <CTAEndCard
                ctaText={ctaText}
                config={templateConfig.cta}
                totalDurationInFrames={durationInFrames}
            />

            {/* SFX Audio Layers */}
            {(templateConfig.sfxEnabled !== false) && sfxAssets.map((sfx, i) => {
                if (!sfx.fileUrl) return null;
                const startFrame = Math.round((sfx.startSec ?? 0) * fps);
                return (
                    <Sequence key={`sfx-${i}`} from={startFrame}>
                        <Audio src={sfx.fileUrl} volume={0.8} />
                    </Sequence>
                );
            })}

            {/* Music Audio Layers */}
            {musicAssets.map((track, i) => {
                if (!track.fileUrl) return null;
                return (
                    <Sequence key={`music-${i}`} from={0}>
                        <Audio
                            src={track.fileUrl}
                            volume={0.3}
                            // Loop music by default
                        />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
