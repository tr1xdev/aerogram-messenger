/**
 * @generated SignedSource<<c1b00cbfadec405e6912abbbf2378b88>>
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
    ]
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
    "cacheID": "20a0ccf1e6637459eb068a3eed8e9cda",
    "id": null,
    "metadata": {},
    "name": "useGlobalSubscriptionsDialogReadSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "ce8a9b643d5ec7f166521f703a36ae6b";

export default node;
