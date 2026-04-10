/**
 * @generated SignedSource<<64a3d1f69f4488452d1be42d7d5285a3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChatManagementSearchQuery$variables = {
  username: string;
};
export type useChatManagementSearchQuery$data = {
  readonly searchUsers: ReadonlyArray<{
    readonly firstName: string;
    readonly id: string;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  }>;
};
export type useChatManagementSearchQuery = {
  response: useChatManagementSearchQuery$data;
  variables: useChatManagementSearchQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "username"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "username",
        "variableName": "username"
      }
    ],
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "searchUsers",
    "plural": true,
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
        "name": "photoUrl",
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
    "name": "useChatManagementSearchQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChatManagementSearchQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "713ca9e5ea1a1099f9bf0cb40ab87dc9",
    "id": null,
    "metadata": {},
    "name": "useChatManagementSearchQuery",
    "operationKind": "query",
    "text": "query useChatManagementSearchQuery(\n  $username: String!\n) {\n  searchUsers(username: $username) {\n    id\n    username\n    firstName\n    lastName\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "c351e05abbbb362da5f8e1ab3a5eb965";

export default node;
