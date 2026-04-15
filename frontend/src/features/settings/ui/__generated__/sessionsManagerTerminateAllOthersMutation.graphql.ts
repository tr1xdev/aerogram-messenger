/**
 * @generated SignedSource<<dae4b40bca303ab8f1a0ae0cdff8274b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type sessionsManagerTerminateAllOthersMutation$variables = Record<PropertyKey, never>;
export type sessionsManagerTerminateAllOthersMutation$data = {
  readonly terminateAllOtherSessions: boolean;
};
export type sessionsManagerTerminateAllOthersMutation = {
  response: sessionsManagerTerminateAllOthersMutation$data;
  variables: sessionsManagerTerminateAllOthersMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "terminateAllOtherSessions",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "sessionsManagerTerminateAllOthersMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "sessionsManagerTerminateAllOthersMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "d19a6865494d7dec6356d05832bcbe40",
    "id": null,
    "metadata": {},
    "name": "sessionsManagerTerminateAllOthersMutation",
    "operationKind": "mutation",
    "text": "mutation sessionsManagerTerminateAllOthersMutation {\n  terminateAllOtherSessions\n}\n"
  }
};
})();

(node as any).hash = "3c43d1644cde12b2bec6c3000e8d48d6";

export default node;
