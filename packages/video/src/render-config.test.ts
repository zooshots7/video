import test from "node:test";
import assert from "node:assert/strict";
import { calculateRenderMetadata, createDefaultEditorProject } from "./render-config";
import type { EditorProjectCompositionProps } from "./types";

test("createDefaultEditorProject returns a usable render stub", () => {
    const project = createDefaultEditorProject();

    assert.equal(project.settings.fps, 30);
    assert.ok(project.tracks.length >= 5);
});

test("calculateRenderMetadata derives duration from timeline content", async () => {
    const props: EditorProjectCompositionProps = {
        project: {
            ...createDefaultEditorProject(),
            id: "video-render-test",
            name: "Render Test",
            settings: {
                width: 720,
                height: 1280,
                fps: 24,
                durationMs: 5000,
                backgroundColor: "#000000",
            },
            tracks: [
                {
                    id: "main-track",
                    type: "video_main",
                    name: "Main Video",
                    hidden: false,
                    muted: false,
                    clips: [
                        {
                            id: "clip-1",
                            type: "video",
                            assetId: "asset-1",
                            startAtMs: 2000,
                            durationMs: 8000,
                            sourceStartMs: 0,
                            volume: 1,
                        },
                    ],
                },
            ],
        },
    };

    const result = await calculateRenderMetadata({ props } as any);

    assert.equal(result.width, 720);
    assert.equal(result.height, 1280);
    assert.equal(result.fps, 24);
    assert.equal(result.durationInFrames, 240);
    assert.equal(result.defaultOutName, "render-test.mp4");
    assert.equal(result.props?.project.settings.durationMs, 5000);
});

test("calculateRenderMetadata normalizes sparse projects before returning props", async () => {
    const result = await calculateRenderMetadata({
        props: {
            project: {
                id: "sparse-project",
                name: "Sparse Project",
                settings: {
                    width: 1080,
                    height: 1920,
                    fps: 30,
                    durationMs: 1500,
                    backgroundColor: "#000000",
                },
                assets: undefined,
                tracks: undefined,
            } as any,
        },
    } as any);

    assert.equal((result.props?.project.tracks?.length ?? 0) >= 5, true);
    assert.deepEqual(result.props?.project.assets ?? {}, {});
});

test("calculateRenderMetadata slugifies the default output name", async () => {
    const result = await calculateRenderMetadata({
        props: {
            project: {
                ...createDefaultEditorProject(),
                id: "slug-project",
                name: "Render Test Name",
            },
        },
    } as any);

    assert.equal(result.defaultOutName, "render-test-name.mp4");
});
