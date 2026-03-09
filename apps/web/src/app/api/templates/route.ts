import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/templates
 *
 * Returns all templates, ordered by sort_order.
 */
export async function GET() {
    const supabase = createServerClient();

    const { data: templates, error } = await supabase
        .from("templates")
        .select("*")
        .order("sort_order");

    if (error) {
        return NextResponse.json(
            { error: `Failed to fetch templates: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, templates });
}
