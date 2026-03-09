import React from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import type { HookConfig } from "@video-editor/shared";

interface HookCardProps {
    hookText: string;
    config: HookConfig;
}

export const HookCard: React.FC<HookCardProps> = ({ hookText, config }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationFrames = config.durationSec * fps;

    const opacity = interpolate(
        frame,
        [0, fps * 0.3, durationFrames - fps * 0.3, durationFrames],
        [0, 1, 1, 0],
        { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
    );

    const scale = interpolate(
        frame,
        [0, fps * 0.3],
        [0.9, 1],
        { extrapolateRight: "clamp" }
    );

    if (frame >= durationFrames) return null;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: config.background,
                justifyContent: "center",
                alignItems: "center",
                opacity,
                zIndex: 20,
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    padding: "0 80px",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        color: config.textColor,
                        fontSize: config.fontSize,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        textShadow: "0 4px 30px rgba(0,0,0,0.5)",
                    }}
                >
                    {hookText}
                </div>
            </div>
        </AbsoluteFill>
    );
};
