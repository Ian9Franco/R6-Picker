import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";

test("Next.js build directory exists", () => {
  assert.strictEqual(fs.existsSync(".next"), true, ".next directory should exist after build");
});
