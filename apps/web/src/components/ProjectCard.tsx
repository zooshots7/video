"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardProject } from "@video-editor/shared";

const statusBadge: Record<DashboardProject["status"], string> = {
    draft: "bg-surface-border/50 text-slate-400",
    processing: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    failed: "bg-red-500/15 text-red-400 border border-red-500/20",
};

export function ProjectCard({ project }: { project: DashboardProject }) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(project.title);
    const [deleting, setDeleting] = useState(false);

    const href = `/editor?project=${project.id}`;

    async function handleDelete() {
        if (!confirm("Delete this project? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
            router.refresh();
        } finally {
            setDeleting(false);
            setShowMenu(false);
        }
    }

    async function handleRename() {
        if (!newTitle.trim() || newTitle === project.title) {
            setRenaming(false);
            return;
        }
        try {
            await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() }),
            });
            router.refresh();
        } finally {
            setRenaming(false);
        }
    }

    return (
        <div className="glass-card glow-hover group relative flex flex-col gap-4 p-5 transition-all hover:bg-surface-hover/50">
            {/* Action menu button */}
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(!showMenu);
                }}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-surface-hover/60 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-hover hover:text-white"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
                <div className="absolute right-3 top-11 z-20 min-w-[140px] rounded-lg border border-surface-border bg-surface-card p-1 shadow-xl">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setRenaming(true);
                            setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-surface-hover hover:text-white"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                        </svg>
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={deleting}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        {deleting ? "Deleting…" : "Delete"}
                    </button>
                </div>
            )}

            <Link href={href} className="flex flex-col gap-4">
                {/* Thumbnail area */}
                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-surface-hover to-surface">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110">
                        <svg
                            className="h-7 w-7 text-accent"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                        </svg>
                    </div>
                    <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[project.status] ?? statusBadge.draft}`}
                    >
                        {project.status}
                    </span>
                </div>

                {/* Info */}
                <div>
                    {renaming ? (
                        <div
                            className="flex gap-2"
                            onClick={(e) => e.preventDefault()}
                        >
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRename();
                                    if (e.key === "Escape") setRenaming(false);
                                }}
                                autoFocus
                                className="flex-1 rounded border border-accent/40 bg-surface px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-accent/40"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRename();
                                }}
                                className="rounded bg-accent/20 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/30"
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
                            {project.title}
                        </h3>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                        {new Date(project.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </Link>
        </div>
    );
}
