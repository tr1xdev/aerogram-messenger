/**
 * @generated SignedSource<<1e9d5c95579286b47b1d530dafe85c49>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMessageActionsReadMutation$variables = {
  chatId: string;
};
export type useMessageActionsReadMutation$data = {
  readonly markDialogAsRead: boolean;
};
export type useMessageActionsReadMutation = {
  response: useMessageActionsReadMutation$data;
  variables: useMessageActionsReadMutation$variables;
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
    "name": "useMessageActionsReadMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useMessageActionsReadMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f648f5018940715eca0a521fb07dd7eb",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsReadMutation",
    "operationKind": "mutation",
    "text": "mutation useMessageActionsReadMutation(\n  $chatId: ID!\n) {\n  markDialogAsRead(chatId: $chatId)\n}\n"
  }
};
})();

(node as any).hash = "1ccf40b491df7c2e7435f5a23816f4de";

export default node;
