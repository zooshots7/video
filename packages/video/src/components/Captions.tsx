import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TranscriptWord, CaptionStyle } from "@video-editor/shared";

interface CaptionsProps {
    words: TranscriptWord[];
    captionStyle: CaptionStyle;
}

const WORDS_PER_GROUP = 5;

export const Captions: React.FC<CaptionsProps> = ({ words, captionStyle }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeSec = frame / fps;

    // Find the current word index
    const currentWordIndex = words.findIndex(
        (w) => currentTimeSec >= w.start && currentTimeSec < w.end
    );

    if (currentWordIndex === -1) return null;

    // Group words around the current word
    const groupStart =
        Math.floor(currentWordIndex / WORDS_PER_GROUP) * WORDS_PER_GROUP;
    const groupEnd = Math.min(groupStart + WORDS_PER_GROUP, words.length);
    const group = words.slice(groupStart, groupEnd);

    const positionStyle: React.CSSProperties =
        captionStyle.position === "center"
            ? { top: "50%", transform: "translateY(-50%)" }
            : { bottom: 220 };

    return (
        <div
            style={{
                position: "absolute",
                left: 40,
                right: 40,
                textAlign: "center",
                zIndex: 10,
                ...positionStyle,
            }}
        >
            <div
                style={{
                    display: "inline-block",
                    padding: "14px 28px",
                    borderRadius: 16,
                    backgroundColor: captionStyle.backgroundColor,
                    backdropFilter: "blur(8px)",
                }}
            >
                {group.map((w, i) => {
                    const isActive =
                        currentTimeSec >= w.start && currentTimeSec < w.end;
                    return (
                        <span
                            key={groupStart + i}
                            style={{
                                fontFamily: captionStyle.fontFamily + ", system-ui, sans-serif",
                                fontSize: captionStyle.fontSize,
                                fontWeight: isActive ? 800 : 600,
                                color: isActive
                                    ? captionStyle.highlightColor
                                    : captionStyle.color,
                                marginRight: 12,
                                transition: "color 0.1s, font-weight 0.1s",
                                textShadow: isActive
                                    ? `0 0 20px ${captionStyle.highlightColor}50`
                                    : "none",
                            }}
                        >
                            {w.word}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
