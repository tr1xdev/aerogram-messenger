/**
 * @generated SignedSource<<fd9e2416021e1407de6dc16388890add>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
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
      readonly " $fragmentSpreads": FragmentRefs<"chatMenuItem_chat">;
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
  "name": "lastName",
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
  "name": "isVerified",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "me",
  "plural": false,
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    (v2/*: any*/),
    (v3/*: any*/),
    (v4/*: any*/),
    (v5/*: any*/)
  ],
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unreadCount",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isPinned",
  "storageKey": null
},
v12 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "appSidebarQuery",
    "selections": [
      (v6/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "myChats",
        "plural": false,
        "selections": [
          (v7/*: any*/),
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
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v4/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "chatMenuItem_chat"
                  }
                ],
                "storageKey": null
              }
            ],
            "type": "ChatList",
            "abstractKey": null
          },
          (v12/*: any*/)
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
    "name": "appSidebarQuery",
    "selections": [
      (v6/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "myChats",
        "plural": false,
        "selections": [
          (v7/*: any*/),
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
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v4/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "lastReadSequence",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Message",
                    "kind": "LinkedField",
                    "name": "lastMessage",
                    "plural": false,
                    "selections": [
                      (v0/*: any*/),
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
                          (v0/*: any*/),
                          (v2/*: any*/),
                          (v3/*: any*/),
                          (v1/*: any*/),
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
                          (v0/*: any*/),
                          (v2/*: any*/),
                          (v3/*: any*/),
                          (v1/*: any*/),
                          (v4/*: any*/),
                          (v5/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "status",
                            "storageKey": null
                          }
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "type": "ChatList",
            "abstractKey": null
          },
          (v12/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "58b8b610cb56b6c2fee0e9d0c7592a44",
    "id": null,
    "metadata": {},
    "name": "appSidebarQuery",
    "operationKind": "query",
    "text": "query appSidebarQuery {\n  me {\n    id\n    username\n    firstName\n    lastName\n    photoUrl\n    isVerified\n  }\n  myChats {\n    __typename\n    ... on ChatList {\n      chats {\n        id\n        title\n        type\n        photoUrl\n        unreadCount\n        isPinned\n        ...chatMenuItem_chat\n      }\n    }\n    ... on Error {\n      __isError: __typename\n      message\n    }\n  }\n}\n\nfragment chatMenuItem_chat on Chat {\n  id\n  title\n  type\n  photoUrl\n  unreadCount\n  isPinned\n  lastReadSequence\n  lastMessage {\n    id\n    text\n    sentAt\n    sequence\n    sender {\n      id\n      firstName\n      lastName\n      username\n      displayName\n    }\n  }\n  members {\n    user {\n      id\n      firstName\n      lastName\n      username\n      photoUrl\n      isVerified\n      status\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c9b915de52be8855ae9a10928bc0d392";

export default node;
