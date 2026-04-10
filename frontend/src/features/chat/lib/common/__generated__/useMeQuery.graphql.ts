/**
 * @generated SignedSource<<e8032a5ce4977bf8385251cbf376dd62>>
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
    "kind": "ClientExtension",
    "selections": [
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
    ]
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
    "cacheID": "315bb7f8a91c853f5f56d63d0d96053e",
    "id": null,
    "metadata": {},
    "name": "useMeQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "d5e29972ea225a13d499e8a504a504b6";

export default node;
