/**
 * @generated SignedSource<<46a235723d1fba2e9c6bb0a62c825e6c>>
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
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "logout",
    "storageKey": null
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
    "cacheID": "96629239a177264ae8bea8905eb4015f",
    "id": null,
    "metadata": {},
    "name": "profileContentLogoutMutation",
    "operationKind": "mutation",
    "text": "mutation profileContentLogoutMutation {\n  logout\n}\n"
  }
};
})();

(node as any).hash = "b7385750ff08eef9b780ad54071b321b";

export default node;
