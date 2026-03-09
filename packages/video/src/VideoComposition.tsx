import React from "react";
import { AbsoluteFill, Video, useVideoConfig } from "remotion";
import type { VideoCompositionProps } from "./types";
import { HookCard } from "./components/HookCard";
import { Captions } from "./components/Captions";
import { CTAEndCard } from "./components/CTAEndCard";
import { PunchInZoomLayer } from "./components/PunchInZoomLayer";

export const VideoComposition: React.FC<VideoCompositionProps> = ({
    sourceVideoUrl,
    transcriptWords,
    templateConfig,
    hookText,
    ctaText,
    zoomTimestamps,
    durationInFrames,
}) => {
    const { fps } = useVideoConfig();

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
        </AbsoluteFill>
    );
};
