"use client";

import { Trash2, Clock3, Type, SlidersHorizontal } from "lucide-react";
import type { Clip, Project } from "@video-editor/timeline-schema";

interface EditorSelectionInspectorProps {
    project: Project | null;
    clip: Clip | null;
    trackName: string | null;
    onDelete: () => void;
    onUpdate: (updates: Partial<Clip>) => void;
}

export function EditorSelectionInspector({
    project,
    clip,
    trackName,
    onDelete,
    onUpdate,
}: EditorSelectionInspectorProps) {
    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected clip</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Inspector</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Caption timing, text content, and clip timing all stay in one focused editor.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <SlidersHorizontal className="h-5 w-5" />
                </div>
            </div>

            {!clip ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-slate-500">
                    Select any clip on the timeline to edit it here.
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-sm font-semibold text-white">{clip.type === "text" ? "Caption clip" : `${clip.type} clip`}</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Track: {trackName || "Unknown"} {project ? `· ${project.name}` : ""}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <NumericField
                            label="Start"
                            value={clip.startAtMs}
                            onChange={(value) => onUpdate({ startAtMs: Math.max(0, value) })}
                        />
                        <NumericField
                            label="Duration"
                            value={clip.durationMs}
                            onChange={(value) => onUpdate({ durationMs: Math.max(100, value) })}
                        />
                    </div>

                    {(clip.type === "video" || clip.type === "image" || clip.type === "text") && (
                        <div className="grid grid-cols-2 gap-3">
                            <NumericField
                                label="X"
                                value={clip.type === "text" ? clip.transform.x : ("transform" in clip ? clip.transform?.x ?? 0 : 0)}
                                onChange={(value) => onUpdate({ transform: { ...("transform" in clip ? clip.transform : {}), x: value } as any })}
                            />
                            <NumericField
                                label="Y"
                                value={clip.type === "text" ? clip.transform.y : ("transform" in clip ? clip.transform?.y ?? 0 : 0)}
                                onChange={(value) => onUpdate({ transform: { ...("transform" in clip ? clip.transform : {}), y: value } as any })}
                            />
                        </div>
                    )}

                    {clip.type === "text" && (
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                                <Type className="h-4 w-4" />
                                Caption text
                            </div>
                            <textarea
                                value={(clip as any).content}
                                onChange={(event) => onUpdate({ content: event.target.value } as Partial<Clip>)}
                                className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <NumericField
                                    label="Font size"
                                    value={(clip as any).style?.fontSize ?? 42}
                                    onChange={(value) =>
                                        onUpdate({
                                            style: {
                                                ...(clip as any).style,
                                                fontSize: value,
                                            },
                                        } as Partial<Clip>)
                                    }
                                />
                                <NumericField
                                    label="Opacity"
                                    value={100}
                                    onChange={() => {}}
                                    disabled
                                />
                            </div>
                        </div>
                    )}

                    {clip.type === "audio" && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                            Audio clips can be trimmed and repositioned here. Volume controls will stay in the same panel when the render stack is fully unified.
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/15"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete clip
                    </button>
                </div>
            )}
        </section>
    );
}

function NumericField({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}) {
    return (
        <label className="space-y-1">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {label}
            </span>
            <input
                type="number"
                disabled={disabled}
                value={Number.isFinite(value) ? value : 0}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </label>
    );
}
