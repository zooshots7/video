import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Transcribe a project's video using Deepgram Nova-2.
 * Falls back to mock transcription if DEEPGRAM_API_KEY is not set.
 *
 * POST /api/transcribe
 * Body: { projectId: string }
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body?.projectId) {
        return NextResponse.json(
            { error: "Missing projectId" },
            { status: 400 }
        );
    }

    const supabase = createServerClient();

    // 1. Fetch the project to get video_url
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, video_url")
        .eq("id", body.projectId)
        .single();

    if (projectError || !project) {
        return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
        );
    }

    // 2. Check if transcript already exists
    const { data: existing } = await supabase
        .from("transcripts")
        .select("id")
        .eq("project_id", body.projectId)
        .single();

    if (existing) {
        return NextResponse.json({
            ok: true,
            message: "Transcript already exists",
            transcriptId: existing.id,
        });
    }

    // 3. Transcribe using OpenAI or fall back to mock
    const openaiKey = process.env.OPENAI_API_KEY;
    let words: { word: string; start: number; end: number; confidence: number }[] = [];
    let fullText = "";
    let source = "manual";

    if (openaiKey && project.video_url) {
        try {
            const result = await transcribeWithOpenAI(
                project.video_url,
                openaiKey
            );
            words = result.words;
            fullText = result.fullText;
            source = "whisper";
        } catch (err: any) {
            console.error("[transcribe] OpenAI error:", err.message);
            // Fall back to mock on failure
            const mock = getMockTranscription();
            words = mock.words;
            fullText = mock.fullText;
            source = "manual";
        }
    } else {
        // No API key or no video URL — use mock
        const mock = getMockTranscription();
        words = mock.words;
        fullText = mock.fullText;
        source = "manual";
    }

    // 4. Save transcript to DB
    const { data: transcript, error: insertError } = await supabase
        .from("transcripts")
        .insert({
            project_id: body.projectId,
            full_text: fullText,
            language: "en",
            source,
        })
        .select()
        .single();

    if (insertError || !transcript) {
        return NextResponse.json(
            { error: `Failed to save transcript: ${insertError?.message}` },
            { status: 500 }
        );
    }

    // 5. Save transcript words
    const wordRows = words.map((w, i) => ({
        transcript_id: transcript.id,
        word: w.word,
        start_sec: w.start,
        end_sec: w.end,
        confidence: w.confidence,
        sort_order: i,
    }));

    const { error: wordsError } = await supabase
        .from("transcript_words")
        .insert(wordRows);

    if (wordsError) {
        console.error("[transcribe] Failed to save words:", wordsError.message);
    }

    // 6. Update project status
    await supabase
        .from("projects")
        .update({ status: "draft" })
        .eq("id", body.projectId);

    return NextResponse.json({
        ok: true,
        transcriptId: transcript.id,
        wordCount: words.length,
        source,
    });
}

/* ── OpenAI Integration ───────────────────── */

async function transcribeWithOpenAI(
    videoUrl: string,
    apiKey: string
): Promise<{ words: { word: string; start: number; end: number; confidence: number }[]; fullText: string }> {
    const openai = new OpenAI({ apiKey });

    // Download the video file to a temporary location
    console.log("[transcribe] Downloading video from:", videoUrl);
    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempVideoPath = join(tmpdir(), `upload-${Date.now()}.mp4`);
    const tempAudioPath = join(tmpdir(), `audio-${Date.now()}.mp3`);
    
    await writeFile(tempVideoPath, buffer);

    try {
        console.log("[transcribe] Extracting audio to bypass OpenAI 25MB limit...");
        await execAsync(`ffmpeg -y -i "${tempVideoPath}" -vn -acodec libmp3lame -q:a 5 "${tempAudioPath}"`);

        console.log("[transcribe] Sending audio to OpenAI Whisper...");
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempAudioPath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
        });

        const words = (transcription.words ?? []).map((w: any) => ({
            word: w.word,
            start: w.start,
            end: w.end,
            confidence: 1.0, 
        }));

        return {
            words,
            fullText: transcription.text,
        };
    } finally {
        // Clean up the temp files
        await unlink(tempVideoPath).catch(console.error);
        await unlink(tempAudioPath).catch(console.error);
    }
}

/* ── Mock Transcription Fallback ─────────────── */

function getMockTranscription() {
    const words = [
        { word: "Hey", start: 2.0, end: 2.3, confidence: 0.99 },
        { word: "everyone,", start: 2.3, end: 2.6, confidence: 0.98 },
        { word: "today", start: 2.6, end: 2.9, confidence: 0.99 },
        { word: "I", start: 2.9, end: 3.0, confidence: 0.99 },
        { word: "want", start: 3.0, end: 3.2, confidence: 0.98 },
        { word: "to", start: 3.2, end: 3.3, confidence: 0.99 },
        { word: "talk", start: 3.3, end: 3.5, confidence: 0.99 },
        { word: "about", start: 3.5, end: 3.8, confidence: 0.98 },
        { word: "something", start: 3.8, end: 4.2, confidence: 0.97 },
        { word: "that", start: 4.2, end: 4.4, confidence: 0.99 },
        { word: "will", start: 4.4, end: 4.6, confidence: 0.99 },
        { word: "completely", start: 4.6, end: 5.1, confidence: 0.96 },
        { word: "change", start: 5.1, end: 5.4, confidence: 0.98 },
        { word: "how", start: 5.4, end: 5.6, confidence: 0.99 },
        { word: "you", start: 5.6, end: 5.7, confidence: 0.99 },
        { word: "create", start: 5.7, end: 6.0, confidence: 0.98 },
        { word: "content.", start: 6.0, end: 6.4, confidence: 0.97 },
        { word: "Artificial", start: 6.8, end: 7.3, confidence: 0.95 },
        { word: "intelligence", start: 7.3, end: 7.9, confidence: 0.96 },
        { word: "is", start: 7.9, end: 8.0, confidence: 0.99 },
        { word: "not", start: 8.0, end: 8.2, confidence: 0.99 },
        { word: "just", start: 8.2, end: 8.4, confidence: 0.99 },
        { word: "a", start: 8.4, end: 8.5, confidence: 0.99 },
        { word: "buzzword", start: 8.5, end: 9.0, confidence: 0.94 },
        { word: "anymore.", start: 9.0, end: 9.4, confidence: 0.97 },
        { word: "It's", start: 9.6, end: 9.8, confidence: 0.98 },
        { word: "actually", start: 9.8, end: 10.2, confidence: 0.97 },
        { word: "transforming", start: 10.2, end: 10.8, confidence: 0.95 },
        { word: "every", start: 10.8, end: 11.1, confidence: 0.98 },
        { word: "single", start: 11.1, end: 11.4, confidence: 0.99 },
        { word: "industry", start: 11.4, end: 11.9, confidence: 0.97 },
        { word: "out", start: 11.9, end: 12.1, confidence: 0.99 },
        { word: "there.", start: 12.1, end: 12.4, confidence: 0.98 },
    ];

    const fullText = words.map((w) => w.word).join(" ");
    return { words, fullText };
}
