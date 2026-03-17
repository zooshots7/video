"use client";

import { PreviewWrapper } from "@/components/editor/PreviewWrapper";
import type { EditorWorkflowStep, SourceSummary } from "../lib/editor-workflow";

interface EditorPreviewStageProps {
    step: EditorWorkflowStep;
    sourceSummary: SourceSummary | null;
    isDraggingOver: boolean;
}

const STEP_HINTS: Record<EditorWorkflowStep, string> = {
    source: "Load the raw clip first so the rest of the workflow can lock onto real media.",
    captions: "Turn the transcript into captions and make timing easy to edit later.",
    resources: "Add b-roll, music, SFX, and VFX directly into the timeline.",
    timeline: "Refine clip timing, split cuts, and polish the flow before export.",
    render: "Review the job state and queue the final export when everything is ready.",
};

export function EditorPreviewStage({ step, sourceSummary, isDraggingOver }: EditorPreviewStageProps) {
    return (
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/50 shadow-[0_30px_90px_rgba(0,0,0,0.58)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_30%)]" />
            <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                        {step === "source" ? "Source media first" : "Real-time preview"}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        {STEP_HINTS[step]}
                    </p>
                </div>
                {sourceSummary ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <p className="text-xs text-slate-400">{sourceSummary.name}</p>
                        <p className="text-sm font-medium text-white">
                            {sourceSummary.durationMs > 0
                                ? `${(sourceSummary.durationMs / 1000).toFixed(1)}s`
                                : "Duration pending"}
                            {" · "}
                            {sourceSummary.width && sourceSummary.height
                                ? `${sourceSummary.width}×${sourceSummary.height}`
                                : "Dimensions pending"}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-2 text-right">
                        <p className="text-xs text-slate-500">No source loaded yet</p>
                        <p className="text-xs text-slate-600">The stage will populate as soon as media is imported.</p>
                    </div>
                )}
            </div>

            <div className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(3,7,18,1),rgba(2,6,23,1))]">
                <PreviewWrapper />

                {isDraggingOver && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyan-400/15 backdrop-blur-sm">
                        <div className="rounded-full border border-cyan-300/30 bg-slate-950/70 px-5 py-3 text-sm font-medium text-white shadow-2xl">
                            Drop media to import it into the current step
                        </div>
                    </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 to-transparent px-5 py-4">
                    <div className="max-w-2xl">
                        <p className="text-sm font-medium text-white">{STEP_HINTS[step]}</p>
                        <p className="mt-1 text-xs text-slate-400">
                            Source uploads, captions, resource inserts, and render state all stay in this same workspace.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
