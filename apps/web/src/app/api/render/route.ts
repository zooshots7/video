import { NextRequest, NextResponse } from "next/server";
import type { RenderJob } from "@video-editor/shared";

/**
 * POST /api/render
 *
 * Stub endpoint for render jobs.
 * In production this will:
 *  1. Accept project + template config
 *  2. Enqueue a render job (e.g. via BullMQ / SQS)
 *  3. Return the job ID for polling
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || !body.projectId || !body.templateId) {
        return NextResponse.json(
            { error: "Missing projectId or templateId" },
            { status: 400 }
        );
    }

    // Stub: create a fake render job
    const job: RenderJob = {
        id: `render-${Date.now()}`,
        projectId: body.projectId,
        status: "queued",
        progress: 0,
        outputUrl: null,
        createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
        ok: true,
        job,
        message: "Render stub — job created but not processed yet.",
    });
}

/**
 * GET /api/render?jobId=xxx
 *
 * Stub endpoint to check render job status.
 */
export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json(
            { error: "Missing jobId query parameter" },
            { status: 400 }
        );
    }

    // Stub: always return "done" with a fake output URL
    const job: RenderJob = {
        id: jobId,
        projectId: "unknown",
        status: "done",
        progress: 100,
        outputUrl: `/renders/${jobId}.mp4`,
        createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, job });
}
