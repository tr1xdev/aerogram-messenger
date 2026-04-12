/**
 * @generated SignedSource<<4e122d8a0d50a588591c6d06be9ddf44>>
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
    readonly isEdited?: boolean;
    readonly replyTo?: {
      readonly id: string;
      readonly sender: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly lastName: string | null | undefined;
      } | null | undefined;
      readonly text: string;
    } | null | undefined;
    readonly sender?: {
      readonly displayName: string | null | undefined;
      readonly firstName: string;
      readonly id: string;
      readonly lastName: string | null | undefined;
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
  "name": "firstName",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v9 = {
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
    (v5/*: any*/),
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
      "kind": "ScalarField",
      "name": "isEdited",
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
        (v6/*: any*/),
        (v7/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "photoUrl",
          "storageKey": null
        },
        (v8/*: any*/)
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Message",
      "kind": "LinkedField",
      "name": "replyTo",
      "plural": false,
      "selections": [
        (v4/*: any*/),
        (v5/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "sender",
          "plural": false,
          "selections": [
            (v4/*: any*/),
            (v6/*: any*/),
            (v7/*: any*/),
            (v8/*: any*/)
          ],
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
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "sendMessage",
        "plural": false,
        "selections": [
          (v9/*: any*/)
        ],
        "storageKey": null
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
          (v9/*: any*/),
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
  },
  "params": {
    "cacheID": "d002c5254d5c492990f72822f1cafa49",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsSendMutation",
    "operationKind": "mutation",
    "text": "mutation useMessageActionsSendMutation(\n  $chatId: ID!\n  $text: String!\n  $replyToId: ID\n) {\n  sendMessage(chatId: $chatId, text: $text, replyToId: $replyToId) {\n    __typename\n    ... on Message {\n      id\n      chatId\n      text\n      sentAt\n      sequence\n      isEdited\n      sender {\n        id\n        firstName\n        lastName\n        photoUrl\n        displayName\n      }\n      replyTo {\n        id\n        text\n        sender {\n          id\n          firstName\n          lastName\n          displayName\n        }\n      }\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c39f5b3c40bb3255d0cfeb45719df686";

export default node;
