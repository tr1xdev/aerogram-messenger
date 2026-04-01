import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      userId
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      requiresVerification
    }
  }
`;

export const TERMINATE_ALL_SESSIONS_MUTATION = gql`
  mutation TerminateAllOtherSessions {
    terminateAllOtherSessions
  }
`;

export const TERMINATE_SESSION_MUTATION = gql`
  mutation TerminateSession($id: ID!) {
    terminateSession(id: $id)
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const GET_SESSIONS_QUERY = gql`
  query GetSessions($userId: ID!) {
    sessions(userId: $userId) {
      id
      device
      ipAddress
      location
      isActive
      isCurrent
      createdAt
    }
  }
`;
