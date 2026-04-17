/**
 * @generated SignedSource<<8d333f2ec9b6b36ba91fad3368055294>>
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
    readonly botDescription: string | null | undefined;
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly isBot: boolean;
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
        "name": "isBot",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "botDescription",
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
    "cacheID": "ed8c0430026bd5a29251efa8d025d269",
    "id": null,
    "metadata": {},
    "name": "chatUserPopoverQuery",
    "operationKind": "query",
    "text": "query chatUserPopoverQuery(\n  $id: ID!\n) {\n  user(id: $id) {\n    id\n    username\n    firstName\n    lastName\n    displayName\n    photoUrl\n    isVerified\n    isBot\n    botDescription\n    bio\n    status\n    email\n  }\n}\n"
  }
};
})();

(node as any).hash = "d91a3120b3b2e236f71a09de77310768";

export default node;
