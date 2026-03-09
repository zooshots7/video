"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Player } from "@remotion/player";
import { TEMPLATES, getTemplateById } from "@video-editor/shared";
import { VideoComposition } from "@video-editor/video";
import { MOCK_TRANSCRIPT, MOCK_ZOOM_TIMESTAMPS } from "@/lib/mock-data";

const SAMPLE_VIDEO_URL =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4";

const FPS = 30;
const DURATION_SECONDS = 15;

interface ProjectData {
    id: string;
    title: string;
    video_url: string | null;
    hook_text: string;
    cta_text: string;
    accent_color: string;
    template_id: string | null;
    templates: {
        id: string;
        slug: string;
        name: string;
        accent_color: string;
        hook_config: Record<string, any>;
        caption_config: Record<string, any>;
        zoom_config: Record<string, any>;
        cta_config: Record<string, any>;
    } | null;
}

function ReviewContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("project");
    const templateParam = searchParams.get("template");

    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(!!projectId);
    const [hookText, setHookText] = useState("This will blow your mind 🤯");
    const [accentColor, setAccentColor] = useState("#6366F1");
    const [captionIntensity, setCaptionIntensity] = useState<"subtle" | "default" | "bold">("default");
    const [exporting, setExporting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load project from DB
    useEffect(() => {
        if (!projectId) return;
        async function loadProject() {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                const data = await res.json();
                if (data.ok && data.project) {
                    setProject(data.project);
                    if (data.project.hook_text) setHookText(data.project.hook_text);
                    if (data.project.accent_color) setAccentColor(data.project.accent_color);
                }
            } catch {
            } finally {
                setLoading(false);
            }
        }
        loadProject();
    }, [projectId]);

    // Determine template config
    const templateConfig = useMemo(() => {
        // If loaded from DB project with joined template
        if (project?.templates) {
            const t = project.templates;
            return {
                id: t.slug,
                name: t.name,
                description: "",
                accentColor: t.accent_color,
                hook: t.hook_config as any,
                caption: t.caption_config as any,
                zoom: t.zoom_config as any,
                cta: t.cta_config as any,
            };
        }
        // Fallback to URL param or first template
        const slug = templateParam ?? TEMPLATES[0].id;
        return getTemplateById(slug) ?? TEMPLATES[0];
    }, [project, templateParam]);

    const intensityLabel: Record<string, string> = { subtle: "Subtle", default: "Default", bold: "Bold" };
    const captionFontScale: Record<string, number> = { subtle: 0.8, default: 1, bold: 1.25 };

    const modifiedTemplate = useMemo(() => {
        const scale = captionFontScale[captionIntensity];
        return {
            ...templateConfig,
            accentColor,
            caption: {
                ...templateConfig.caption,
                fontSize: Math.round(templateConfig.caption.fontSize * scale),
                highlightColor: accentColor,
            },
            cta: {
                ...templateConfig.cta,
                background: accentColor,
            },
        };
    }, [templateConfig, accentColor, captionIntensity]);

    // Use the project's actual video URL or fall back to sample
    const videoUrl = project?.video_url || SAMPLE_VIDEO_URL;

    async function handleSave() {
        if (!projectId) return;
        setSaving(true);
        try {
            await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hookText,
                    accentColor,
                }),
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleExport() {
        if (projectId) await handleSave();
        setExporting(true);
        // TODO: wire to real render pipeline
        setTimeout(() => setExporting(false), 3000);
    }

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-slate-500">Loading project…</div>;
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left — Remotion Player */}
            <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Review &amp; Export
                </h1>
                <p className="text-sm text-slate-400">
                    {project ? (
                        <>Project: <span className="font-semibold text-white">{project.title}</span> · Template: <span className="font-semibold text-white">{templateConfig.name}</span></>
                    ) : (
                        <>Using template: <span className="font-semibold text-white">{templateConfig.name}</span></>
                    )}
                </p>

                <div className="relative mx-auto w-full max-w-[340px]">
                    <div className="overflow-hidden rounded-2xl border border-surface-border shadow-2xl shadow-accent/10">
                        <Player
                            component={VideoComposition}
                            inputProps={{
                                sourceVideoUrl: videoUrl,
                                transcriptWords: MOCK_TRANSCRIPT,
                                templateConfig: modifiedTemplate,
                                hookText,
                                ctaText: templateConfig.cta.buttonText ?? "Follow for more",
                                zoomTimestamps: MOCK_ZOOM_TIMESTAMPS,
                                durationInFrames: DURATION_SECONDS * FPS,
                                fps: FPS,
                            }}
                            durationInFrames={DURATION_SECONDS * FPS}
                            compositionWidth={1080}
                            compositionHeight={1920}
                            fps={FPS}
                            style={{ width: "100%", aspectRatio: "9 / 16" }}
                            controls
                            autoPlay
                            loop
                            acknowledgeRemotionLicense
                        />
                    </div>
                </div>
            </div>

            {/* Right — Controls */}
            <div className="space-y-6">
                <div className="glass-card space-y-6 p-6">
                    <h2 className="text-lg font-bold text-white">Customise</h2>

                    {/* Hook Text */}
                    <div className="space-y-2">
                        <label htmlFor="hook-text" className="text-sm font-medium text-slate-300">Hook Text</label>
                        <input
                            id="hook-text"
                            type="text"
                            value={hookText}
                            onChange={(e) => setHookText(e.target.value)}
                            className="w-full rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40"
                        />
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Accent Color</label>
                        <div className="flex gap-3">
                            {["#6366F1", "#F43F5E", "#0EA5E9", "#10B981", "#F59E0B"].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setAccentColor(c)}
                                    className={`h-9 w-9 rounded-full border-2 transition-all ${accentColor === c ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-surface-border hover:border-accent/40">
                                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="sr-only" />
                            </label>
                        </div>
                    </div>

                    {/* Caption Intensity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Caption Intensity</label>
                        <div className="flex gap-2">
                            {(["subtle", "default", "bold"] as const).map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setCaptionIntensity(level)}
                                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${captionIntensity === level ? "border-accent bg-accent/10 text-accent" : "border-surface-border text-slate-400 hover:border-surface-hover hover:text-slate-300"}`}
                                >
                                    {intensityLabel[level]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    {projectId && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 rounded-lg border border-surface-border py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-surface-hover hover:text-white disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 rounded-lg bg-gradient-to-r from-accent to-accent-pink py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition-all hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
                    >
                        {exporting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Exporting…
                            </span>
                        ) : "Export MP4 ↓"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-slate-500">Loading…</div>}>
            <ReviewContent />
        </Suspense>
    );
}
