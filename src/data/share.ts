// Compact URL-hash codec for the collected state.
//
// The album has a fixed, stable id order (`getAllIds()`), so the state is
// just an array of counts in that order. Each count is 0–9 (onLong caps at
// 9), so it fits in a nibble: we pack two counts per byte and base64url the
// bytes. ~994 stickers → ~497 bytes → ~663 chars in the hash.
//
// A leading version byte lets old links fail loudly if the album structure
// (PER_TEAM / FWC_COUNT / CC_COUNT) ever changes.

import { getAllIds } from '~/data/album';

const VERSION = 1;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(collected: Record<string, number>): string {
  const ids = getAllIds();
  const bytes = new Uint8Array(1 + Math.ceil(ids.length / 2));
  bytes[0] = VERSION;
  ids.forEach((id, i) => {
    const n = Math.min(Math.max(collected[id] || 0, 0), 15);
    const byte = 1 + (i >> 1);
    bytes[byte] |= i & 1 ? n : n << 4;
  });
  return toBase64Url(bytes);
}

/** Returns the decoded `collected` map, or null if the payload is invalid. */
export function decodeShare(payload: string): Record<string, number> | null {
  try {
    const bytes = fromBase64Url(payload);
    if (bytes.length < 1 || bytes[0] !== VERSION) return null;
    const ids = getAllIds();
    if (bytes.length - 1 < Math.ceil(ids.length / 2)) return null;
    const collected: Record<string, number> = {};
    ids.forEach((id, i) => {
      const byte = bytes[1 + (i >> 1)];
      const n = i & 1 ? byte & 0x0f : byte >> 4;
      if (n > 0) collected[id] = n;
    });
    return collected;
  } catch {
    return null;
  }
}

/** Full shareable URL for the given state (current page, state in the hash). */
export function buildShareUrl(collected: Record<string, number>): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#a=${encodeShare(collected)}`;
}

/** Reads an incoming shared state from the location hash, if any. */
export function readShareFromHash(): Record<string, number> | null {
  const m = window.location.hash.match(/[#&]a=([^&]+)/);
  return m ? decodeShare(m[1]) : null;
}

/** Decodes a pasted full URL *or* a bare payload (manual-import fallback). */
export function decodeShareFromText(
  text: string,
): Record<string, number> | null {
  const trimmed = text.trim();
  const m = trimmed.match(/[#&]a=([^&\s]+)/);
  return decodeShare(m ? m[1] : trimmed);
}
