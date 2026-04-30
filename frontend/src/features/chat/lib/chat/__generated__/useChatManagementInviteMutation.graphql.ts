/**
 * @generated SignedSource<<ddf057f9af490e858d3fa08489a3f571>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChatManagementInviteMutation$variables = {
  chatID: string;
  userIds: ReadonlyArray<string>;
};
export type useChatManagementInviteMutation$data = {
  readonly inviteToChat: {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChatManagementInviteMutation = {
  response: useChatManagementInviteMutation$data;
  variables: useChatManagementInviteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "userIds"
  }
],
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "chatID",
        "variableName": "chatID"
      },
      {
        "kind": "Variable",
        "name": "userIds",
        "variableName": "userIds"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "inviteToChat",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "__typename",
        "storageKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "success",
            "storageKey": null
          }
        ],
        "type": "SuccessResult",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v1/*: any*/),
        "type": "ForbiddenError",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v1/*: any*/),
        "type": "InternalError",
        "abstractKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatManagementInviteMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChatManagementInviteMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "553a48a41a50ded780e49f60f7304360",
    "id": null,
    "metadata": {},
    "name": "useChatManagementInviteMutation",
    "operationKind": "mutation",
    "text": "mutation useChatManagementInviteMutation(\n  $chatID: ID!\n  $userIds: [ID!]!\n) {\n  inviteToChat(chatID: $chatID, userIds: $userIds) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7ef7e4e5b5fbfa5f4c4e6654c64f7cf5";

export default node;
