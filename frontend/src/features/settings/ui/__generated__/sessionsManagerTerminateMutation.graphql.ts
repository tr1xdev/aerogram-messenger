/**
 * @generated SignedSource<<20c208ba5cae5ebcd15665676f481c37>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type sessionsManagerTerminateMutation$variables = {
  id: string;
};
export type sessionsManagerTerminateMutation$data = {
  readonly terminateSession: boolean;
};
export type sessionsManagerTerminateMutation = {
  response: sessionsManagerTerminateMutation$data;
  variables: sessionsManagerTerminateMutation$variables;
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
    "name": "terminateSession",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "sessionsManagerTerminateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "sessionsManagerTerminateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3011a80be2146b0f334e24f24cf352fe",
    "id": null,
    "metadata": {},
    "name": "sessionsManagerTerminateMutation",
    "operationKind": "mutation",
    "text": "mutation sessionsManagerTerminateMutation(\n  $id: ID!\n) {\n  terminateSession(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "7a6c95fb3dba08eef34c058fd367480b";

export default node;
