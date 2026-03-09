import React from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from "remotion";
import type { ZoomConfig } from "@video-editor/shared";

interface PunchInZoomLayerProps {
    zoomTimestamps: number[];
    config: ZoomConfig;
    children: React.ReactNode;
}

export const PunchInZoomLayer: React.FC<PunchInZoomLayerProps> = ({
    zoomTimestamps,
    config,
    children,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeSec = frame / fps;
    const zoomDurationFrames = config.durationSec * fps;

    let scale = 1;

    for (const ts of zoomTimestamps) {
        const zoomStartFrame = ts * fps;
        const zoomEndFrame = zoomStartFrame + zoomDurationFrames;

        if (frame >= zoomStartFrame && frame <= zoomEndFrame) {
            if (config.easing === "spring") {
                const s = spring({
                    frame: frame - zoomStartFrame,
                    fps,
                    config: {
                        damping: 12,
                        stiffness: 150,
                        mass: 0.5,
                    },
                });
                // Zoom in then out
                const halfPoint = zoomDurationFrames / 2;
                if (frame - zoomStartFrame < halfPoint) {
                    scale = interpolate(s, [0, 1], [1, config.scale]);
                } else {
                    const s2 = spring({
                        frame: frame - zoomStartFrame - halfPoint,
                        fps,
                        config: {
                            damping: 12,
                            stiffness: 150,
                            mass: 0.5,
                        },
                    });
                    scale = interpolate(s2, [0, 1], [config.scale, 1]);
                }
            } else {
                // ease-in-out
                const progress = (frame - zoomStartFrame) / zoomDurationFrames;
                if (progress < 0.5) {
                    scale = interpolate(
                        progress,
                        [0, 0.5],
                        [1, config.scale],
                        { extrapolateRight: "clamp" }
                    );
                } else {
                    scale = interpolate(
                        progress,
                        [0.5, 1],
                        [config.scale, 1],
                        { extrapolateRight: "clamp" }
                    );
                }
            }
            break;
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
            }}
        >
            {children}
        </AbsoluteFill>
    );
};
