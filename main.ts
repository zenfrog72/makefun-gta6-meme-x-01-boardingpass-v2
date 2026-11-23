// Boarding Pass v2 — entrypoint for the gta6-meme-x-01 bounty entry.
//
// What this program does, in order:
//   1. Reads POST.json and meme.png from the current working directory.
//   2. Checks both files against the entry rules (see the two checkers).
//   3. Only if every check passes, copies both files — byte for byte —
//      into the output directory and exits 0.
// Any failed check aborts the run with a non-zero exit and nothing copied.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const POST_MAX_BYTES = 16_384;
const URL_MAX_CHARS = 2_048;

function refuse(reason: string): never {
  console.error(`boarding-pass entry: ${reason}`);
  process.exit(1);
}

function loadRequired(name: string): Buffer {
  try {
    return readFileSync(name);
  } catch {
    refuse(`cannot read ${name}`);
  }
}

// ---- POST.json -------------------------------------------------------------
// Rules: the file is at most POST_MAX_BYTES long, parses as a JSON object,
// and carries a "url" string no longer than URL_MAX_CHARS characters.
function checkPost(raw: Buffer): void {
  if (raw.length > POST_MAX_BYTES) {
    refuse(`POST.json is ${raw.length} bytes; the cap is ${POST_MAX_BYTES}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    refuse("POST.json is not valid JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    refuse("POST.json must hold a JSON object");
  }
  const url = (parsed as Record<string, unknown>)["url"];
  if (typeof url !== "string") {
    refuse('POST.json needs a string "url" field');
  }
  if (url.length > URL_MAX_CHARS) {
    refuse(`POST.json url runs ${url.length} characters; the cap is ${URL_MAX_CHARS}`);
  }
}

// ---- meme.png --------------------------------------------------------------
// Rules: the file opens with the eight-byte PNG signature, then a chain of
// chunks. Each chunk is laid out as
//   [4-byte big-endian length][4-byte type][length bytes of data][4-byte CRC]
// where the CRC is the IEEE CRC-32 of (type bytes followed by data bytes).
// The first chunk must be IHDR, and the chain must finish with an IEND chunk
// whose final byte is also the final byte of the file — no trailing junk.

const PNG_MAGIC: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Lookup table for the reflected IEEE polynomial 0xEDB88320, built once.
const CRC_LOOKUP: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let value = 0; value < 256; value++) {
    let reg = value;
    for (let bit = 0; bit < 8; bit++) {
      reg = reg & 1 ? 0xedb88320 ^ (reg >>> 1) : reg >>> 1;
    }
    table[value] = reg >>> 0;
  }
  return table;
})();

function crcOf(bytes: Buffer): number {
  let reg = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    reg = CRC_LOOKUP[(reg ^ bytes[i]) & 0xff] ^ (reg >>> 8);
  }
  return (reg ^ 0xffffffff) >>> 0;
}

function checkPng(png: Buffer): void {
  if (png.length < PNG_MAGIC.length) {
    refuse("meme.png is too short to be a PNG");
  }
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (png[i] !== PNG_MAGIC[i]) {
      refuse("meme.png does not start with the PNG signature");
    }
  }

  let cursor = PNG_MAGIC.length;
  let isFirst = true;
  for (;;) {
    // A chunk header alone needs eight bytes: length plus type.
    if (cursor + 8 > png.length) {
      refuse("meme.png ends in the middle of a chunk header");
    }
    const dataLength = png.readUInt32BE(cursor);
    const typeStart = cursor + 4;
    const type = png.toString("ascii", typeStart, typeStart + 4);
    const dataStart = typeStart + 4;
    const crcStart = dataStart + dataLength;
    const nextChunk = crcStart + 4;
    if (nextChunk > png.length) {
      refuse(`meme.png chunk ${type} overruns the end of the file`);
    }
    const storedCrc = png.readUInt32BE(crcStart);
    const actualCrc = crcOf(png.subarray(typeStart, crcStart));
    if (storedCrc !== actualCrc) {
      refuse(`meme.png chunk ${type} fails its CRC-32 check`);
    }
    if (isFirst && type !== "IHDR") {
      refuse(`meme.png opens with ${type}; the first chunk must be IHDR`);
    }
    isFirst = false;
    cursor = nextChunk;
    if (type === "IEND") {
      break;
    }
  }
  if (cursor !== png.length) {
    refuse("meme.png has extra bytes after the IEND chunk");
  }
}

// ---- publish ---------------------------------------------------------------

function main(): void {
  const post = loadRequired("POST.json");
  const meme = loadRequired("meme.png");
  checkPost(post);
  checkPng(meme);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "POST.json"), post);
  writeFileSync(join(outDir, "meme.png"), meme);
}

main();
