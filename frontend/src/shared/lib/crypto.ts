const DB_NAME = "aerogram_crypto";
const STORE_NAME = "keys";

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePrivateKey = async (
  userId: string,
  key: CryptoKey,
): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction
      .objectStore(STORE_NAME)
      .put(key, `priv_${userId}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getPrivateKey = async (
  userId: string,
): Promise<CryptoKey | null> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(`priv_${userId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const generateE2EEKeys = async (): Promise<{
  publicKey: string;
  privKeyObj: CryptoKey;
}> => {
  const keys = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"],
  );

  const pubExported = await window.crypto.subtle.exportKey(
    "spki",
    keys.publicKey,
  );
  const publicKeyB64 = btoa(
    String.fromCharCode(...new Uint8Array(pubExported)),
  );

  return {
    publicKey: publicKeyB64,
    privKeyObj: keys.privateKey,
  };
};

export const encryptText = async (
  text: string,
  recipientPublicKeyB64: string,
  myPrivKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const recipientPubKey = await window.crypto.subtle.importKey(
    "spki",
    Uint8Array.from(atob(recipientPublicKeyB64), (c) => c.charCodeAt(0)),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: recipientPubKey },
    myPrivKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedSecret,
    data,
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export const decryptText = async (
  ciphertextB64: string,
  ivB64: string,
  senderPublicKeyB64: string,
  myPrivKey: CryptoKey,
): Promise<string> => {
  const decoder = new TextDecoder();
  const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) =>
    c.charCodeAt(0),
  );
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));

  const senderPubKey = await window.crypto.subtle.importKey(
    "spki",
    Uint8Array.from(atob(senderPublicKeyB64), (c) => c.charCodeAt(0)),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: senderPubKey },
    myPrivKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedSecret,
    ciphertext,
  );

  return decoder.decode(decrypted);
};
