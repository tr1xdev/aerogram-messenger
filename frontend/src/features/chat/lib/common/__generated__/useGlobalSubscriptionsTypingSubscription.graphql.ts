/**
 * @generated SignedSource<<58cb60d0a63d14e8288a68fc2d81ec98>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsTypingSubscription$variables = {
  chatId: string;
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
    "name": "chatId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "chatID",
        "variableName": "chatId"
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
    "cacheID": "136dd832eb5086338c624ebc5ae1ce8e",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsTypingSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsTypingSubscription(\n  $chatId: ID!\n) {\n  userTyping(chatID: $chatId) {\n    userId\n    isTyping\n  }\n}\n"
  }
};
})();

(node as any).hash = "a6943a2069a5b85b573e97d1e9646587";

export default node;
