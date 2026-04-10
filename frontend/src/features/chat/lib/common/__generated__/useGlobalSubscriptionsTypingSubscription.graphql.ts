/**
 * @generated SignedSource<<8a52bb39d10bebbc155d547d6f91b888>>
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
    "cacheID": "9ea67a06c9d57b16471296a1379ac10a",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsTypingSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsTypingSubscription(\n  $chatID: ID!\n) {\n  userTyping(chatID: $chatID) {\n    userId\n    isTyping\n  }\n}\n"
  }
};
})();

(node as any).hash = "5d4d67d7c5978a3b01ff25e34484d27c";

export default node;
