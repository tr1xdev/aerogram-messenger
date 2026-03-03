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

      const existingKey = await getPrivateKey(me.id);

      if (!me.publicKey && !existingKey) {
        try {
          const { publicKey, privKeyObj } = await generateE2EEKeys();
          await savePrivateKey(me.id, privKeyObj);

          await updateProfile({
            variables: {
              input: { publicKey },
            },
          });
        } catch (error: unknown) {
          console.error("[E2EE] Init failed", error);
        }
      }
    };

    initialize();
  }, [me, updateProfile]);
}
