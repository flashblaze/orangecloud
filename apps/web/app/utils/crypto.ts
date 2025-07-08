/**
 * Client-side crypto utilities for credential encryption
 * Uses Web Crypto API available in browsers
 */

export interface EncryptedCredentials {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
}

export interface EncryptionResult {
  encryptedCredentials: string; // Base64 encoded
  wrappedDek: string; // Base64 encoded
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive key from passphrase using PBKDF2
export async function deriveKey(
  passphrase: string,
  salt: ArrayBuffer,
  iterations = 100000
): Promise<CryptoKey> {
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
}

// Generate a random DEK (Data Encryption Key)
export async function generateDEK(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);

  return key as CryptoKey;
}

// Encrypt data with AES-GCM
export async function encryptData(
  key: CryptoKey,
  data: string,
  iv?: ArrayBuffer
): Promise<{ ciphertext: ArrayBuffer; iv: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const ivArray = iv ? new Uint8Array(iv) : crypto.getRandomValues(new Uint8Array(12));
  const ivBuffer = ivArray.buffer;

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(data)
  );

  return { ciphertext, iv: ivBuffer };
}

// Decrypt data with AES-GCM
export async function decryptData(
  key: CryptoKey,
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Wrap DEK with KEK (Key Encryption Key)
export async function wrapDEK(kek: CryptoKey, dek: CryptoKey): Promise<ArrayBuffer> {
  const dekRaw = await crypto.subtle.exportKey('raw', dek);
  const dekBuffer = dekRaw instanceof ArrayBuffer ? dekRaw : (dekRaw as any).buffer;

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, kek, dekBuffer);

  // Prepend IV to wrapped key
  const result = new Uint8Array(iv.length + wrapped.byteLength);
  result.set(iv);
  result.set(new Uint8Array(wrapped), iv.length);

  return result.buffer;
}

// Unwrap DEK with KEK
export async function unwrapDEK(kek: CryptoKey, wrappedDek: ArrayBuffer): Promise<CryptoKey> {
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
}

// Main encryption function
export async function encryptCredentials(
  credentials: EncryptedCredentials,
  passphrase: string
): Promise<EncryptionResult> {
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
}

// Main decryption function
export async function decryptCredentials(
  encryptionResult: EncryptionResult,
  passphrase: string
): Promise<EncryptedCredentials> {
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
}

// Generate a strong passphrase suggestion
export function generatePassphraseSuggestion(): string {
  const words = [
    'ocean',
    'mountain',
    'forest',
    'river',
    'valley',
    'desert',
    'meadow',
    'canyon',
    'sunrise',
    'sunset',
    'rainbow',
    'thunder',
    'lightning',
    'breeze',
    'shadow',
    'crystal',
    'diamond',
    'emerald',
    'sapphire',
    'ruby',
    'golden',
    'silver',
    'copper',
    'bronze',
    'swift',
    'brave',
    'wise',
    'noble',
    'gentle',
    'fierce',
    'calm',
    'bright',
  ];

  const numbers = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  const selectedWords = [];

  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selectedWords.push(words[randomIndex]);
    words.splice(randomIndex, 1); // Remove to avoid duplicates
  }

  return `${selectedWords.join('-')}-${numbers}`;
}

// Validate passphrase strength
export function validatePassphrase(passphrase: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (passphrase.length >= 12) {
    score += 2;
  } else if (passphrase.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(passphrase)) score += 1;
  if (/[A-Z]/.test(passphrase)) score += 1;
  if (/\d/.test(passphrase)) score += 1;
  if (/[^a-zA-Z\d]/.test(passphrase)) score += 1;

  if (score < 3) {
    feedback.push('Include uppercase, lowercase, numbers, and symbols');
  }

  // Check for common weak patterns
  if (/^(.)\1+$/.test(passphrase)) {
    feedback.push('Avoid repeating characters');
    score = 0;
  }

  if (/^(password|123456|qwerty|admin)/i.test(passphrase)) {
    feedback.push('Avoid common passwords');
    score = 0;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}
