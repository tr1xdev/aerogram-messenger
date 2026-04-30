/**
 * @generated SignedSource<<985f0f61b3988db5789b56bb25d697d4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type chatMenuItemLeaveChatMutation$variables = {
  id: string;
};
export type chatMenuItemLeaveChatMutation$data = {
  readonly leaveChat: {
    readonly success?: boolean;
  };
};
export type chatMenuItemLeaveChatMutation = {
  response: chatMenuItemLeaveChatMutation$data;
  variables: chatMenuItemLeaveChatMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "chatID",
    "variableName": "id"
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
    "name": "chatMenuItemLeaveChatMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "leaveChat",
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
    "name": "chatMenuItemLeaveChatMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "leaveChat",
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
    "cacheID": "df31f949eb40a51f3fbc06afa92bab3a",
    "id": null,
    "metadata": {},
    "name": "chatMenuItemLeaveChatMutation",
    "operationKind": "mutation",
    "text": "mutation chatMenuItemLeaveChatMutation(\n  $id: ID!\n) {\n  leaveChat(chatID: $id) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "13d60e5a2571b07b7a17a5fa16b554bb";

export default node;
