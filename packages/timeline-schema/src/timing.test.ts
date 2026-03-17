import test from "node:test";
import assert from "node:assert/strict";
import type { Project } from "./index";
import {
    framesFromMs,
    getProjectDurationInFrames,
    getProjectDurationMs,
    msFromFrames,
} from "./timing";

const project: Project = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Timing Fixture",
    createdAt: "2026-03-17T00:00:00.000Z",
    updatedAt: "2026-03-17T00:00:00.000Z",
    settings: {
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: 6000,
        backgroundColor: "#000000",
    },
    assets: {},
    tracks: [
        {
            id: "22222222-2222-4222-8222-222222222222",
            type: "video_main",
            name: "Main",
            hidden: false,
            muted: false,
            clips: [
                {
                    id: "33333333-3333-4333-8333-333333333333",
                    type: "video",
                    startAtMs: 0,
                    durationMs: 5000,
                    assetId: "44444444-4444-4444-8444-444444444444",
                    sourceStartMs: 0,
                    volume: 1,
                },
            ],
        },
        {
            id: "55555555-5555-4555-8555-555555555555",
            type: "text",
            name: "Captions",
            hidden: false,
            muted: false,
            clips: [
                {
                    id: "66666666-6666-4666-8666-666666666666",
                    type: "text",
                    startAtMs: 7000,
                    durationMs: 2000,
                    content: "Late caption",
                    transform: {
                        x: 540,
                        y: 960,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                    },
                    style: {
                        fontFamily: "Inter",
                        fontSize: 48,
                        color: "#ffffff",
                        textAlign: "center",
                        fontWeight: "700",
                    },
                },
            ],
        },
    ],
};

test("framesFromMs and msFromFrames round trip cleanly", () => {
    assert.equal(framesFromMs(1500, 30), 45);
    assert.equal(msFromFrames(45, 30), 1500);
});

test("project duration math respects the longest clip", () => {
    assert.equal(getProjectDurationMs(project), 9000);
    assert.equal(getProjectDurationInFrames(project), 270);
});
