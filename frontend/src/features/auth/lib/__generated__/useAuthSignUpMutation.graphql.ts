/**
 * @generated SignedSource<<2a3a175c53e56f201288cde2fa8ea43b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SignUpInput = {
  email: string;
  firstName: string;
  lastName?: string | null | undefined;
  password: string;
  username?: string | null | undefined;
};
export type useAuthSignUpMutation$variables = {
  input: SignUpInput;
};
export type useAuthSignUpMutation$data = {
  readonly signUp: {
    readonly accessToken: string | null | undefined;
    readonly refreshToken: string | null | undefined;
    readonly requiresVerification: boolean;
    readonly userId: string;
  };
};
export type useAuthSignUpMutation = {
  response: useAuthSignUpMutation$data;
  variables: useAuthSignUpMutation$variables;
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
    "name": "signUp",
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useAuthSignUpMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useAuthSignUpMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "75538a7dd69b71c8f187bc068107a05a",
    "id": null,
    "metadata": {},
    "name": "useAuthSignUpMutation",
    "operationKind": "mutation",
    "text": "mutation useAuthSignUpMutation(\n  $input: SignUpInput!\n) {\n  signUp(input: $input) {\n    userId\n    accessToken\n    refreshToken\n    requiresVerification\n  }\n}\n"
  }
};
})();

(node as any).hash = "4f06c5f6622753c235da61bfcdb5a4a9";

export default node;
