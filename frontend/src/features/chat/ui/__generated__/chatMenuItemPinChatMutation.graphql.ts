/**
 * @generated SignedSource<<618cb4fd4496cf6e7495cd831a1759f5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type chatMenuItemPinChatMutation$variables = {
  id: string;
  pinned: boolean;
};
export type chatMenuItemPinChatMutation$data = {
  readonly pinChat: {
    readonly success?: boolean;
  };
};
export type chatMenuItemPinChatMutation = {
  response: chatMenuItemPinChatMutation$data;
  variables: chatMenuItemPinChatMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "pinned"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  },
  {
    "kind": "Variable",
    "name": "pinned",
    "variableName": "pinned"
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
    "name": "chatMenuItemPinChatMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "pinChat",
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
    "name": "chatMenuItemPinChatMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "pinChat",
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
    "cacheID": "41a02ed302b18371806156a92a9c88d3",
    "id": null,
    "metadata": {},
    "name": "chatMenuItemPinChatMutation",
    "operationKind": "mutation",
    "text": "mutation chatMenuItemPinChatMutation(\n  $id: ID!\n  $pinned: Boolean!\n) {\n  pinChat(id: $id, pinned: $pinned) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b6c79eb76a178be71b8f20f130603de0";

export default node;
