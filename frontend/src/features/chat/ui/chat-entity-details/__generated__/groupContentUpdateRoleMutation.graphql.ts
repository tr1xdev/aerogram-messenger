/**
 * @generated SignedSource<<c0ba20a18abbb7253530b5b1203a2a96>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type groupContentUpdateRoleMutation$variables = {
  chatID: string;
  role: string;
  userID: string;
};
export type groupContentUpdateRoleMutation$data = {
  readonly updateMemberRole: {
    readonly success: boolean;
  };
};
export type groupContentUpdateRoleMutation = {
  response: groupContentUpdateRoleMutation$data;
  variables: groupContentUpdateRoleMutation$variables;
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
    "name": "groupContentUpdateRoleMutation",
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
    "name": "groupContentUpdateRoleMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "f29d7abdb1642f26a2815eec7231d363",
    "id": null,
    "metadata": {},
    "name": "groupContentUpdateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation groupContentUpdateRoleMutation(\n  $chatID: ID!\n  $userID: ID!\n  $role: String!\n) {\n  updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "0d06269c271d7c8652246b33c8ee94a1";

export default node;
