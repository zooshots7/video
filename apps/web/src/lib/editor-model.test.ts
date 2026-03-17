import test from "node:test";
import assert from "node:assert/strict";
import {
    createAssetFromLibraryRow,
    createAssetFromUpload,
    createBlankEditorProject,
    insertAssetIntoProject,
    normalizeEditorProject,
    replaceMainSourceClip,
    trackTypeForLibraryKind,
} from "../app/editor/lib/editor-workflow";
import { getAssetUrl, resolveClipAsset, sortTracksForRender } from "@video-editor/timeline-schema";

test("blank editor projects include the canonical track stack", () => {
    const project = createBlankEditorProject("editor-proj-1");

    assert.deepEqual(
        project.tracks.map((track) => `${track.type}:${track.name}`),
        [
            "video_main:Main Video",
            "video_overlay:B-roll",
            "audio:Music",
            "audio:SFX",
            "text:Captions",
            "effect:Effects",
        ],
    );
});

test("normalizeEditorProject fills in missing tracks without dropping assets", () => {
    const project = createBlankEditorProject("editor-proj-1");
    const normalized = normalizeEditorProject({
        ...project,
        tracks: project.tracks.slice(0, 2),
        assets: {
            asset1: {
                id: "asset1",
                type: "video",
                url: "https://example.com/video.mp4",
                name: "Demo",
                durationMs: 1000,
            },
        },
    });

    assert.equal(normalized.tracks.length, 6);
    assert.equal(normalized.assets.asset1.name, "Demo");
});

test("upload assets are promoted into the canonical asset dictionary", () => {
    const project = createBlankEditorProject("editor-proj-1");
    const asset = createAssetFromUpload({
        id: "asset-upload-1",
        type: "video",
        url: "https://example.com/uploaded.mp4",
        name: "Uploaded clip",
        durationMs: 12000,
    });

    const result = replaceMainSourceClip(
        project,
        {
            id: "clip-1",
            type: "video",
            assetId: asset.id,
            startAtMs: 0,
            durationMs: asset.durationMs,
            sourceStartMs: 0,
            volume: 1,
            transform: {
                x: project.settings.width / 2,
                y: project.settings.height / 2,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                anchorX: 0.5,
                anchorY: 0.5,
            },
        },
        asset,
    );

    assert.equal(result.assets[asset.id]?.id, asset.id);
    const mainClip = result.tracks.find((track) => track.type === "video_main")?.clips[0];
    assert.ok(mainClip);
    assert.equal(mainClip?.assetId, asset.id);
    assert.equal(getAssetUrl(result, mainClip!), asset.url);
    assert.equal(resolveClipAsset(result, mainClip!)?.name, "Uploaded clip");
});

test("library assets resolve to the expected track class", () => {
    assert.equal(trackTypeForLibraryKind("broll"), "video_overlay");
    assert.equal(trackTypeForLibraryKind("music"), "audio");
    assert.equal(trackTypeForLibraryKind("vfx"), "effect");

    const asset = createAssetFromLibraryRow("vfx", {
        id: "vfx-1",
        slug: "flash-pop",
        name: "Flash Pop",
        description: null,
        category_id: null,
        thumbnail_url: null,
        preview_url: "https://example.com/flash.mp4",
        vfx_type: "flash",
        config: { type: "flash", color: "#ffffff" },
        is_premium: false,
        sort_order: 1,
        created_at: new Date().toISOString(),
    } as any);

    const project = createBlankEditorProject("editor-proj-1");
    const result = insertAssetIntoProject({
        project,
        asset,
        startAtMs: 0,
        trackType: "effect",
        trackName: "Effects",
        effectConfig: { type: "flash", color: "#ffffff" },
    });

    assert.equal(result.clip.type, "effect");
    assert.equal(sortTracksForRender(result.project.tracks)[0].type, "video_main");
});
