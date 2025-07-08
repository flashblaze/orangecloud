/**
 * Crypto utilities for client-side encryption
 * Works in both browser and Cloudflare Workers environments
 */

export interface EncryptedCredentials {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
}

export interface EncryptionResult {
  encryptedCredentials: string;
  wrappedDek: string;
  salt: string;
  iv: string;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const deriveKey = async (
  passphrase: string,
  salt: ArrayBuffer,
  iterations = 100000
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Generate a random DEK (Data Encryption Key)
export const generateDEK = async (): Promise<CryptoKey> => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);

  // Since we're using symmetric encryption, return the CryptoKey directly
  return key as CryptoKey;
};

// Encrypt data with AES-GCM
export const encryptData = async (
  key: CryptoKey,
  data: string,
  iv?: ArrayBuffer
): Promise<{ ciphertext: ArrayBuffer; iv: ArrayBuffer }> => {
  const encoder = new TextEncoder();
  const ivArray = iv ? new Uint8Array(iv) : crypto.getRandomValues(new Uint8Array(12));
  const ivBuffer = ivArray.buffer;

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(data)
  );

  return { ciphertext, iv: ivBuffer };
};

// Decrypt data with AES-GCM
export const decryptData = async (
  key: CryptoKey,
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer
): Promise<string> => {
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

// Wrap DEK with KEK (Key Encryption Key)
export const wrapDEK = async (kek: CryptoKey, dek: CryptoKey): Promise<ArrayBuffer> => {
  const dekRaw = await crypto.subtle.exportKey('raw', dek);

  // Ensure we have an ArrayBuffer
  const dekBuffer = dekRaw instanceof ArrayBuffer ? dekRaw : (dekRaw as any).buffer;

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, kek, dekBuffer);

  // Prepend IV to wrapped key
  const result = new Uint8Array(iv.length + wrapped.byteLength);
  result.set(iv);
  result.set(new Uint8Array(wrapped), iv.length);

  return result.buffer;
};

// Unwrap DEK with KEK
export const unwrapDEK = async (kek: CryptoKey, wrappedDek: ArrayBuffer): Promise<CryptoKey> => {
  const wrapped = new Uint8Array(wrappedDek);
  const iv = wrapped.slice(0, 12);
  const ciphertext = wrapped.slice(12);

  const dekRaw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer },
    kek,
    ciphertext.buffer
  );

  return crypto.subtle.importKey('raw', dekRaw, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
};

// Main encryption function
export const encryptCredentials = async (
  credentials: EncryptedCredentials,
  passphrase: string
): Promise<EncryptionResult> => {
  // Generate salt and derive KEK
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kek = await deriveKey(passphrase, salt.buffer);

  // Generate DEK
  const dek = await generateDEK();

  // Encrypt credentials with DEK
  const credentialsJson = JSON.stringify(credentials);
  const { ciphertext, iv } = await encryptData(dek, credentialsJson);

  // Wrap DEK with KEK
  const wrappedDek = await wrapDEK(kek, dek);

  return {
    encryptedCredentials: arrayBufferToBase64(ciphertext),
    wrappedDek: arrayBufferToBase64(wrappedDek),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv),
  };
};

// Main decryption function
export const decryptCredentials = async (
  encryptionResult: EncryptionResult,
  passphrase: string
): Promise<EncryptedCredentials> => {
  // Derive KEK from passphrase and salt
  const salt = base64ToArrayBuffer(encryptionResult.salt);
  const kek = await deriveKey(passphrase, salt);

  // Unwrap DEK
  const wrappedDek = base64ToArrayBuffer(encryptionResult.wrappedDek);
  const dek = await unwrapDEK(kek, wrappedDek);

  // Decrypt credentials
  const ciphertext = base64ToArrayBuffer(encryptionResult.encryptedCredentials);
  const iv = base64ToArrayBuffer(encryptionResult.iv);
  const decryptedJson = await decryptData(dek, ciphertext, iv);

  return JSON.parse(decryptedJson) as EncryptedCredentials;
};

// Secure memory cleanup (best effort)
export const secureCleanup = (_key: CryptoKey): void => {
  // In a real implementation, you'd want to zero out memory
  // This is a best-effort approach since we can't directly control GC
  try {
    // Force garbage collection if available (not standard)
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
    }
  } catch {
    // Ignore errors
  }
};
