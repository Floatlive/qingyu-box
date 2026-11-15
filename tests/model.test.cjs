const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = {};
vm.runInNewContext(
  `${fs.readFileSync(path.join(root, "js/01-core.js"), "utf8")}
   ${fs.readFileSync(path.join(root, "js/03-model.js"), "utf8")}
   globalThis.api = { emptyData, normalizeData, mergeById, mergeData };`,
  context,
);

const { emptyData, normalizeData, mergeById, mergeData } = context.api;

test("import merge keeps only the first item for each ID", () => {
  const merged = mergeById([], [
    { id: "same-id", text: "first" },
    { id: "same-id", text: "duplicate" },
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "first");
});

test("import merge keeps only one mood per date", () => {
  const merged = mergeData(emptyData(), {
    moods: [
      { id: "mood-one", date: "2026-11-15", text: "first", weather: "sunny", comment: "" },
      { id: "mood-two", date: "2026-11-15", text: "duplicate", weather: "rain", comment: "" },
    ],
  });

  assert.equal(merged.moods.length, 1);
  assert.equal(merged.moods[0].text, "first");
});

test("normalization rejects IDs that cannot be safely embedded in handlers", () => {
  const normalized = normalizeData({
    customTrivia: [
      { id: "x');globalThis.injected=true;//", name: "item", fact: "fact" },
      { id: "safe-id_123", name: "safe", fact: "fact" },
    ],
  });

  assert.deepEqual(
    Array.from(normalized.customTrivia, (item) => item.id),
    ["safe-id_123"],
  );
});
