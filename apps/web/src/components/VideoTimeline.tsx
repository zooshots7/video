import React, { useEffect, useState, useRef } from "react";
import type { PlayerRef } from "@remotion/player";
import type { TranscriptWord } from "@video-editor/shared";

interface VideoTimelineProps {
    playerRef: React.RefObject<PlayerRef>;
    transcriptWords: TranscriptWord[];
    zoomTimestamps: number[];
    durationInFrames: number;
    fps: number;
    hookText: string;
    ctaText: string;
    templateConfig: any;
}

const PIXELS_PER_SECOND = 60; // 60px = 1 second
const PIXELS_PER_FRAME = PIXELS_PER_SECOND / 30; // Assuming 30fps default

export function VideoTimeline({
    playerRef,
    transcriptWords,
    zoomTimestamps,
    durationInFrames,
    fps,
    hookText,
    ctaText,
    templateConfig,
}: VideoTimelineProps) {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const totalDurationSeconds = durationInFrames / fps;
    const timelineWidth = totalDurationSeconds * PIXELS_PER_SECOND;

    // Sync playhead state via requestAnimationFrame loop
    useEffect(() => {
        let animationFrameId: number;

        const checkFrame = () => {
            if (playerRef.current) {
                const frame = playerRef.current.getCurrentFrame();
                setCurrentFrame(frame);
                setIsPlaying(playerRef.current.isPlaying());
            }
            animationFrameId = requestAnimationFrame(checkFrame);
        };

        animationFrameId = requestAnimationFrame(checkFrame);
        return () => cancelAnimationFrame(animationFrameId);
    }, [playerRef]);

    // Handle clicking on the timeline to seek
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current || !playerRef.current) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Ensure within bounds
        const boundedX = Math.max(0, Math.min(clickX, timelineWidth));
        const clickedSecond = boundedX / PIXELS_PER_SECOND;
        let targetFrame = Math.round(clickedSecond * fps);
        targetFrame = Math.max(0, Math.min(targetFrame, durationInFrames - 1));
        
        playerRef.current.seekTo(targetFrame);
        setCurrentFrame(targetFrame);
    };

    const playheadPositionX = (currentFrame / fps) * PIXELS_PER_SECOND;

    // Computed Durations
    const hookDurationSec = templateConfig?.hook?.durationSec || 2;
    const ctaDurationSec = templateConfig?.cta?.durationSec || 3;
    const ctaStartSec = totalDurationSeconds - ctaDurationSec;

    return (
        <div className="glass-card mt-6 flex w-full flex-col overflow-hidden rounded-xl border border-surface-border bg-surface p-4 shadow-xl">
            {/* Header / Playback Controls */}
            <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (playerRef.current) {
                                isPlaying ? playerRef.current.pause() : playerRef.current.play();
                            }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white"
                    >
                        {isPlaying ? (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                    <div className="text-sm font-medium text-slate-300">
                        <span className="text-white">{(currentFrame / fps).toFixed(1)}s</span>
                        {" / "}
                        <span className="text-slate-500">{totalDurationSeconds.toFixed(1)}s</span>
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    {fps} FPS
                </div>
            </div>

            {/* Timeline Area (Scrollable Horizontally) */}
            <div className="relative w-full overflow-x-auto pb-4">
                <div
                    ref={timelineRef}
                    onClick={handleTimelineClick}
                    className="relative ml-20 cursor-pointer"
                    style={{ width: `${timelineWidth}px`, minHeight: "200px" }}
                >
                    {/* Time Ruler */}
                    <div className="absolute top-0 flex h-6 w-full items-end border-b border-surface-border text-xs text-slate-500 select-none">
                        {Array.from({ length: Math.ceil(totalDurationSeconds) + 1 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute border-l border-surface-border pl-1"
                                style={{ left: `${i * PIXELS_PER_SECOND}px`, height: "12px" }}
                            >
                                {i}s
                            </div>
                        ))}
                    </div>

                    {/* Tracks Wrapper */}
                    <div className="pointer-events-none mt-8 flex flex-col gap-2">
                        {/* Track 1: Video */}
                        <div className="group relative flex h-10 w-full items-center rounded-md bg-stone-800/50 shadow-inner">
                            <div className="absolute -left-20 flex w-16 items-center gap-2 pr-2 text-xs font-semibold text-slate-400 opacity-60 transition-opacity group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                V1
                            </div>
                            <div 
                                className="absolute h-full rounded bg-emerald-500/20 border border-emerald-500/40"
                                style={{ width: "100%", left: 0 }}
                            >
                                <div className="p-1 pl-2 text-[10px] uppercase font-bold text-emerald-300">Base Video</div>
                            </div>
                        </div>

                        {/* Track 2: Hook */}
                        <div className="group relative flex h-10 w-full items-center rounded-md bg-stone-800/50 shadow-inner">
                            <div className="absolute -left-20 flex w-16 items-center gap-2 text-xs font-semibold text-slate-400 opacity-60 transition-opacity group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                H1
                            </div>
                            {hookText && hookDurationSec > 0 && (
                                <div 
                                    className="absolute h-full rounded bg-yellow-500/20 border border-yellow-500/40 truncate p-1 transition-colors hover:bg-yellow-500/30"
                                    style={{ 
                                        width: `${hookDurationSec * PIXELS_PER_SECOND}px`, 
                                        left: 0 
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-yellow-300 pr-1">HOOK</span>
                                    <span className="text-xs text-yellow-100/70 truncate">{hookText}</span>
                                </div>
                            )}
                        </div>

                        {/* Track 3: Captions */}
                        <div className="group relative flex h-10 w-full items-center rounded-md bg-stone-800/50 shadow-inner">
                            <div className="absolute -left-20 flex w-16 items-center gap-2 text-xs font-semibold text-slate-400 opacity-60 transition-opacity group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                C1
                            </div>
                            {transcriptWords.map((word, i) => (
                                <div 
                                    key={i}
                                    className="absolute h-full rounded-sm bg-purple-500/20 border-x border-purple-500/40 flex items-center justify-center overflow-hidden transition-all hover:bg-purple-500/40"
                                    style={{ 
                                        left: `${word.start * PIXELS_PER_SECOND}px`, 
                                        width: `${Math.max(2, (word.end - word.start) * PIXELS_PER_SECOND)}px` 
                                    }}
                                >
                                    <span className="text-[8px] text-purple-200 select-none px-0.5 truncate">{word.word}</span>
                                </div>
                            ))}
                        </div>

                        {/* Track 4: Zoom FX */}
                        <div className="group relative flex h-10 w-full items-center rounded-md bg-stone-800/50 shadow-inner">
                            <div className="absolute -left-20 flex w-16 items-center gap-2 text-xs font-semibold text-slate-400 opacity-60 transition-opacity group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                FX
                            </div>
                            {zoomTimestamps.map((sec, i) => (
                                <div 
                                    key={i}
                                    className="absolute h-full rounded bg-orange-500/20 border border-orange-500/40 flex items-center px-1"
                                    style={{ 
                                        left: `${sec * PIXELS_PER_SECOND}px`, 
                                        width: `${2.5 * PIXELS_PER_SECOND}px` // arbitrary visual duration for punch in
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-orange-300">ZOOM IN</span>
                                </div>
                            ))}
                        </div>

                        {/* Track 5: CTA */}
                        <div className="group relative flex h-10 w-full items-center rounded-md bg-stone-800/50 shadow-inner">
                            <div className="absolute -left-20 flex w-16 items-center gap-2 text-xs font-semibold text-slate-400 opacity-60 transition-opacity group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                E1
                            </div>
                            {ctaText && ctaStartSec > 0 && (
                                <div 
                                    className="absolute h-full rounded bg-rose-500/20 border border-rose-500/40 truncate p-1 transition-colors hover:bg-rose-500/30"
                                    style={{ 
                                        width: `${ctaDurationSec * PIXELS_PER_SECOND}px`, 
                                        left: `${ctaStartSec * PIXELS_PER_SECOND}px` 
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-rose-300 pr-1">CTA</span>
                                    <span className="text-xs text-rose-100/70 truncate">{ctaText}</span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Playhead Marker */}
                    <div 
                        className="pointer-events-none absolute top-0 z-50 flex flex-col items-center"
                        style={{ 
                            left: `${playheadPositionX}px`, 
                            height: "100%", 
                            transform: "translateX(-50%)" 
                        }}
                    >
                        <div className="border-t-[8px] border-x-[6px] border-x-transparent border-t-pink-500 absolute -top-1" />
                        <div className="h-full w-0.5 bg-pink-500/80 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
