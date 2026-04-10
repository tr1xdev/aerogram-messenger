/**
 * @generated SignedSource<<88568dc63f95f57b1de5dc04e589e4a0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type VerifyEmailInput = {
  code: string;
  userID: string;
};
export type useAuthVerifyEmailMutation$variables = {
  input: VerifyEmailInput;
};
export type useAuthVerifyEmailMutation$data = {
  readonly verifyEmail: {
    readonly accessToken: string | null | undefined;
    readonly refreshToken: string | null | undefined;
    readonly requiresVerification: boolean;
    readonly userId: string;
  };
};
export type useAuthVerifyEmailMutation = {
  response: useAuthVerifyEmailMutation$data;
  variables: useAuthVerifyEmailMutation$variables;
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
        "name": "verifyEmail",
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
    "name": "useAuthVerifyEmailMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useAuthVerifyEmailMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "31ee0aa0047e0c22a1268c709ea87d2f",
    "id": null,
    "metadata": {},
    "name": "useAuthVerifyEmailMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "5dc05af8e598a7d4287777355baf1e85";

export default node;
