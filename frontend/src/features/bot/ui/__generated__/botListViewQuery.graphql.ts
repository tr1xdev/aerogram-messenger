/**
 * @generated SignedSource<<03de12563260297dab8f85af8d78cd72>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type botListViewQuery$variables = Record<PropertyKey, never>;
export type botListViewQuery$data = {
  readonly myBots: ReadonlyArray<{
    readonly firstName: string;
    readonly id: string;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"botListView_user">;
  }>;
};
export type botListViewQuery = {
  response: botListViewQuery$data;
  variables: botListViewQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "botListViewQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "myBots",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "botListView_user"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "botListViewQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "myBots",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
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
            "name": "botDescription",
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
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9b8acd825afceb66ef301067f18f3ec6",
    "id": null,
    "metadata": {},
    "name": "botListViewQuery",
    "operationKind": "query",
    "text": "query botListViewQuery {\n  myBots {\n    id\n    username\n    firstName\n    photoUrl\n    ...botListView_user\n  }\n}\n\nfragment botListView_user on User {\n  id\n  username\n  firstName\n  lastName\n  botDescription\n  photoUrl\n  status\n  isVerified\n}\n"
  }
};
})();

(node as any).hash = "0310d97fcc99741db24c476a1877c74b";

export default node;
