import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
    ProjectSchema,
    ProjectTimelineDbRowSchema,
    ensureDefaultTracks,
    projectTimelineDbRowToProject,
    projectToProjectTimelineDbRow,
} from '@video-editor/timeline-schema';

/**
 * GET /api/project-timeline?projectId=xxx
 * Returns the saved timeline JSON for a project.
 */
export async function GET(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('project_timeline')
        .select('project_id, timeline_json, updated_at')
        .eq('project_id', projectId)
        .single();

    if (error || !data) {
        return NextResponse.json({ ok: false, error: 'Timeline not found' }, { status: 404 });
    }

    const parsedRow = ProjectTimelineDbRowSchema.safeParse(data);
    if (!parsedRow.success) {
        return NextResponse.json({ ok: false, error: 'Corrupt timeline payload' }, { status: 500 });
    }

    const timeline = ensureDefaultTracks(projectTimelineDbRowToProject(parsedRow.data));
    return NextResponse.json({ ok: true, timeline });
}

/**
 * POST /api/project-timeline
 * Body: { projectId: string, timeline: Project }
 * Upserts the timeline JSON to the DB.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body?.projectId || !body?.timeline) {
        return NextResponse.json({ error: 'Missing projectId or timeline' }, { status: 400 });
    }

    const parsed = ProjectSchema.safeParse(body.timeline);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid timeline schema', details: parsed.error.flatten() },
            { status: 400 }
        );
    }
    const normalizedTimeline = ensureDefaultTracks(parsed.data);
    const timelineRow = projectToProjectTimelineDbRow(
        body.projectId,
        normalizedTimeline,
        new Date().toISOString()
    );

    const supabase = createAdminClient();
    const { error } = await supabase
        .from('project_timeline')
        .upsert(
            timelineRow as unknown as { project_id: string; timeline_json: Record<string, unknown>; updated_at: string },
            { onConflict: 'project_id' }
        );

    if (error) {
        return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
