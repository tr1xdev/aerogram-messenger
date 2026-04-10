/**
 * @generated SignedSource<<5ec0ace70295e7588539da76b2178009>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsChatDeletedSubscription$variables = {
  userId: string;
};
export type useGlobalSubscriptionsChatDeletedSubscription$data = {
  readonly chatDeleted: string;
};
export type useGlobalSubscriptionsChatDeletedSubscription = {
  response: useGlobalSubscriptionsChatDeletedSubscription$data;
  variables: useGlobalSubscriptionsChatDeletedSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "userId"
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
            "name": "userId",
            "variableName": "userId"
          }
        ],
        "kind": "ScalarField",
        "name": "chatDeleted",
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
    "name": "useGlobalSubscriptionsChatDeletedSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsChatDeletedSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1f58a731aca1def430798c8af9b08b55",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsChatDeletedSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "8aae6e801bc359836581b854adf881f7";

export default node;
