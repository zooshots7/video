import { NextRequest, NextResponse } from 'next/server';
import { ProjectSchema } from '@video-editor/timeline-schema';
import { queueRenderProject, toRenderJobDto } from '@/lib/render-jobs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body?.project) {
            return NextResponse.json(
                { success: false, error: 'Missing project payload' },
                { status: 400 }
            );
        }

        const project = ProjectSchema.parse(body.project);
        const { job, renderJobId, queued } = await queueRenderProject({
            project,
            renderJobId: typeof body.renderJobId === "string" ? body.renderJobId : undefined,
        });

        return NextResponse.json({
            success: true,
            message: queued ? 'Render job queued successfully' : 'Render job already exists',
            jobId: renderJobId,
            job: toRenderJobDto(job),
        });

    } catch (error: any) {
        console.error('Failed to queue render job:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Invalid timeline schema'
        }, { status: 400 });
    }
}
