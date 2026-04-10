/**
 * @generated SignedSource<<e8696005bf0bf0999a7ed3d0981da6a3>>
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
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly isPremium: boolean;
    readonly isVerified: boolean;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly status: string;
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
            "name": "email",
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
            "name": "displayName",
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
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isVerified",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isPremium",
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

(node as any).hash = "7ef85fedff52a723560f5b9650cfa4b9";

export default node;
