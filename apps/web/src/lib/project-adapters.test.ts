import test from "node:test";
import assert from "node:assert/strict";
import {
    buildProjectUpdatePayload,
    extractVideoStoragePath,
    inferStorageBucket,
} from "./project-adapters";

test("extractVideoStoragePath returns the public storage path when present", () => {
    assert.equal(
        extractVideoStoragePath(
            "https://cdn.example.com/storage/v1/object/public/videos/projects/demo.mp4"
        ),
        "projects/demo.mp4"
    );
    assert.equal(
        extractVideoStoragePath(
            "https://cdn.example.com/storage/v1/object/public/assets/uploads/demo.mp4"
        ),
        "uploads/demo.mp4"
    );
    assert.equal(extractVideoStoragePath("https://example.com/not-a-video"), null);
});

test("inferStorageBucket detects the public bucket name", () => {
    assert.equal(
        inferStorageBucket(
            "https://cdn.example.com/storage/v1/object/public/assets/uploads/demo.mp4"
        ),
        "assets"
    );
    assert.equal(
        inferStorageBucket(
            "https://cdn.example.com/storage/v1/object/public/videos/uploads/demo.mp4"
        ),
        "videos"
    );
    assert.equal(inferStorageBucket("https://example.com/not-a-video"), null);
});

test("buildProjectUpdatePayload keeps only allowed update fields", () => {
    assert.deepEqual(
        buildProjectUpdatePayload({
            templateId: "clean-creator",
            hookText: "New hook",
            ctaText: "New CTA",
            accentColor: "#111111",
            videoUrl: "https://cdn.example.com/storage/v1/object/public/assets/uploads/demo.mp4",
            status: "processing",
            title: "Updated title",
            ignored: true,
        }),
        {
            template_id: "clean-creator",
            hook_text: "New hook",
            cta_text: "New CTA",
            accent_color: "#111111",
            video_url: "https://cdn.example.com/storage/v1/object/public/assets/uploads/demo.mp4",
            status: "processing",
            title: "Updated title",
        }
    );

    assert.deepEqual(
        buildProjectUpdatePayload({ status: "archived", extra: "ignored" }),
        {}
    );
});
