/**
 * @generated SignedSource<<d2d8e1219f574ae7bb5be4b2743ff106>>
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
v2 = [
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
          (v1/*: any*/),
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
            "name": "photoUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
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
    "selections": (v2/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "5dc6fa8b873a98a71f4f8e331d4acee6",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsMessageAddedSubscription(\n  $chatId: ID!\n) {\n  messageAdded(chatId: $chatId) {\n    id\n    chatId\n    text\n    sentAt\n    sequence\n    sender {\n      id\n      firstName\n      lastName\n      photoUrl\n      displayName\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f9c1857ad7bc576a6fa2046a2520b1dd";

export default node;
