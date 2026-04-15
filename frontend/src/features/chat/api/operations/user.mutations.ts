import { gql } from "@apollo/client";
import { USER_FIELDS } from "../fragments/message.fragments";

export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const TERMINATE_SESSION = gql`
  mutation TerminateSession($id: ID!) {
    terminateSession(id: $id)
  }
`;

export const TERMINATE_ALL_OTHERS = gql`
  mutation TerminateAllOtherSessions {
    terminateAllOtherSessions
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;
