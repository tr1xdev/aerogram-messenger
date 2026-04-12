/**
 * @generated SignedSource<<8a42e6c4bd795f36f2b2043990f8f948>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsMessageAddedSubscription$variables = {
  chatId: string;
};
export type useGlobalSubscriptionsMessageAddedSubscription$data = {
  readonly messageAdded: {
    readonly chatId: string;
    readonly id: string;
    readonly isEdited: boolean;
    readonly replyTo: {
      readonly id: string;
      readonly sender: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly lastName: string | null | undefined;
      } | null | undefined;
      readonly text: string;
    } | null | undefined;
    readonly sender: {
      readonly displayName: string | null | undefined;
      readonly firstName: string;
      readonly id: string;
      readonly lastName: string | null | undefined;
      readonly photoUrl: string | null | undefined;
    } | null | undefined;
    readonly sentAt: string;
    readonly sequence: any;
    readonly text: string;
  };
};
export type useGlobalSubscriptionsMessageAddedSubscription = {
  response: useGlobalSubscriptionsMessageAddedSubscription$data;
  variables: useGlobalSubscriptionsMessageAddedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatId"
  }
],
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
  "name": "text",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "chatId",
        "variableName": "chatId"
      }
    ],
    "concreteType": "Message",
    "kind": "LinkedField",
    "name": "messageAdded",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "chatId",
        "storageKey": null
      },
      (v2/*: any*/),
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
          (v1/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "photoUrl",
            "storageKey": null
          },
          (v5/*: any*/)
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
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "User",
            "kind": "LinkedField",
            "name": "sender",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "selections": (v6/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "53efc5df9f8987796dac1d391dac59ce",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsMessageAddedSubscription(\n  $chatId: ID!\n) {\n  messageAdded(chatId: $chatId) {\n    id\n    chatId\n    text\n    sentAt\n    sequence\n    isEdited\n    sender {\n      id\n      firstName\n      lastName\n      photoUrl\n      displayName\n    }\n    replyTo {\n      id\n      text\n      sender {\n        id\n        firstName\n        lastName\n        displayName\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "947095cb852e476577b69076a77b094b";

export default node;
