import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase";

/**
 * GET /api/projects/[id]
 *
 * Fetches a single project with its template, transcript, and signed video URL.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createServerClient();

    const { data: project, error } = await supabase
        .from("projects")
        .select("*, templates(*)")
        .eq("id", params.id)
        .single();

    if (error || !project) {
        return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
        );
    }

    // Generate signed URL for private video bucket
    let signedVideoUrl: string | null = null;
    if (project.video_url) {
        // Extract storage path from full URL
        const videoUrl = project.video_url as string;
        const bucketPrefix = "/storage/v1/object/public/videos/";
        const idx = videoUrl.indexOf(bucketPrefix);
        if (idx !== -1) {
            const storagePath = videoUrl.substring(idx + bucketPrefix.length);
            const { data: signedData } = await supabase.storage
                .from("videos")
                .createSignedUrl(storagePath, 3600); // 1 hour
            if (signedData?.signedUrl) {
                signedVideoUrl = signedData.signedUrl;
            }
        }
    }

    // Fetch transcript with words if it exists
    let transcript = null;
    const { data: transcriptData } = await supabase
        .from("transcripts")
        .select("*, transcript_words(*)")
        .eq("project_id", params.id)
        .single();

    if (transcriptData) {
        const words = (transcriptData.transcript_words ?? []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
        );
        transcript = {
            ...transcriptData,
            transcript_words: words,
        };
    }

    return NextResponse.json({
        ok: true,
        project: { ...project, signed_video_url: signedVideoUrl },
        transcript,
    });
}

/**
 * PATCH /api/projects/[id]
 *
 * Updates a project. Used to set template, hook text, CTA, etc.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Build update payload from allowed fields
    const update: Record<string, any> = {};
    if (body.templateId !== undefined) update.template_id = body.templateId;
    if (body.hookText !== undefined) update.hook_text = body.hookText;
    if (body.ctaText !== undefined) update.cta_text = body.ctaText;
    if (body.accentColor !== undefined) update.accent_color = body.accentColor;
    if (body.status !== undefined) update.status = body.status;
    if (body.title !== undefined) update.title = body.title;
    if (body.config !== undefined) update.config = body.config;

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: project, error } = await supabase
        .from("projects")
        .update(update)
        .eq("id", params.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: `Failed to update project: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, project });
}

/**
 * DELETE /api/projects/[id]
 *
 * Deletes a project and its related data (transcripts, assets, render jobs).
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient();

    // Delete related data first (cascade may handle some of these)
    await supabase.from("project_assets").delete().eq("project_id", params.id);
    await supabase.from("render_jobs").delete().eq("project_id", params.id);

    // Delete transcript words via transcript
    const { data: transcripts } = await supabase
        .from("transcripts")
        .select("id")
        .eq("project_id", params.id);

    if (transcripts?.length) {
        for (const t of transcripts) {
            await supabase.from("transcript_words").delete().eq("transcript_id", t.id);
        }
        await supabase.from("transcripts").delete().eq("project_id", params.id);
    }

    // Delete the project itself
    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", params.id);

    if (error) {
        return NextResponse.json(
            { error: `Failed to delete project: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}

