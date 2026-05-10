/**
 * @generated SignedSource<<32a7fac26864c17734ee6826bac23e7c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentUpdateRoleMutation$variables = {
  chatID: string;
  role: string;
  userID: string;
};
export type channelContentUpdateRoleMutation$data = {
  readonly updateMemberRole: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  };
};
export type channelContentUpdateRoleMutation = {
  response: channelContentUpdateRoleMutation$data;
  variables: channelContentUpdateRoleMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "chatID"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "role"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "userID"
},
v3 = [
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
        "name": "role",
        "variableName": "role"
      },
      {
        "kind": "Variable",
        "name": "userID",
        "variableName": "userID"
      }
    ],
    "concreteType": "SuccessResult",
    "kind": "LinkedField",
    "name": "updateMemberRole",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "__typename",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "success",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "channelContentUpdateRoleMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v2/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "channelContentUpdateRoleMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "a9b279557160cd67d207eb984907e3e3",
    "id": null,
    "metadata": {},
    "name": "channelContentUpdateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentUpdateRoleMutation(\n  $chatID: ID!\n  $userID: ID!\n  $role: String!\n) {\n  updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {\n    __typename\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "816a138200e07d3afe167ead9c2140ac";

export default node;
