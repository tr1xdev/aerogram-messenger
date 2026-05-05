/**
 * @generated SignedSource<<3a2e38031e4dcaab212ae49ea223bcbe>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentRemoveMemberMutation$variables = {
  chatID: string;
  userID: string;
};
export type channelContentRemoveMemberMutation$data = {
  readonly removeChatMember: {
    readonly __typename: "ForbiddenError";
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
export type channelContentRemoveMemberMutation = {
  response: channelContentRemoveMemberMutation$data;
  variables: channelContentRemoveMemberMutation$variables;
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
        "type": "NotFoundError",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v1/*: any*/),
        "type": "ForbiddenError",
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
    "name": "channelContentRemoveMemberMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentRemoveMemberMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "936bf76127c6034d21fb3b8218e70a1c",
    "id": null,
    "metadata": {},
    "name": "channelContentRemoveMemberMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentRemoveMemberMutation(\n  $chatID: ID!\n  $userID: ID!\n) {\n  removeChatMember(chatID: $chatID, userID: $userID) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n    ... on NotFoundError {\n      message\n    }\n    ... on ForbiddenError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "260b3b4cb572ee761f60b57b03759823";

export default node;
