import test from "node:test";
import assert from "node:assert/strict";
import { mimeTypeToExt } from "./upload";

test("mimeTypeToExt maps supported media types", () => {
    assert.equal(mimeTypeToExt("video/mp4"), ".mp4");
    assert.equal(mimeTypeToExt("audio/wav"), ".wav");
    assert.equal(mimeTypeToExt("image/webp"), ".webp");
    assert.equal(mimeTypeToExt("application/json"), "");
});
