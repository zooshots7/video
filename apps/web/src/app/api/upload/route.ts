import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { mimeTypeToExt } from '@/lib/upload';

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with a 'file' field (video, audio, or image).
 * Uploads to Supabase Storage `assets` bucket.
 * Returns { url, path, mimeType, size }.
 */
export async function POST(request: NextRequest) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    // Accept 'file' field (generic) or legacy 'video' field
    const file = (formData.get('file') ?? formData.get('video')) as Blob | null;
    if (!file) {
        return NextResponse.json({ error: "Missing 'file' field in form data" }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const ext = mimeTypeToExt(mimeType);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
        .from('assets')
        .upload(fileName, buffer, { contentType: mimeType, upsert: false });

    if (error) {
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);

    return NextResponse.json({
        ok: true,
        url: urlData.publicUrl,
        path: data.path,
        mimeType,
        size: file.size,
    });
}
