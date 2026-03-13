import { NextRequest, NextResponse } from 'next/server';
import { renderQueue } from '@/lib/queue';
import { ProjectSchema } from '@video-editor/timeline-schema';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate the incoming project against out universal schema
        const project = ProjectSchema.parse(body);

        // Add the job to the BullMQ queue
        const job = await renderQueue.add('render-project', project, {
            jobId: project.id, // Ensure idempotency or easy tracking
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Render job queued successfully',
            jobId: job.id
        });

    } catch (error: any) {
        console.error('Failed to queue render job:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Invalid timeline schema'
        }, { status: 400 });
    }
}
