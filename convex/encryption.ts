// convex/encryption.ts

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || "SpotlightAppSecretKey2026";

// Helper to convert Uint8Array to Base64
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Derive a CryptoKey from the ENCRYPTION_KEY string using AES-CBC
async function getCryptoKey(): Promise<CryptoKey> {
  const rawKey = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

const PREFIX = "enc:v1:";

/**
 * Encrypts a plain text string into a base64 encrypted string with prefix.
 */
export async function encryptText(text: string): Promise<string> {
  if (!text || text.startsWith(PREFIX)) return text;
  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encodedText = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      encodedText
    );

    // Combine IV (16 bytes) and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return PREFIX + arrayBufferToBase64(combined);
  } catch (err) {
    console.error("Encryption error:", err);
    return text; // fallback to plain text if failed
  }
}

/**
 * Decrypts an encrypted base64 string back to plain text.
 * Instantly returns legacy plain text if the prefix is missing.
 */
export async function decryptText(text: string): Promise<string> {
  if (!text) return text;

  // 🔒 Safe legacy guard: Return immediately if not encrypted with enc:v1:
  if (!text.startsWith(PREFIX)) {
    return text;
  }

  try {
    const encryptedBase64 = text.slice(PREFIX.length);
    const key = await getCryptoKey();
    const combined = base64ToArrayBuffer(encryptedBase64);

    if (combined.length < 16) return text;

    const iv = combined.slice(0, 16);
    const data = combined.slice(16);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption error:", err);
    return text;
  }
}
