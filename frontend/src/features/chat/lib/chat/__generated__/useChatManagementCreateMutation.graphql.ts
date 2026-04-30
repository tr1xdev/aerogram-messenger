/**
 * @generated SignedSource<<60eeff2d6c6979b6479a3d1e0a289c19>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type useChatManagementCreateMutation$variables = {
  userID: string;
};
export type useChatManagementCreateMutation$data = {
  readonly createDirectChat: {
    readonly __typename: "Chat";
    readonly id: string;
    readonly isPinned: boolean;
    readonly lastReadSequence: any;
    readonly myReadSequence: any;
    readonly myRole: string;
    readonly photoUrl: string | null | undefined;
    readonly title: string;
    readonly type: ChatType;
    readonly unreadCount: number;
  } | {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "ValidationError";
    readonly message: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChatManagementCreateMutation = {
  response: useChatManagementCreateMutation$data;
  variables: useChatManagementCreateMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "userID"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "userID",
    "variableName": "userID"
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
  "kind": "InlineFragment",
  "selections": [
    (v3/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "type",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "photoUrl",
      "storageKey": null
    },
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
      "kind": "ScalarField",
      "name": "myReadSequence",
      "storageKey": null
    }
  ],
  "type": "Chat",
  "abstractKey": null
},
v5 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v6 = {
  "kind": "InlineFragment",
  "selections": (v5/*: any*/),
  "type": "ForbiddenError",
  "abstractKey": null
},
v7 = {
  "kind": "InlineFragment",
  "selections": (v5/*: any*/),
  "type": "ValidationError",
  "abstractKey": null
},
v8 = {
  "kind": "InlineFragment",
  "selections": (v5/*: any*/),
  "type": "InternalError",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatManagementCreateMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "createDirectChat",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v4/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChatManagementCreateMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "createDirectChat",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v4/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
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
    "cacheID": "1fbc522df16b2a763487b093c9d70d55",
    "id": null,
    "metadata": {},
    "name": "useChatManagementCreateMutation",
    "operationKind": "mutation",
    "text": "mutation useChatManagementCreateMutation(\n  $userID: ID!\n) {\n  createDirectChat(userID: $userID) {\n    __typename\n    ... on Chat {\n      id\n      type\n      title\n      photoUrl\n      unreadCount\n      isPinned\n      myRole\n      lastReadSequence\n      myReadSequence\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on ValidationError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ff806bb8cbbb76a6643d75a9c0ac7127";

export default node;
