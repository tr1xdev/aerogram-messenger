/**
 * @generated SignedSource<<3c4aaa151d94e27dd14bfa678fd47b64>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botDetailViewDeleteMutation$variables = {
  id: string;
};
export type botDetailViewDeleteMutation$data = {
  readonly deleteBot: boolean;
};
export type botDetailViewDeleteMutation = {
  response: botDetailViewDeleteMutation$data;
  variables: botDetailViewDeleteMutation$variables;
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
    "name": "deleteBot",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "botDetailViewDeleteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "botDetailViewDeleteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e865ade4a5777d051c71c63050c372cd",
    "id": null,
    "metadata": {},
    "name": "botDetailViewDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation botDetailViewDeleteMutation(\n  $id: ID!\n) {\n  deleteBot(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "a4658456fa431f70d90833194e2bd7a5";

export default node;
