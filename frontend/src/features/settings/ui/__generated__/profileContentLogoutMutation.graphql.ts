/**
 * @generated SignedSource<<d845e602b55d59d2744cc878bd9b4c29>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type profileContentLogoutMutation$variables = Record<PropertyKey, never>;
export type profileContentLogoutMutation$data = {
  readonly logout: boolean;
};
export type profileContentLogoutMutation = {
  response: profileContentLogoutMutation$data;
  variables: profileContentLogoutMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "kind": "ClientExtension",
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "logout",
        "storageKey": null
      }
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "profileContentLogoutMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "profileContentLogoutMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "0ef6b1ca8d02e1c22ca496e2056b533c",
    "id": null,
    "metadata": {},
    "name": "profileContentLogoutMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "b7385750ff08eef9b780ad54071b321b";

export default node;
