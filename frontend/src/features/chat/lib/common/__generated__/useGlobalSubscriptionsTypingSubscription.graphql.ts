/**
 * @generated SignedSource<<313ae3460fc28a86c8f73eb62142857d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsTypingSubscription$variables = {
  chatID: string;
};
export type useGlobalSubscriptionsTypingSubscription$data = {
  readonly userTyping: {
    readonly isTyping: boolean;
    readonly userId: string;
  };
};
export type useGlobalSubscriptionsTypingSubscription = {
  response: useGlobalSubscriptionsTypingSubscription$data;
  variables: useGlobalSubscriptionsTypingSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  }
],
v1 = [
  {
    "kind": "ClientExtension",
    "selections": [
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "chatID",
            "variableName": "chatID"
          }
        ],
        "concreteType": "TypingPayload",
        "kind": "LinkedField",
        "name": "userTyping",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "userId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isTyping",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useGlobalSubscriptionsTypingSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsTypingSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "53bbd476afe32fcab02527116b81d775",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsTypingSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "5d4d67d7c5978a3b01ff25e34484d27c";

export default node;
