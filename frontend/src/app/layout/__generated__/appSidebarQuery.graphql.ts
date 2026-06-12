/**
 * @generated SignedSource<<c5e0cef54aea65d867431ee574069c31>>
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
    readonly " $fragmentSpreads": FragmentRefs<"settingsDialog_user">;
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
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unreadCount",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isPinned",
  "storageKey": null
},
v11 = {
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
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "appSidebarQuery",
    "selections": [
      {
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
          (v5/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "settingsDialog_user"
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
          (v6/*: any*/),
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
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v4/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
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
          (v11/*: any*/)
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
      {
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
          (v5/*: any*/),
          (v12/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "bio",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isBot",
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
            "name": "botCommands",
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
      },
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "myChats",
        "plural": false,
        "selections": [
          (v6/*: any*/),
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
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v4/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
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
                          (v12/*: any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Attachment",
                        "kind": "LinkedField",
                        "name": "attachments",
                        "plural": true,
                        "selections": [
                          (v0/*: any*/),
                          (v8/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "url",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "fileName",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "fileSize",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "contentType",
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
          (v11/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "ea59c4923aff7c484846fc004891105b",
    "id": null,
    "metadata": {},
    "name": "appSidebarQuery",
    "operationKind": "query",
    "text": "query appSidebarQuery {\n  me {\n    id\n    username\n    firstName\n    lastName\n    photoUrl\n    isVerified\n    ...settingsDialog_user\n  }\n  myChats {\n    __typename\n    ... on ChatList {\n      chats {\n        id\n        title\n        type\n        photoUrl\n        unreadCount\n        isPinned\n        ...chatMenuItem_chat\n      }\n    }\n    ... on Error {\n      __isError: __typename\n      message\n    }\n  }\n}\n\nfragment chatMenuItem_chat on Chat {\n  id\n  title\n  type\n  photoUrl\n  unreadCount\n  isPinned\n  myRole\n  lastReadSequence\n  lastMessage {\n    id\n    text\n    sentAt\n    sequence\n    sender {\n      id\n      firstName\n      lastName\n      username\n      displayName\n    }\n    attachments {\n      id\n      type\n      url\n      fileName\n      fileSize\n      contentType\n    }\n  }\n  members {\n    user {\n      id\n      firstName\n      lastName\n      username\n      photoUrl\n      isVerified\n      status\n    }\n  }\n}\n\nfragment profileContent_user on User {\n  id\n  firstName\n  lastName\n  username\n  displayName\n  photoUrl\n  bio\n  isBot\n  isVerified\n  botDescription\n  botCommands\n  createdAt\n}\n\nfragment settingsDialog_user on User {\n  id\n  ...profileContent_user\n}\n"
  }
};
})();

(node as any).hash = "5a39035deafe00b8b7e3fe3a41d49874";

export default node;
