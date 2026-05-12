/**
 * @generated SignedSource<<8bdaa45f679f9040e6bda29711de1248>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChannelActionsRemoveMemberMutation$variables = {
  chatID: string;
  userID: string;
};
export type useChannelActionsRemoveMemberMutation$data = {
  readonly removeChatMember: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChannelActionsRemoveMemberMutation = {
  response: useChannelActionsRemoveMemberMutation$data;
  variables: useChannelActionsRemoveMemberMutation$variables;
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
    "name": "useChannelActionsRemoveMemberMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChannelActionsRemoveMemberMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2be9f19670771893947a49da660df8a0",
    "id": null,
    "metadata": {},
    "name": "useChannelActionsRemoveMemberMutation",
    "operationKind": "mutation",
    "text": "mutation useChannelActionsRemoveMemberMutation(\n  $chatID: ID!\n  $userID: ID!\n) {\n  removeChatMember(chatID: $chatID, userID: $userID) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1207c60372d2cf1c7edb425c507bb062";

export default node;
