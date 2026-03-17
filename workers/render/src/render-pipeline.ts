import fs from "fs";
import os from "os";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { Project } from "@video-editor/timeline-schema";
import { REMOTION_COMPOSITION_ID, REMOTION_ENTRY_POINT } from "./render-constants";

export interface RenderPipelineProgress {
    stage: "bundle" | "select" | "render" | "upload";
    progress: number;
}

export async function renderTimelineProject(params: {
    project: Project;
    renderJobId: string;
    onProgress?: (progress: RenderPipelineProgress) => Promise<void> | void;
}) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const supabase = createClient(
        supabaseUrl,
        supabaseServiceKey
    );

    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, selectComposition } = await import("@remotion/renderer");

    const bundleLocation = await bundle({
        entryPoint: REMOTION_ENTRY_POINT,
        onProgress: async (progress: number) => {
            await params.onProgress?.({
                stage: "bundle",
                progress: Math.round(progress * 20),
            });
        },
    });

    await params.onProgress?.({ stage: "select", progress: 25 });

    const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: REMOTION_COMPOSITION_ID,
        inputProps: { project: params.project },
    });

    const outputDir = path.join(os.tmpdir(), "video-editor-renders");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${params.renderJobId}.mp4`);

    try {
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: "h264",
            outputLocation: outputPath,
            inputProps: { project: params.project },
            onProgress: async ({ progress }: { progress: number }) => {
                await params.onProgress?.({
                    stage: "render",
                    progress: 30 + Math.round(progress * 60),
                });
            },
        });

        await params.onProgress?.({ stage: "upload", progress: 92 });

        const fileBuffer = fs.readFileSync(outputPath);
        const storagePath = `${params.project.id}/${params.renderJobId}.mp4`;

        const { error: uploadError } = await supabase.storage
            .from("renders")
            .upload(storagePath, fileBuffer, {
                contentType: "video/mp4",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from("renders")
            .getPublicUrl(storagePath);

        return {
            outputUrl: urlData.publicUrl,
            outputPath,
            bundleLocation,
        };
    } finally {
        try {
            fs.unlinkSync(outputPath);
        } catch {}

        try {
            fs.rmSync(bundleLocation, { recursive: true, force: true });
        } catch {}
    }
}
