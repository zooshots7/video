import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";
import { getVideoMetadata } from "@remotion/media-utils";
import path from "path";
import os from "os";
import fs from "fs";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processRenderJob(jobId: string) {
    console.log(`[render] Starting job ${jobId}`);
    
    try {
        // 1. Fetch Job
        const { data: job, error: jobErr } = await supabase
            .from("render_jobs")
            .select("*, project:projects(*)")
            .eq("id", jobId)
            .single();

        if (jobErr || !job) throw new Error("Job not found");

        await updateProgress(jobId, 10, "fetching project data");

        const projectId = job.project_id;
        
        let actualDurationSec = job.project.duration_sec;
        if (!actualDurationSec) {
             try {
                 const metadata = await getVideoMetadata(job.project.video_url);
                 actualDurationSec = metadata.durationInSeconds;
                 // Update the project with the real duration
                 await supabase.from("projects").update({ duration_sec: actualDurationSec }).eq("id", projectId);
             } catch (err) {
                 console.warn(`[render] Could not fetch video metadata exactly, using 30s.`, err);
                 actualDurationSec = 30;
             }
        }
        
        const durationInFrames = Math.floor(actualDurationSec * 30);

        // Fetch all assets
        const { data: projectAssets } = await supabase
            .from("project_assets")
            .select("*")
            .eq("project_id", projectId);

        // Fetch transcript
        const { data: transcripts } = await supabase
            .from("transcripts")
            .select("*, transcript_words(*)")
            .eq("project_id", projectId)
            .single();

        // 2. Prep Composition Props
        const inputProps = {
            sourceVideoUrl: job.project.video_url,
            transcriptWords: transcripts?.transcript_words?.map((w: any) => ({
                word: w.word,
                start: w.start_sec,
                end: w.end_sec
            })) || [],
            templateConfig: getTemplateConfig(job.project),
            hookText: job.project.hook_text,
            ctaText: job.project.cta_text,
            zoomTimestamps: [], // Simplified for now
            durationInFrames,
            fps: 30,
            projectAssets: projectAssets?.map(a => ({
                assetType: a.asset_type,
                fileUrl: a.config?.fileUrl,
                startSec: a.start_sec,
                endSec: a.end_sec
            })) || []
        };

        await updateProgress(jobId, 20, "bundling composition");

        // 3. Bundle Remotion project
        const bundledDir = await bundle({
            // Path to the Remotion root in packages/video
            entryPoint: path.resolve(__dirname, "../../../packages/video/src/root.tsx"),
            webpackOverride: (config) => config,
        });

        await updateProgress(jobId, 50, "extracting composition");

        // 4. Select the composition (VideoEditor)
        const composition = await selectComposition({
            serveUrl: bundledDir,
            id: "VideoEditor",
            inputProps,
        });

        await updateProgress(jobId, 60, "rendering video");

        // 5. Render
        const outputLocation = path.join(os.tmpdir(), `render-${jobId}.mp4`);
        await renderMedia({
            composition: {
                ...composition,
                durationInFrames,
            },
            serveUrl: bundledDir,
            codec: "h264",
            outputLocation,
            inputProps,
            onProgress: ({ progress }) => {
                // Map remotion progress (0-1) to our 60-90 range
                const currentJobProgress = 60 + Math.floor(progress * 30);
                // Throttle updates so we don't spam DB
                if (currentJobProgress % 5 === 0) {
                     updateProgress(jobId, currentJobProgress, "rendering");
                }
            },
        });

        await updateProgress(jobId, 90, "uploading to storage");

        // 6. Upload to Supabase
        const fileBuffer = fs.readFileSync(outputLocation);
        const fileName = `renders/${projectId}/${jobId}.mp4`;
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("videos")
            .upload(fileName, fileBuffer, {
                contentType: "video/mp4",
                upsert: true
            });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
            .from("videos")
            .getPublicUrl(uploadData.path);

        // 7. Cleanup & Finish
        fs.unlinkSync(outputLocation);
        
        await supabase
            .from("render_jobs")
            .update({
                status: "done",
                progress: 100,
                output_url: urlData.publicUrl,
                completed_at: new Date().toISOString()
            })
            .eq("id", jobId);

        console.log(`[render] Finished job ${jobId}`);

    } catch (error: any) {
        console.error(`[render] Job ${jobId} failed:`, error);
        await supabase
            .from("render_jobs")
            .update({
                status: "failed",
                error_message: error.message
            })
            .eq("id", jobId);
    }
}

async function updateProgress(jobId: string, progress: number, message: string) {
    console.log(`[render] Job ${jobId}: ${progress}% - ${message}`);
    await supabase.from("render_jobs").update({ progress }).eq("id", jobId);
}

// Temporary stub since we don't have direct access to shared package templates in the isolated worker
function getTemplateConfig(project: any) {
    const config = project.config || {};
    
    // Reverse engineer intensity scaling (approximate based on frontend)
    let fontSize = 42;
    if (config.captionIntensity === "subtle") fontSize = Math.round(42 * 0.8);
    if (config.captionIntensity === "bold") fontSize = Math.round(42 * 1.25);

    return {
        id: project.template_id || "custom",
        name: "Custom Template",
        accentColor: project.accent_color || "#6366F1",
        vfxEnabled: config.vfxEnabled ?? true,
        sfxEnabled: config.sfxEnabled ?? true,
        hook: {
            durationSec: 2,
            background: "#0F172A",
            textColor: "#F8FAFC",
            fontSize: 64,
        },
        caption: {
            fontFamily: config.captionFont || "Inter",
            fontSize: fontSize,
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.5)",
            highlightColor: project.accent_color || "#6366F1",
            position: "bottom",
        },
        zoom: {
            scale: 1.15,
            durationSec: 0.6,
            easing: "ease-in-out",
        },
        cta: {
            durationSec: 2,
            background: project.accent_color || "#6366F1",
            textColor: "#FFFFFF",
            fontSize: 48,
            buttonText: project.cta_text,
        },
    }
}
