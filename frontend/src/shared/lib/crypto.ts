export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export const generateE2EEKeys = async (): Promise<KeyPair> => {
  const keys = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );

  const pub = await window.crypto.subtle.exportKey("spki", keys.publicKey);
  const priv = await window.crypto.subtle.exportKey("pkcs8", keys.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(pub))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(priv))),
  };
};

export const encryptText = async (
  text: string,
  recipientPublicKeyB64: string,
  myPrivateKeyB64: string,
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

  const myPrivKey = await window.crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(myPrivateKeyB64), (c) => c.charCodeAt(0)),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"],
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
  myPrivateKeyB64: string,
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

  const myPrivKey = await window.crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(myPrivateKeyB64), (c) => c.charCodeAt(0)),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"],
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

export const decryptMessage = async (
  text: string,
  senderPublicKey: string,
  myPrivateKey: string,
): Promise<string> => {
  try {
    const [ivB64, ciphertextB64] = text.split(":");
    if (!ivB64 || !ciphertextB64) return text;

    return await decryptText(
      ciphertextB64,
      ivB64,
      senderPublicKey,
      myPrivateKey,
    );
  } catch {
    return "Decryption Error";
  }
};
