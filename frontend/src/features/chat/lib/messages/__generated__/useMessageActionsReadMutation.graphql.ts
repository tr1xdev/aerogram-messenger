/**
 * @generated SignedSource<<120558bd9a2145b106e9ec44d8045856>>
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
    "cacheID": "f217856681b8ff3103b638cc89418628",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsReadMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "1ccf40b491df7c2e7435f5a23816f4de";

export default node;
