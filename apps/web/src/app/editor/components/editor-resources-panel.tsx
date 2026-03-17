"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LibraryBig, Music3, Sparkles, ScissorsLineDashed, Film } from "lucide-react";
import type { Asset } from "@video-editor/timeline-schema";

type ResourceTab = "vfx" | "sfx" | "broll" | "music";

interface LibraryRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    is_premium: boolean;
    sort_order: number;
    preview_url?: string | null;
    file_url?: string;
    duration_ms?: number;
    vfx_type?: string;
    sfx_type?: string;
    bpm?: number;
    mood?: string;
    genre?: string;
    artist?: string;
    config?: Record<string, unknown>;
}

interface CategoryRow {
    slug: string;
    name: string;
}

interface EditorResourcesPanelProps {
    currentTimeMs: number;
    onAddLibraryAsset: (
        resourceType: ResourceTab,
        asset: Asset,
        config?: Record<string, unknown>
    ) => Promise<void>;
    onImportMedia: (file: File, resourceType: ResourceTab) => Promise<void>;
}

const TABS: Array<{
    key: ResourceTab;
    label: string;
    icon: ReactNode;
}> = [
    { key: "vfx", label: "VFX", icon: <Sparkles className="h-4 w-4" /> },
    { key: "sfx", label: "SFX", icon: <ScissorsLineDashed className="h-4 w-4" /> },
    { key: "broll", label: "B-roll", icon: <Film className="h-4 w-4" /> },
    { key: "music", label: "Music", icon: <Music3 className="h-4 w-4" /> },
];

export function EditorResourcesPanel({
    currentTimeMs,
    onAddLibraryAsset,
    onImportMedia,
}: EditorResourcesPanelProps) {
    const [activeTab, setActiveTab] = useState<ResourceTab>("broll");
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [assets, setAssets] = useState<LibraryRow[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ type: activeTab });
                if (activeCategory) params.set("category", activeCategory);
                const res = await fetch(`/api/assets?${params}`);
                const data = await res.json().catch(() => null);
                if (!res.ok || !data?.ok) {
                    throw new Error(data?.error || "Failed to load assets");
                }
                if (!cancelled) {
                    setAssets(data.assets ?? []);
                    setCategories(data.categories ?? []);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message ?? "Failed to load assets");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [activeTab, activeCategory]);

    async function handleAdd(asset: LibraryRow) {
        setAddingId(asset.id);
        setError(null);
        try {
            const timelineAsset = buildTimelineAsset(asset, activeTab);
            await onAddLibraryAsset(activeTab, timelineAsset, asset.config);
        } catch (err: any) {
            setError(err?.message ?? "Failed to add asset");
        } finally {
            setAddingId(null);
        }
    }

    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step 3</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Resources</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Add library clips and place them on the timeline at the current playhead.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <LibraryBig className="h-5 w-5" />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.key);
                                setActiveCategory(null);
                            }}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-cyan-400 text-slate-950"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <FilterChip active={!activeCategory} onClick={() => setActiveCategory(null)}>
                        All
                    </FilterChip>
                    {categories.map((category) => (
                        <FilterChip key={category.slug} active={category.slug === activeCategory} onClick={() => setActiveCategory(category.slug)}>
                            {category.name}
                        </FilterChip>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-400">
                <span>{loading ? "Loading library…" : `${assets.length} assets available`}</span>
                <span>Insert at {formatTime(currentTimeMs)}</span>
            </div>

            <div className="grid gap-3">
                {error && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
                        Loading resources…
                    </div>
                ) : assets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
                        No assets in this category yet.
                    </div>
                ) : (
                    assets.map((asset) => (
                        <button
                            key={asset.id}
                            type="button"
                            onClick={() => void handleAdd(asset)}
                            className="group rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition-all hover:border-cyan-400/35 hover:bg-white/[0.04]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                        {asset.name}
                                        {asset.is_premium && <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">Pro</span>}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                        {describeAsset(asset, activeTab)}
                                    </p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    {addingId === asset.id ? "Adding…" : "Add"}
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Quick import</p>
                <p className="mt-1 text-sm text-slate-400">
                    Drop a local file here or use the source step upload. Imported media will be inserted straight into the timeline.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => pickFile("video/*", (file) => onImportMedia(file, "broll"))}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
                    >
                        Import B-roll
                    </button>
                    <button
                        type="button"
                        onClick={() => pickFile("audio/*", (file) => onImportMedia(file, "music"))}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
                    >
                        Import audio
                    </button>
                </div>
            </div>
        </section>
    );
}

function buildTimelineAsset(asset: LibraryRow, resourceType: ResourceTab): Asset {
    const url =
        resourceType === "vfx"
            ? asset.preview_url || `https://example.com/vfx/${asset.id}`
            : asset.file_url || asset.preview_url || `https://example.com/resource/${asset.id}`;

    return {
        id: asset.id,
        type: resourceType === "music" || resourceType === "sfx" ? "audio" : resourceType === "broll" ? "video" : "effect",
        url,
        name: asset.name,
        durationMs: asset.duration_ms ?? 1500,
    };
}

function describeAsset(asset: LibraryRow, resourceType: ResourceTab): string {
    if (resourceType === "vfx") {
        return asset.vfx_type ? `${asset.vfx_type} effect` : asset.description || "Visual effect preset";
    }
    if (resourceType === "sfx") {
        return [asset.sfx_type, asset.duration_ms ? `${(asset.duration_ms / 1000).toFixed(1)}s` : null]
            .filter(Boolean)
            .join(" · ");
    }
    if (resourceType === "music") {
        return [asset.artist, asset.genre, asset.bpm ? `${asset.bpm} BPM` : null]
            .filter(Boolean)
            .join(" · ");
    }
    return [asset.description, asset.duration_ms ? `${(asset.duration_ms / 1000).toFixed(1)}s` : null]
        .filter(Boolean)
        .join(" · ");
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
        >
            {children}
        </button>
    );
}

function formatTime(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

async function pickFile(accept: string, onPick: (file: File) => Promise<void>) {
    return await new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                await onPick(file);
            }
            resolve();
        };
        input.click();
    });
}
