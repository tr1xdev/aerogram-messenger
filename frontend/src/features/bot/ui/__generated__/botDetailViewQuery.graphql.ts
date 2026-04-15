/**
 * @generated SignedSource<<74355b6c7f0dfc98235e68ebb804f968>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botDetailViewQuery$variables = {
  id: string;
};
export type botDetailViewQuery$data = {
  readonly user: {
    readonly botDescription: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  };
};
export type botDetailViewQuery = {
  response: botDetailViewQuery$data;
  variables: botDetailViewQuery$variables;
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
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "user",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "username",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "firstName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "botDescription",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "photoUrl",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "botDetailViewQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "botDetailViewQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "64534dda6884cfc2f8f7a8c279919176",
    "id": null,
    "metadata": {},
    "name": "botDetailViewQuery",
    "operationKind": "query",
    "text": "query botDetailViewQuery(\n  $id: ID!\n) {\n  user(id: $id) {\n    id\n    username\n    firstName\n    botDescription\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "dbee6922e4dcba350451a49cb1c9b0dd";

export default node;
