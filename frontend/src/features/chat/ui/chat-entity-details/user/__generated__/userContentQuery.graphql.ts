/**
 * @generated SignedSource<<461e1c2401b1ad66d81d4730d681d7cf>>
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
    readonly displayName: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
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
    "cacheID": "fddf727e94a28d6e5895ec2cf36ba981",
    "id": null,
    "metadata": {},
    "name": "userContentQuery",
    "operationKind": "query",
    "text": "query userContentQuery(\n  $id: ID!\n) {\n  user(id: $id) {\n    id\n    firstName\n    lastName\n    displayName\n    username\n    photoUrl\n    status\n    bio\n  }\n}\n"
  }
};
})();

(node as any).hash = "d1acfe66dfc67731ac1286fa800c8d8c";

export default node;
