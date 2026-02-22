/**
 * IRmark computation (Deno-compatible)
 *
 * HMRC requires every FPS/EPS submission to carry an IRmark — a SHA-1 hash
 * (base64-encoded) of the canonicalised Body element of the GovTalkMessage.
 *
 * Algorithm:
 * 1. Extract <Body>...</Body> substring
 * 2. Add GovTalkMessage namespace to Body element
 * 3. Remove IRmark element
 * 4. Strip &#xD; carriage returns
 * 5. SHA-1 hash → base64
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

  // Remove carriage returns
  bodyString = bodyString.replace(/&#xD;/g, '');

  // SHA-1 hash → base64 using Web Crypto API (Deno)
  return await sha1Base64(bodyString);
}

/**
 * SHA-1 hash of a string, returned as base64.
 * Uses the Web Crypto API available in Deno.
 */
async function sha1Base64(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = new Uint8Array(hashBuffer);
  return base64Encode(hashArray);
}

/**
 * Inserts a computed IRmark value into an XML string.
 */
export function insertIRmark(xml: string, irmark: string): string {
  return xml.replace(
    '<IRmark Type="generic"></IRmark>',
    `<IRmark Type="generic">${irmark}</IRmark>`
  );
}
