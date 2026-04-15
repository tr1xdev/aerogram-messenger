/**
 * @generated SignedSource<<dbfa95069f0be3d426affb70af87df5a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type sessionsManagerQuery$variables = Record<PropertyKey, never>;
export type sessionsManagerQuery$data = {
  readonly mySessions: ReadonlyArray<{
    readonly createdAt: string;
    readonly device: string | null | undefined;
    readonly id: string;
    readonly ipAddress: string | null | undefined;
    readonly isActive: boolean | null | undefined;
    readonly isCurrent: boolean;
    readonly location: string | null | undefined;
  }>;
};
export type sessionsManagerQuery = {
  response: sessionsManagerQuery$data;
  variables: sessionsManagerQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Session",
    "kind": "LinkedField",
    "name": "mySessions",
    "plural": true,
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
        "name": "device",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "ipAddress",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "location",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isActive",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isCurrent",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "createdAt",
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
    "name": "sessionsManagerQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "sessionsManagerQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "3b19493599ddb77ce8ec6c67a739d8da",
    "id": null,
    "metadata": {},
    "name": "sessionsManagerQuery",
    "operationKind": "query",
    "text": "query sessionsManagerQuery {\n  mySessions {\n    id\n    device\n    ipAddress\n    location\n    isActive\n    isCurrent\n    createdAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "1e4b2711fbff72d3ce40b415f909d41d";

export default node;
