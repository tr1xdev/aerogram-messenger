/**
 * @generated SignedSource<<18533f1e67b186905af1262443485248>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type appSidebarQuery$variables = Record<PropertyKey, never>;
export type appSidebarQuery$data = {
  readonly me: {
    readonly firstName: string;
    readonly id: string;
    readonly isVerified: boolean;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  };
  readonly myChats: {
    readonly __typename: string;
    readonly chats?: ReadonlyArray<{
      readonly id: string;
      readonly isPinned: boolean;
      readonly photoUrl: string | null | undefined;
      readonly title: string;
      readonly type: ChatType;
      readonly unreadCount: number;
    }>;
    readonly message?: string;
  };
};
export type appSidebarQuery = {
  response: appSidebarQuery$data;
  variables: appSidebarQuery$variables;
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
  "name": "photoUrl",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "me",
    "plural": false,
    "selections": [
      (v0/*: any*/),
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
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isVerified",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": null,
    "kind": "LinkedField",
    "name": "myChats",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "__typename",
        "storageKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Chat",
            "kind": "LinkedField",
            "name": "chats",
            "plural": true,
            "selections": [
              (v0/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "title",
                "storageKey": null
              },
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "unreadCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "isPinned",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "type",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "type": "ChatList",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "message",
            "storageKey": null
          }
        ],
        "type": "Error",
        "abstractKey": "__isError"
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
    "name": "appSidebarQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "appSidebarQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "d42cb20476f6a823ffeb91d3f0e21273",
    "id": null,
    "metadata": {},
    "name": "appSidebarQuery",
    "operationKind": "query",
    "text": "query appSidebarQuery {\n  me {\n    id\n    username\n    firstName\n    lastName\n    photoUrl\n    isVerified\n  }\n  myChats {\n    __typename\n    ... on ChatList {\n      chats {\n        id\n        title\n        photoUrl\n        unreadCount\n        isPinned\n        type\n      }\n    }\n    ... on Error {\n      __isError: __typename\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a6c4fba2912cc0c24134eb3c52c74f18";

export default node;
