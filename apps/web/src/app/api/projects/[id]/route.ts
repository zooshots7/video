import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/projects/[id]
 *
 * Fetches a single project with its template.
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

    return NextResponse.json({ ok: true, project });
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
