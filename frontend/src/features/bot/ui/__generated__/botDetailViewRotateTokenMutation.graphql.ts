/**
 * @generated SignedSource<<29845a42b091ae5193bb8b0521068f0b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botDetailViewRotateTokenMutation$variables = {
  id: string;
};
export type botDetailViewRotateTokenMutation$data = {
  readonly rotateBotToken: string;
};
export type botDetailViewRotateTokenMutation = {
  response: botDetailViewRotateTokenMutation$data;
  variables: botDetailViewRotateTokenMutation$variables;
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
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "kind": "ScalarField",
    "name": "rotateBotToken",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "botDetailViewRotateTokenMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "botDetailViewRotateTokenMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "84da0cdbddea743803ef3af4ea0f9e9c",
    "id": null,
    "metadata": {},
    "name": "botDetailViewRotateTokenMutation",
    "operationKind": "mutation",
    "text": "mutation botDetailViewRotateTokenMutation(\n  $id: ID!\n) {\n  rotateBotToken(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "fe16c9dc42e9e41835ee065c3f942ae9";

export default node;
