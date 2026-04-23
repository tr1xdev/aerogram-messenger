/**
 * @generated SignedSource<<7e9c9410cde82f26e7289313cb01ec38>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type groupContentRemoveMemberMutation$variables = {
  chatID: string;
  userID: string;
};
export type groupContentRemoveMemberMutation$data = {
  readonly removeChatMember: {
    readonly success?: boolean;
  };
};
export type groupContentRemoveMemberMutation = {
  response: groupContentRemoveMemberMutation$data;
  variables: groupContentRemoveMemberMutation$variables;
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
    "name": "groupContentRemoveMemberMutation",
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
    "name": "groupContentRemoveMemberMutation",
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
    "cacheID": "f11189fc2f397860d77836dc42cbece8",
    "id": null,
    "metadata": {},
    "name": "groupContentRemoveMemberMutation",
    "operationKind": "mutation",
    "text": "mutation groupContentRemoveMemberMutation(\n  $chatID: ID!\n  $userID: ID!\n) {\n  removeChatMember(chatID: $chatID, userID: $userID) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "58f6429d14a4effcd686ba0282d0b5d9";

export default node;
