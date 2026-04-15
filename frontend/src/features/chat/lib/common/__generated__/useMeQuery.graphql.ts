/**
 * @generated SignedSource<<05c1b3cd0219c4680824904bdea47108>>
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
    readonly firstName: string;
    readonly id: string;
    readonly lastName: string | null | undefined;
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
        "name": "firstName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastName",
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
    "cacheID": "c58ab513565cd1b1fff6b920543ada97",
    "id": null,
    "metadata": {},
    "name": "useMeQuery",
    "operationKind": "query",
    "text": "query useMeQuery {\n  me {\n    id\n    username\n    firstName\n    lastName\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "58a18ba31eebdc1007ff45f763a6bbe7";

export default node;
