/**
 * @generated SignedSource<<5b7646a8e016d9d6e0132ebde39239a0>>
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

(node as any).hash = "c5e6fbd358750a9a006f21e864d5d037";

export default node;
