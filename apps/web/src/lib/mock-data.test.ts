import assert from "node:assert/strict";
import test from "node:test";
import { MOCK_PROJECTS } from "./mock-data";

test("dashboard mock projects use the database row shape", () => {
  assert.ok(MOCK_PROJECTS.length > 0);
  for (const project of MOCK_PROJECTS) {
    assert.ok("template_id" in project);
    assert.ok("created_at" in project);
    assert.ok("updated_at" in project);
    assert.ok("hook_text" in project);
    assert.ok(!("templateId" in project));
    assert.ok(!("createdAt" in project));
  }
});
