/**
 * @generated SignedSource<<7583be1df73f738a5efd38731cc8be4d>>
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
    "cacheID": "ffb968c534ad1b09e0540a77f48429e6",
    "id": null,
    "metadata": {},
    "name": "useMarkDialogMutation",
    "operationKind": "mutation",
    "text": "mutation useMarkDialogMutation(\n  $chatId: ID!\n) {\n  markDialogAsRead(chatId: $chatId)\n}\n"
  }
};
})();

(node as any).hash = "e61e815d8a52405cff42619a1a088158";

export default node;
