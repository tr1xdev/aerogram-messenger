/**
 * @generated SignedSource<<240a29f2b46f21487938324728456cba>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type chatUserPopoverQuery$variables = {
  id: string;
};
export type chatUserPopoverQuery$data = {
  readonly user: {
    readonly bio: string | null | undefined;
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly isVerified: boolean;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly status: string;
    readonly username: string | null | undefined;
  };
};
export type chatUserPopoverQuery = {
  response: chatUserPopoverQuery$data;
  variables: chatUserPopoverQuery$variables;
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
        "name": "username",
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
        "name": "photoUrl",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isVerified",
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
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "email",
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
    "name": "chatUserPopoverQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "chatUserPopoverQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "dee451cfec3df64dfe2e6457549914bb",
    "id": null,
    "metadata": {},
    "name": "chatUserPopoverQuery",
    "operationKind": "query",
    "text": "query chatUserPopoverQuery(\n  $id: ID!\n) {\n  user(id: $id) {\n    id\n    username\n    firstName\n    lastName\n    displayName\n    photoUrl\n    isVerified\n    bio\n    status\n    email\n  }\n}\n"
  }
};
})();

(node as any).hash = "6b4abd62e8be1132ae4494dd8aa0b0d6";

export default node;
