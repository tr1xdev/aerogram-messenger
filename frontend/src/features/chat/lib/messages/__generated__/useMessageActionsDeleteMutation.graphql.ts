/**
 * @generated SignedSource<<abc4093ec432ca4744cda339299d3d48>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useMessageActionsDeleteMutation$variables = {
  id: string;
};
export type useMessageActionsDeleteMutation$data = {
  readonly deleteMessage: boolean;
};
export type useMessageActionsDeleteMutation = {
  response: useMessageActionsDeleteMutation$data;
  variables: useMessageActionsDeleteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "kind": "ScalarField",
    "name": "deleteMessage",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useMessageActionsDeleteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useMessageActionsDeleteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "fe34a4b344a76c02338de9511db98ea2",
    "id": null,
    "metadata": {},
    "name": "useMessageActionsDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation useMessageActionsDeleteMutation(\n  $id: ID!\n) {\n  deleteMessage(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "f724f24602fcade3ed1bcc1313a94d40";

export default node;
