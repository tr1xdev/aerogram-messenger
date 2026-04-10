/**
 * @generated SignedSource<<d006ba5848e3ad64f06a3e2920ff8e3b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMessageActionsSendMutation$variables = {
  chatId: string;
  replyToId?: string | null | undefined;
  text: string;
};
export type useMessageActionsSendMutation$data = {
  readonly sendMessage: {
    readonly chatId?: string;
    readonly id?: string;
    readonly sender?: {
      readonly firstName: string;
      readonly id: string;
      readonly photoUrl: string | null | undefined;
    } | null | undefined;
    readonly sentAt?: string;
    readonly sequence?: any;
    readonly text?: string;
  };
};
export type useMessageActionsSendMutation = {
  response: useMessageActionsSendMutation$data;
  variables: useMessageActionsSendMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "chatId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "replyToId"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "text"
},
v3 = [
  {
    "kind": "Variable",
    "name": "chatId",
    "variableName": "chatId"
  },
  {
    "kind": "Variable",
    "name": "replyToId",
    "variableName": "replyToId"
  },
  {
    "kind": "Variable",
    "name": "text",
    "variableName": "text"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "kind": "InlineFragment",
  "selections": [
    (v4/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "chatId",
      "storageKey": null
    },
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
        (v4/*: any*/),
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
          "name": "photoUrl",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "useMessageActionsSendMutation",
    "selections": [
      {
        "kind": "ClientExtension",
        "selections": [
          {
            "alias": null,
            "args": (v3/*: any*/),
            "concreteType": null,
            "kind": "LinkedField",
            "name": "sendMessage",
            "plural": false,
            "selections": [
              (v5/*: any*/)
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v2/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "useMessageActionsSendMutation",
    "selections": [
      {
        "kind": "ClientExtension",
        "selections": [
          {
            "alias": null,
            "args": (v3/*: any*/),
            "concreteType": null,
            "kind": "LinkedField",
            "name": "sendMessage",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "__typename",
                "storageKey": null
              },
              (v5/*: any*/),
              {
                "kind": "InlineFragment",
                "selections": [
                  (v4/*: any*/)
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
    "cacheID": "27864b7a48c50ae9878b6d734d1b3ccc",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsSendMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "f8cac73cd19d05444c29583aa5c91576";

export default node;
