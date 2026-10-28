import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { transaction, type StoredResult } from "../lib/store";
import { generateCharacter } from "../lib/engine";
import { defaults } from "../lib/questions";
const base = path.resolve("work", "store-tests");
async function isolated(fn: (dir: string) => Promise<void>) {
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, "run-"));
  process.env.SOULMATE_DATA_DIR = dir;
  try {
    await fn(dir);
  } finally {
    delete process.env.SOULMATE_DATA_DIR;
    if (path.resolve(dir).startsWith(base + path.sep))
      await rm(dir, { recursive: true, force: true });
  }
}
function record(now = new Date()): StoredResult {
  return {
    owner: "synthetic-test-session",
    request_key: crypto.randomUUID(),
    fingerprint: "test-only",
    share_token: null,
    character: generateCharacter(
      { adult_confirmed: true, answers: defaults },
      now,
    ),
  };
}
test("串行事务在 32 个并发写入下不丢结果", async () =>
  isolated(async (dir) => {
    await Promise.all(
      Array.from({ length: 32 }, () =>
        transaction((db) => {
          db.results.push(record());
        }),
      ),
    );
    const data = JSON.parse(
      await readFile(path.join(dir, "results.json"), "utf8"),
    );
    assert.equal(data.results.length, 32);
    assert.equal(
      new Set(data.results.map((r: StoredResult) => r.character.id)).size,
      32,
    );
  }));
test("自动移除超过保留期的结果", async () =>
  isolated(async () => {
    await transaction((db) => {
      db.results.push(record(new Date(Date.now() - 31 * 86400000)), record());
    });
    const count = await transaction((db) => db.results.length);
    assert.equal(count, 1);
  }));
test("损坏的存储明确失败，不覆盖原文件", async () =>
  isolated(async (dir) => {
    const file = path.join(dir, "results.json");
    await writeFile(file, "corrupt-fixture", "utf8");
    await assert.rejects(() => transaction((db) => db.results.length));
    assert.equal(await readFile(file, "utf8"), "corrupt-fixture");
  }));
test("事务回调失败不会写入半成品，后续事务可以恢复", async () =>
  isolated(async () => {
    await transaction((db) => {
      db.results.push(record());
    });
    await assert.rejects(() =>
      transaction((db) => {
        db.results = [];
        throw new Error("synthetic failure");
      }),
    );
    assert.equal(await transaction((db) => db.results.length), 1);
  }));
