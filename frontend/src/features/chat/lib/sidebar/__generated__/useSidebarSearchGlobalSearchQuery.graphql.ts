/**
 * @generated SignedSource<<1d6cc87c4ec7b5977eb6668dd633bf7c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useSidebarSearchGlobalSearchQuery$variables = {
  query: string;
};
export type useSidebarSearchGlobalSearchQuery$data = {
  readonly searchGlobal: {
    readonly results: ReadonlyArray<{
      readonly __typename: "Chat";
      readonly id: string;
      readonly photoUrl: string | null | undefined;
      readonly title: string;
    } | {
      readonly __typename: "User";
      readonly displayName: string | null | undefined;
      readonly id: string;
      readonly photoUrl: string | null | undefined;
    } | {
      // This will never be '%other', but we need some
      // value in case none of the concrete values match.
      readonly __typename: "%other";
    }>;
  };
};
export type useSidebarSearchGlobalSearchQuery = {
  response: useSidebarSearchGlobalSearchQuery$data;
  variables: useSidebarSearchGlobalSearchQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "query"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "query",
    "variableName": "query"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
},
v5 = {
  "kind": "InlineFragment",
  "selections": [
    (v3/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "displayName",
      "storageKey": null
    },
    (v4/*: any*/)
  ],
  "type": "User",
  "abstractKey": null
},
v6 = {
  "kind": "InlineFragment",
  "selections": [
    (v3/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    (v4/*: any*/)
  ],
  "type": "Chat",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useSidebarSearchGlobalSearchQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "GlobalSearchList",
        "kind": "LinkedField",
        "name": "searchGlobal",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": null,
            "kind": "LinkedField",
            "name": "results",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "storageKey": null
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useSidebarSearchGlobalSearchQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "GlobalSearchList",
        "kind": "LinkedField",
        "name": "searchGlobal",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": null,
            "kind": "LinkedField",
            "name": "results",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              {
                "kind": "InlineFragment",
                "selections": [
                  (v3/*: any*/)
                ],
                "type": "Node",
                "abstractKey": "__isNode"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d5ece0d66a6c8cdf366ee5dccc657591",
    "id": null,
    "metadata": {},
    "name": "useSidebarSearchGlobalSearchQuery",
    "operationKind": "query",
    "text": "query useSidebarSearchGlobalSearchQuery(\n  $query: String!\n) {\n  searchGlobal(query: $query) {\n    results {\n      __typename\n      ... on User {\n        id\n        displayName\n        photoUrl\n      }\n      ... on Chat {\n        id\n        title\n        photoUrl\n      }\n      ... on Node {\n        __isNode: __typename\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "68a42535a0709f09dcfab8aabde1f49e";

export default node;
