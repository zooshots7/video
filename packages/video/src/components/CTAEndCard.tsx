import React from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import type { CtaConfig } from "@video-editor/shared";

interface CTAEndCardProps {
    ctaText: string;
    config: CtaConfig;
    totalDurationInFrames: number;
}

export const CTAEndCard: React.FC<CTAEndCardProps> = ({
    ctaText,
    config,
    totalDurationInFrames,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const ctaStartFrame = totalDurationInFrames - config.durationSec * fps;

    if (frame < ctaStartFrame) return null;

    const localFrame = frame - ctaStartFrame;
    const ctaDurationFrames = config.durationSec * fps;

    const opacity = interpolate(
        localFrame,
        [0, fps * 0.3],
        [0, 1],
        { extrapolateRight: "clamp" }
    );

    const slideUp = interpolate(
        localFrame,
        [0, fps * 0.4],
        [40, 0],
        { extrapolateRight: "clamp" }
    );

    const buttonScale = interpolate(
        localFrame,
        [fps * 0.3, fps * 0.5],
        [0.8, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

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
                    transform: `translateY(${slideUp}px)`,
                    textAlign: "center",
                    padding: "0 60px",
                }}
            >
                <div
                    style={{
                        color: config.textColor,
                        fontSize: config.fontSize,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 800,
                        lineHeight: 1.3,
                        marginBottom: 40,
                    }}
                >
                    {ctaText}
                </div>
                <div
                    style={{
                        display: "inline-block",
                        transform: `scale(${buttonScale})`,
                        padding: "20px 60px",
                        borderRadius: 16,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid rgba(255,255,255,0.3)",
                    }}
                >
                    <span
                        style={{
                            color: "#fff",
                            fontSize: 36,
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontWeight: 700,
                        }}
                    >
                        {config.buttonText}
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
