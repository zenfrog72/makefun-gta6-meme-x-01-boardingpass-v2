// Boarding Pass v2 — entrypoint for the gta6-meme-x-01 meme entry.
//
// This program renders nothing. It proves the two entry files are whole
// and inside the hand-in limits, then copies them byte for byte into the
// output directory the harness names (MAKEFUN_OUTPUT_DIR, else /output).
//
//   POST.json — at most 16,384 bytes on disk; parses as a JSON object;
//               its "url" member is a string of at most 2,048 characters.
//   meme.png  — carries the PNG signature; the first chunk is IHDR (its
//               canvas size is read from there); every chunk's stored
//               CRC-32 matches the CRC computed over type + data; the
//               walk ends on an IEND chunk that finishes the file exactly,
//               with no trailing bytes.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENTRY_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const POST_BYTE_CAP = 16384;
const URL_CHAR_CAP = 2048;

function refuse(reason: string): never {
  console.error(`main.ts: ${reason}`);
  process.exit(1);
}

// ---------- POST.json ----------

const postBytes = readFileSync(join(ENTRY_DIR, "POST.json"));
if (postBytes.length > POST_BYTE_CAP) {
  refuse(`POST.json is ${postBytes.length} bytes, over the ${POST_BYTE_CAP}-byte cap`);
}

let postParsed: unknown;
try {
  postParsed = JSON.parse(postBytes.toString("utf8"));
} catch {
  refuse("POST.json does not parse as JSON");
}
if (typeof postParsed !== "object" || postParsed === null || Array.isArray(postParsed)) {
  refuse("POST.json must hold a JSON object");
}
const postUrl = (postParsed as { url?: unknown }).url;
if (typeof postUrl !== "string" || postUrl.length === 0) {
  refuse("POST.json carries no usable url string");
}
if (postUrl.length > URL_CHAR_CAP) {
  refuse(`POST.json url is ${postUrl.length} characters, over the ${URL_CHAR_CAP}-character cap`);
}

// ---------- meme.png ----------

const pngBytes = readFileSync(join(ENTRY_DIR, "meme.png"));

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (pngBytes.length < PNG_MAGIC.length || !pngBytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
  refuse("meme.png does not start with the PNG signature");
}

// CRC-32 (IEEE 802.3 polynomial, as PNG uses), table-driven.
const crcTable: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let cursor = PNG_MAGIC.length;
let chunkIndex = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let sawIend = false;

while (cursor < pngBytes.length) {
  if (cursor + 8 > pngBytes.length) {
    refuse(`chunk ${chunkIndex} header runs past the end of meme.png`);
  }
  const dataLength = pngBytes.readUInt32BE(cursor);
  const typeStart = cursor + 4;
  const dataStart = cursor + 8;
  const dataEnd = dataStart + dataLength;
  const crcEnd = dataEnd + 4;
  if (crcEnd > pngBytes.length) {
    refuse(`chunk ${chunkIndex} runs past the end of meme.png`);
  }
  const chunkType = pngBytes.toString("ascii", typeStart, dataStart);
  const storedCrc = pngBytes.readUInt32BE(dataEnd);
  const computedCrc = crc32(pngBytes.subarray(typeStart, dataEnd));
  if (storedCrc !== computedCrc) {
    refuse(`chunk ${chunkIndex} (${chunkType}) fails its CRC-32 check`);
  }
  if (chunkIndex === 0) {
    if (chunkType !== "IHDR" || dataLength !== 13) {
      refuse("the first chunk of meme.png is not a 13-byte IHDR");
    }
    canvasWidth = pngBytes.readUInt32BE(dataStart);
    canvasHeight = pngBytes.readUInt32BE(dataStart + 4);
    if (canvasWidth === 0 || canvasHeight === 0) {
      refuse("IHDR reports a zero-sized canvas");
    }
  }
  cursor = crcEnd;
  chunkIndex++;
  if (chunkType === "IEND") {
    sawIend = true;
    break;
  }
}
if (!sawIend) {
  refuse("meme.png ends without an IEND chunk");
}
if (cursor !== pngBytes.length) {
  refuse(`meme.png has ${pngBytes.length - cursor} trailing bytes after IEND`);
}

// ---------- hand the proven files over ----------

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, "POST.json"), postBytes);
writeFileSync(join(OUTPUT_DIR, "meme.png"), pngBytes);
console.log(
  `main.ts: POST.json (${postBytes.length} bytes) and meme.png ` +
    `(${canvasWidth}x${canvasHeight}, ${chunkIndex} chunks CRC-verified) copied to ${OUTPUT_DIR}`,
);
