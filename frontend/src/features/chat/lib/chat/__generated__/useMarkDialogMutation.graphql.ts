/**
 * @generated SignedSource<<bc7bc2b36efaea6189ea5ed187e8bfdc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMarkDialogMutation$variables = {
  chatId: string;
};
export type useMarkDialogMutation$data = {
  readonly markDialogAsRead: boolean;
};
export type useMarkDialogMutation = {
  response: useMarkDialogMutation$data;
  variables: useMarkDialogMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatId"
  }
],
v1 = [
  {
    "kind": "ClientExtension",
    "selections": [
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "chatId",
            "variableName": "chatId"
          }
        ],
        "kind": "ScalarField",
        "name": "markDialogAsRead",
        "storageKey": null
      }
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useMarkDialogMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useMarkDialogMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d8287a92fc0bab94172fb0c941e3dbd8",
    "id": null,
    "metadata": {},
    "name": "useMarkDialogMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "e61e815d8a52405cff42619a1a088158";

export default node;
