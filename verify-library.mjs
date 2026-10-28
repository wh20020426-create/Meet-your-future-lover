import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const catalog = JSON.parse(await readFile("lib/library-manifest.json", "utf8"));
const hashes = new Set();
let total = 0;
for (const entry of catalog) {
  const bytes = await readFile(path.join("public", entry.path));
  if (
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP" ||
    bytes.length < 10000
  )
    throw new Error(`Invalid image: ${entry.id}`);
  if (
    !bytes.includes(Buffer.from("Pre-generated AI synthetic image")) ||
    !bytes.includes(Buffer.from(entry.id))
  )
    throw new Error(`Missing synthetic-content description: ${entry.id}`);
  const hash = createHash("sha256");
  let parts = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const tag = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    if (["VP8 ", "VP8L", "ALPH"].includes(tag)) {
      hash.update(bytes.subarray(offset + 8, offset + 8 + size));
      parts++;
    }
    offset += 8 + size + (size % 2);
  }
  if (!parts) throw new Error(`No image pixels: ${entry.id}`);
  const digest = hash.digest("hex");
  if (hashes.has(digest)) throw new Error(`Duplicate pixel data: ${entry.id}`);
  hashes.add(digest);
  total += bytes.length;
}
if (catalog.length !== 60) throw new Error("Expected 60 portraits");
console.log(
  `Verified ${catalog.length} images: valid WebP, 60 distinct pixel payloads, AI description metadata. Total ${(total / 1024 / 1024).toFixed(2)} MiB.`,
);
