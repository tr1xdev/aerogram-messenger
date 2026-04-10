/**
 * @generated SignedSource<<4e3cb646cbc6fa90b1269e3a99ea33ff>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useTypingSendMutation$variables = {
  chatID: string;
  typing: boolean;
};
export type useTypingSendMutation$data = {
  readonly sendTypingEvent: boolean;
};
export type useTypingSendMutation = {
  response: useTypingSendMutation$data;
  variables: useTypingSendMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "typing"
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
          },
          {
            "kind": "Variable",
            "name": "typing",
            "variableName": "typing"
          }
        ],
        "kind": "ScalarField",
        "name": "sendTypingEvent",
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
    "name": "useTypingSendMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useTypingSendMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "912b0cf1d82b542e7123546d5e4afcaf",
    "id": null,
    "metadata": {},
    "name": "useTypingSendMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "4827111e8bf334071e7a3be1ae9d392a";

export default node;
