/**
 * @generated SignedSource<<e2613f895f90a5e763339e3ec560c0c4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelSettingsExportInviteMutation$variables = {
  chatID: string;
};
export type channelSettingsExportInviteMutation$data = {
  readonly exportChatInvite: {
    readonly code?: string;
    readonly inviteLink?: string;
  };
};
export type channelSettingsExportInviteMutation = {
  response: channelSettingsExportInviteMutation$data;
  variables: channelSettingsExportInviteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "chatID",
    "variableName": "chatID"
  }
],
v2 = {
  "kind": "InlineFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "code",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "inviteLink",
      "storageKey": null
    }
  ],
  "type": "ChatInvite",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "channelSettingsExportInviteMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "exportChatInvite",
        "plural": false,
        "selections": [
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelSettingsExportInviteMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "exportChatInvite",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "__typename",
            "storageKey": null
          },
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "255506f03a3d9c931e7858f64613d22b",
    "id": null,
    "metadata": {},
    "name": "channelSettingsExportInviteMutation",
    "operationKind": "mutation",
    "text": "mutation channelSettingsExportInviteMutation(\n  $chatID: ID!\n) {\n  exportChatInvite(chatID: $chatID) {\n    __typename\n    ... on ChatInvite {\n      code\n      inviteLink\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2b32fdc5f353503876332e5c5c643e6f";

export default node;
