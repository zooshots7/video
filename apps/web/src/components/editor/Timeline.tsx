import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@video-editor/editor-core';
import { Track, Clip, getAssetUrl } from '@video-editor/timeline-schema';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { v4 as uuidv4 } from 'uuid';

// Constants for timeline scaling
const PIXELS_PER_SECOND = 50;
const SNAP_THRESHOLD_PX = 10; // 10px snap radius

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSnapPoints(project: any, currentClipId: string, playheadMs: number): number[] {
    const points: number[] = [playheadMs];
    project.tracks.forEach((t: any) => {
        t.clips.forEach((c: any) => {
            if (c.id !== currentClipId) {
                points.push(c.startAtMs);
                points.push(c.startAtMs + c.durationMs);
            }
        });
    });
    return points;
}

// ─── Timeline Clip ────────────────────────────────────────────────────────────

const TimelineClip = ({ trackId, clip }: { trackId: string, clip: Clip }) => {
    const { project, moveClipTime, trimClip, addClip, selectClip, selectedClipId, activeTool, snappingEnabled, playheadMs } = useEditorStore();
    const isSelected = selectedClipId === clip.id;
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const assetUrl = project ? getAssetUrl(project, clip) : null;

    const widthStr = `${(clip.durationMs / 1000) * PIXELS_PER_SECOND}px`;
    const leftStr = `${(clip.startAtMs / 1000) * PIXELS_PER_SECOND}px`;

    // Resolve-style Colors mapping
    const bgColors: Record<string, string> = {
        video: 'bg-[#4B617A]/80 border-[#6582A0]', // Muted Slate Blue
        audio: 'bg-[#3A6B4F]/80 border-[#4F906A]', // Desaturated Forest Green
        image: 'bg-[#7A5B4B]/80 border-[#A07765]', // Muted Brown/Amber
        text: 'bg-[#6B4B7A]/80 border-[#8D65A0]',  // Muted Purple
        effect: 'bg-[#7A664B]/80 border-[#A08B65]',
    };
    const colorClass = bgColors[clip.type] || bgColors.video;

    // Wavesurfer setup for Audio/Video clips
    useEffect(() => {
        if (clip.type !== 'audio' && clip.type !== 'video' || !waveContainerRef.current) return;
        
        if (!assetUrl) return;

        wavesurferRef.current = WaveSurfer.create({
            container: waveContainerRef.current,
            waveColor: clip.type === 'audio' ? 'rgba(79, 144, 106, 0.6)' : 'rgba(101, 130, 160, 0.4)',
            progressColor: 'transparent',
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 30,
            interact: false,
            url: assetUrl,
        });

        wavesurferRef.current.on('decode', () => {
            wavesurferRef.current?.zoom(PIXELS_PER_SECOND);
        });

        return () => wavesurferRef.current?.destroy();
    }, [assetUrl, clip.id, clip.type]);

    // Blade Tool Cut Logic
    const handleClipClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTool === 'select') {
            selectClip(clip.id);
            return;
        }

        if (activeTool === 'blade') {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickOffsetMs = (clickX / PIXELS_PER_SECOND) * 1000;
            const splitPointMs = clip.startAtMs + clickOffsetMs;

            if (splitPointMs <= clip.startAtMs || splitPointMs >= clip.startAtMs + clip.durationMs) return;

            const leftDuration = splitPointMs - clip.startAtMs;
            const rightDuration = clip.durationMs - leftDuration;

            // Trim left half in-place
            trimClip(trackId, clip.id, clip.startAtMs, leftDuration, (clip as any).sourceStartMs ?? 0);

            // Create right half as new clip
            const { src: _src, ...clipWithoutLegacySrc } = clip as any;
            const rightClip = {
                ...clipWithoutLegacySrc,
                id: uuidv4(),
                startAtMs: splitPointMs,
                durationMs: rightDuration,
                sourceStartMs: ((clip as any).sourceStartMs ?? 0) + leftDuration,
            };
            addClip(trackId, rightClip);
            selectClip(rightClip.id);
            // Switch back to select tool after cut
            useEditorStore.getState().setActiveTool('select');
        }
    };

    return (
        <motion.div 
            drag={activeTool === 'select' ? "x" : false}
            dragMomentum={false}
            onDragEnd={(e, info) => {
                let newStartMs = Math.max(0, clip.startAtMs + (info.offset.x / PIXELS_PER_SECOND) * 1000);
                
                // Snapping Logic
                if (snappingEnabled && project) {
                    const snapPoints = getSnapPoints(project, clip.id, playheadMs);
                    const snapThresholdMs = (SNAP_THRESHOLD_PX / PIXELS_PER_SECOND) * 1000;
                    
                    // Check snap for left edge
                    for (const pt of snapPoints) {
                        if (Math.abs(newStartMs - pt) < snapThresholdMs) {
                            newStartMs = pt;
                            break;
                        }
                    }
                    // Check snap for right edge
                    const rightEdge = newStartMs + clip.durationMs;
                    for (const pt of snapPoints) {
                        if (Math.abs(rightEdge - pt) < snapThresholdMs) {
                            newStartMs = pt - clip.durationMs;
                            break;
                        }
                    }
                }
                moveClipTime(trackId, clip.id, newStartMs);
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={handleClipClick}
            className={`absolute h-[40px] mt-[4px] rounded-[4px] border flex items-center px-1 transition-colors overflow-hidden ${colorClass} ${isSelected ? 'ring-1 ring-white/80 z-20 brightness-110' : 'hover:brightness-110 z-10'} ${activeTool === 'blade' && isHovering ? 'cursor-[url(/scissors.png),crosshair]' : activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ width: widthStr, left: leftStr }}
        >
            {/* Waveform container */}
            {(clip.type === 'audio' || clip.type === 'video') && (
                <div 
                    ref={waveContainerRef} 
                    className="absolute inset-0 pointer-events-none opacity-60"
                    style={{ 
                        transform: `translateX(-${((clip as any).sourceStartMs ?? 0) / 1000 * PIXELS_PER_SECOND}px)`,
                        width: `${(((clip as any).durationMs + ((clip as any).sourceStartMs ?? 0)) / 1000) * PIXELS_PER_SECOND}px`
                    }} 
                />
            )}

            {/* Clip Label */}
            <span className="text-[10px] truncate max-w-full font-medium text-white/90 select-none pointer-events-none z-10 drop-shadow-md px-1.5 py-0.5 bg-black/30 rounded-sm ml-1">
                {clip.type === 'text' ? (clip as any).content : `${clip.type} Clip`}
            </span>
            
            {/* Trimming Handles */}
            {(isSelected || (isHovering && activeTool === 'select')) && (
                <>
                    {/* Left Handle */}
                    <motion.div 
                        drag="x" dragMomentum={false}
                        onDrag={(e, info) => e.stopPropagation()}
                        onDragEnd={(e, info) => {
                            e.stopPropagation();
                            const deltaMs = (info.offset.x / PIXELS_PER_SECOND) * 1000;
                            const newStartMs = Math.max(0, clip.startAtMs + deltaMs);
                            const newDurationMs = clip.durationMs - deltaMs;
                            const newSourceStartMs = Math.max(0, ((clip as any).sourceStartMs ?? 0) + deltaMs);
                            if (newDurationMs > 100) {
                                trimClip(trackId, clip.id, newStartMs, newDurationMs, newSourceStartMs);
                            }
                        }}
                        className="absolute left-0 top-0 bottom-0 w-3 bg-white/20 hover:bg-white/90 cursor-col-resize z-30 flex items-center justify-center border-l-2 border-transparent hover:border-white transition-all group/handle"
                    >
                        <div className="w-[1px] h-4 bg-white/50 group-hover/handle:bg-black/50" />
                    </motion.div>

                    {/* Right Handle */}
                    <motion.div 
                        drag="x" dragMomentum={false}
                        onDrag={(e, info) => e.stopPropagation()}
                        onDragEnd={(e, info) => {
                            e.stopPropagation();
                            const deltaMs = (info.offset.x / PIXELS_PER_SECOND) * 1000;
                            const newDurationMs = clip.durationMs + deltaMs;
                            if (newDurationMs > 100) {
                                trimClip(trackId, clip.id, clip.startAtMs, newDurationMs, (clip as any).sourceStartMs);
                            }
                        }}
                        className="absolute right-0 top-0 bottom-0 w-3 bg-white/20 hover:bg-white/90 cursor-col-resize z-30 flex items-center justify-center border-r-2 border-transparent hover:border-white transition-all group/handle"
                    >
                        <div className="w-[1px] h-4 bg-white/50 group-hover/handle:bg-black/50" />
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

// ─── Timeline Track ───────────────────────────────────────────────────────────

const TimelineTrack = ({ track }: { track: Track }) => {
    return (
        <div className="flex h-[44px] w-full bg-[#0F0F0F] border-b border-[#1A1A1A] flex items-center relative group">
            {/* Bluma Track Header (Minimalist) */}
            <div className="flex w-[140px] h-full items-center justify-between shrink-0 border-r border-[#1A1A1A] bg-[#0A0A0A] z-40 px-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-[4px] bg-[#141414] text-[9px] font-semibold text-[#888] border border-[#222]">
                        {track.name.substring(0, 2)}
                    </span>
                    <span className="text-[10px] font-medium text-[#666] truncate max-w-[50px] capitalize group-hover:text-[#CCC] transition-colors">
                        {track.type.split('_')[0]}
                    </span>
                </div>
                {/* Simplified Controls */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[#555] hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg></button>
                </div>
            </div>
            
            {/* Track Body */}
            <div className="flex-1 h-full relative overflow-hidden bg-[#0A0A0A] group-hover:bg-[#0F0F0F] transition-colors">
                 <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.01]" />
                 
                 {track.clips.map(clip => (
                    <TimelineClip key={clip.id} trackId={track.id} clip={clip} />
                 ))}
            </div>
        </div>
    );
}

// ─── Main Timeline ────────────────────────────────────────────────────────────

export const Timeline = () => {
    const { project, playheadMs, selectClip } = useEditorStore();
    
    if (!project) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#111]">
                <p className="text-[#555] text-sm">No project loaded.</p>
            </div>
        );
    }

    const playheadLeft = `${(playheadMs / 1000) * PIXELS_PER_SECOND}px`;

    // Separate tracks by role so captions/effects stay visible in the same timeline surface.
    const videoTracks = project.tracks.filter(t => t.type.startsWith('video'));
    const textTracks = project.tracks.filter(t => t.type === 'text');
    const effectTracks = project.tracks.filter(t => t.type === 'effect');
    const audioTracks = project.tracks.filter(t => t.type === 'audio');

    return (
        <div 
            className="flex-1 overflow-auto relative flex flex-col bg-[#0A0A0A] select-none pb-24"
            onClick={() => selectClip(null)}
        >
            {/* Ruler Header (Clean styling) */}
            <div className="sticky top-0 h-7 bg-[#0A0A0A] border-b border-[#1A1A1A] z-50 flex">
                <div className="w-[140px] shrink-0 border-r border-[#1A1A1A] bg-[#0A0A0A]" /> {/* Offset for track headers */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Timecode ticks */}
                    {Array.from({ length: 150 }).map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l border-[#222] flex flex-col justify-end pb-[2px]" style={{ left: `${i * PIXELS_PER_SECOND * 5}px` }}>
                            <span className="text-[8px] font-mono text-[#555] ml-1 select-none">{(i * 5).toString()}s</span>
                        </div>
                    ))}
                    {/* Shorter 1s sub-ticks */}
                    {Array.from({ length: 750 }).map((_, i) => (
                        i % 5 !== 0 && <div key={i} className="absolute bottom-0 h-1.5 border-l border-[#222]" style={{ left: `${i * PIXELS_PER_SECOND}px` }} />
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative w-max min-w-full">
                {/* Video Tracks (Top) */}
                <div className="flex flex-col-reverse mt-1">
                    {videoTracks.map(track => (
                        <TimelineTrack key={track.id} track={track} />
                    ))}
                </div>

                {/* Bluma-style subtle Central Divider */}
                <div className="h-4 w-full flex items-center justify-center opacity-30">
                     <div className="h-px w-full bg-[#333]" />
                </div>

                {/* Text / Caption Tracks */}
                <div className="flex flex-col">
                    {textTracks.map(track => (
                        <TimelineTrack key={track.id} track={track} />
                    ))}
                </div>

                {/* Effect Tracks */}
                <div className="flex flex-col">
                    {effectTracks.map(track => (
                        <TimelineTrack key={track.id} track={track} />
                    ))}
                </div>

                {/* Audio Tracks (Bottom) */}
                <div className="flex flex-col">
                    {audioTracks.map(track => (
                        <TimelineTrack key={track.id} track={track} />
                    ))}
                </div>

                {/* Minimalist Playhead Marker */}
                <div 
                    className="absolute top-0 bottom-0 w-[1.5px] bg-[#E0E0E0] z-50 pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
                    style={{ transform: `translateX(calc(${playheadLeft} + 140px))` }} 
                >
                    <div className="absolute -top-3.5 -left-[4.5px] w-2.5 h-3.5 rounded-t-sm bg-[#E0E0E0]" />
                </div>
            </div>
        </div>
    );
}
