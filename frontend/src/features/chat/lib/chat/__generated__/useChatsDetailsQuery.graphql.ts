/**
 * @generated SignedSource<<3f45210e63d7156c62a61b64962b9714>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type useChatsDetailsQuery$variables = {
  id: string;
};
export type useChatsDetailsQuery$data = {
  readonly chat: {
    readonly __typename: "Chat";
    readonly canWrite: boolean;
    readonly id: string;
    readonly isPinned: boolean;
    readonly lastReadSequence: any;
    readonly members: ReadonlyArray<{
      readonly user: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly isBot: boolean;
        readonly isVerified: boolean;
        readonly lastName: string | null | undefined;
        readonly photoUrl: string | null | undefined;
        readonly status: string;
        readonly " $fragmentSpreads": FragmentRefs<"chatHeader_user">;
      };
    }> | null | undefined;
    readonly membersCount: number;
    readonly myReadSequence: any;
    readonly myRole: string;
    readonly permissions: {
      readonly canAssignAdmins: boolean;
      readonly canDeleteMessages: boolean;
      readonly canEditMetadata: boolean;
      readonly canInviteUsers: boolean;
      readonly canSendMessage: boolean;
    };
    readonly photoUrl: string | null | undefined;
    readonly slug: string | null | undefined;
    readonly title: string;
    readonly type: ChatType;
    readonly unreadCount: number;
    readonly " $fragmentSpreads": FragmentRefs<"chatMenuItem_chat" | "useMarkDialog_chat">;
  } | {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "NotFoundError";
    readonly message: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChatsDetailsQuery = {
  response: useChatsDetailsQuery$data;
  variables: useChatsDetailsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
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
  "name": "slug",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "membersCount",
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
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastReadSequence",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "myReadSequence",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "canWrite",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "myRole",
  "storageKey": null
},
v15 = {
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
      "name": "canSendMessage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canInviteUsers",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canEditMetadata",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canDeleteMessages",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "canAssignAdmins",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isBot",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v22 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v23 = {
  "kind": "InlineFragment",
  "selections": (v22/*: any*/),
  "type": "NotFoundError",
  "abstractKey": null
},
v24 = {
  "kind": "InlineFragment",
  "selections": (v22/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v25 = {
  "kind": "InlineFragment",
  "selections": (v22/*: any*/),
  "type": "InternalError",
  "abstractKey": null
},
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatsDetailsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "useMarkDialog_chat"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "chatMenuItem_chat"
              },
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v15/*: any*/),
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
                      (v3/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v7/*: any*/),
                      (v18/*: any*/),
                      (v19/*: any*/),
                      (v20/*: any*/),
                      (v21/*: any*/),
                      {
                        "args": null,
                        "kind": "FragmentSpread",
                        "name": "chatHeader_user"
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "type": "Chat",
            "abstractKey": null
          },
          (v23/*: any*/),
          (v24/*: any*/),
          (v25/*: any*/)
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
    "name": "useChatsDetailsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v3/*: any*/),
              (v9/*: any*/),
              (v12/*: any*/),
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
                      (v3/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v26/*: any*/),
                      (v7/*: any*/),
                      (v21/*: any*/),
                      (v20/*: any*/),
                      (v18/*: any*/),
                      (v19/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "isTyping",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v11/*: any*/)
                ],
                "storageKey": null
              },
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v10/*: any*/),
              (v14/*: any*/),
              (v11/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Message",
                "kind": "LinkedField",
                "name": "lastMessage",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
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
                      (v3/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v26/*: any*/),
                      (v18/*: any*/)
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
                      (v3/*: any*/),
                      (v6/*: any*/),
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
              (v4/*: any*/),
              (v8/*: any*/),
              (v13/*: any*/),
              (v15/*: any*/)
            ],
            "type": "Chat",
            "abstractKey": null
          },
          (v23/*: any*/),
          (v24/*: any*/),
          (v25/*: any*/),
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
    ]
  },
  "params": {
    "cacheID": "8763fff579940f2187aa569085cf5fc8",
    "id": null,
    "metadata": {},
    "name": "useChatsDetailsQuery",
    "operationKind": "query",
    "text": "query useChatsDetailsQuery(\n  $id: ID!\n) {\n  chat(id: $id) {\n    __typename\n    ... on Chat {\n      ...useMarkDialog_chat\n      ...chatMenuItem_chat\n      id\n      slug\n      title\n      type\n      photoUrl\n      membersCount\n      unreadCount\n      isPinned\n      lastReadSequence\n      myReadSequence\n      canWrite\n      myRole\n      permissions {\n        canSendMessage\n        canInviteUsers\n        canEditMetadata\n        canDeleteMessages\n        canAssignAdmins\n      }\n      members {\n        user {\n          id\n          firstName\n          lastName\n          photoUrl\n          displayName\n          isBot\n          status\n          isVerified\n          ...chatHeader_user\n        }\n      }\n    }\n    ... on NotFoundError {\n      message\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n\nfragment chatHeader_user on User {\n  id\n  status\n  photoUrl\n  firstName\n  lastName\n  displayName\n  username\n  isTyping\n  isVerified\n}\n\nfragment chatMenuItem_chat on Chat {\n  id\n  title\n  type\n  photoUrl\n  unreadCount\n  isPinned\n  myRole\n  lastReadSequence\n  lastMessage {\n    id\n    text\n    sentAt\n    sequence\n    sender {\n      id\n      firstName\n      lastName\n      username\n      displayName\n    }\n    attachments {\n      id\n      type\n      url\n      fileName\n      fileSize\n      contentType\n    }\n  }\n  members {\n    user {\n      id\n      firstName\n      lastName\n      username\n      photoUrl\n      isVerified\n      status\n    }\n  }\n}\n\nfragment useMarkDialog_chat on Chat {\n  id\n  unreadCount\n  myReadSequence\n  members {\n    user {\n      id\n    }\n    lastReadSequence\n  }\n}\n"
  }
};
})();

(node as any).hash = "d4e9a6eb9083e6f33cc689c5e253c236";

export default node;
