import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/projects
 *
 * Lists all projects, ordered by most recent.
 */
export async function GET() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Return mock data when Supabase is not configured
        const { MOCK_PROJECTS } = await import("@/lib/mock-data");
        return NextResponse.json({ ok: true, projects: MOCK_PROJECTS });
    }

    const supabase = createServerClient();

    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json(
            { error: `Failed to fetch projects: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, projects });
}

/**
 * POST /api/projects
 *
 * Creates a new project.
 * Accepts: { title, templateId?, hookText?, ctaText?, accentColor? }
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || !body.title) {
        return NextResponse.json(
            { error: "Missing title" },
            { status: 400 }
        );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
            ok: true,
            project: {
                id: `proj-${Date.now()}`,
                title: body.title,
                status: "draft",
                video_url: null,
                template_id: body.templateId ?? null,
                hook_text: body.hookText ?? "",
                cta_text: body.ctaText ?? "",
                accent_color: body.accentColor ?? "#6366F1",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            message: "Stub — Supabase not configured.",
        });
    }

    const supabase = createServerClient();

    const { data: project, error } = await supabase
        .from("projects")
        .insert({
            title: body.title,
            video_url: body.videoUrl ?? null,
            template_id: body.templateId ?? null,
            hook_text: body.hookText ?? "",
            cta_text: body.ctaText ?? "",
            accent_color: body.accentColor ?? "#6366F1",
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: `Failed to create project: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, project });
}
