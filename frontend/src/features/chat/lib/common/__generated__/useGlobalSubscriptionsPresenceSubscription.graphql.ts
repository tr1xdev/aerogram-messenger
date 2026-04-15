/**
 * @generated SignedSource<<a8a5ce323efae8ad34cdcc20d769b7e0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsPresenceSubscription$variables = {
  chatId: string;
};
export type useGlobalSubscriptionsPresenceSubscription$data = {
  readonly userStatusChanged: {
    readonly lastSeen: string | null | undefined;
    readonly status: string;
    readonly userId: string;
  };
};
export type useGlobalSubscriptionsPresenceSubscription = {
  response: useGlobalSubscriptionsPresenceSubscription$data;
  variables: useGlobalSubscriptionsPresenceSubscription$variables;
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
        "name": "chatId",
        "variableName": "chatId"
      }
    ],
    "concreteType": "UserStatusPayload",
    "kind": "LinkedField",
    "name": "userStatusChanged",
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
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastSeen",
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
    "name": "useGlobalSubscriptionsPresenceSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsPresenceSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d84517268a4aa05a22a1de36c927c48f",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsPresenceSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsPresenceSubscription(\n  $chatId: ID!\n) {\n  userStatusChanged(chatId: $chatId) {\n    userId\n    status\n    lastSeen\n  }\n}\n"
  }
};
})();

(node as any).hash = "fbaee2a72acd5aacd8115234e2ebd43d";

export default node;
