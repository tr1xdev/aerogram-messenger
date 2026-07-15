import { useState, useCallback } from "react";
import { graphql, useMutation } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import type { useAuthLoginMutation } from "./__generated__/useAuthLoginMutation.graphql";
import type { useAuthSignUpMutation } from "./__generated__/useAuthSignUpMutation.graphql";
import type { useAuthVerifyEmailMutation } from "./__generated__/useAuthVerifyEmailMutation.graphql";

const loginMutation = graphql`
  mutation useAuthLoginMutation($input: LoginInput!) {
    login(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

const signUpMutation = graphql`
  mutation useAuthSignUpMutation($input: SignUpInput!) {
    signUp(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

const verifyEmailMutation = graphql`
  mutation useAuthVerifyEmailMutation($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

function normalizeError(message: string): string {
  if (!message) return "An unknown error occurred";

  let cleanMessage = message;

  const relayPattern = /^No data returned for operation\s+[`'"]?[\w-]+[`'"]?,\s+got error\(s\):\s*/i;

  if (relayPattern.test(cleanMessage)) {
    cleanMessage = cleanMessage.replace(relayPattern, "");
  }

  cleanMessage = cleanMessage.split("See the error")[0].trim();

  return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
}

export function parseApiError(error: unknown): string {
  if (typeof error === "string") return normalizeError(error);
  if (error instanceof Error) return normalizeError(error.message);
  if (Array.isArray(error) && error.length > 0) {
    return normalizeError(error[0]?.message);
  }
  return normalizeError("");
}

export const useLogin = (): {
  mutate: (params: {
    input: useAuthLoginMutation["variables"]["input"];
  }) => void;
  isPending: boolean;
  error: Error | null;
} => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<Error | null>(null);
  const [commit, isInFlight] = useMutation<useAuthLoginMutation>(loginMutation);

  const mutate = useCallback(
    (params: { input: useAuthLoginMutation["variables"]["input"] }): void => {
      setError(null);
      commit({
        variables: { input: params.input },
        onCompleted: (response, errors): void => {
          if (errors && errors.length > 0) {
            setError(new Error(errors[0].message));
            return;
          }

          const data = response?.login;
          if (!data) return;

          if (data.requiresVerification) {
            navigate({ to: "/otp", search: { userId: data.userId } });
          } else if (data.accessToken && data.refreshToken) {
            setTokens(data.accessToken, data.refreshToken);
            navigate({ to: "/" });
          }
        },
        onError: (err: Error): void => setError(err),
      });
    },
    [commit, navigate, setTokens],
  );

  return { mutate, isPending: isInFlight, error };
};

export const useSignUp = (): {
  mutate: (params: {
    input: useAuthSignUpMutation["variables"]["input"];
  }) => void;
  isPending: boolean;
  error: Error | null;
} => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<Error | null>(null);
  const [commit, isInFlight] =
    useMutation<useAuthSignUpMutation>(signUpMutation);

  const mutate = useCallback(
    (params: { input: useAuthSignUpMutation["variables"]["input"] }): void => {
      setError(null);
      commit({
        variables: { input: params.input },
        onCompleted: (response, errors): void => {
          if (errors && errors.length > 0) {
            setError(new Error(errors[0].message));
            return;
          }

          const data = response?.signUp;
          if (!data) return;

          if (data.requiresVerification) {
            navigate({ to: "/otp", search: { userId: data.userId } });
          } else if (data.accessToken && data.refreshToken) {
            setTokens(data.accessToken, data.refreshToken);
            navigate({ to: "/" });
          }
        },
        onError: (err: Error): void => setError(err),
      });
    },
    [commit, navigate, setTokens],
  );

  return { mutate, isPending: isInFlight, error };
};

export const useVerifyEmail = (): {
  mutate: (params: {
    input: useAuthVerifyEmailMutation["variables"]["input"];
  }) => void;
  isPending: boolean;
  error: Error | null;
} => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<Error | null>(null);
  const [commit, isInFlight] =
    useMutation<useAuthVerifyEmailMutation>(verifyEmailMutation);

  const mutate = useCallback(
    (params: {
      input: useAuthVerifyEmailMutation["variables"]["input"];
    }): void => {
      setError(null);
      commit({
        variables: { input: params.input },
        onCompleted: (response, errors): void => {
          if (errors && errors.length > 0) {
            setError(new Error(errors[0].message));
            return;
          }

          const data = response?.verifyEmail;
          if (data?.accessToken && data?.refreshToken) {
            setTokens(data.accessToken, data.refreshToken);
            navigate({ to: "/" });
          }
        },
        onError: (err: Error): void => setError(err),
      });
    },
    [commit, navigate, setTokens],
  );

  return { mutate, isPending: isInFlight, error };
};
