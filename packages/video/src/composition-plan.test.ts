import test from "node:test";
import assert from "node:assert/strict";
import type { EditorProject } from "@video-editor/timeline-schema";
import { createDefaultEditorProject } from "./render-config";
import {
    buildCompositionPlan,
    getActiveFrameState,
    mediaStyle,
    resolveEffectKind,
} from "./composition-plan";

function createCompositionFixture(): EditorProject {
    const project = createDefaultEditorProject();

    project.id = "composition-test";
    project.name = "Render Test Name";
    project.settings = {
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: 4_000,
        backgroundColor: "#010101",
    };
    project.assets = {
        source: {
            id: "source",
            type: "video",
            name: "Source video",
            url: "https://example.com/source.mp4",
            durationMs: 8_000,
        },
        music: {
            id: "music",
            type: "audio",
            name: "Music bed",
            url: "https://example.com/music.mp3",
            durationMs: 4_000,
        },
        sfx: {
            id: "sfx",
            type: "audio",
            name: "Hit",
            url: "https://example.com/hit.mp3",
            durationMs: 600,
        },
        hook: {
            id: "hook",
            type: "effect",
            name: "Hook Card",
            durationMs: 1_200,
            metadata: {
                config: {
                    kind: "hook-card",
                    title: "Asset hook",
                    color: "#88ffee",
                },
            },
        },
        flash: {
            id: "flash",
            type: "effect",
            name: "Flash",
            durationMs: 300,
            metadata: {
                config: {
                    type: "flash",
                    opacity: 0.2,
                },
            },
        },
        zoom: {
            id: "zoom",
            type: "effect",
            name: "Punch In Zoom",
            durationMs: 1_000,
            metadata: {
                config: {
                    kind: "punch-in zoom",
                    scale: 1.18,
                },
            },
        },
    };

    project.tracks = project.tracks.map((track) => {
        if (track.type === "video_main") {
            return {
                ...track,
                clips: [
                    {
                        id: "main-clip",
                        type: "video",
                        assetId: "source",
                        startAtMs: 0,
                        durationMs: 4_000,
                        sourceStartMs: 500,
                        volume: 1,
                    },
                ],
            };
        }

        if (track.type === "effect") {
            return {
                ...track,
                clips: [
                    {
                        id: "hook-clip",
                        type: "effect",
                        assetId: "hook",
                        startAtMs: 900,
                        durationMs: 1_200,
                        config: {
                            title: "Clip hook override",
                        },
                    },
                    {
                        id: "flash-clip",
                        type: "effect",
                        assetId: "flash",
                        startAtMs: 1_200,
                        durationMs: 300,
                        config: {
                            opacity: 0.45,
                        },
                    },
                    {
                        id: "zoom-clip",
                        type: "effect",
                        assetId: "zoom",
                        startAtMs: 1_200,
                        durationMs: 1_000,
                        config: {
                            scale: 1.22,
                        },
                    },
                ],
            };
        }

        if (track.type === "text") {
            return {
                ...track,
                clips: [
                    {
                        id: "caption-clip",
                        type: "text",
                        content: "Caption timing matters",
                        startAtMs: 1_200,
                        durationMs: 800,
                        style: {
                            fontSize: 72,
                            fontFamily: "Inter",
                            fontWeight: 700,
                            color: "#ffffff",
                            textAlign: "center",
                            backgroundColor: "rgba(0,0,0,0.55)",
                        },
                        transform: {
                            x: 540,
                            y: 1640,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0,
                            anchorX: 0.5,
                            anchorY: 0.5,
                        },
                    },
                ],
            };
        }

        if (track.type === "audio" && track.name === "Music") {
            return {
                ...track,
                clips: [
                    {
                        id: "music-clip",
                        type: "audio",
                        assetId: "music",
                        startAtMs: 0,
                        durationMs: 4_000,
                        sourceStartMs: 0,
                        volume: 0.45,
                    },
                ],
            };
        }

        if (track.type === "audio" && track.name === "SFX") {
            return {
                ...track,
                clips: [
                    {
                        id: "sfx-clip",
                        type: "audio",
                        assetId: "sfx",
                        startAtMs: 1_200,
                        durationMs: 500,
                        sourceStartMs: 200,
                        volume: 0.92,
                    },
                ],
            };
        }

        return {
            ...track,
            clips: [],
        };
    });

    return project;
}

test("buildCompositionPlan resolves canonical clips into render-order frame descriptors", () => {
    const plan = buildCompositionPlan({ project: createCompositionFixture() });

    assert.equal(plan.backgroundColor, "#010101");
    assert.deepEqual(
        plan.items.map((item) => item.kind),
        ["video", "audio", "audio", "text", "effect", "effect", "effect"]
    );

    const music = plan.items.find((item) => item.id === "music-clip");
    const caption = plan.items.find((item) => item.id === "caption-clip");
    const hook = plan.items.find((item) => item.id === "hook-clip");
    const flash = plan.items.find((item) => item.id === "flash-clip");

    assert.deepEqual(music, {
        kind: "audio",
        id: "music-clip",
        trackType: "audio",
        trackName: "Music",
        from: 0,
        durationInFrames: 120,
        src: "https://example.com/music.mp3",
        startFrom: 0,
        volume: 0.45,
    });
    assert.equal(caption?.kind, "text");
    assert.equal(caption?.from, 36);
    assert.equal(caption?.durationInFrames, 24);
    assert.equal(hook?.kind, "effect");
    assert.equal(hook?.effectKind, "hook");
    assert.equal(hook?.config.title, "Clip hook override");
    assert.equal(flash?.kind, "effect");
    assert.equal(flash?.config.opacity, 0.45);
});

test("getActiveFrameState layers music, sfx, captions, flash, hook, and zoom together", () => {
    const plan = buildCompositionPlan({ project: createCompositionFixture() });
    const state = getActiveFrameState(plan, 39);

    assert.equal(state.audio.length, 2);
    assert.equal(state.captions.length, 1);
    assert.deepEqual(
        state.effects.map((effect) => effect.effectKind),
        ["hook", "flash", "zoom"]
    );
    assert.equal(state.captions[0]?.content, "Caption timing matters");
    assert.ok(state.zoomScale > 1);
});

test("getActiveFrameState drops transient caption, flash, and sfx after their window", () => {
    const plan = buildCompositionPlan({ project: createCompositionFixture() });
    const state = getActiveFrameState(plan, 72);

    assert.equal(state.audio.length, 1);
    assert.equal(state.captions.length, 0);
    assert.deepEqual(
        state.effects.map((effect) => effect.effectKind),
        []
    );
    assert.equal(state.zoomScale, 1);
});

test("mediaStyle defaults to centered full-frame cover when transform is absent", () => {
    const style = mediaStyle(
        {
            id: "video",
            type: "video",
            assetId: "source",
            startAtMs: 0,
            durationMs: 1_000,
            sourceStartMs: 0,
            volume: 1,
        },
        1080,
        1920
    );

    assert.equal(style.left, 540);
    assert.equal(style.top, 960);
    assert.equal(style.width, "100%");
    assert.equal(style.height, "100%");
    assert.equal(style.objectFit, "cover");
});

test("resolveEffectKind normalizes zoom, hook-card, flash, vignette, and glitch aliases", () => {
    assert.equal(resolveEffectKind(null, { kind: "Punch In Zoom" }), "zoom");
    assert.equal(resolveEffectKind(null, { type: "hook-card" }), "hook");
    assert.equal(resolveEffectKind(null, { type: "flash" }), "flash");
    assert.equal(resolveEffectKind(null, { type: "vignette" }), "vignette");
    assert.equal(resolveEffectKind(null, { type: "rgb-split" }), "glitch");
});
