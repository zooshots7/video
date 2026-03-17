import test from "node:test";
import assert from "node:assert/strict";
import { v4 as uuidv4 } from "uuid";
import {
    buildCaptionGroups,
    createIdleRenderSummary,
    createAssetFromUpload,
    createBlankEditorProject,
    getPreferredRenderJob,
    insertResourceClip,
    mergeRecentRenderJobs,
    replaceMainSourceClip,
    renderJobToSummary,
} from "./editor-workflow";

test("createBlankEditorProject seeds the canonical track layout", () => {
    const project = createBlankEditorProject(uuidv4());

    assert.equal(project.tracks.some((track) => track.type === "video_main"), true);
    assert.equal(project.tracks.some((track) => track.type === "text"), true);
    assert.equal(project.tracks.some((track) => track.type === "effect"), true);
});

test("buildCaptionGroups folds words into short caption chunks", () => {
    const groups = buildCaptionGroups([
        { word: "Hello", start: 0, end: 0.3 },
        { word: "there", start: 0.35, end: 0.65 },
        { word: "welcome", start: 1.1, end: 1.5 },
        { word: "back", start: 1.55, end: 1.8 },
    ]);

    assert.equal(groups.length, 2);
    assert.equal(groups[0].text, "Hello there");
    assert.equal(groups[1].text, "welcome back");
});

test("insertResourceClip stores VFX as effect clips on the effects track", () => {
    const project = createBlankEditorProject(uuidv4());
    const asset = createAssetFromUpload({
        name: "Flash",
        type: "effect",
        url: "https://example.com/flash.json",
        durationMs: 1200,
        metadata: {
            config: { type: "flash" },
        },
    });

    const next = insertResourceClip(project, asset, "vfx", 1000, {
        config: { color: "#ffffff" },
    });

    const effectTrack = next.tracks.find((track) => track.type === "effect");
    assert.ok(effectTrack);
    assert.equal(effectTrack?.clips[0]?.type, "effect");
    assert.equal(effectTrack?.clips[0]?.startAtMs, 1000);
});

test("replaceMainSourceClip updates the main video track and asset dictionary", () => {
    const project = createBlankEditorProject(uuidv4());
    const asset = createAssetFromUpload({
        name: "Source",
        type: "video",
        url: "https://example.com/source.mp4",
        durationMs: 10_000,
        metadata: { width: 1920, height: 1080 },
    });

    const next = replaceMainSourceClip(project, {
        id: uuidv4(),
        type: "video",
        assetId: asset.id,
        startAtMs: 0,
        durationMs: asset.durationMs,
        sourceStartMs: 0,
        volume: 1,
        src: asset.url,
    }, asset);

    const mainTrack = next.tracks.find((track) => track.type === "video_main");
    assert.ok(mainTrack);
    assert.equal(mainTrack?.clips.length, 1);
    assert.equal(next.assets[asset.id]?.url, asset.url);
});

test("render job helpers prefer active jobs and derive render summary", () => {
    const jobs = mergeRecentRenderJobs([], [
        {
            id: "older-done",
            projectId: "project-1",
            status: "done",
            progress: 100,
            outputUrl: "https://example.com/done.mp4",
            errorMessage: null,
            createdAt: "2026-03-16T10:00:00.000Z",
            startedAt: "2026-03-16T10:00:05.000Z",
            completedAt: "2026-03-16T10:01:00.000Z",
        },
        {
            id: "active-job",
            projectId: "project-1",
            status: "rendering",
            progress: 64,
            outputUrl: null,
            errorMessage: null,
            createdAt: "2026-03-17T10:00:00.000Z",
            startedAt: "2026-03-17T10:00:05.000Z",
            completedAt: null,
        },
    ]);

    const preferredJob = getPreferredRenderJob(jobs);
    const summary = renderJobToSummary(preferredJob);

    assert.equal(jobs[0]?.id, "active-job");
    assert.equal(preferredJob?.id, "active-job");
    assert.deepEqual(createIdleRenderSummary(), {
        status: "idle",
        jobId: null,
        outputUrl: null,
        message: null,
        progress: 0,
    });
    assert.equal(summary.status, "rendering");
    assert.equal(summary.jobId, "active-job");
    assert.equal(summary.progress, 64);
});
