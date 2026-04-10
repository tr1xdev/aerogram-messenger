/**
 * @generated SignedSource<<bb80ef429dd21cc65dd2da5f3c670896>>
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
    "cacheID": "af547fcbdf90036ff3a2586add748cd1",
    "id": null,
    "metadata": {},
    "name": "useTypingSendMutation",
    "operationKind": "mutation",
    "text": "mutation useTypingSendMutation(\n  $chatID: ID!\n  $typing: Boolean!\n) {\n  sendTypingEvent(chatID: $chatID, typing: $typing)\n}\n"
  }
};
})();

(node as any).hash = "4827111e8bf334071e7a3be1ae9d392a";

export default node;
