/**
 * @generated SignedSource<<e472e6771e56b05570397bd10a3c874b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LoginInput = {
  email: string;
  password: string;
};
export type useAuthLoginMutation$variables = {
  input: LoginInput;
};
export type useAuthLoginMutation$data = {
  readonly login: {
    readonly accessToken: string | null | undefined;
    readonly refreshToken: string | null | undefined;
    readonly requiresVerification: boolean;
    readonly userId: string;
  };
};
export type useAuthLoginMutation = {
  response: useAuthLoginMutation$data;
  variables: useAuthLoginMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
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
            "name": "input",
            "variableName": "input"
          }
        ],
        "concreteType": "AuthPayload",
        "kind": "LinkedField",
        "name": "login",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "userId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "accessToken",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "refreshToken",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "requiresVerification",
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
    "name": "useAuthLoginMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useAuthLoginMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "cb34ac68abd9b35791716e72c10511c1",
    "id": null,
    "metadata": {},
    "name": "useAuthLoginMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "2b6f7eb63ca56243ac632900bf83799c";

export default node;
