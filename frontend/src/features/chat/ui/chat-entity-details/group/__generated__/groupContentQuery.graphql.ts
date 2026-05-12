/**
 * @generated SignedSource<<df4e660bbfb3b2741f2dd78bfcc8bb3d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type groupContentQuery$variables = {
  id: string;
};
export type groupContentQuery$data = {
  readonly chat: {
    readonly __typename: "Chat";
    readonly id: string;
    readonly members: ReadonlyArray<{
      readonly role: string;
      readonly user: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly photoUrl: string | null | undefined;
      };
    }> | null | undefined;
    readonly membersCount: number;
    readonly myRole: string;
    readonly permissions: {
      readonly canEditMetadata: boolean;
    };
    readonly photoUrl: string | null | undefined;
    readonly title: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
  readonly me: {
    readonly id: string;
  };
};
export type groupContentQuery = {
  response: groupContentQuery$data;
  variables: groupContentQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = [
  (v1/*: any*/)
],
v3 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "me",
  "plural": false,
  "selections": (v2/*: any*/),
  "storageKey": null
},
v4 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
},
v7 = {
  "kind": "InlineFragment",
  "selections": [
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    (v6/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "membersCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "myRole",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ChatPermissions",
      "kind": "LinkedField",
      "name": "permissions",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "canEditMetadata",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ChatMember",
      "kind": "LinkedField",
      "name": "members",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "user",
          "plural": false,
          "selections": [
            (v1/*: any*/),
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
              "name": "firstName",
              "storageKey": null
            },
            (v6/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "role",
          "storageKey": null
        }
      ],
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
    "name": "groupContentQuery",
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v7/*: any*/)
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
    "name": "groupContentQuery",
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v7/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": (v2/*: any*/),
            "type": "Node",
            "abstractKey": "__isNode"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "a4dfa4251764990c20224411ca463cb5",
    "id": null,
    "metadata": {},
    "name": "groupContentQuery",
    "operationKind": "query",
    "text": "query groupContentQuery(\n  $id: ID!\n) {\n  me {\n    id\n  }\n  chat(id: $id) {\n    __typename\n    ... on Chat {\n      id\n      title\n      photoUrl\n      membersCount\n      myRole\n      permissions {\n        canEditMetadata\n      }\n      members {\n        user {\n          id\n          displayName\n          firstName\n          photoUrl\n        }\n        role\n      }\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "483a1e84a0bc305524e2382f62e4730c";

export default node;
