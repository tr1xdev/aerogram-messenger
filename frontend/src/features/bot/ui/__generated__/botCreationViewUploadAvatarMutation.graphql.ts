/**
 * @generated SignedSource<<aa716b39f5bfa9b92a4a6bb744a02cb6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botCreationViewUploadAvatarMutation$variables = {
  file: any;
  userId: string;
};
export type botCreationViewUploadAvatarMutation$data = {
  readonly uploadAvatar: {
    readonly id: string;
    readonly photoUrl: string | null | undefined;
  };
};
export type botCreationViewUploadAvatarMutation = {
  response: botCreationViewUploadAvatarMutation$data;
  variables: botCreationViewUploadAvatarMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "file"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "userId"
},
v2 = [
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "botCreationViewUploadAvatarMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "botCreationViewUploadAvatarMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "84cd20be7967d9fd1db7e0836684d7a4",
    "id": null,
    "metadata": {},
    "name": "botCreationViewUploadAvatarMutation",
    "operationKind": "mutation",
    "text": "mutation botCreationViewUploadAvatarMutation(\n  $userId: ID!\n  $file: Upload!\n) {\n  uploadAvatar(userId: $userId, file: $file) {\n    id\n    photoUrl\n  }\n}\n"
  }
};
})();

(node as any).hash = "dcc85ce085c8185c580edfc249dfb7c0";

export default node;
