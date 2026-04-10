/**
 * @generated SignedSource<<ce44069cfd7ff7b7f496649332f6e94c>>
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
      readonly id: string;
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
          (v1/*: any*/)
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
    "cacheID": "bf1ff96500fd0739bd4f5bf465752134",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsMessageAddedSubscription(\n  $chatId: ID!\n) {\n  messageAdded(chatId: $chatId) {\n    id\n    chatId\n    text\n    sentAt\n    sequence\n    sender {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5e2c8e9fd15bfbcb9fd3dbd2375068ec";

export default node;
