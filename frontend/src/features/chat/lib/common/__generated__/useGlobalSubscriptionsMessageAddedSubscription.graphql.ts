/**
 * @generated SignedSource<<b4547818d690d16be72323ca49ac430c>>
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
    ]
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
    "cacheID": "6a688392d2f5f4db5524d90283520da2",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsMessageAddedSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "5e2c8e9fd15bfbcb9fd3dbd2375068ec";

export default node;
