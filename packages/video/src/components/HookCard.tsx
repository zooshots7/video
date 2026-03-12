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
                justifyContent: "flex-start",
                alignItems: "center",
                paddingTop: 160,
                opacity,
                zIndex: 20,
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    padding: "24px 48px",
                    textAlign: "center",
                    backgroundColor: config.background,
                    borderRadius: 32,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    border: "4px solid rgba(255,255,255,0.1)",
                }}
            >
                <div
                    style={{
                        color: config.textColor,
                        fontSize: config.fontSize,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        textTransform: "uppercase",
                        letterSpacing: "-0.03em",
                    }}
                >
                    {hookText}
                </div>
            </div>
        </AbsoluteFill>
    );
};
