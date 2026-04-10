/**
 * @generated SignedSource<<ec0a965fbb981637b9991337a5f63ddd>>
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
    readonly createdAt: string;
    readonly id: string;
    readonly isPinned: boolean;
    readonly lastReadSequence: any;
    readonly members: ReadonlyArray<{
      readonly user: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly isBot: boolean;
        readonly lastName: string | null | undefined;
        readonly photoUrl: string | null | undefined;
        readonly username: string | null | undefined;
      };
    }> | null | undefined;
    readonly membersCount: number;
    readonly myReadSequence: any;
    readonly photoUrl: string | null | undefined;
    readonly title: string;
    readonly type: ChatType;
    readonly unreadCount: number;
    readonly " $fragmentSpreads": FragmentRefs<"useMarkDialog_chat">;
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
  "name": "type",
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
  "name": "photoUrl",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "membersCount",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unreadCount",
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
  "kind": "ScalarField",
  "name": "lastReadSequence",
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
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "user",
  "plural": false,
  "selections": [
    (v3/*: any*/),
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
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "username",
      "storageKey": null
    },
    (v6/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isBot",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v14 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v15 = {
  "kind": "InlineFragment",
  "selections": (v14/*: any*/),
  "type": "NotFoundError",
  "abstractKey": null
},
v16 = {
  "kind": "InlineFragment",
  "selections": (v14/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v17 = {
  "kind": "InlineFragment",
  "selections": (v14/*: any*/),
  "type": "InternalError",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatsDetailsQuery",
    "selections": [
      {
        "kind": "ClientExtension",
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
                  (v4/*: any*/),
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v12/*: any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "useMarkDialog_chat"
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "ChatMember",
                    "kind": "LinkedField",
                    "name": "members",
                    "plural": true,
                    "selections": [
                      (v13/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "type": "Chat",
                "abstractKey": null
              },
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/)
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChatsDetailsQuery",
    "selections": [
      {
        "kind": "ClientExtension",
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
                  (v4/*: any*/),
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "ChatMember",
                    "kind": "LinkedField",
                    "name": "members",
                    "plural": true,
                    "selections": [
                      (v13/*: any*/),
                      (v10/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "type": "Chat",
                "abstractKey": null
              },
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/),
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
      }
    ]
  },
  "params": {
    "cacheID": "e0cae36778b58a6c920995ceac9d7c90",
    "id": null,
    "metadata": {},
    "name": "useChatsDetailsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "8c1070cd87b22713c608a8a8024cc686";

export default node;
