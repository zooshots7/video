import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload
 *
 * Stub endpoint for video uploads.
 * In production this will:
 *  1. Accept a multipart/form-data payload with the MP4 file
 *  2. Store the file in cloud storage (e.g. S3, R2)
 *  3. Return the public URL
 */
export async function POST(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return NextResponse.json(
            { error: "Expected multipart/form-data" },
            { status: 400 }
        );
    }

    // In the MVP we just acknowledge the upload
    const formData = await request.formData();
    const file = formData.get("video");

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
            { error: "Missing 'video' field in form data" },
            { status: 400 }
        );
    }

    // Stub: return a fake URL
    const fakeUrl = `/uploads/${Date.now()}.mp4`;

    return NextResponse.json({
        ok: true,
        url: fakeUrl,
        size: file.size,
        message: "Upload stub — file accepted but not persisted yet.",
    });
}
