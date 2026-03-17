"use client";

import { useRef, useState } from "react";
import { UploadCloud, Video } from "lucide-react";
import type { SourceSummary } from "../lib/editor-workflow";

interface EditorSourcePanelProps {
    sourceSummary: SourceSummary | null;
    transcriptCount: number;
    onImportSource: (file: File) => Promise<void>;
    onTranscribe: () => Promise<void>;
}

export function EditorSourcePanel({
    sourceSummary,
    transcriptCount,
    onImportSource,
    onTranscribe,
}: EditorSourcePanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFilePick(file: File | null) {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            await onImportSource(file);
        } catch (err: any) {
            setError(err?.message ?? "Failed to import the source video");
        } finally {
            setUploading(false);
        }
    }

    async function handleTranscribe() {
        setTranscribing(true);
        setError(null);
        try {
            await onTranscribe();
        } catch (err: any) {
            setError(err?.message ?? "Failed to transcribe the source video");
        } finally {
            setTranscribing(false);
        }
    }

    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step 1</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Source media</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Import the raw video once and the rest of the editor will keep using that same project anchor.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <Video className="h-5 w-5" />
                </div>
            </div>

            {sourceSummary ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-white">{sourceSummary.name}</p>
                            <p className="text-xs text-slate-500">{sourceSummary.url}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
                        >
                            Replace source
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <Metric label="Duration" value={sourceSummary.durationMs ? `${(sourceSummary.durationMs / 1000).toFixed(1)}s` : "Pending"} />
                        <Metric label="Dimensions" value={sourceSummary.width && sourceSummary.height ? `${sourceSummary.width}×${sourceSummary.height}` : "Pending"} />
                        <Metric label="Audio" value={sourceSummary.hasAudio === "unknown" ? "Unknown" : sourceSummary.hasAudio ? "Detected" : "None"} />
                        <Metric label="Transcript" value={transcriptCount > 0 ? `${transcriptCount} words ready` : "Not generated yet"} />
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-400/30 bg-cyan-400/[0.04] px-6 py-10 text-center transition-colors hover:border-cyan-400/55 hover:bg-cyan-400/[0.08]"
                >
                    <UploadCloud className="h-8 w-8 text-cyan-300" />
                    <p className="mt-4 text-base font-semibold text-white">Upload raw video</p>
                    <p className="mt-1 text-sm text-slate-400">MP4, MOV, or WebM. The editor will probe the duration and dimensions automatically.</p>
                </button>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {uploading ? "Importing…" : sourceSummary ? "Choose different video" : "Upload source"}
                </button>
                <button
                    type="button"
                    disabled={transcribing || !sourceSummary}
                    onClick={handleTranscribe}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {transcribing ? "Transcribing…" : transcriptCount > 0 ? "Re-run transcription" : "Generate captions"}
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                    void handleFilePick(event.target.files?.[0] ?? null).finally(() => {
                        event.target.value = "";
                    });
                }}
            />
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
