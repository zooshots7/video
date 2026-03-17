import assert from "node:assert/strict";
import test from "node:test";
import {
  createBlankProject,
  createDefaultTracks,
  ProjectSchema,
  projectTimelineDbRowToDocument,
  projectTimelineDbRowToProject,
  projectToProjectTimelineDbRow,
} from "../src";

const sampleSettings = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationMs: 15000,
  backgroundColor: "#000000",
};

test("createDefaultTracks returns canonical editor tracks", () => {
  const tracks = createDefaultTracks();

  assert.equal(tracks.length, 6);
  assert.deepEqual(
    tracks.map((track) => track.type),
    ["video_main", "video_overlay", "audio", "audio", "text", "effect"],
  );
  assert.ok(tracks.every((track) => typeof track.id === "string" && track.id.length > 0));
});

test("ProjectSchema accepts opaque string ids and parses the canonical document", () => {
  const project = createBlankProject({
    id: "editor-proj-1",
    name: "Canonical Editor Draft",
    settings: sampleSettings,
    tracks: [
      {
        id: "track-main",
        type: "video_main",
        name: "Main Video",
        hidden: false,
        muted: false,
        clips: [],
      },
    ],
    assets: {
      "asset-main": {
        id: "asset-main",
        type: "video",
        url: "https://example.com/video.mp4",
        name: "Source Video",
        durationMs: 15000,
      },
    },
    createdAt: "2026-03-17T00:00:00.000Z",
    updatedAt: "2026-03-17T00:00:00.000Z",
  });

  assert.doesNotThrow(() => ProjectSchema.parse(project));
});

test("timeline DB row adapters round-trip the canonical project", () => {
  const project = createBlankProject({
    id: "editor-proj-1",
    name: "Canonical Editor Draft",
    settings: sampleSettings,
    tracks: [
      {
        id: "track-main",
        type: "video_main",
        name: "Main Video",
        hidden: false,
        muted: false,
        clips: [],
      },
    ],
    assets: {
      "asset-main": {
        id: "asset-main",
        type: "video",
        url: "https://example.com/video.mp4",
        name: "Source Video",
        durationMs: 15000,
      },
    },
    createdAt: "2026-03-17T00:00:00.000Z",
    updatedAt: "2026-03-17T00:00:00.000Z",
  });

  const row = projectToProjectTimelineDbRow(
    project.id,
    project,
    "2026-03-17T00:00:00.000Z",
  );

  assert.deepEqual(projectTimelineDbRowToProject(row), project);
  assert.deepEqual(projectTimelineDbRowToDocument(row), {
    projectId: "editor-proj-1",
    timeline: project,
    updatedAt: "2026-03-17T00:00:00.000Z",
  });
});
