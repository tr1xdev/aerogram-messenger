/**
 * @generated SignedSource<<f9be5e20b7adf99423b10d839052aab9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelSettingsRotateInviteMutation$variables = {
  chatID: string;
  inviteCode: string;
};
export type channelSettingsRotateInviteMutation$data = {
  readonly revokeChatInvite: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type channelSettingsRotateInviteMutation = {
  response: channelSettingsRotateInviteMutation$data;
  variables: channelSettingsRotateInviteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "inviteCode"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "chatID",
        "variableName": "chatID"
      },
      {
        "kind": "Variable",
        "name": "inviteCode",
        "variableName": "inviteCode"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "revokeChatInvite",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "__typename",
        "storageKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "success",
            "storageKey": null
          }
        ],
        "type": "SuccessResult",
        "abstractKey": null
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
    "name": "channelSettingsRotateInviteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelSettingsRotateInviteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "91a4945bc50beb6f575fab04d3c6a2ae",
    "id": null,
    "metadata": {},
    "name": "channelSettingsRotateInviteMutation",
    "operationKind": "mutation",
    "text": "mutation channelSettingsRotateInviteMutation(\n  $chatID: ID!\n  $inviteCode: String!\n) {\n  revokeChatInvite(chatID: $chatID, inviteCode: $inviteCode) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "61392e8bf00779e432255a545dea77e7";

export default node;
