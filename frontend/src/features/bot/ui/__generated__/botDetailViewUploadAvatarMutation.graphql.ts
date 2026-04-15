/**
 * @generated SignedSource<<a6068efd029fe3ea72fc4c58193be50f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botDetailViewUploadAvatarMutation$variables = {
  file: any;
  userId?: string | null | undefined;
};
export type botDetailViewUploadAvatarMutation$data = {
  readonly uploadAvatar: {
    readonly id: string;
    readonly photoUrl: string | null | undefined;
  };
};
export type botDetailViewUploadAvatarMutation = {
  response: botDetailViewUploadAvatarMutation$data;
  variables: botDetailViewUploadAvatarMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "file"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "userId"
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
      },
      {
        "kind": "Variable",
        "name": "userId",
        "variableName": "userId"
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
    "name": "botDetailViewUploadAvatarMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "botDetailViewUploadAvatarMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8fc12b1ac2f9f88b887c762004873016",
    "id": null,
    "metadata": {},
    "name": "botDetailViewUploadAvatarMutation",
    "operationKind": "mutation",
    "text": "mutation botDetailViewUploadAvatarMutation(\n  $file: Upload!\n  $userId: ID\n) {\n  uploadAvatar(file: $file, userId: $userId) {\n    id\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "a3142b926217994f8973588733a563cd";

export default node;
