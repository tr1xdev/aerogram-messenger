/**
 * @generated SignedSource<<dba93ca8031ee7ff3790d2651cc3d676>>
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
    "cacheID": "51164235811c019a2c3e8fb9cd5a39ff",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsChatDeletedSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsChatDeletedSubscription(\n  $userId: ID!\n) {\n  chatDeleted(userId: $userId)\n}\n"
  }
};
})();

(node as any).hash = "8aae6e801bc359836581b854adf881f7";

export default node;
