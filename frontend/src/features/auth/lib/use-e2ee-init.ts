import { useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { UPDATE_PROFILE } from "../../chat/api/chat.gql";
import { generateE2EEKeys } from "@/shared/lib/crypto";
import type { User } from "@/entities/chat/model/types";

export function useE2EEInit(me?: User): void {
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  useEffect(() => {
    const initializeKeys = async (): Promise<void> => {
      if (!me || me.publicKey) return;

      const storageKey = `e2ee_priv_${me.id}`;
      const existingPrivKey = localStorage.getItem(storageKey);

      if (!existingPrivKey) {
        try {
          const keys = await generateE2EEKeys();
          localStorage.setItem(storageKey, keys.privateKey);

          await updateProfile({
            variables: {
              input: {
                publicKey: keys.publicKey,
              },
            },
          });
        } catch {
          console.error("E2EE initialization failed");
        }
      }
    };

    initializeKeys();
  }, [me, updateProfile]);
}
