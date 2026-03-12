import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import path from "path";
import os from "os";
import fs from "fs";

/**
 * POST /api/render
 *
 * Creates a render job and triggers Remotion server-side rendering.
 * Accepts: { projectId, templateId }
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || !body.projectId || !body.templateId) {
        return NextResponse.json(
            { error: "Missing projectId or templateId" },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();

    // 1. Fetch the project + template + transcript
    const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("*, templates(*)")
        .eq("id", body.projectId)
        .single();

    if (fetchError || !project) {
        return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
        );
    }

    // 2. Fetch transcript words
    let transcriptWords: { word: string; start: number; end: number }[] = [];
    const { data: transcript } = await supabase
        .from("transcripts")
        .select("*, transcript_words(*)")
        .eq("project_id", body.projectId)
        .single();

    if (transcript?.transcript_words?.length) {
        transcriptWords = (transcript.transcript_words as any[])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((w: any) => ({
                word: w.word,
                start: w.start_sec,
                end: w.end_sec,
            }));
    }

    // 3. Create render job in DB
    const { data: job, error: jobError } = await supabase
        .from("render_jobs")
        .insert({
            project_id: body.projectId,
            status: "queued",
            progress: 0,
        })
        .select()
        .single();

    if (jobError || !job) {
        return NextResponse.json(
            { error: `Failed to create render job: ${jobError?.message}` },
            { status: 500 }
        );
    }

    // 4. Return job details so the frontend can poll
    // The separate Node.js render worker daemon will pick up this queued job

    return NextResponse.json({ ok: true, job });
}

/**
 * GET /api/render?jobId=xxx
 *
 * Fetches render job status from the database.
 */
export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json(
            { error: "Missing jobId query parameter" },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();

    const { data: job, error } = await supabase
        .from("render_jobs")
        .select()
        .eq("id", jobId)
        .single();

    if (error || !job) {
        return NextResponse.json(
            { error: "Render job not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true, job });
}


