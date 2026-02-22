// ============================================================
// CLIENT-SIDE ENCRYPTION — AES-GCM for sensitive data at rest
// ============================================================
// Encrypts MFA secrets before storing in IndexedDB.
// Uses a device-bound key derived from a random seed stored
// in IndexedDB (separate store). This prevents casual
// inspection of IndexedDB contents but is NOT a substitute
// for server-side secret storage (which the PostgreSQL
// backend will handle in production).

import { openDB } from 'idb';

const KEY_DB_NAME = 'shadow_system_keyring';
const KEY_DB_VERSION = 1;
const KEY_STORE = 'keys';
const DEVICE_KEY_ID = 'device_encryption_key';

async function getKeyDB() {
  return openDB(KEY_DB_NAME, KEY_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' });
      }
    },
  });
}

/**
 * Get or create a device-bound AES-GCM encryption key.
 * The key is stored in IndexedDB and is unique to this browser/device.
 */
async function getDeviceKey(): Promise<CryptoKey> {
  const db = await getKeyDB();
  const stored = await db.get(KEY_STORE, DEVICE_KEY_ID);

  if (stored?.jwk) {
    return crypto.subtle.importKey(
      'jwk',
      stored.jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  // Generate a new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  const jwk = await crypto.subtle.exportKey('jwk', key);
  await db.put(KEY_STORE, { id: DEVICE_KEY_ID, jwk });

  return key;
}

/**
 * Encrypt a plaintext string. Returns a base64-encoded string
 * containing the IV + ciphertext.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  // Combine IV + ciphertext into a single array
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded IV+ciphertext string back to plaintext.
 */
export async function decryptSecret(encrypted: string): Promise<string> {
  const key = await getDeviceKey();

  // Base64 decode
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}
