import { useEffect } from "react";
import { useMutation } from "@apollo/client/react/index.js";
import { UPDATE_PROFILE } from "@/features/chat/api";
import {
  generateE2EEKeys,
  savePrivateKey,
  getPrivateKey,
  exportAndEncryptPrivateKey,
  getMasterKey,
  decryptAndImportPrivateKey,
} from "@/shared/lib/crypto";
import type { User } from "@/entities/chat/model/types";

export function useE2EEInit(me?: User): void {
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  useEffect((): void => {
    if (!me) return;

    const init = async (): Promise<void> => {
      try {
        const localKey = await getPrivateKey(me.id);

        if (!localKey && !me.publicKey) {
          const { publicKey, privateKey } = await generateE2EEKeys();
          await savePrivateKey(me.id, privateKey);

          const masterKey = await getMasterKey("password123", me.id);
          const encrypted = await exportAndEncryptPrivateKey(
            privateKey,
            masterKey,
          );

          await updateProfile({
            variables: {
              input: {
                publicKey,
                encryptedPrivKey: encrypted.ciphertext,
                encryptionIv: encrypted.iv,
              },
            },
          });
        } else if (!localKey && me.encryptedPrivKey && me.encryptionIv) {
          const masterKey = await getMasterKey("password123", me.id);
          const restoredKey = await decryptAndImportPrivateKey(
            me.encryptedPrivKey,
            me.encryptionIv,
            masterKey,
          );
          await savePrivateKey(me.id, restoredKey);
          window.location.reload();
        }
      } catch (err: unknown) {
        console.error("[E2EE] Init error:", err);
      }
    };

    init();
  }, [me, updateProfile]);
}
