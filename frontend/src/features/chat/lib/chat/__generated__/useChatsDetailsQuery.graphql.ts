/**
 * @generated SignedSource<<9652d8c88e2ca9528563726b38029686>>
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
    readonly id: string;
    readonly lastReadSequence: any;
    readonly members: ReadonlyArray<{
      readonly user: {
        readonly firstName: string;
        readonly id: string;
        readonly isBot: boolean;
        readonly photoUrl: string | null | undefined;
      };
    }> | null | undefined;
    readonly membersCount: number;
    readonly photoUrl: string | null | undefined;
    readonly title: string;
    readonly type: ChatType;
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
  "name": "title",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
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
  "name": "lastReadSequence",
  "storageKey": null
},
v9 = {
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
v10 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v11 = {
  "kind": "InlineFragment",
  "selections": (v10/*: any*/),
  "type": "NotFoundError",
  "abstractKey": null
},
v12 = {
  "kind": "InlineFragment",
  "selections": (v10/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v13 = {
  "kind": "InlineFragment",
  "selections": (v10/*: any*/),
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
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "ChatMember",
                "kind": "LinkedField",
                "name": "members",
                "plural": true,
                "selections": [
                  (v9/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "type": "Chat",
            "abstractKey": null
          },
          (v11/*: any*/),
          (v12/*: any*/),
          (v13/*: any*/)
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
                "name": "myReadSequence",
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
                  (v9/*: any*/),
                  (v8/*: any*/)
                ],
                "storageKey": null
              },
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/)
            ],
            "type": "Chat",
            "abstractKey": null
          },
          (v11/*: any*/),
          (v12/*: any*/),
          (v13/*: any*/),
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
    "cacheID": "8bf9f0d519545cae4a641ebba551a654",
    "id": null,
    "metadata": {},
    "name": "useChatsDetailsQuery",
    "operationKind": "query",
    "text": "query useChatsDetailsQuery(\n  $id: ID!\n) {\n  chat(id: $id) {\n    __typename\n    ... on Chat {\n      ...useMarkDialog_chat\n      id\n      title\n      type\n      photoUrl\n      membersCount\n      lastReadSequence\n      members {\n        user {\n          id\n          firstName\n          photoUrl\n          isBot\n        }\n      }\n    }\n    ... on NotFoundError {\n      message\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n\nfragment useMarkDialog_chat on Chat {\n  id\n  unreadCount\n  myReadSequence\n  members {\n    user {\n      id\n    }\n    lastReadSequence\n  }\n}\n"
  }
};
})();

(node as any).hash = "e6ea7b1b05959eb7afa608fdc5aa0e71";

export default node;
