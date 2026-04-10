/**
 * @generated SignedSource<<31663a4ac49fbd53b1ff7f52a59b3d3d>>
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
        "kind": "ClientExtension",
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
        ]
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
        "kind": "ClientExtension",
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
      }
    ]
  },
  "params": {
    "cacheID": "637401adba7a6da2e1f9d01bf051c95d",
    "id": null,
    "metadata": {},
    "name": "useChatManagementCreateMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "7f9f31304f1d58c59a926ba6a3b484c8";

export default node;
