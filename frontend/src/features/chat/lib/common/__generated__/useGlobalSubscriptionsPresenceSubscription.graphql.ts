/**
 * @generated SignedSource<<97ff5c869a36bfa69a9762d5194962e5>>
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
    "kind": "ClientExtension",
    "selections": [
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
    ]
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
    "cacheID": "9305f452706127e735884fd902644a15",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsPresenceSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "fbaee2a72acd5aacd8115234e2ebd43d";

export default node;
