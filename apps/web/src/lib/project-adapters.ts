import type { DbProject } from "@video-editor/shared";

export function extractVideoStoragePath(videoUrl: string): string | null {
    const buckets = ["assets", "videos"];

    for (const bucket of buckets) {
        const bucketPrefix = `/storage/v1/object/public/${bucket}/`;
        const index = videoUrl.indexOf(bucketPrefix);

        if (index !== -1) {
            return videoUrl.substring(index + bucketPrefix.length);
        }
    }

    return null;
}

export function inferStorageBucket(videoUrl: string): "assets" | "videos" | null {
    if (videoUrl.includes("/storage/v1/object/public/assets/")) {
        return "assets";
    }

    if (videoUrl.includes("/storage/v1/object/public/videos/")) {
        return "videos";
    }

    return null;
}

export function buildProjectUpdatePayload(body: unknown): Partial<{
    template_id: string;
    hook_text: string;
    cta_text: string;
    accent_color: string;
    status: DbProject["status"];
    title: string;
    video_url: string;
}> {
    if (!body || typeof body !== "object") {
        return {};
    }

    const input = body as Record<string, unknown>;
    const allowedStatuses: DbProject["status"][] = [
        "draft",
        "processing",
        "done",
        "failed",
    ];
    const update: Partial<{
        template_id: string;
        hook_text: string;
        cta_text: string;
        accent_color: string;
        status: DbProject["status"];
        title: string;
        video_url: string;
    }> = {};

    if (typeof input.templateId === "string") update.template_id = input.templateId;
    if (typeof input.hookText === "string") update.hook_text = input.hookText;
    if (typeof input.ctaText === "string") update.cta_text = input.ctaText;
    if (typeof input.accentColor === "string") update.accent_color = input.accentColor;
    if (typeof input.videoUrl === "string") update.video_url = input.videoUrl;
    if (
        typeof input.status === "string" &&
        allowedStatuses.includes(input.status as DbProject["status"])
    ) {
        update.status = input.status as DbProject["status"];
    }
    if (typeof input.title === "string") update.title = input.title;

    return update;
}
