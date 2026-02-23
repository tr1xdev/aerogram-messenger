import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { gqlClient } from "@/shared/api/client";
import { useAuthStore } from "@/store/auth";
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
  user_id: string;
}

interface VerifyPayload {
  access_token: string;
  refresh_token: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface SignUpInput {
  username?: string;
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
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
        search: { userId: data.user_id || "" },
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
        search: { userId: data.user_id || "" },
      });
    },
  });
};

export const useVerifyEmail = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (variables: { input: VerifyEmailInput }) => {
      const response = await gqlClient.request<{ verifyEmail: VerifyPayload }>(
        VERIFY_EMAIL_MUTATION,
        variables,
      );
      return response.verifyEmail;
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAuth(true);
      navigate({ to: "/" });
    },
  });
};
