/**
 * @generated SignedSource<<f1de90ceebde564c8a6d390a9b0da37c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type useChatsMyChatsQuery$variables = Record<PropertyKey, never>;
export type useChatsMyChatsQuery$data = {
  readonly myChats: {
    readonly __typename: "ChatList";
    readonly chats: ReadonlyArray<{
      readonly createdAt: string;
      readonly id: string;
      readonly isPinned: boolean;
      readonly lastMessage: {
        readonly id: string;
        readonly sentAt: string;
        readonly text: string;
      } | null | undefined;
      readonly lastReadSequence: any;
      readonly members: ReadonlyArray<{
        readonly user: {
          readonly displayName: string | null | undefined;
          readonly id: string;
          readonly photoUrl: string | null | undefined;
        };
      }> | null | undefined;
      readonly myReadSequence: any;
      readonly photoUrl: string | null | undefined;
      readonly title: string;
      readonly type: ChatType;
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
  "name": "type",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
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
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unreadCount",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isPinned",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastReadSequence",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "myReadSequence",
  "storageKey": null
},
v10 = {
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
    }
  ],
  "storageKey": null
},
v11 = {
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
        (v4/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v12 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v13 = {
  "kind": "InlineFragment",
  "selections": (v12/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v14 = {
  "kind": "InlineFragment",
  "selections": (v12/*: any*/),
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
        "kind": "ClientExtension",
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
                      (v5/*: any*/),
                      (v6/*: any*/),
                      (v7/*: any*/),
                      (v8/*: any*/),
                      (v9/*: any*/),
                      (v10/*: any*/),
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "type": "ChatList",
                "abstractKey": null
              },
              (v13/*: any*/),
              (v14/*: any*/)
            ],
            "storageKey": null
          }
        ]
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
        "kind": "ClientExtension",
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
                      (v5/*: any*/),
                      (v1/*: any*/),
                      (v2/*: any*/),
                      (v3/*: any*/),
                      (v4/*: any*/),
                      (v6/*: any*/),
                      (v7/*: any*/),
                      (v8/*: any*/),
                      (v9/*: any*/),
                      (v10/*: any*/),
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "type": "ChatList",
                "abstractKey": null
              },
              (v13/*: any*/),
              (v14/*: any*/)
            ],
            "storageKey": null
          }
        ]
      }
    ]
  },
  "params": {
    "cacheID": "d5b10fd64e0770a60b87c33ac92e2788",
    "id": null,
    "metadata": {},
    "name": "useChatsMyChatsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "28f86c3f96851f77b9727758b528ba62";

export default node;
