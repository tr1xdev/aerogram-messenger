/**
 * @generated SignedSource<<a3feb4cf9cc82d9b59307f15e983d000>>
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
    readonly success?: boolean;
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
v2 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "channelContentRemoveMemberMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "removeChatMember",
        "plural": false,
        "selections": [
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentRemoveMemberMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
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
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "16f68ea19a3b3078832a3955e0f76488",
    "id": null,
    "metadata": {},
    "name": "channelContentRemoveMemberMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentRemoveMemberMutation(\n  $chatID: ID!\n  $userID: ID!\n) {\n  removeChatMember(chatID: $chatID, userID: $userID) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "72b3e9e345a765369718056fe10f9059";

export default node;
