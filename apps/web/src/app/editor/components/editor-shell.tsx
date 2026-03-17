"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { AlertTriangle, CheckCircle2, Save, Sparkles, Keyboard } from "lucide-react";
import { useEditorStore } from "@video-editor/editor-core";
import { EditorStepper } from "./editor-stepper";
import { EditorPreviewStage } from "./editor-preview-stage";
import { EditorSourcePanel } from "./editor-source-panel";
import { EditorTranscriptPanel } from "./editor-transcript-panel";
import { EditorResourcesPanel } from "./editor-resources-panel";
import { EditorTimelinePanel } from "./editor-timeline-panel";
import { EditorRenderPanel } from "./editor-render-panel";
import { EditorSelectionInspector } from "./editor-selection-inspector";
import type { EditorWorkflowStep } from "../lib/editor-workflow";
import { summarizeProject } from "../lib/editor-workflow";
import { useEditorWorkflow } from "../hooks/use-editor-workflow";
import type { Clip } from "@video-editor/timeline-schema";

const STEP_GUIDANCE: Record<EditorWorkflowStep, string> = {
    source: "Upload the raw source to unlock the rest of the workflow.",
    captions: "Generate captions, then refine the transcript groups that matter.",
    resources: "Browse the library and insert b-roll, SFX, music, or effects.",
    timeline: "Polish clip timing, selected clip content, and the overall flow.",
    render: "Save, queue the export, and watch the render job finish.",
};

export function EditorShell() {
    const workflow = useEditorWorkflow();
    const { project, playheadMs, isPlaying, setIsPlaying, selectedClipId, selectClip, updateClip, deleteClip, setActiveTool, snappingEnabled, setSnappingEnabled } = useEditorStore();
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const summary = useMemo(() => (project ? summarizeProject(project) : null), [project]);

    const selectedClipInfo = useMemo(() => {
        if (!project || !selectedClipId) return null;
        for (const track of project.tracks) {
            const clip = track.clips.find((candidate) => candidate.id === selectedClipId);
            if (clip) {
                return { clip, track };
            }
        }
        return null;
    }, [project, selectedClipId]);

    const captionClips = useMemo(
        () =>
            project?.tracks
                .find((track) => track.type === "text")
                ?.clips.filter((clip): clip is Clip & { type: "text" } => clip.type === "text")
                .map((clip) => ({
                    id: clip.id,
                    content: clip.content,
                    startAtMs: clip.startAtMs,
                    durationMs: clip.durationMs,
                })) ?? [],
        [project]
    );

    const completed: Record<EditorWorkflowStep, boolean> = {
        source: Boolean(summary?.hasSourceClip || workflow.sourceSummary),
        captions: Boolean(captionClips.length || workflow.transcriptWords.length),
        resources: Boolean(summary && summary.resources > 0),
        timeline: Boolean(summary && summary.resources > 0 && summary.hasSourceClip),
        render:
            workflow.renderSummary.status === "queued" ||
            workflow.renderSummary.status === "rendering" ||
            workflow.renderSummary.status === "done",
    };

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) return;

            switch (event.key.toLowerCase()) {
                case "a":
                    setActiveTool("select");
                    break;
                case "b":
                    setActiveTool("blade");
                    break;
                case "n":
                    setSnappingEnabled(!snappingEnabled);
                    break;
                case " ":
                    event.preventDefault();
                    setIsPlaying(!isPlaying);
                    break;
                case "delete":
                case "backspace":
                    if (selectedClipInfo) {
                        deleteClip(selectedClipInfo.track.id, selectedClipInfo.clip.id);
                        selectClip(null);
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [deleteClip, isPlaying, selectClip, selectedClipInfo, setActiveTool, setIsPlaying, setSnappingEnabled, snappingEnabled]);

    async function handleFileImport(file: File) {
        if (workflow.activeStep === "source" && file.type.startsWith("video/")) {
            await workflow.importSourceFile(file);
            return;
        }

        if (file.type.startsWith("audio/")) {
            await workflow.importResourceFile(file, "music");
            return;
        }

        if (file.type.startsWith("image/")) {
            await workflow.importResourceFile(file, "broll");
            return;
        }

        await workflow.importResourceFile(file, "broll");
    }

    async function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDraggingOver(false);
        const files = Array.from(event.dataTransfer.files);
        if (!files.length) return;

        for (const file of files) {
            await handleFileImport(file);
        }
    }

    if (workflow.loadError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
                <div className="max-w-xl rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-rose-200" />
                        <h1 className="text-lg font-semibold">Editor failed to load</h1>
                    </div>
                    <p className="mt-3 text-sm text-rose-100/90">{workflow.loadError}</p>
                </div>
            </div>
        );
    }

    if (workflow.isBootstrapping || !project) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-slate-300">
                    Preparing your editor workspace…
                </div>
            </div>
        );
    }

    const activePanel = (() => {
        switch (workflow.activeStep) {
            case "source":
                return (
                    <EditorSourcePanel
                        sourceSummary={workflow.sourceSummary}
                        transcriptCount={workflow.transcriptWords.length}
                        onImportSource={async (file) => {
                            await workflow.importSourceFile(file);
                        }}
                        onTranscribe={async () => {
                            await workflow.transcribeProject();
                        }}
                    />
                );
            case "captions":
                return (
                    <EditorTranscriptPanel
                        transcriptCount={workflow.transcriptWords.length}
                        captionClips={captionClips}
                        selectedClipId={selectedClipId}
                        onTranscribe={async () => {
                            await workflow.transcribeProject();
                        }}
                        onSelectCaptionClip={(clipId) => selectClip(clipId)}
                    />
                );
            case "resources":
                return (
                    <EditorResourcesPanel
                        currentTimeMs={playheadMs}
                        onAddLibraryAsset={workflow.addLibraryAssetToTimeline}
                        onImportMedia={workflow.importResourceFile}
                    />
                );
            case "timeline":
                return <EditorTimelinePanel projectClipCount={project.tracks.reduce((count, track) => count + track.clips.length, 0)} />;
            case "render":
                return (
                    <EditorRenderPanel
                        renderSummary={workflow.renderSummary}
                        recentRenderJobs={workflow.recentRenderJobs}
                        onQueueRender={workflow.queueRender}
                    />
                );
        }
    })();

    return (
        <div
            className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.10),transparent_24%),linear-gradient(180deg,#050816_0%,#020617_55%,#01020a_100%)] text-white"
            onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(event) => void handleDrop(event)}
        >
            <div className="mx-auto flex min-h-screen max-w-[1760px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
                <header className="rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-500">
                                <Sparkles className="h-4 w-4 text-cyan-300" />
                                /editor workspace
                            </div>
                            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
                                One guided workspace from raw footage to final render
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                                The editor now leads with the source, captions, resources, timeline, and render as one coherent path instead of a pile of disconnected controls.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            <StatusPill
                                label={
                                    workflow.saveStatus === "saved"
                                        ? "Saved"
                                        : workflow.saveStatus === "saving"
                                            ? "Saving"
                                            : workflow.saveStatus === "error"
                                                ? "Save failed"
                                                : "Autosave"
                                }
                                tone={
                                    workflow.saveStatus === "error"
                                        ? "rose"
                                        : workflow.saveStatus === "saved"
                                            ? "emerald"
                                            : "neutral"
                                }
                            />
                            <StatusPill
                                label={
                                    workflow.renderSummary.status === "rendering"
                                        ? `Rendering ${workflow.renderSummary.progress}%`
                                        : workflow.renderSummary.status === "queued"
                                            ? "Render queued"
                                            : workflow.renderSummary.status === "done"
                                                ? "Render ready"
                                                : "Render idle"
                                }
                                tone={
                                    workflow.renderSummary.status === "done"
                                        ? "emerald"
                                        : workflow.renderSummary.status === "queued" || workflow.renderSummary.status === "rendering"
                                            ? "cyan"
                                            : "neutral"
                                }
                            />
                            <button
                                type="button"
                                onClick={() => void workflow.saveProject()}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <Save className="h-4 w-4" />
                                Save now
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Current step
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    {workflow.activeStep === "source"
                                        ? "Load source media"
                                        : workflow.activeStep === "captions"
                                            ? "Shape captions"
                                            : workflow.activeStep === "resources"
                                                ? "Insert resources"
                                                : workflow.activeStep === "timeline"
                                                    ? "Polish the timeline"
                                                    : "Queue the final render"}
                                </h2>
                                <p className="mt-1 max-w-3xl text-sm text-slate-400">
                                    {STEP_GUIDANCE[workflow.activeStep]}
                                </p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                                Step {Math.max(1, WORKFLOW_ORDER.indexOf(workflow.activeStep) + 1)} of 5
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <EditorStepper activeStep={workflow.activeStep} onStepChange={workflow.setActiveStep} completed={completed} />
                    </div>
                </header>

                <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
                    <main className="space-y-6">
                        <EditorPreviewStage
                            step={workflow.activeStep}
                            sourceSummary={workflow.sourceSummary}
                            isDraggingOver={isDraggingOver}
                        />
                        {activePanel}
                    </main>

                    <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Project overview</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <StatCard label="Project ID" value={workflow.projectId ?? "Pending"} />
                                <StatCard label="Source" value={workflow.sourceSummary ? "Loaded" : "Waiting"} />
                                <StatCard label="Captions" value={captionClips.length > 0 ? `${captionClips.length} groups` : "None"} />
                                <StatCard label="Resources" value={summary ? `${summary.resources} clips` : "Unknown"} />
                                <StatCard label="Next action" value={STEP_GUIDANCE[workflow.activeStep]} />
                            </div>
                        </section>

                        <EditorSelectionInspector
                            project={project}
                            clip={selectedClipInfo?.clip ?? null}
                            trackName={selectedClipInfo?.track.name ?? null}
                            onDelete={() => {
                                if (!selectedClipInfo) return;
                                deleteClip(selectedClipInfo.track.id, selectedClipInfo.clip.id);
                                selectClip(null);
                            }}
                            onUpdate={(updates) => {
                                if (!selectedClipInfo) return;
                                updateClip(selectedClipInfo.track.id, selectedClipInfo.clip.id, updates);
                            }}
                        />

                        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                                <Keyboard className="h-4 w-4" />
                                Shortcuts
                            </div>
                            <div className="mt-4 space-y-3 text-sm text-slate-400">
                                <Shortcut keyText="Space" label="Play / pause" />
                                <Shortcut keyText="A" label="Select tool" />
                                <Shortcut keyText="B" label="Blade tool" />
                                <Shortcut keyText="N" label="Toggle snapping" />
                                <Shortcut keyText="Delete" label="Remove selected clip" />
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function StatusPill({ label, tone }: { label: string; tone: "neutral" | "cyan" | "emerald" | "rose" }) {
    const classes = {
        neutral: "border-white/10 bg-white/5 text-slate-200",
        cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
        emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
        rose: "border-rose-400/20 bg-rose-400/10 text-rose-100",
    }[tone];

    return <div className={`rounded-full border px-4 py-2 text-sm font-medium ${classes}`}>{label}</div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
    );
}

function Shortcut({ keyText, label }: { keyText: string; label: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <span className="text-slate-400">{label}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {keyText}
            </span>
        </div>
    );
}

const WORKFLOW_ORDER: EditorWorkflowStep[] = ["source", "captions", "resources", "timeline", "render"];
