import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Character } from "./schema";
export type StoredResult = {
  owner: string;
  request_key: string;
  fingerprint: string;
  share_token: string | null;
  character: Character;
};
type Database = { version: 1; results: StoredResult[] };
const globals = globalThis as typeof globalThis & {
  soulmateWrite?: Promise<unknown>;
};
const file = () =>
  path.join(
    process.env.SOULMATE_DATA_DIR ?? path.join(process.cwd(), "data"),
    "results.json",
  );
async function read(): Promise<Database> {
  try {
    const db = JSON.parse(await readFile(file(), "utf8"));
    if (db.version !== 1 || !Array.isArray(db.results))
      throw new Error("Invalid local database");
    return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { version: 1, results: [] };
    throw error;
  }
}
export async function transaction<T>(
  fn: (db: Database) => T | Promise<T>,
): Promise<T> {
  const run = (globals.soulmateWrite ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const db = await read();
      db.results = db.results.filter(
        (r) => new Date(r.character.expiry_at).getTime() > Date.now(),
      );
      const result = await fn(db);
      await mkdir(path.dirname(file()), { recursive: true });
      const tmp = file() + ".tmp";
      await writeFile(tmp, JSON.stringify(db), "utf8");
      await rename(tmp, file());
      return result;
    });
  globals.soulmateWrite = run;
  return run;
}
export const randomToken = () => randomBytes(24).toString("base64url");
