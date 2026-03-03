import { useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { UPDATE_PROFILE } from "../../chat/api/chat.gql";
import {
  generateE2EEKeys,
  savePrivateKey,
  getPrivateKey,
} from "@/shared/lib/crypto";
import type { User } from "@/entities/chat/model/types";

export function useE2EEInit(me?: User): void {
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      if (!me) return;

      console.log("[E2EE Check]", {
        username: me.username,
        dbPublicKey: !!me.publicKey,
      });

      const existingKey = await getPrivateKey(me.id);
      console.log("[E2EE Local Key]", { exists: !!existingKey });

      if (!me.publicKey) {
        try {
          console.log("[E2EE Action] Starting key generation/sync...");

          const { publicKey, privKeyObj } = await generateE2EEKeys();

          console.log("[E2EE Action] Saving private key to IndexedDB...");
          await savePrivateKey(me.id, privKeyObj);

          console.log("[E2EE Action] Sending mutation to server...", {
            publicKey,
          });
          const result = await updateProfile({
            variables: {
              input: { publicKey },
            },
          });

          console.log("[E2EE Success] Server response:", result.data);
        } catch (error: unknown) {
          console.error("[E2EE Error]", error);
        }
      } else if (!existingKey) {
        console.warn(
          "[E2EE Warning] Public key exists on server but private key is missing locally. You won't be able to decrypt old messages.",
        );
      }
    };

    initialize();
  }, [me, updateProfile]);
}
