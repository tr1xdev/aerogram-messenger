/**
 * @generated SignedSource<<974c20279ed637ad6b542d115fa10fd9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useGlobalSubscriptionsDialogReadSubscription$variables = {
  chatId: string;
};
export type useGlobalSubscriptionsDialogReadSubscription$data = {
  readonly dialogRead: {
    readonly chatId: string;
    readonly lastSequence: any;
    readonly userId: string;
  };
};
export type useGlobalSubscriptionsDialogReadSubscription = {
  response: useGlobalSubscriptionsDialogReadSubscription$data;
  variables: useGlobalSubscriptionsDialogReadSubscription$variables;
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
    "concreteType": "ReadPayload",
    "kind": "LinkedField",
    "name": "dialogRead",
    "plural": false,
    "selections": [
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
        "name": "userId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastSequence",
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
    "name": "useGlobalSubscriptionsDialogReadSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useGlobalSubscriptionsDialogReadSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8a26374e83d10cb5ac26679d6d400a8f",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsDialogReadSubscription",
    "operationKind": "subscription",
    "text": "subscription useGlobalSubscriptionsDialogReadSubscription(\n  $chatId: ID!\n) {\n  dialogRead(chatId: $chatId) {\n    chatId\n    userId\n    lastSequence\n  }\n}\n"
  }
};
})();

(node as any).hash = "ce8a9b643d5ec7f166521f703a36ae6b";

export default node;
