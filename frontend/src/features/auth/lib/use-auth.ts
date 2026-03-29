import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { gqlClient } from "@/shared/api/client";
import { useAuthStore } from "@/store/auth-store";
import {
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from "../api/auth.gql";

export const parseApiError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const e = error as { response?: { errors?: { message: string }[] } };
    if (e.response?.errors && e.response.errors.length > 0) {
      return e.response.errors[0].message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
};

interface AuthPayload {
  userId: string;
}

interface VerifyPayload {
  accessToken: string;
  refreshToken: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface SignUpInput {
  username?: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface VerifyEmailInput {
  userID: string;
  code: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (variables: { input: LoginInput }) => {
      const response = await gqlClient.request<{ login: AuthPayload }>(
        LOGIN_MUTATION,
        variables,
      );
      return response.login;
    },
    onSuccess: (data) => {
      navigate({
        to: "/otp",
        search: { userId: data.userId },
      });
    },
  });
};

export const useSignUp = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (variables: { input: SignUpInput }) => {
      const response = await gqlClient.request<{ signUp: AuthPayload }>(
        SIGNUP_MUTATION,
        variables,
      );
      return response.signUp;
    },
    onSuccess: (data) => {
      navigate({
        to: "/otp",
        search: { userId: data.userId },
      });
    },
  });
};

export const useVerifyEmail = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: async (variables: { input: VerifyEmailInput }) => {
      const response = await gqlClient.request<{ verifyEmail: VerifyPayload }>(
        VERIFY_EMAIL_MUTATION,
        variables,
      );
      return response.verifyEmail;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate({ to: "/" });
    },
  });
};
