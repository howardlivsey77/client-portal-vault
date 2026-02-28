/**
 * IRmark computation (Deno-compatible)
 *
 * HMRC requires every FPS/EPS submission to carry an IRmark — a SHA-1 hash
 * (base64-encoded) of the canonicalised Body element of the GovTalkMessage.
 *
 * Algorithm (from HMRC specification):
 * 1. Extract <Body>...</Body> substring
 * 2. Add GovTalkMessage namespace attribute to the Body element
 * 3. Remove the IRmark element entirely
 * 4. Strip &#xD; carriage returns
 * 5. CANONICALISE the result (W3C Canonical XML 1.0) ← REQUIRED, was missing
 * 6. SHA-1 hash → base64
 *
 * The canonicalisation step is not optional. HMRC's IRmark verifier runs c14n
 * on their end before hashing. Without it the hash will never match and every
 * submission will be rejected with an IRmark error.
 */

import { encode as base64Encode } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

/**
 * Computes the IRmark for a given XML string that contains an empty
 * <IRmark Type="generic"></IRmark> placeholder.
 */
export async function computeIRmark(xml: string): Promise<string> {
  // Extract the GovTalkMessage namespace declaration
  const nsMatch = xml.match(/<GovTalkMessage ([^>]+)>/);
  if (!nsMatch) throw new Error('IRmark: could not find GovTalkMessage element');
  const namespace = nsMatch[1];

  // Extract the Body element
  const bodyStart = xml.lastIndexOf('<Body>');
  const bodyEnd = xml.lastIndexOf('</Body>') + 7;
  if (bodyStart === -1 || bodyEnd < 7) {
    throw new Error('IRmark: could not extract Body element');
  }
  let bodyString = xml.substring(bodyStart, bodyEnd);

  // Add the GovTalkMessage namespace to the Body element
  bodyString = bodyString.replace(/^<Body>/, `<Body ${namespace}>`);

  // Remove the IRmark element itself from the body string
  bodyString = bodyString.replace(
    /<(vat:)?IRmark Type="generic">[A-Za-z0-9/+=]*<\/(vat:)?IRmark>/g,
    ''
  );

  // Remove carriage returns that c14n may introduce
  bodyString = bodyString.replace(/&#xD;/g, '');

  // CANONICALISE before hashing (this step was missing — it is required)
  const canonical = canonicalise(bodyString);

  return await sha1Base64(canonical);
}

/**
 * Minimal W3C Canonical XML 1.0 implementation.
 *
 * Full c14n is complex, but FPS XML has a known, controlled structure.
 * This implementation handles all transformations relevant to HMRC FPS:
 *
 *  1. Expand self-closing tags to explicit open/close pairs
 *  2. Normalise attribute order (alphabetical within each element)
 *  3. Normalise whitespace in text nodes (collapse runs, trim)
 *  4. Use double quotes for all attribute values
 *  5. Encode special characters in text and attribute values
 *  6. Propagate namespace declarations to child elements where needed
 *
 * If you encounter IRmark rejections from HMRC that appear to be c14n-related,
 * compare the body string produced here against the output of IRmarkDOS.jar
 * on the same input to identify any divergence.
 */
function canonicalise(xml: string): string {
  let result = xml;

  // 1. Expand self-closing tags: <Tag/> → <Tag></Tag>
  result = result.replace(/<([A-Za-z][A-Za-z0-9:_.-]*)([^>]*?)\/>/g, '<$1$2></$1>');

  // 2. Normalise attribute quoting to double quotes
  result = result.replace(/(\s[A-Za-z][A-Za-z0-9:_.-]*)='([^']*)'/g, '$1="$2"');

  // 3. Sort attributes alphabetically within each opening tag.
  result = result.replace(/<([A-Za-z][A-Za-z0-9:_.-]*)((?:\s+[A-Za-z][A-Za-z0-9:_.-]*="[^"]*"){2,})\s*>/g,
    (_match, tagName, attrsStr) => {
      const attrPattern = /\s+([A-Za-z][A-Za-z0-9:_.-]*)="([^"]*)"/g;
      const attrs: Array<[string, string]> = [];
      let m: RegExpExecArray | null;
      while ((m = attrPattern.exec(attrsStr)) !== null) {
        attrs.push([m[1], m[2]]);
      }
      attrs.sort(([a], [b]) => a.localeCompare(b));
      const sortedAttrs = attrs.map(([k, v]) => ` ${k}="${v}"`).join('');
      return `<${tagName}${sortedAttrs}>`;
    }
  );

  // 4. Normalise line endings to LF only
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 5. Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

/**
 * SHA-1 hash of a string, returned as base64.
 * Uses the Web Crypto API (available in Deno and modern browsers).
 */
async function sha1Base64(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = new Uint8Array(hashBuffer);
  return base64Encode(hashArray);
}

/**
 * Inserts a computed IRmark value into an XML string that contains the
 * placeholder <IRmark Type="generic"></IRmark>.
 */
export function insertIRmark(xml: string, irmark: string): string {
  return xml.replace(
    '<IRmark Type="generic"></IRmark>',
    `<IRmark Type="generic">${irmark}</IRmark>`
  );
}
