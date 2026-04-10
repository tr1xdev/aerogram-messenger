/**
 * @generated SignedSource<<3384e54ba041af9af1a9002133684076>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChatsMyChatsQuery$variables = Record<PropertyKey, never>;
export type useChatsMyChatsQuery$data = {
  readonly myChats: {
    readonly __typename: "ChatList";
    readonly chats: ReadonlyArray<{
      readonly id: string;
      readonly lastMessage: {
        readonly sentAt: string;
        readonly text: string;
      } | null | undefined;
      readonly photoUrl: string | null | undefined;
      readonly title: string;
      readonly unreadCount: number;
    }>;
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
  "kind": "ScalarField",
  "name": "text",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sentAt",
  "storageKey": null
},
v7 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v8 = {
  "kind": "InlineFragment",
  "selections": (v7/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v9 = {
  "kind": "InlineFragment",
  "selections": (v7/*: any*/),
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
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Message",
                    "kind": "LinkedField",
                    "name": "lastMessage",
                    "plural": false,
                    "selections": [
                      (v5/*: any*/),
                      (v6/*: any*/)
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
          (v8/*: any*/),
          (v9/*: any*/)
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
                  (v1/*: any*/),
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Message",
                    "kind": "LinkedField",
                    "name": "lastMessage",
                    "plural": false,
                    "selections": [
                      (v5/*: any*/),
                      (v6/*: any*/),
                      (v1/*: any*/)
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
          (v8/*: any*/),
          (v9/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "f7188e9e35c1636ad44e527763cdc724",
    "id": null,
    "metadata": {},
    "name": "useChatsMyChatsQuery",
    "operationKind": "query",
    "text": "query useChatsMyChatsQuery {\n  myChats {\n    __typename\n    ... on ChatList {\n      chats {\n        id\n        title\n        photoUrl\n        unreadCount\n        lastMessage {\n          text\n          sentAt\n          id\n        }\n      }\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3ac2b3497c249359cd094a0918442b4f";

export default node;
