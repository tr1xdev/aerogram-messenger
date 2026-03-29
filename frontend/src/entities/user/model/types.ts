import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { gqlClient } from "@/shared/api/client";
import { useAuthStore } from "@/store/auth-store";
import {
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from "@/features/auth/api/auth.gql";

interface AuthPayload {
  user_id: string;
}

interface VerifyPayload {
  access_token: string;
  refresh_token: string;
}

interface LoginVariables {
  input: {
    email: string;
    password: string;
  };
}

interface SignUpVariables {
  input: {
    username?: string;
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
  };
}

interface VerifyVariables {
  input: {
    userID: string;
    code: string;
  };
}

export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (variables: LoginVariables) => {
      const response = await gqlClient.request<{ login: AuthPayload }>(
        LOGIN_MUTATION,
        variables,
      );
      return response.login;
    },
    onSuccess: (data) => {
      navigate({ to: "/otp", search: { userId: data.user_id } });
    },
  });
};

export const useSignUp = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (variables: SignUpVariables) => {
      const response = await gqlClient.request<{ signUp: AuthPayload }>(
        SIGNUP_MUTATION,
        variables,
      );
      return response.signUp;
    },
    onSuccess: (data) => {
      navigate({ to: "/otp", search: { userId: data.user_id } });
    },
  });
};

export const useVerifyEmail = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: async (variables: VerifyVariables) => {
      const response = await gqlClient.request<{ verifyEmail: VerifyPayload }>(
        VERIFY_EMAIL_MUTATION,
        variables,
      );
      return response.verifyEmail;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      navigate({ to: "/" });
    },
  });
};
