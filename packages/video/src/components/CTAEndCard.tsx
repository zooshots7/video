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
                backgroundColor: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(12px)",
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
                    padding: "80px",
                    backgroundColor: config.background,
                    borderRadius: 48,
                    boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
                    border: `4px solid ${config.textColor}33`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        color: config.textColor,
                        fontSize: config.fontSize,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        marginBottom: 48,
                        textTransform: "uppercase",
                        letterSpacing: "-0.02em",
                        maxWidth: 800,
                    }}
                >
                    {ctaText}
                </div>
                <div
                    style={{
                        display: "inline-block",
                        transform: `scale(${buttonScale})`,
                        padding: "24px 80px",
                        borderRadius: 100,
                        backgroundColor: config.textColor,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    }}
                >
                    <span
                        style={{
                            color: config.background,
                            fontSize: 40,
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {config.buttonText}
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
