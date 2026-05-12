/**
 * @generated SignedSource<<3d097220b272bb0f4af664439e62c442>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChannelActionsKickMutation$variables = {
  chatID: string;
  userID: string;
};
export type useChannelActionsKickMutation$data = {
  readonly removeChatMember: {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "NotFoundError";
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
export type useChannelActionsKickMutation = {
  response: useChannelActionsKickMutation$data;
  variables: useChannelActionsKickMutation$variables;
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
    "name": "userID"
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
        "name": "userID",
        "variableName": "userID"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "removeChatMember",
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
        "type": "NotFoundError",
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
    "name": "useChannelActionsKickMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChannelActionsKickMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "7d1468517d7a99198ad8e7c107d41216",
    "id": null,
    "metadata": {},
    "name": "useChannelActionsKickMutation",
    "operationKind": "mutation",
    "text": "mutation useChannelActionsKickMutation(\n  $chatID: ID!\n  $userID: ID!\n) {\n  removeChatMember(chatID: $chatID, userID: $userID) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on NotFoundError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6ce363e7cd7d6f2dfde27168f007bb03";

export default node;
