import test from "node:test";
import assert from "node:assert/strict";
import type { DbTemplate, DbTranscriptWord } from "@video-editor/shared";
import { mapDbTemplateToTemplateConfig, mapDbTranscriptWords, deriveRenderDurationSeconds, buildVideoCompositionProps } from "./render-adapters";

const templateRow: DbTemplate = {
    id: "77777777-7777-4777-8777-777777777777",
    slug: "clean-creator",
    name: "Clean Creator",
    description: "Clean creator template",
    thumbnail_url: null,
    accent_color: "#6366F1",
    hook_config: {
        durationSec: 2,
        background: "#111111",
        textColor: "#ffffff",
        fontSize: 64,
    },
    caption_config: {
        fontFamily: "Inter",
        fontSize: 40,
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.5)",
        highlightColor: "#6366F1",
        position: "bottom",
    },
    zoom_config: {
        scale: 1.15,
        durationSec: 0.6,
        easing: "ease-in-out",
    },
    cta_config: {
        durationSec: 2,
        background: "#6366F1",
        textColor: "#ffffff",
        fontSize: 48,
        buttonText: "Follow for more",
    },
    is_premium: false,
    sort_order: 1,
    created_at: "2026-03-17T00:00:00.000Z",
    updated_at: "2026-03-17T00:00:00.000Z",
};

const transcriptRows: Pick<DbTranscriptWord, "word" | "start_sec" | "end_sec" | "sort_order">[] = [
    { word: "later", start_sec: 4, end_sec: 4.4, sort_order: 1 },
    { word: "first", start_sec: 1, end_sec: 1.2, sort_order: 0 },
];

test("mapDbTranscriptWords sorts by sort order and normalizes timing shape", () => {
    assert.deepEqual(mapDbTranscriptWords(transcriptRows), [
        { word: "first", start: 1, end: 1.2 },
        { word: "later", start: 4, end: 4.4 },
    ]);
});

test("mapDbTemplateToTemplateConfig preserves template fields", () => {
    const mapped = mapDbTemplateToTemplateConfig(templateRow);

    assert.equal(mapped.id, "clean-creator");
    assert.equal(mapped.caption.highlightColor, "#6366F1");
    assert.equal(mapped.cta.buttonText, "Follow for more");
});

test("deriveRenderDurationSeconds prefers project duration but grows to fit transcript", () => {
    assert.equal(
        deriveRenderDurationSeconds({
            projectDurationSec: null,
            transcriptWords: [{ word: "hello", start: 1, end: 4.2 }],
        }),
        7
    );

    assert.equal(
        deriveRenderDurationSeconds({
            projectDurationSec: 12,
            transcriptWords: [{ word: "hello", start: 1, end: 4.2 }],
        }),
        12
    );
});

test("buildVideoCompositionProps derives durationInFrames from canonical timing", () => {
    const props = buildVideoCompositionProps({
        sourceVideoUrl: "https://example.com/video.mp4",
        transcriptWords: [{ word: "hello", start: 1, end: 4.2 }],
        templateConfig: mapDbTemplateToTemplateConfig(templateRow),
        hookText: "Hook",
        ctaText: "CTA",
        zoomTimestamps: [2],
        fps: 30,
    });

    assert.equal(props.fps, 30);
    assert.equal(props.durationInFrames, 210);
    assert.equal(props.templateConfig.id, "clean-creator");
});
