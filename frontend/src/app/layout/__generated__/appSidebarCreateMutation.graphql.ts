/**
 * @generated SignedSource<<cd37acfe81137b560f965784ae5cc354>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ChatType = "CHANNEL" | "GROUP" | "PRIVATE" | "%future added value";
export type appSidebarCreateMutation$variables = {
  userID: string;
};
export type appSidebarCreateMutation$data = {
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
export type appSidebarCreateMutation = {
  response: appSidebarCreateMutation$data;
  variables: appSidebarCreateMutation$variables;
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
    "name": "appSidebarCreateMutation",
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
    "name": "appSidebarCreateMutation",
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
    "cacheID": "484ae9dee6f31f0a656fc10b321e41d2",
    "id": null,
    "metadata": {},
    "name": "appSidebarCreateMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "51fced0ce79a844ed76f0d4540052224";

export default node;
