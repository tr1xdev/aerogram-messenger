/**
 * @generated SignedSource<<d7817f820c9337a3c7fbd5bb00a97aec>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMessageActionsSendMutation$variables = {
  attachments?: ReadonlyArray<any> | null | undefined;
  chatId: string;
  replyToId?: string | null | undefined;
  text: string;
};
export type useMessageActionsSendMutation$data = {
  readonly sendMessage: {
    readonly attachments?: ReadonlyArray<{
      readonly contentType: string;
      readonly fileName: string;
      readonly fileSize: any;
      readonly id: string;
      readonly type: string;
      readonly url: string;
    }> | null | undefined;
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
  "name": "attachments"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "chatId"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "replyToId"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "text"
},
v4 = [
  {
    "kind": "Variable",
    "name": "attachments",
    "variableName": "attachments"
  },
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
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "text",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v10 = {
  "kind": "InlineFragment",
  "selections": [
    (v5/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "chatId",
      "storageKey": null
    },
    (v6/*: any*/),
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
      "concreteType": "Attachment",
      "kind": "LinkedField",
      "name": "attachments",
      "plural": true,
      "selections": [
        (v5/*: any*/),
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
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "sender",
      "plural": false,
      "selections": [
        (v5/*: any*/),
        (v7/*: any*/),
        (v8/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "photoUrl",
          "storageKey": null
        },
        (v9/*: any*/)
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
        (v5/*: any*/),
        (v6/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "sender",
          "plural": false,
          "selections": [
            (v5/*: any*/),
            (v7/*: any*/),
            (v8/*: any*/),
            (v9/*: any*/)
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
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "useMessageActionsSendMutation",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "sendMessage",
        "plural": false,
        "selections": [
          (v10/*: any*/)
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
      (v1/*: any*/),
      (v3/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "useMessageActionsSendMutation",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
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
          (v10/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v5/*: any*/)
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
    "cacheID": "55cbf2557a46da7ffe2dca8a40acbb6d",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsSendMutation",
    "operationKind": "mutation",
    "text": "mutation useMessageActionsSendMutation(\n  $chatId: ID!\n  $text: String!\n  $replyToId: ID\n  $attachments: [Upload!]\n) {\n  sendMessage(chatId: $chatId, text: $text, replyToId: $replyToId, attachments: $attachments) {\n    __typename\n    ... on Message {\n      id\n      chatId\n      text\n      sentAt\n      sequence\n      isEdited\n      attachments {\n        id\n        type\n        url\n        fileName\n        fileSize\n        contentType\n      }\n      sender {\n        id\n        firstName\n        lastName\n        photoUrl\n        displayName\n      }\n      replyTo {\n        id\n        text\n        sender {\n          id\n          firstName\n          lastName\n          displayName\n        }\n      }\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "bd56104a3cc1693bc70480b1d6ec145b";

export default node;
