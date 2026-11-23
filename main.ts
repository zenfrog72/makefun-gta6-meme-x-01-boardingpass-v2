// boarding-pass-v2 entrypoint, final call
// Gatekeeper for the Boarding Pass v2 entry: POST.json and meme.png are
// checked thoroughly first, and only a clean pair is copied to the output
// directory. If anything is off, nothing is copied at all.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const POST_BYTE_LIMIT = 16384;
const URL_CHAR_LIMIT = 2048;

// --- CRC-32 (IEEE) -----------------------------------------------------------

const CRC_LOOKUP = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_LOOKUP[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// --- POST.json ---------------------------------------------------------------

function readPost() {
  const name = "POST.json";
  if (!existsSync(name)) fail("POST.json is missing from the entry");
  if (statSync(name).size > POST_BYTE_LIMIT) {
    fail("POST.json is over the 16384-byte limit");
  }
  const raw = readFileSync(name);
  let parsed;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    fail("POST.json does not parse as JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("POST.json must hold a JSON object");
  }
  if (typeof parsed.url !== "string") {
    fail('POST.json must carry a "url" string');
  }
  if (parsed.url.length > URL_CHAR_LIMIT) {
    fail("the POST.json url is over the 2048-character limit");
  }
  return raw;
}

// --- meme.png ----------------------------------------------------------------

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readMeme() {
  const name = "meme.png";
  if (!existsSync(name)) fail("meme.png is missing from the entry");
  const data = readFileSync(name);
  if (data.length < PNG_MAGIC.length || !data.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    fail("meme.png does not open with the PNG signature");
  }
  // Walk the chunk list: 4-byte length, 4-byte type, data, 4-byte CRC.
  let offset = PNG_MAGIC.length;
  let isFirst = true;
  for (;;) {
    if (offset + 8 > data.length) {
      fail("meme.png stops in the middle of a chunk header");
    }
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunkDataEnd = offset + 8 + length;
    const chunkEnd = chunkDataEnd + 4;
    if (chunkEnd > data.length) {
      fail(`meme.png chunk ${type} reaches past the end of the file`);
    }
    if (isFirst && type !== "IHDR") {
      fail("meme.png must begin with an IHDR chunk");
    }
    isFirst = false;
    const storedCrc = data.readUInt32BE(chunkDataEnd);
    if (storedCrc !== crc32(data.subarray(offset + 4, chunkDataEnd))) {
      fail(`meme.png chunk ${type} fails its CRC-32 check`);
    }
    offset = chunkEnd;
    if (type === "IEND") break;
  }
  if (offset !== data.length) {
    fail("meme.png has extra bytes after IEND");
  }
  return data;
}

// --- driver ------------------------------------------------------------------

// Validation gathers every problem it can find and reports them together,
// so a broken entry hears everything that is wrong in a single run instead
// of fixing one complaint at a time.
class ValidationStop extends Error {}

const problems = [];

function fail(message) {
  problems.push(message);
  throw new ValidationStop(message);
}

function attempt(load) {
  try {
    return load();
  } catch (err) {
    if (err instanceof ValidationStop) return null;
    throw err;
  }
}

function main() {
  const post = attempt(readPost);
  const meme = attempt(readMeme);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`main.ts: ${problem}`);
    }
    process.exit(1);
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "POST.json"), post);
  writeFileSync(join(outDir, "meme.png"), meme);
}

main();
