/**
 * @generated SignedSource<<f77ac73221b0b183a1f359c6970fd150>>
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
    "kind": "ClientExtension",
    "selections": [
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
    ]
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
    "cacheID": "62ffa7b13612a82d0f2b7cbfa9cef4c3",
    "id": null,
    "metadata": {},
    "name": "useChatManagementSearchQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "c351e05abbbb362da5f8e1ab3a5eb965";

export default node;
