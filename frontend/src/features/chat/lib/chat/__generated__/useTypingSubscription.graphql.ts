/**
 * @generated SignedSource<<d855976bb830be6be7666c153940d35c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useTypingSubscription$variables = {
  chatID: string;
};
export type useTypingSubscription$data = {
  readonly userTyping: {
    readonly isTyping: boolean;
    readonly userId: string;
  };
};
export type useTypingSubscription = {
  response: useTypingSubscription$data;
  variables: useTypingSubscription$variables;
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
    "kind": "ClientExtension",
    "selections": [
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
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useTypingSubscription",
    "selections": (v1/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useTypingSubscription",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "14aa27ce511bb249cf14efd7967649cf",
    "id": null,
    "metadata": {},
    "name": "useTypingSubscription",
    "operationKind": "subscription",
    "text": null
  }
};
})();

(node as any).hash = "4b09a8f8c6ad8d986539b696a7115aba";

export default node;
