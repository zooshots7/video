/**
 * @video-editor/render-worker
 *
 * BullMQ worker that processes canonical timeline render jobs.
 * Queue orchestration lives here; the Remotion bundle/render/upload work is
 * delegated to `render-pipeline.ts`.
 */

import { Job, Worker } from "bullmq";
import Redis from "ioredis";
import { createClient } from "@supabase/supabase-js";
import { Project, ProjectSchema } from "@video-editor/timeline-schema";
import { renderTimelineProject, RenderPipelineProgress } from "./render-pipeline";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const QUEUE_NAME = "video-render-queue";

const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface RenderQueuePayload {
    project: Project;
    renderJobId: string;
}

async function updateRenderJob(renderJobId: string, patch: Record<string, unknown>) {
    await supabase
        .from("render_jobs")
        .update(patch)
        .eq("id", renderJobId);
}

const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<RenderQueuePayload>) => {
        const payload = job.data;
        const project = ProjectSchema.parse(payload.project);

        console.log(`[render-worker] Starting job ${job.id} for project ${project.id}`);

        await updateRenderJob(payload.renderJobId, {
            status: "rendering",
            progress: 5,
            started_at: new Date().toISOString(),
        });
        await job.updateProgress(5);

        try {
            const result = await renderTimelineProject({
                project,
                renderJobId: payload.renderJobId,
                onProgress: async (progress: RenderPipelineProgress) => {
                    await updateRenderJob(payload.renderJobId, {
                        progress: progress.progress,
                    });
                    await job.updateProgress(progress.progress);
                },
            });

            await updateRenderJob(payload.renderJobId, {
                status: "done",
                progress: 100,
                output_url: result.outputUrl,
                completed_at: new Date().toISOString(),
            });
            await job.updateProgress(100);

            console.log(`[render-worker] Job ${job.id} complete → ${result.outputUrl}`);
            return { outputUrl: result.outputUrl };
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Unknown render failure");
            await updateRenderJob(payload.renderJobId, {
                status: "failed",
                error_message: err.message,
                completed_at: new Date().toISOString(),
            });
            throw err;
        }
    },
    {
        connection: connection as any,
        concurrency: 2,
    }
);

worker.on("completed", (job, result) => {
    console.log(`[render-worker] ✅ Job ${job.id} completed:`, result);
});

worker.on("failed", (job, err) => {
    console.error(`[render-worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on("progress", (job, progress) => {
    console.log(`[render-worker] Job ${job.id} progress: ${progress}%`);
});

console.log(`[render-worker] 🚀 Listening on queue "${QUEUE_NAME}" via ${REDIS_URL}`);
