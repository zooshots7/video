"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface DbTemplate {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    accent_color: string;
    is_premium: boolean;
    zoom_config: Record<string, any>;
    caption_config: Record<string, any>;
}

const accentMap: Record<string, string> = {
    "#6366F1": "from-indigo-500 to-purple-600",
    "#F43F5E": "from-rose-500 to-pink-600",
    "#0EA5E9": "from-sky-500 to-cyan-600",
};

function TemplatesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get("project");

    const [templates, setTemplates] = useState<DbTemplate[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTemplates() {
            try {
                const res = await fetch("/api/templates");
                const data = await res.json();
                if (data.ok) {
                    setTemplates(data.templates);
                }
            } catch {
                setError("Failed to load templates");
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, []);

    async function handleContinue() {
        if (!selected || !projectId) return;
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: selected }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save");

            router.push(`/review?project=${projectId}`);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center text-slate-500">
                Loading templates…
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Choose a Template
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Pick a style that fits your content. You can customise colors later.
                </p>
                {!projectId && (
                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
                        No project selected.{" "}
                        <a href="/new" className="underline hover:text-amber-300">Upload a video first →</a>
                    </div>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => {
                    const isSelected = selected === t.id;
                    const zoom = t.zoom_config as any;
                    const caption = t.caption_config as any;

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelected(t.id)}
                            className={`glass-card glow-hover group relative flex flex-col gap-4 p-5 text-left transition-all hover:bg-surface-hover/50 ${isSelected ? "ring-2 ring-accent shadow-lg shadow-accent/20" : ""
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent shadow-lg">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                            )}

                            <div
                                className={`flex h-44 items-end overflow-hidden rounded-lg bg-gradient-to-br ${accentMap[t.accent_color] ?? "from-slate-600 to-slate-800"} p-4 transition-transform group-hover:scale-[1.02]`}
                            >
                                <div className="mx-auto flex h-full w-24 flex-col justify-between overflow-hidden rounded-lg bg-black/40 p-2 backdrop-blur-sm">
                                    <div className="rounded bg-white/10 px-2 py-1">
                                        <div className="h-1.5 w-10 rounded-full bg-white/40" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-1 w-full rounded-full bg-white/20" />
                                        <div className="h-1 w-3/4 rounded-full bg-white/30" />
                                        <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: t.accent_color }} />
                                    </div>
                                    <div className="rounded px-1 py-0.5 text-center" style={{ backgroundColor: t.accent_color }}>
                                        <div className="h-1 w-8 mx-auto rounded-full bg-white/60" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-slate-400">{t.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {[
                                    `Zoom ${zoom?.scale ?? 1.2}×`,
                                    caption?.position === "center" ? "Centred captions" : "Bottom captions",
                                    zoom?.easing === "spring" ? "Spring zoom" : "Smooth zoom",
                                ].map((tag) => (
                                    <span key={tag} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-slate-400">{tag}</span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={!selected || !projectId || saving}
                    onClick={handleContinue}
                    className="rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                    {saving ? "Saving…" : "Generate Preview →"}
                </button>
            </div>
        </div>
    );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-slate-500">Loading…</div>}>
            <TemplatesContent />
        </Suspense>
    );
}
