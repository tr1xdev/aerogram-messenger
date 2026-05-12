/**
 * @generated SignedSource<<a3e6d9472be25dae9a1f0760028df0d4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChannelActionsUpdateRoleMutation$variables = {
  chatID: string;
  role: string;
  userID: string;
};
export type useChannelActionsUpdateRoleMutation$data = {
  readonly updateMemberRole: {
    readonly success: boolean;
  };
};
export type useChannelActionsUpdateRoleMutation = {
  response: useChannelActionsUpdateRoleMutation$data;
  variables: useChannelActionsUpdateRoleMutation$variables;
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
    "name": "useChannelActionsUpdateRoleMutation",
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
    "name": "useChannelActionsUpdateRoleMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "de3f680b4419e7261d0bd5c493de404d",
    "id": null,
    "metadata": {},
    "name": "useChannelActionsUpdateRoleMutation",
    "operationKind": "mutation",
    "text": "mutation useChannelActionsUpdateRoleMutation(\n  $chatID: ID!\n  $userID: ID!\n  $role: String!\n) {\n  updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "71694aee5728c18d9013e9cb0dc537d2";

export default node;
