/**
 * @generated SignedSource<<a94ac3f06bfb95f0f378c1d7b669069a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type profileContentUploadAvatarMutation$variables = {
  file: any;
};
export type profileContentUploadAvatarMutation$data = {
  readonly uploadAvatar: {
    readonly id: string;
    readonly photoUrl: string | null | undefined;
  };
};
export type profileContentUploadAvatarMutation = {
  response: profileContentUploadAvatarMutation$data;
  variables: profileContentUploadAvatarMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "file"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "file",
        "variableName": "file"
      }
    ],
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "uploadAvatar",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "photoUrl",
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
    "name": "profileContentUploadAvatarMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "profileContentUploadAvatarMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2870f66fd0f1dbd038e1097688020bd0",
    "id": null,
    "metadata": {},
    "name": "profileContentUploadAvatarMutation",
    "operationKind": "mutation",
    "text": "mutation profileContentUploadAvatarMutation(\n  $file: Upload!\n) {\n  uploadAvatar(file: $file) {\n    id\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "6f03e9cf4b6e0502be872240d2bdb296";

export default node;
