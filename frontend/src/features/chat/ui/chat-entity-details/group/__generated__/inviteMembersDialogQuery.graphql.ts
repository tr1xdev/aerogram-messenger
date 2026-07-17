/**
 * @generated SignedSource<<0e35bece05db6edc387c2c29416d585a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type inviteMembersDialogQuery$variables = {
  skip: boolean;
  username: string;
};
export type inviteMembersDialogQuery$data = {
  readonly searchUsers?: ReadonlyArray<{
    readonly displayName: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  }>;
};
export type inviteMembersDialogQuery = {
  response: inviteMembersDialogQuery$data;
  variables: inviteMembersDialogQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "skip"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "username"
},
v2 = [
  {
    "condition": "skip",
    "kind": "Condition",
    "passingValue": false,
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
            "name": "displayName",
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
            "name": "username",
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "inviteMembersDialogQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "inviteMembersDialogQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "0c170f0b506c7402e5af1169a55e2bd8",
    "id": null,
    "metadata": {},
    "name": "inviteMembersDialogQuery",
    "operationKind": "query",
    "text": "query inviteMembersDialogQuery(\n  $username: String!\n  $skip: Boolean!\n) {\n  searchUsers(username: $username) @skip(if: $skip) {\n    id\n    displayName\n    firstName\n    username\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "86dc24449b5f131ef5d3631e4347c842";

export default node;
