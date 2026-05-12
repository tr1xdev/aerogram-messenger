/**
 * @generated SignedSource<<e293e75672924220da6ea0f6f5cda8eb>>
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
    "cacheID": "7b011fb2f8de8e01e8416bd97593fef4",
    "id": null,
    "metadata": {},
    "name": "channelContentUpdateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentUpdateRoleMutation(\n  $chatID: ID!\n  $userID: ID!\n  $role: String!\n) {\n  updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "7df891a4151baafd6f27b46e7481f4e9";

export default node;
