/**
 * @generated SignedSource<<54a15e00d048016c6d7d9b96e686e929>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMeQuery$variables = Record<PropertyKey, never>;
export type useMeQuery$data = {
  readonly me: {
    readonly id: string;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  };
};
export type useMeQuery = {
  response: useMeQuery$data;
  variables: useMeQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "me",
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
        "name": "photoUrl",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "useMeQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useMeQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "28f3f63ada633e996f822aa091d0ebc0",
    "id": null,
    "metadata": {},
    "name": "useMeQuery",
    "operationKind": "query",
    "text": "query useMeQuery {\n  me {\n    id\n    username\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "d5e29972ea225a13d499e8a504a504b6";

export default node;
