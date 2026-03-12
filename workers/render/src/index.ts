/**
 * @video-editor/render-worker
 *
 * Render job processor. Will integrate with Remotion's
 * server-side rendering in a future step.
 */

import { processRenderJob } from "./render";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const POLL_INTERVAL = 5000;

async function poll() {
    try {
        const { data: job, error } = await supabase
            .from("render_jobs")
            .select("id")
            .eq("status", "queued")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("[worker] Poll error:", error.message);
        } else if (job) {
            // Claim job by marking as rendering
            await supabase
                .from("render_jobs")
                .update({ status: "rendering", started_at: new Date().toISOString() })
                .eq("id", job.id);

            await processRenderJob(job.id);
        }
    } catch (err: any) {
        console.error("[worker] Unhandled error:", err.message);
    } finally {
        setTimeout(poll, POLL_INTERVAL);
    }
}

console.log("[worker] Starting Render Worker...");
poll();
