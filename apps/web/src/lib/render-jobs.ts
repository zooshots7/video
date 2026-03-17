import { randomUUID } from "crypto";
import { Project, ProjectSchema } from "@video-editor/timeline-schema";
import { createAdminClient } from "@/lib/supabase";
import { renderQueue } from "@/lib/queue";
import type { DbRenderJob } from "@video-editor/shared";

export interface RenderQueuePayload {
    project: Project;
    renderJobId: string;
}

export interface RenderJobDto {
    id: string;
    projectId: string;
    status: DbRenderJob["status"];
    progress: number;
    outputUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

export function toRenderJobDto(job: DbRenderJob): RenderJobDto {
    return {
        id: job.id,
        projectId: job.project_id,
        status: job.status,
        progress: job.progress,
        outputUrl: job.output_url,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
    };
}

export async function getRenderJobById(jobId: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("render_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

    return (data as DbRenderJob | null) ?? null;
}

export async function listRenderJobsForProject(projectId: string, limit = 5) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("render_jobs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(limit);

    return (data ?? []) as DbRenderJob[];
}

export async function getActiveRenderJobForProject(projectId: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("render_jobs")
        .select("*")
        .eq("project_id", projectId)
        .in("status", ["queued", "rendering"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return (data as DbRenderJob | null) ?? null;
}

export async function queueRenderProject(options: {
    project: Project;
    renderJobId?: string;
}) {
    const project = ProjectSchema.parse(options.project);
    const supabase = createAdminClient();

    if (!options.renderJobId) {
        const activeJob = await getActiveRenderJobForProject(project.id);
        if (activeJob) {
            return { job: activeJob, renderJobId: activeJob.id, queued: false };
        }
    }

    const renderJobId = options.renderJobId ?? randomUUID();

    const existingJob = await getRenderJobById(renderJobId);

    if (existingJob) {
        return { job: existingJob, renderJobId, queued: false };
    }

    const { data: job, error } = await supabase
        .from("render_jobs")
        .insert({
            id: renderJobId,
            project_id: project.id,
            status: "queued",
            progress: 0,
        })
        .select()
        .single();

    if (error || !job) {
        throw new Error(`Failed to create render job: ${error?.message ?? "unknown error"}`);
    }

    await renderQueue.add(
        "render-project",
        { project, renderJobId } satisfies RenderQueuePayload,
        {
            jobId: renderJobId,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5_000,
            },
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 100 },
        }
    );

    return { job, renderJobId, queued: true };
}
