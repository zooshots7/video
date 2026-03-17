import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { ProjectCard } from "@/components/ProjectCard";
import type { DashboardProject } from "@video-editor/shared";

const statusBadge: Record<string, string> = {
    draft: "bg-surface-border/50 text-slate-400",
    processing: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    failed: "bg-red-500/15 text-red-400 border border-red-500/20",
};

async function getProjects(): Promise<DashboardProject[]> {
    try {
        const supabase = createServerClient();
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as DashboardProject[];
    } catch {
        return [];
    }
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const projects = await getProjects();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Your Projects
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Create social-ready shorts from your talking-head videos.
                    </p>
                </div>
                <Link
                    href="/new"
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95"
                >
                    + New Project
                </Link>
            </div>

            {/* Project Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                ))}

                {/* Empty state / create new card */}
                <Link
                    href="/new"
                    className="glass-card glow-hover flex flex-col items-center justify-center gap-3 p-5 text-center transition-all hover:bg-surface-hover/50"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                        <svg
                            className="h-7 w-7 text-accent"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-400">
                        Create New Project
                    </span>
                </Link>
            </div>

            {/* Empty state message */}
            {projects.length === 0 && (
                <div className="text-center text-sm text-slate-500 mt-4">
                    No projects yet. Upload your first video to get started!
                </div>
            )}
        </div>
    );
}
