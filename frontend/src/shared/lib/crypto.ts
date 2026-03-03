const DB_NAME = "chat-e2ee";
const STORE_NAME = "keys";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function getMasterKey(
  password: string,
  salt: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function generateE2EEKeys(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const pair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"],
  );

  const pubExport = await window.crypto.subtle.exportKey(
    "spki",
    pair.publicKey,
  );
  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(pubExport))),
    privateKey: pair.privateKey,
  };
}

export async function exportAndEncryptPrivateKey(
  privKey: CryptoKey,
  masterKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    exported,
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
  };
}

export async function decryptAndImportPrivateKey(
  ciphertextB64: string,
  ivB64: string,
  masterKey: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) =>
    c.charCodeAt(0),
  );
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    masterKey,
    ciphertext,
  );

  return window.crypto.subtle.importKey(
    "pkcs8",
    decrypted,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );
}

export async function savePrivateKey(
  userId: string,
  privKey: CryptoKey,
): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(privKey, userId);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(userId);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(tx.error);
  });
}

export async function encryptText(
  text: string,
  peerPubKeyB64: string,
  myPrivKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const peerKeyBuf = Uint8Array.from(atob(peerPubKeyB64), (c) =>
    c.charCodeAt(0),
  );
  const peerPubKey = await window.crypto.subtle.importKey(
    "spki",
    peerKeyBuf,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPubKey },
    myPrivKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    new TextEncoder().encode(text),
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
  };
}

export async function decryptText(
  ciphertext: string,
  ivB64: string,
  peerPubKeyB64: string,
  myPrivKey: CryptoKey,
): Promise<string> {
  const peerKeyBuf = Uint8Array.from(atob(peerPubKeyB64), (c) =>
    c.charCodeAt(0),
  );
  const peerPubKey = await window.crypto.subtle.importKey(
    "spki",
    peerKeyBuf,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPubKey },
    myPrivKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0)),
    },
    sharedKey,
    Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0)),
  );

  return new TextDecoder().decode(decrypted);
}
