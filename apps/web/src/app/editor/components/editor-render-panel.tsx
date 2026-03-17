"use client";

import { useState } from "react";
import { Rocket, PlayCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { RecentRenderJob, RenderSummary } from "../lib/editor-workflow";

interface EditorRenderPanelProps {
    renderSummary: RenderSummary;
    recentRenderJobs: RecentRenderJob[];
    onQueueRender: () => Promise<void>;
}

export function EditorRenderPanel({ renderSummary, recentRenderJobs, onQueueRender }: EditorRenderPanelProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleQueue() {
        setBusy(true);
        setError(null);
        try {
            await onQueueRender();
        } catch (err: any) {
            setError(err?.message ?? "Failed to queue render");
        } finally {
            setBusy(false);
        }
    }

    const statusTone =
        renderSummary.status === "done"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
            : renderSummary.status === "failed"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                : renderSummary.status === "queued" || renderSummary.status === "rendering"
                    ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-black/25 text-slate-300";

    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step 5</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Render</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Save the project, queue the export, and surface the current job state in the same place.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <Rocket className="h-5 w-5" />
                </div>
            </div>

            <button
                type="button"
                onClick={() => void handleQueue()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
                <PlayCircle className="h-4 w-4" />
                {busy ? "Queueing render…" : "Queue final render"}
            </button>

            <div className={`rounded-2xl border px-4 py-4 ${statusTone}`}>
                <div className="flex items-start gap-3">
                    {renderSummary.status === "done" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                    ) : renderSummary.status === "failed" ? (
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
                    ) : (
                        <Rocket className="mt-0.5 h-5 w-5 text-cyan-300" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium capitalize text-white">{renderSummary.status}</p>
                        <p className="mt-1 text-sm text-slate-300">
                            {renderSummary.message || "No render job has been queued yet."}
                        </p>
                        {(renderSummary.status === "queued" || renderSummary.status === "rendering") && (
                            <div className="mt-3 space-y-2">
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-[width] duration-500"
                                        style={{ width: `${Math.max(4, renderSummary.progress)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400">{renderSummary.progress}% complete</p>
                            </div>
                        )}
                        {renderSummary.jobId && (
                            <p className="mt-2 text-xs text-slate-500">
                                Job ID: <span className="font-mono text-slate-300">{renderSummary.jobId}</span>
                            </p>
                        )}
                        {renderSummary.outputUrl && (
                            <a
                                href={renderSummary.outputUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                            >
                                Open final output
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white">Recent renders</h4>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {recentRenderJobs.length} tracked
                    </p>
                </div>

                <div className="mt-3 space-y-3">
                    {recentRenderJobs.length ? (
                        recentRenderJobs.map((job) => (
                            <div
                                key={job.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium capitalize text-white">{job.status}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(job.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    {job.status === "failed"
                                        ? job.errorMessage ?? "Render failed."
                                        : job.status === "done"
                                            ? "Final output is ready to open."
                                            : `${job.progress}% complete`}
                                </p>
                                {job.outputUrl ? (
                                    <a
                                        href={job.outputUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                                    >
                                        Open output
                                    </a>
                                ) : null}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-400">
                            Recent renders will stay visible here after refresh once you queue the first export.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
