/**
 * @generated SignedSource<<9ef59df4fa2ff47ddbfe23740728855d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useChatsMyChatsQuery$variables = Record<PropertyKey, never>;
export type useChatsMyChatsQuery$data = {
  readonly myChats: {
    readonly __typename: "ChatList";
    readonly chats: ReadonlyArray<{
      readonly id: string;
      readonly lastMessage: {
        readonly id: string;
        readonly sender: {
          readonly displayName: string | null | undefined;
          readonly firstName: string;
          readonly id: string;
          readonly lastName: string | null | undefined;
        } | null | undefined;
        readonly sentAt: string;
        readonly sequence: any;
        readonly text: string;
      } | null | undefined;
      readonly photoUrl: string | null | undefined;
      readonly title: string;
      readonly unreadCount: number;
    }>;
    readonly " $fragmentSpreads": FragmentRefs<"useAppTitle_chats">;
  } | {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChatsMyChatsQuery = {
  response: useChatsMyChatsQuery$data;
  variables: useChatsMyChatsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unreadCount",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "concreteType": "Message",
  "kind": "LinkedField",
  "name": "lastMessage",
  "plural": false,
  "selections": [
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "text",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sentAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sequence",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "sender",
      "plural": false,
      "selections": [
        (v1/*: any*/),
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
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v6 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v7 = {
  "kind": "InlineFragment",
  "selections": (v6/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v8 = {
  "kind": "InlineFragment",
  "selections": (v6/*: any*/),
  "type": "InternalError",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatsMyChatsQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "myChats",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "useAppTitle_chats"
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Chat",
                "kind": "LinkedField",
                "name": "chats",
                "plural": true,
                "selections": [
                  (v1/*: any*/),
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "type": "ChatList",
            "abstractKey": null
          },
          (v7/*: any*/),
          (v8/*: any*/)
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
    "name": "useChatsMyChatsQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "myChats",
        "plural": false,
        "selections": [
          (v0/*: any*/),
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
                  (v4/*: any*/),
                  (v1/*: any*/),
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v5/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "type": "ChatList",
            "abstractKey": null
          },
          (v7/*: any*/),
          (v8/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "3069401f8f6c3e9e28f55e9d1784e47d",
    "id": null,
    "metadata": {},
    "name": "useChatsMyChatsQuery",
    "operationKind": "query",
    "text": "query useChatsMyChatsQuery {\n  myChats {\n    __typename\n    ... on ChatList {\n      ...useAppTitle_chats\n      chats {\n        id\n        title\n        photoUrl\n        unreadCount\n        lastMessage {\n          id\n          text\n          sentAt\n          sequence\n          sender {\n            id\n            firstName\n            lastName\n            displayName\n          }\n        }\n      }\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n\nfragment useAppTitle_chats on ChatList {\n  chats {\n    unreadCount\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "37cc639b9844402aa25b455680454f10";

export default node;
