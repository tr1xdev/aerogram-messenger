/**
 * @generated SignedSource<<d53d892d443a23be22fe06d85ee8d2f1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type newChatDialogQuery$variables = Record<PropertyKey, never>;
export type newChatDialogQuery$data = {
  readonly me: {
    readonly id: string;
    readonly username: string | null | undefined;
  };
};
export type newChatDialogQuery = {
  response: newChatDialogQuery$data;
  variables: newChatDialogQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "me",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "username",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "newChatDialogQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "newChatDialogQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "4380858d1cc278fcb6b21b07f5114470",
    "id": null,
    "metadata": {},
    "name": "newChatDialogQuery",
    "operationKind": "query",
    "text": "query newChatDialogQuery {\n  me {\n    id\n    username\n  }\n}\n"
  }
};
})();

(node as any).hash = "6d65f20f0f776b18e301b9639783b059";

export default node;
