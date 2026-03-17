"use client";

import { FileText, Captions, WandSparkles } from "lucide-react";

export interface CaptionClipSummary {
    id: string;
    content: string;
    startAtMs: number;
    durationMs: number;
}

interface EditorTranscriptPanelProps {
    transcriptCount: number;
    captionClips: CaptionClipSummary[];
    selectedClipId: string | null;
    onTranscribe: () => Promise<void>;
    onSelectCaptionClip: (clipId: string) => void;
}

export function EditorTranscriptPanel({
    transcriptCount,
    captionClips,
    selectedClipId,
    onTranscribe,
    onSelectCaptionClip,
}: EditorTranscriptPanelProps) {
    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step 2</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Transcript + captions</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Generate transcript words, then refine caption groups in the timeline inspector.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <Captions className="h-5 w-5" />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Transcript" value={transcriptCount > 0 ? `${transcriptCount} words` : "Not generated"} />
                <Metric label="Caption groups" value={captionClips.length > 0 ? `${captionClips.length} clips` : "None yet"} />
                <Metric label="Editing" value={captionClips.length > 0 ? "Live on the timeline" : "Generate once to start"} />
            </div>

            <button
                type="button"
                onClick={() => void onTranscribe()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition-transform hover:scale-[1.01]"
            >
                <WandSparkles className="h-4 w-4" />
                {transcriptCount > 0 ? "Re-run transcription" : "Generate captions from source"}
            </button>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    <FileText className="h-4 w-4" />
                    Caption groups
                </div>

                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                    {captionClips.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-slate-500">
                            No caption clips yet. Run transcription to create editable groups on the captions track.
                        </div>
                    ) : (
                        captionClips.map((clip) => {
                            const isSelected = clip.id === selectedClipId;
                            return (
                                <button
                                    key={clip.id}
                                    type="button"
                                    onClick={() => onSelectCaptionClip(clip.id)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                        isSelected
                                            ? "border-cyan-400/50 bg-cyan-400/10"
                                            : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">{clip.content}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {(clip.startAtMs / 1000).toFixed(1)}s · {(clip.durationMs / 1000).toFixed(1)}s
                                            </p>
                                        </div>
                                        {isSelected && <span className="rounded-full bg-cyan-400 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950">Selected</span>}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
    );
}

