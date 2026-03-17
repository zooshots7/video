import { NextRequest, NextResponse } from "next/server";
import {
    getActiveRenderJobForProject,
    getRenderJobById,
    listRenderJobsForProject,
    toRenderJobDto,
} from "@/lib/render-jobs";

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get("jobId");
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (jobId) {
        const job = await getRenderJobById(jobId);

        if (!job) {
            return NextResponse.json(
                { error: "Render job not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, job: toRenderJobDto(job) });
    }

    if (projectId) {
        const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 5);
        const limit = Number.isFinite(limitParam)
            ? Math.min(20, Math.max(1, Math.round(limitParam)))
            : 5;
        const [activeJob, jobs] = await Promise.all([
            getActiveRenderJobForProject(projectId),
            listRenderJobsForProject(projectId, limit),
        ]);

        return NextResponse.json({
            ok: true,
            activeJob: activeJob ? toRenderJobDto(activeJob) : null,
            jobs: jobs.map(toRenderJobDto),
        });
    }

    return NextResponse.json(
        { error: "Missing jobId or projectId query parameter" },
        { status: 400 }
    );
}
