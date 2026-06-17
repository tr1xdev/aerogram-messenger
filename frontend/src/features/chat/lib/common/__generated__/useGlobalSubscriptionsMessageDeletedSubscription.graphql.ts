/**
 * @generated SignedSource<<438f5cde032f54f57451baef88639de2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsMessageDeletedSubscription$variables = {
  chatId: string;
};
export type useGlobalSubscriptionsMessageDeletedSubscription$data = {
  readonly messageDeleted: string;
};
export type useGlobalSubscriptionsMessageDeletedSubscription = {
  response: useGlobalSubscriptionsMessageDeletedSubscription$data;
  variables: useGlobalSubscriptionsMessageDeletedSubscription$variables;
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
    "kind": "ScalarField",
    "name": "messageDeleted",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useGlobalSubscriptionsMessageDeletedSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsMessageDeletedSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6e10328f813dfe8c4b92da9e85b9a385",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsMessageDeletedSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsMessageDeletedSubscription(\n  $chatId: ID!\n) {\n  messageDeleted(chatId: $chatId)\n}\n"
  }
};
})();

(node as any).hash = "1c4002f44d80981771d35c2b71b9eae3";

export default node;
