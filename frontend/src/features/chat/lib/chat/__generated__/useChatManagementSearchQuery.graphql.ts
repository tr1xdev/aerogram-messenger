/**
 * @generated SignedSource<<1a250f81d4a79c4d11061bf4cd03e5a7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type useChatManagementSearchQuery$variables = {
  query: string;
};
export type useChatManagementSearchQuery$data = {
  readonly searchGlobal: {
    readonly results: ReadonlyArray<{
      readonly __typename: "Chat";
      readonly id: string;
      readonly membersCount: number;
      readonly photoUrl: string | null | undefined;
      readonly slug: string | null | undefined;
      readonly title: string;
      readonly type: ChatType;
    } | {
      readonly __typename: "User";
      readonly firstName: string;
      readonly id: string;
      readonly lastName: string | null | undefined;
      readonly photoUrl: string | null | undefined;
      readonly username: string | null | undefined;
    } | {
      // This will never be '%other', but we need some
      // value in case none of the concrete values match.
      readonly __typename: "%other";
    }>;
  };
};
export type useChatManagementSearchQuery = {
  response: useChatManagementSearchQuery$data;
  variables: useChatManagementSearchQuery$variables;
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
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "type",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "slug",
      "storageKey": null
    },
    (v4/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "membersCount",
      "storageKey": null
    }
  ],
  "type": "Chat",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatManagementSearchQuery",
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
    "name": "useChatManagementSearchQuery",
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
    "cacheID": "f9bbeab83bf32876679d2277c27c8bf7",
    "id": null,
    "metadata": {},
    "name": "useChatManagementSearchQuery",
    "operationKind": "query",
    "text": "query useChatManagementSearchQuery(\n  $query: String!\n) {\n  searchGlobal(query: $query) {\n    results {\n      __typename\n      ... on User {\n        id\n        username\n        firstName\n        lastName\n        photoUrl\n      }\n      ... on Chat {\n        id\n        title\n        type\n        slug\n        photoUrl\n        membersCount\n      }\n      ... on Node {\n        __isNode: __typename\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "372067b88431eae975cb8685855a7310";

export default node;
