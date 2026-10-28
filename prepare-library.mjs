import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const records = JSON.parse(await readFile(process.argv[2], "utf8"));
const dir = path.join(process.cwd(), "public", "library");
await mkdir(dir, { recursive: true });
let total = 0;
for (const r of records) {
  const target = path.join(dir, r.id + ".webp");
  await sharp(r.path)
    .resize({ width: 960, withoutEnlargement: true })
    .withXmp(
      `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description>Fictional adult portrait. Pre-generated AI synthetic image for Soulmate Lab static library. Asset ${r.id}.</dc:description></rdf:Description></rdf:RDF></x:xmpmeta>`,
    )
    .webp({ quality: 88 })
    .toFile(target);
  total++;
}
console.log(`Prepared ${total} static portraits in public/library.`);
