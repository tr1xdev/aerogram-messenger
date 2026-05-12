/**
 * @generated SignedSource<<9f8ac4f1d3aa0fa73c66a097ef2a2204>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type userContentQuery$variables = {
  id: string;
};
export type userContentQuery$data = {
  readonly user: {
    readonly bio: string | null | undefined;
    readonly botDescription: string | null | undefined;
    readonly displayName: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly isBot: boolean;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly status: string;
    readonly username: string | null | undefined;
  };
};
export type userContentQuery = {
  response: userContentQuery$data;
  variables: userContentQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "user",
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
        "name": "firstName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "displayName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "username",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "photoUrl",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "bio",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isBot",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "botDescription",
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
    "name": "userContentQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "userContentQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "260bf8e617d8f1ce44ebc7acec729444",
    "id": null,
    "metadata": {},
    "name": "userContentQuery",
    "operationKind": "query",
    "text": "query userContentQuery(\n  $id: ID!\n) {\n  user(id: $id) {\n    id\n    firstName\n    lastName\n    displayName\n    username\n    photoUrl\n    status\n    bio\n    isBot\n    botDescription\n  }\n}\n"
  }
};
})();

(node as any).hash = "c4800fdd1d90b5b9f159a13e9fbdd793";

export default node;
